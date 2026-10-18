// Public API surface for package consumers.
// Internal helpers and implementation details stay private.

export { useMediaDevices } from "./hooks/useMediaDevices.js";
export type { UseMediaDevicesResult } from "./hooks/useMediaDevices.js";
export { useWebcam } from "./hooks/useWebcam.js";
export type { UseWebcamOptions, UseWebcamResult } from "./hooks/useWebcam.js";

export {
  listAudioInputDevices,
  listMediaDevices,
  listVideoInputDevices,
} from "./list-media-devices.js";
export type { SnapshotOptions } from "./types/webcam-controller.js";
export type { WebcamLabels } from "./types/webcam-labels.js";
export type { WebcamHandle, WebcamProps } from "./Webcam.js";
export { Webcam } from "./Webcam.js";

export type {
  WebcamDetail,
  WebcamErrorCode,
  WebcamErrorDetail,
  WebcamFitMode,
  WebcamOptions,
  WebcamPhase,
} from "./webcam-types.js";
