# Changelog

## [3.0.0](https://github.com/cp949/react-webcam/compare/v2.0.0...v3.0.0) (2026-10-18)

### ⚠ BREAKING CHANGES

* `visibleFlipButton`, `visibleCameraDirectionButton`, `visibleAspectRatioButton`, `visibleSnapshotButton`, `visibleVideoSizeDebug`, `visibleConstraintsDebug` prop을 제거했다. `controls`와 `debug` prop으로 바꿔야 한다.

### Features

* 내장 스냅샷 버튼의 결과를 받는 onSnapshot prop 추가 ([9700120](https://github.com/cp949/react-webcam/commit/97001202aa456ba70cad7da8e35ebbb612897add))
* 디바이스 변경을 따라가는 useMediaDevices 훅 추가 ([700f036](https://github.com/cp949/react-webcam/commit/700f0365d83101fe349bbdf5369715981ecbd26e))
* 비디오 트랙이 mute된 동안 isFrameReady를 false로 내림 ([df657fd](https://github.com/cp949/react-webcam/commit/df657fd0a325130ef280039498d9831c7bae080b))
* 영어 라벨 프리셋 WEBCAM_LABELS_EN 추가 ([cff4ccb](https://github.com/cp949/react-webcam/commit/cff4ccb4156bfa0ea114c9670056e3204a77b980))
* 탭 복귀 시 track-ended 오류를 복구하는 autoRecover 옵션 추가 ([a939949](https://github.com/cp949/react-webcam/commit/a939949d21c42ebee816050e28dc0a0f284b6bdd))
* CSS 변수로 내장 UI 색을 바꾸는 --webcam-* 변수 8개 추가 ([fdd06d7](https://github.com/cp949/react-webcam/commit/fdd06d703d52413368e0dcb0da863374c5b14643)), references [#1e1e1e](https://github.com/cp949/react-webcam/issues/1e1e1e) [#f7f8fa](https://github.com/cp949/react-webcam/issues/f7f8fa)
* visible* prop 6개를 controls·debug 객체로 통합 ([5b0479d](https://github.com/cp949/react-webcam/commit/5b0479da66ab1124a6f2e7aecec5890565e6d3fc))
* WebcamHandle.getDetail 추가와 WebcamFitMode·WebcamErrorDetail 타입 공개 ([1550ef2](https://github.com/cp949/react-webcam/commit/1550ef28674ae31873a96074f9cacb075e69358d))
* WebcamHandle.retry와 errorFallback의 retry 헬퍼 추가 ([a9436b1](https://github.com/cp949/react-webcam/commit/a9436b1c50147a7b70d5942316048d65f6529d8f))

### Bug Fixes

* 메뉴 버튼 ARIA와 키보드 조작 보강 ([049705b](https://github.com/cp949/react-webcam/commit/049705b569e6fc64412eb187abc9f0127347d9cd))
* 스냅샷 버튼과 메뉴 항목에 키보드 포커스 시각 효과 추가 ([4be938e](https://github.com/cp949/react-webcam/commit/4be938e343f2087a940e6835518368aebe53f843))
* 오디오 트랙 종료 시 영상을 유지하고 audioEnded로 알림 ([e19d8f8](https://github.com/cp949/react-webcam/commit/e19d8f8bf0f6af9d9ef8e7dfad06cfacfa591ab9))
* 자동재생 실패 시 console.warn 중복 출력 제거 ([e8faf48](https://github.com/cp949/react-webcam/commit/e8faf4839f9f3fc8b1a0177d5108a01f37921ca2))
* 제어형 prop에 변경 콜백이 없을 때 console.warn으로 원인을 알림 ([a61d0fa](https://github.com/cp949/react-webcam/commit/a61d0fa7323867684c575987b5a5278a7ad9d087))
* element-size에서 작은 크기 변화마다 스트림을 다시 요청하지 않음 ([a882698](https://github.com/cp949/react-webcam/commit/a8826981803ae00783ffb8ec0f27dbf46a747c13))
* exports에서 CJS 타입 선언을 .d.cts로 분리 ([2905bf8](https://github.com/cp949/react-webcam/commit/2905bf82121c1b3ef709133274b9a1cfef5598a9))
* pnpm 배포의 대화형 인증 지원 ([237eff3](https://github.com/cp949/react-webcam/commit/237eff304a5de4b1ffcf7716b7b0e427cf59cb0c))

### Performance Improvements

* 요소 크기가 필요 없는 옵션은 첫 getUserMedia 요청의 debounce를 건너뜀 ([5578722](https://github.com/cp949/react-webcam/commit/5578722ca794c4232fd69a80b0f059778a42f8e4))

## [2.0.0](https://github.com/cp949/react-webcam/compare/v1.3.0...v2.0.0) (2026-10-18)

### ⚠ BREAKING CHANGES

* SecurityError now reports errorCode security-error and phase error instead of insecure-context and insecure. WebcamErrorCode adds security-error and policy-blocked; consumers must update exhaustive error handling. Actual insecure contexts retain insecure-context and insecure.

### Features

* 외부 video용 웹캠 훅과 카메라 에러 분류 개선 ([c5eda0f](https://github.com/cp949/react-webcam/commit/c5eda0ff981790271dcbc42af876c0aa5146670b))

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
