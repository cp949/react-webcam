/**
 * 비디오 DOM 요소에 대한 모든 side effect를 담당하는 훅이다.
 *
 * 책임:
 * - srcObject 연결 및 play() 시도
 * - transform(좌우 반전) 반영
 * - objectFit 반영
 * - loadedmetadata / loadeddata 이벤트로 실제 비디오 해상도 수집
 * - debug 목적 비디오 이벤트 구독
 *
 * `useWebcamController`에서 DOM 계층 effect를 격리해
 * orchestrator가 상태 관리와 stream lifecycle에만 집중할 수 있게 한다.
 */
import { useEffect, useRef } from "react";
import { startDebugVideoEventListener } from "../utils/media-debug.js";

export type UseVideoElementBindingsOptions = {
  videoElement: HTMLVideoElement | undefined;

  /** 현재 활성 미디어 스트림 — srcObject에 연결된다 */
  mediaStream: MediaStream | undefined;

  /** 좌우 반전 여부 */
  flipped: boolean;

  /** object-fit 값 */
  fitMode: "unset" | "fill" | "cover" | "contain" | undefined;

  /** 비디오 이벤트 디버그 로깅 활성화 여부 */
  debugVideoEvents: boolean;

  /**
   * 실제 비디오 해상도가 확인되거나 비디오 요소가 제거될 때 호출된다.
   * - 해상도 확인: `{ width, height }` 전달
   * - 요소 제거: `undefined` 전달
   */
  onVideoSizeChange: (size: { width: number; height: number } | undefined) => void;

  /**
   * play()가 AbortError 이외의 오류로 실패했을 때 호출된다.
   * AbortError(srcObject 교체 중 자동 취소)는 전달되지 않는다.
   */
  onPlayError: (mediaStream: MediaStream, error: Error) => void;

  /**
   * 실제 playback이 시작되었거나 play() 호출이 성공했을 때 호출된다.
   * 같은 스트림에 기록된 playback-error를 해제하는 용도다.
   */
  onPlaybackStart: (mediaStream: MediaStream) => void;
};

export function useVideoElementBindings({
  videoElement,
  mediaStream,
  flipped,
  fitMode,
  debugVideoEvents,
  onVideoSizeChange,
  onPlayError,
  onPlaybackStart,
}: UseVideoElementBindingsOptions): void {
  // callback을 ref로 감싸 effect dep에 포함하지 않아도 항상 최신 참조를 사용한다.
  const onVideoSizeChangeRef = useRef(onVideoSizeChange);
  onVideoSizeChangeRef.current = onVideoSizeChange;

  const onPlayErrorRef = useRef(onPlayError);
  onPlayErrorRef.current = onPlayError;

  const onPlaybackStartRef = useRef(onPlaybackStart);
  onPlaybackStartRef.current = onPlaybackStart;

  // ─── srcObject 연결 및 play() ──────────────────────────────────────────────
  // 현재 스트림을 비디오 요소에 연결하고 재생을 시도한다.
  // Safari / 모바일 브라우저는 autoPlay 정책으로 재생이 막힐 수 있으므로
  // play()를 명시적으로 호출해 실패 여부를 감지한다.
  useEffect(() => {
    if (!videoElement) return;
    videoElement.srcObject = mediaStream ?? null;
    let active = true;
    if (mediaStream) {
      videoElement
        .play()
        .then(() => {
          if (!active) return;
          onPlaybackStartRef.current(mediaStream);
        })
        .catch((err: unknown) => {
          if (!active) return;
          // AbortError는 srcObject 교체 시 이전 play() 요청이 정상적으로 취소되는 경우이므로 무시한다.
          if ((err as { name?: string })?.name === "AbortError") return;
          // 자동재생이 브라우저 정책에 의해 차단된 경우 — 상위 상태로 올린다.
          const error = err instanceof Error ? err : new Error(String(err));
          console.warn("[react-webcam] autoPlay blocked or failed:", error);
          onPlayErrorRef.current(mediaStream, error);
        });
    }
    return () => {
      active = false;
    };
  }, [videoElement, mediaStream]);

  // ─── transform (좌우 반전) ────────────────────────────────────────────────
  useEffect(() => {
    if (!videoElement) return;
    videoElement.style.transform = flipped ? "scaleX(-1)" : "none";
  }, [videoElement, flipped]);

  // ─── objectFit ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!videoElement) return;
    videoElement.style.objectFit = fitMode ?? "unset";
  }, [videoElement, fitMode]);

  // ─── 실제 비디오 해상도 관찰 ────────────────────────────────────────────────
  // loadedmetadata / loadeddata 두 이벤트를 모두 구독해 videoSize를 보수적으로 갱신한다.
  // iOS Safari는 loadedmetadata가 loadeddata보다 늦게 오는 경우가 있기 때문이다.
  // videoElement가 변경되거나 제거될 때 cleanup이 정확히 실행된다.
  useEffect(() => {
    if (!videoElement) {
      onVideoSizeChangeRef.current(undefined);
      return;
    }

    const handleVideoSize = () => {
      const w = videoElement.videoWidth;
      const h = videoElement.videoHeight;
      if (!w || !h) return;
      onVideoSizeChangeRef.current({ width: w, height: h });
    };

    videoElement.addEventListener("loadedmetadata", handleVideoSize);
    videoElement.addEventListener("loadeddata", handleVideoSize);
    handleVideoSize();
    return () => {
      videoElement.removeEventListener("loadedmetadata", handleVideoSize);
      videoElement.removeEventListener("loadeddata", handleVideoSize);
    };
  }, [videoElement]);

  // ─── 실제 playback 시작 감지 ───────────────────────────────────────────────
  useEffect(() => {
    if (!videoElement || !mediaStream) return;

    const handlePlaying = () => {
      onPlaybackStartRef.current(mediaStream);
    };

    videoElement.addEventListener("playing", handlePlaying);
    return () => {
      videoElement.removeEventListener("playing", handlePlaying);
    };
  }, [videoElement, mediaStream]);

  // ─── debug 이벤트 리스너 ────────────────────────────────────────────────────
  useEffect(() => {
    if (!videoElement || !debugVideoEvents) return;
    return startDebugVideoEventListener(videoElement);
  }, [videoElement, debugVideoEvents]);
}
