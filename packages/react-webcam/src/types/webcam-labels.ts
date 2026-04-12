// Button label types and defaults used by the public Webcam UI.

/**
 * Optional label overrides for the built-in webcam UI controls.
 * Any field left undefined falls back to the default Korean label set.
 */
export type WebcamLabels = {
  /** Snapshot button `title` / `aria-label`. */
  snapshot?: string;

  /** Mirror toggle button `title` / `aria-label`. */
  flip?: string;

  /** Camera direction button `title` / `aria-label`. */
  cameraDirection?: string;

  /** Camera direction menu label for the rear camera option. */
  facingModeBack?: string;

  /** Camera direction menu label for the front camera option. */
  facingModeFront?: string;

  /** Camera direction menu label for the browser-default option. */
  facingModeDefault?: string;

  /** Aspect ratio button `title` / `aria-label`. */
  aspectRatio?: string;

  /** Aspect ratio menu label for the automatic option. */
  aspectRatioAuto?: string;
};

/** Built-in Korean label table used when `labels` is omitted. */
export const DEFAULT_WEBCAM_LABELS: Required<WebcamLabels> = {
  snapshot: "스냅샷",
  flip: "미러",
  cameraDirection: "전면/후면 카메라",
  facingModeBack: "후면",
  facingModeFront: "전면",
  facingModeDefault: "기본",
  aspectRatio: "크기 비율",
  aspectRatioAuto: "자동",
};
