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
