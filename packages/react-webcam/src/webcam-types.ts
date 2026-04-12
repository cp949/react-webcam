// Public webcam state and option types.

/** Result of a `getUserMedia()` request. */
export type MediaStreamLoadResult = {
  mediaStream?: MediaStream;
  error?: Error;
};

// ---------------------------------------------------------------------------
// 상태/에러 모델
// ---------------------------------------------------------------------------

/**
 * Webcam lifecycle phases published by the component.
 */
export type WebcamPhase =
  | "idle"
  | "requesting"
  | "live"
  | "playback-error"
  | "denied"
  | "unavailable"
  | "unsupported"
  | "insecure"
  | "error";

/**
 * Normalized webcam error codes derived from browser errors.
 */
export type WebcamErrorCode =
  | "permission-denied"
  | "device-not-found"
  | "device-in-use"
  | "constraints-unsatisfied"
  | "unsupported-browser"
  | "insecure-context"
  | "aborted"
  | "track-ended"
  | "unknown";

// ---------------------------------------------------------------------------
// WebcamDetail — phase 기준 discriminated union
// ---------------------------------------------------------------------------

/**
 * Actual video size observed after metadata is available.
 * The value is optional on every variant so it can survive phase transitions.
 */
type WithVideoSize = { videoSize?: { width: number; height: number } };

/**
 * Shared fields for error phases.
 */
type WebcamDetailError = WithVideoSize & {
  phase: "denied" | "unavailable" | "unsupported" | "insecure" | "error";
  /** Normalized library error code. */
  errorCode: WebcamErrorCode;
  /** Original browser error. */
  error: Error;
  /** Constraints active when the error occurred. */
  constraints: MediaStreamConstraints;
};

/**
 * Discriminated union describing the current webcam state.
 * Narrow with `phase` to safely access phase-specific fields.
 *
 * @example
 * ```ts
 * function handleDetail(detail: WebcamDetail) {
 *   if (detail.phase === 'live') {
 *     console.log(detail.mediaStream); // MediaStream — 항상 존재
 *   } else if (detail.phase === 'denied') {
 *     console.warn(detail.errorCode); // WebcamErrorCode — 항상 존재
 *   }
 * }
 * ```
 */
export type WebcamDetail =
  /** Initial state before requesting a stream. */
  | (WithVideoSize & { phase: "idle" })
  /** `getUserMedia` request in progress. */
  | (WithVideoSize & { phase: "requesting"; constraints: MediaStreamConstraints })
  /** Stream acquired and video playback is active. */
  | (WithVideoSize & {
      phase: "live";
      /** Acquired `MediaStream`, always present in the `live` phase. */
      mediaStream: MediaStream;
      constraints: MediaStreamConstraints;
    })
  /**
   * Stream acquisition succeeded, but `video.play()` failed.
   * This commonly happens when autoplay is blocked.
   * `AbortError` caused by `srcObject` replacement does not enter this phase.
   */
  | (WithVideoSize & {
      phase: "playback-error";
      /** The stream is still valid even though playback failed. */
      mediaStream: MediaStream;
      constraints: MediaStreamConstraints;
      /** Original `play()` failure. */
      error: Error;
    })
  /** Error phases such as denied, unavailable, unsupported, insecure, or generic failure. */
  | WebcamDetailError;

/** Camera options translated into `getUserMedia()` constraints. */
export type WebcamOptions = {
  /** Enables audio capture. */
  audioEnabled?: boolean;

  /** Preferred video size, or `"element-size"` to mirror the rendered element. */
  size?: { width?: number; height?: number } | "element-size";

  /** Preferred aspect ratio. */
  aspectRatio?: number;

  /** Preferred device ID. */
  deviceId?: string;

  /**
   * Preferred facing mode. When omitted, the browser chooses automatically.
   * Ignored when `deviceId` is provided.
   */
  facingMode?: "user" | "environment";

  /**
   * Device selection strategy.
   * - `'ideal'`: use `deviceId` as an ideal constraint
   * - `'exact'`: use `deviceId` as an exact constraint
   * Defaults to `'ideal'`.
   */
  deviceSelectionStrategy?: "ideal" | "exact";

  /** Preferred frame rate. */
  frameRate?: number;

  /** Upper bound for the frame rate. */
  maxFrameRate?: number;
};
