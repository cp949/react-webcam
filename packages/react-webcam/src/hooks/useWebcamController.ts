/** 웹캠 컴포넌트가 사용하는 상태와 제어 로직을 한곳에 모은 훅이다. */
import { useCallback, useEffect, useMemo, useState } from "react";
import type { WebcamController } from "../types/webcam-controller.js";
import { snapshotToCanvas } from "../utils/snapshot-to-canvas.js";
import {
  mediaStreamResultFromDetail,
  patchDetailVideoSize,
} from "../utils/webcam-controller-state.js";
import type { MediaStreamLoadResult, WebcamDetail, WebcamOptions } from "../webcam-types.js";
import { useElementMediaConstraints } from "./useElementMediaConstraints.js";
import { useVideoElementBindings } from "./useVideoElementBindings.js";
import { useWebcamStreamLifecycle } from "./useWebcamStreamLifecycle.js";

/**
 * `useWebcamController`가 내부 렌더링에 사용하는 확장 컨트롤러 결과다.
 * 외부 소비자는 `WebcamController` 인터페이스만 사용하고, `Webcam.tsx`는 추가 필드까지 함께 사용한다.
 */
export type UseWebcamControllerResult = WebcamController & {
  /** 현재 연결된 비디오 엘리먼트 */
  readonly videoElement: HTMLVideoElement | undefined;

  /** 마지막 스트림 요청 결과 (하위 호환 유지) */
  readonly mediaStreamResult: MediaStreamLoadResult;

  /** 현재 웹캠 생명주기 상태 */
  readonly webcamDetail: WebcamDetail;

  /** 메타데이터 로드 이후 확인한 실제 비디오 해상도 */
  readonly videoSize: { width: number; height: number } | undefined;

  /** 현재 요소 크기 기준으로 계산한 미디어 제약 조건 */
  readonly constraints: MediaStreamConstraints | undefined;

  /** 비디오 요소와 미디어 스트림이 모두 준비되었는지 여부 */
  readonly isLoaded: boolean;

  /** 비디오 DOM 참조를 등록하는 함수 */
  setVideoElement: (el: HTMLVideoElement | null | undefined) => void;

  /** 비디오 표시 방식을 바꾸는 함수 */
  setFitMode: (mode: "unset" | "fill" | "cover" | "contain" | undefined) => void;

  /** 비디오 이벤트 디버그 로깅을 켜고 끄는 함수 */
  setDebugVideoEvents: (enabled: boolean) => void;
};

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_WEBCAM_OPTS: WebcamOptions = { audioEnabled: false };

function getVideoTrackDeviceId(stream: MediaStream | undefined): string | undefined {
  if (!stream?.getVideoTracks) return undefined;
  return stream.getVideoTracks()[0]?.getSettings().deviceId;
}

function getAudioTrackDeviceId(stream: MediaStream | undefined): string | undefined {
  if (!stream?.getAudioTracks) return undefined;
  return stream.getAudioTracks()[0]?.getSettings().deviceId;
}

/**
 * 웹캠 스트림 생명주기와 뷰 상태, 스냅샷 액션을 React 상태만으로 관리한다.
 *
 * 원천 상태:
 * - `webcamOptions`, `flipped`, `videoElement`, `fitMode`, `debugVideoEvents`
 * - `videoSize` — loadedmetadata 이후 확인된 실제 비디오 해상도
 *
 * 파생값:
 * - `constraints` — useElementMediaConstraints가 계산
 * - `streamState` — useWebcamStreamLifecycle이 관리
 * - `webcamDetail` — streamState에 videoSize를 패칭한 최종 상태
 * - `mediaStreamResult` — webcamDetail에서 도출
 * - `isLoaded` — mediaStreamResult와 videoElement로부터 계산
 */
