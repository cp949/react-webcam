# Changelog

## 1.3.0

### Minor Changes

- 8b3d64c: Widen `peerDependencies` to accept React 18 and 19 (`^18.0.0 || ^19.0.0`). No source changes were required — `Webcam` already used `forwardRef`/`useImperativeHandle`, which works identically on both major versions. Verified with a one-off local run of the test suite and type-check against React 18.3.1 / `@types/react` 18.3.31 before reverting dev dependencies back to React 19.

### Patch Changes

- 9fcc23c: Fix the built-in aspect ratio / camera direction dropdown menu getting clipped by the webcam frame's `overflow: hidden` root. The menu now opens right-aligned to its trigger button (`top: 100%`, `right: 0`) instead of relying on the browser's default static position, which used to grow past the right edge when the trigger sits in the top-right toolbar.

## 1.2.1

### Patch Changes

- f728794: Update development dependencies and resolve pnpm audit advisories for vite and esbuild via pnpm overrides.

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
