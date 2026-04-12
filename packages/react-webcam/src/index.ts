// Public API surface for package consumers.
// Internal helpers and implementation details stay private.

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
  WebcamOptions,
  WebcamPhase,
} from "./webcam-types.js";
