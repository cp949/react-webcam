/**
 * 웹캠 스트림 수명주기를 전담하는 훅이다.
 *
 * 책임:
 * - getUserMedia 요청 시작
 * - 성공/실패 상태 publish
 * - 취소된 요청(stale) 무시
 * - cleanup 시 이전 스트림 stop 및 상태 초기화
 *
 * `useWebcamController`에서 스트림 생명주기 effect를 분리해
 * 상위 훅이 상태 조립에만 집중할 수 있게 한다.
 *
 * videoSize 패칭은 이 훅의 관심사가 아니다.
 * 반환값에 videoSize가 없어도 `patchDetailVideoSize`로 상위에서 조립한다.
 */
import { useEffect, useState } from "react";
import { ensureError } from "../utils/ensure-error.js";
import { BrowserMediaDevices, mapDomExceptionToErrorCode } from "../utils/media-devices.js";
import { errorCodeToPhase } from "../utils/webcam-controller-state.js";
import type { WebcamDetail } from "../webcam-types.js";

export type UseWebcamStreamLifecycleOptions = {
  /** 스트림을 연결할 비디오 요소 — undefined이면 요청하지 않는다 */
  videoElement: HTMLVideoElement | undefined;

  /** getUserMedia에 전달할 제약 조건 — undefined이면 요청하지 않는다 */
  constraints: MediaStreamConstraints | undefined;

  /** true이면 새 스트림 요청을 막고 idle 상태로 수렴시킨다 */
  disabled?: boolean;
};

const IDLE_STATE: WebcamDetail = { phase: "idle" };

/**
 * 스트림 수명주기 상태를 반환한다.
 * videoSize는 포함하지 않는다. `patchDetailVideoSize`로 상위에서 조립한다.
 */
export function useWebcamStreamLifecycle({
  videoElement,
  constraints,
  disabled = false,
}: UseWebcamStreamLifecycleOptions): WebcamDetail {
  const [streamState, setStreamState] = useState<WebcamDetail>(IDLE_STATE);

  // videoElement 또는 constraints가 없거나 disabled이면 idle로 전환한다.
  // 재시작 시에는 아래 effect가 곧바로 requesting을 설정하므로 중간 상태를 여기서 관리한다.
  useEffect(() => {
    if (!videoElement || !constraints || disabled) {
      setStreamState(IDLE_STATE);
    }
  }, [videoElement, constraints, disabled]);

  // 요소나 제약 조건이 바뀌면 스트림을 다시 요청하고 이전 요청을 정리한다.
  // 흐름은 요청 시작 → 성공 publish → 실패 error 전환 → 취소된 요청 무시 → cleanup 시 stream stop 순서다.
  // cleanup에서 idle을 설정하지 않아야 재시작 중 idle 깜빡임이 생기지 않는다.
  // 실제 분리 시점의 idle 전환은 위 effect가 담당한다.
  useEffect(() => {
    if (!videoElement || !constraints || disabled) return;

    const ctx = { canceled: false };
    let acquiredStream: MediaStream | undefined;
    let acquiredVideoTracks: MediaStreamTrack[] = [];
    let acquiredAudioTracks: MediaStreamTrack[] = [];
    let videoTrackEndedHandler: (() => void) | undefined;
    let audioTrackEndedHandler: (() => void) | undefined;
    // constraints는 가드 통과 후 확정된 값이므로 비동기 경계에서 캡처해 사용한다.
    const currentConstraints = constraints;

    setStreamState({ phase: "requesting", constraints: currentConstraints });

    async function requestStream() {
      try {
        const ms = await BrowserMediaDevices.requestUserMedia(currentConstraints);
        if (ctx.canceled) {
          // 취소된 요청이 뒤늦게 끝나면 즉시 스트림을 반납하고 상태는 건드리지 않는다.
          BrowserMediaDevices.stopStream(ms);
          return;
        }
        acquiredStream = ms;

        // 트랙이 외부 요인(카메라 분리, 권한 회수 등)으로 종료될 때 상태를 전환한다.
        const videoTracks = ms.getVideoTracks?.() ?? [];
        const handleVideoTrackEnded = () => {
          if (ctx.canceled) return;
          setStreamState({
            phase: "error",
            errorCode: "track-ended",
            error: new Error("Video track ended unexpectedly"),
            constraints: currentConstraints,
          });
          BrowserMediaDevices.stopStream(ms);
        };
        videoTracks.forEach((track) => {
          track.addEventListener("ended", handleVideoTrackEnded);
        });
        // cleanup에서 제거할 수 있도록 참조를 저장한다.
        acquiredVideoTracks = videoTracks;
        videoTrackEndedHandler = handleVideoTrackEnded;

        // 오디오 트랙도 동일하게 모니터링한다 — audioEnabled 사용 시 오디오 트랙 안정성도 계약에 포함된다.
        const audioTracks = ms.getAudioTracks?.() ?? [];
        const handleAudioTrackEnded = () => {
          if (ctx.canceled) return;
          setStreamState({
            phase: "error",
            errorCode: "track-ended",
            error: new Error("Audio track ended unexpectedly"),
            constraints: currentConstraints,
          });
          BrowserMediaDevices.stopStream(ms);
        };
        audioTracks.forEach((track) => {
          track.addEventListener("ended", handleAudioTrackEnded);
        });
        acquiredAudioTracks = audioTracks;
        audioTrackEndedHandler = handleAudioTrackEnded;

        setStreamState({
          phase: "live",
          mediaStream: ms,
          constraints: currentConstraints,
        });
      } catch (err) {
        if (ctx.canceled) return;
        const errorCode = mapDomExceptionToErrorCode(err);
        setStreamState({
          phase: errorCodeToPhase(errorCode),
          errorCode,
          error: ensureError(err),
          constraints: currentConstraints,
        });
      }
    }

    void requestStream();

    return () => {
      ctx.canceled = true;
      if (videoTrackEndedHandler) {
        const listener = videoTrackEndedHandler;
        acquiredVideoTracks.forEach((t) => {
          t.removeEventListener("ended", listener);
        });
      }
      if (audioTrackEndedHandler) {
        const listener = audioTrackEndedHandler;
        acquiredAudioTracks.forEach((t) => {
          t.removeEventListener("ended", listener);
        });
      }
      if (acquiredStream) {
        BrowserMediaDevices.stopStream(acquiredStream);
      }
    };
  }, [videoElement, constraints, disabled]);

  return streamState;
}
