# Changelog

## 1.2.0

### Minor Changes

- Add `errorFallback` to render custom UI for camera error states.

## 1.1.1

### Patch Changes

- Expand the demo coverage for disabled webcam flows, add Vitest coverage for the demo app, and polish the built-in disabled placeholder behavior.

## 1.1.0

### Minor Changes

- d8ab064: Add `disabled` and `disabledFallback` support to `Webcam`, including the built-in disabled placeholder UI.

## 1.0.2

### Patch Changes

- Add localization guidance for built-in labels and polish the camera menu popup hover styling.

## 1.0.1

### Patch Changes

- Align release notes and package changelog handling with the package-level changeset workflow.

## 1.0.0

### Major Changes

- Initial public release of `@cp949/react-webcam`.
- Added controlled and uncontrolled state ownership for `flipped` and `webcamOptions`.
- Added the `WebcamHandle` ref API for snapshots, device inspection, and playback pause/resume.
- Added runtime webcam state reporting through `onStateChange`.
- Added browser media-device listing helpers.
- Added a demo app covering the public package flows.