export function useWebcamController(): UseWebcamControllerResult {
  // ─── 원천 상태 ─────────────────────────────────────────────────────────────
  const [webcamOptions, setWebcamOptionsState] = useState<WebcamOptions>(DEFAULT_WEBCAM_OPTS);
  const [flipped, setFlippedState] = useState(false);
  const [videoElement, setVideoElementState] = useState<HTMLVideoElement | undefined>(undefined);
  const [fitMode, setFitModeState] = useState<"unset" | "fill" | "cover" | "contain" | undefined>(
    undefined,
  );
  const [debugVideoEvents, setDebugVideoEvents] = useState(false);
  // 실제 비디오 해상도 — loadedmetadata / loadeddata 이후 useVideoElementBindings가 보고한다.
  const [videoSize, setVideoSize] = useState<{ width: number; height: number } | undefined>(
    undefined,
  );
  // play() 실패 시 useVideoElementBindings가 보고한다.
  const [playbackErrorState, setPlaybackErrorState] = useState<
    { mediaStream: MediaStream; error: Error } | undefined
  >(undefined);

  // ─── element size 관찰 & constraints 계산 ──────────────────────────────────
  const constraints = useElementMediaConstraints(videoElement, webcamOptions);

  // ─── stream request lifecycle ───────────────────────────────────────────────
  // 요청 시작 → 성공/실패 publish → 취소된 요청 무시 → cleanup 시 stream stop
  const streamState = useWebcamStreamLifecycle({ videoElement, constraints });

  // 스트림 상태가 바뀌면(새 요청 시작 등) 이전 재생 오류를 초기화한다.
  useEffect(() => {
    if (streamState.phase !== "live") {
      setPlaybackErrorState(undefined);
    }
  }, [streamState]);

  // ─── derived values ────────────────────────────────────────────────────────
  // videoSize를 streamState 위에 패칭한 뒤, playbackError가 있으면 playback-error 상태로 전환한다.
  const webcamDetail = useMemo((): WebcamDetail => {
    const base = patchDetailVideoSize(streamState, videoSize);
    if (
      playbackErrorState &&
      base.phase === "live" &&
      playbackErrorState.mediaStream === base.mediaStream
    ) {
      return {
        phase: "playback-error",
        mediaStream: base.mediaStream,
        constraints: base.constraints,
        error: playbackErrorState.error,
        videoSize: base.videoSize,
      };
    }
    return base;
  }, [streamState, videoSize, playbackErrorState]);

  // webcamDetail 참조가 안정적이므로 mediaStreamResult도 안정적으로 유지된다.
  // 매 렌더마다 새 객체를 만들지 않아 하위 useMemo 재실행을 최소화한다.
  const mediaStreamResult = useMemo(
    () => mediaStreamResultFromDetail(webcamDetail),
    [webcamDetail],
  );

  // isLoaded: 실제 재생 가능 상태임을 보장한다.
  // - phase가 live여야 한다 (playback-error, 오류 계열 모두 제외)
  // - 비디오 요소가 마운트되어 있어야 한다
  // - 실제 비디오 메타데이터가 확보되어야 한다
  const isLoaded = webcamDetail.phase === "live" && !!videoElement && !!videoSize;

  // ─── DOM 바인딩 (srcObject, transform, objectFit, 해상도 관찰, debug) ───────
  useVideoElementBindings({
    videoElement,
    mediaStream: mediaStreamResult.mediaStream,
    flipped,
    fitMode,
    debugVideoEvents,
    onVideoSizeChange: setVideoSize,
    onPlayError: (mediaStream, error) => {
      setPlaybackErrorState({ mediaStream, error });
    },
    onPlaybackStart: (mediaStream) => {
      setPlaybackErrorState((prev) => {
        if (!prev) return prev;
        return prev.mediaStream === mediaStream ? undefined : prev;
      });
    },
  });

  // 외부로 노출하는 setter는 안정적인 참조를 유지한다.
  const setFlipped = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setFlippedState(value);
  }, []);

  const setWebcamOptions = useCallback(
    (option: WebcamOptions | undefined | ((prev: WebcamOptions) => WebcamOptions)) => {
      if (typeof option === "function") {
        setWebcamOptionsState(option);
      } else {
        setWebcamOptionsState(option ?? DEFAULT_WEBCAM_OPTS);
      }
    },
    [],
  );

  const setVideoElement = useCallback((el: HTMLVideoElement | null | undefined) => {
    setVideoElementState(el ?? undefined);
  }, []);

  const setFitMode = useCallback((mode: "unset" | "fill" | "cover" | "contain" | undefined) => {
    setFitModeState(mode);
  }, []);

  // 공개 컨트롤러와 내부 상태를 하나의 메모이즈된 객체로 묶어 반환한다.
  return useMemo(
    (): UseWebcamControllerResult => ({
      flipped,
      webcamOptions,

      setFlipped,
      setWebcamOptions,

      snapshotToCanvas: (options?) => {
        if (!videoElement) return null;
        return snapshotToCanvas(videoElement, flipped, options);
      },

      getPlayingVideoDeviceId: () => {
        return getVideoTrackDeviceId(mediaStreamResult.mediaStream);
      },

      getPlayingAudioDeviceId: () => {
        return getAudioTrackDeviceId(mediaStreamResult.mediaStream);
      },

      pausePlayback: () => {
        if (!videoElement) return;
        videoElement.pause();
      },

      resumePlayback: () => {
        if (!videoElement || !mediaStreamResult.mediaStream) return;
        const currentStream = mediaStreamResult.mediaStream;
        videoElement
          .play()
          .then(() => {
            setPlaybackErrorState((prev) => {
              if (!prev) return prev;
              return prev.mediaStream === currentStream ? undefined : prev;
            });
          })
          .catch((err: unknown) => {
            // AbortError는 재생 요청이 중단된 것이므로 무시한다.
            if ((err as { name?: string })?.name === "AbortError") return;
            const error = err instanceof Error ? err : new Error(String(err));
            setPlaybackErrorState({ mediaStream: currentStream, error });
          });
      },

      videoElement,
      mediaStreamResult,
      webcamDetail,
      videoSize,
      constraints,
      isLoaded,

      setVideoElement,
      setFitMode,
      setDebugVideoEvents,
    }),
    [
      flipped,
      webcamOptions,
      videoElement,
      mediaStreamResult,
      webcamDetail,
      videoSize,
      constraints,
      isLoaded,
      setFlipped,
      setWebcamOptions,
      setVideoElement,
      setFitMode,
      setDebugVideoEvents,
    ],
  );
}
