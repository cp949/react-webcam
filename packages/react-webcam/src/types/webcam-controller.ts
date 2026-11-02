/** Public controller types shared by the `Webcam` ref handle. */
import type { WebcamOptions } from "../webcam-types.js";

/** Options for capturing the current video frame to a canvas. */
export type SnapshotOptions = {
  /** Enables image smoothing on the destination canvas. */
  imageSmoothEnabled?: boolean;

  /** Existing canvas to draw into instead of creating a new one. */
  canvas?: HTMLCanvasElement;

  /** Maximum size constraint applied to the captured image. */
  sizeConstraints?: { maxWidth: number } | { maxHeight: number };

  /**
   * 결과 이미지의 좌우 반전 여부다.
   * 생략하면 현재 `flipped` 상태(미리보기와 같은 방향)를 따른다.
   * 거울 미리보기에서 정방향 이미지를 저장하려면 `false`를 넘긴다.
   */
  flipped?: boolean;

  /**
   * 원본 프레임 가운데를 이 비율(너비/높이)로 잘라 낸다.
   * 미리보기 컨테이너 비율이 이 값과 같고 `fitMode: "cover"`이며 `object-position`이 기본값일 때는 미리보기와 같은 영역이다.
   * 0 이하, `NaN`, `Infinity`는 무시한다.
   * `sizeConstraints`는 잘라 낸 크기에 적용한다. 처리 순서는 크롭, 축소, 반전이다.
   */
  aspectRatio?: number;
};

/**
 * Immutable controller snapshot with imperative webcam actions.
 *
 * Internal implementation details stay private. State is exposed as readonly
 * snapshots, and changes happen through methods only.
 */
export type WebcamController = {
  /** Current horizontal mirror state. */
  readonly flipped: boolean;

  /** Current webcam option snapshot. */
  readonly webcamOptions: WebcamOptions;

  /** Sets the mirror state or derives the next value from the previous one. */
  setFlipped: (value: boolean | ((prev: boolean) => boolean)) => void;

  /** Replaces the webcam options or derives them from the previous value. */
  setWebcamOptions: (
    opts: WebcamOptions | undefined | ((prev: WebcamOptions) => WebcamOptions),
  ) => void;

  /** Captures the current frame to a canvas, or returns `null` before ready. */
  snapshotToCanvas: (options?: SnapshotOptions) => HTMLCanvasElement | null;

  /** Device ID of the currently playing video track. */
  getPlayingVideoDeviceId: () => string | undefined;

  /** Device ID of the currently playing audio track. */
  getPlayingAudioDeviceId: () => string | undefined;

  /**
   * Pauses the current video element.
   *
   * - Calls `video.pause()` only; it does not stop any `MediaStreamTrack`.
   * - The camera stream stays alive, so `track-ended` detection still works.
   * - This is a no-op when no video element is attached.
   * - It does not change `WebcamPhase` or `WebcamDetail`, so
   *   `onStateChange` is not emitted.
   */
  pausePlayback: () => void;

  /**
   * Resumes playback on a paused video element.
   *
   * - Calls `video.play()`; it does not restart any `MediaStreamTrack`.
   * - This is a no-op when the video element or stream is missing.
   * - If `play()` fails, the existing `playback-error` flow is used.
   * - Browsers can still block it under autoplay policy without a user gesture.
   */
  resumePlayback: () => void;
};
