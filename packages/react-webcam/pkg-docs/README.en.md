# @cp949/react-webcam

React 18/19 webcam component library.

- Supports controlled and uncontrolled ownership for component state.
- Exposes `WebcamHandle` for snapshots, option updates, and playback
  pause/resume.
- Publishes runtime state such as permission denial, autoplay blocking, and
  unavailable devices through `onStateChange`.

For repository-level workflow and development commands, see the root README.

## Install

```bash
npm install @cp949/react-webcam
```

**This package supports React 18 and 19.** React 17 and below are not
supported.

```bash
npm install react@^18 react-dom@^18
# or
npm install react@^19 react-dom@^19
```

## Browser Compatibility Target

The packed library artifact and a consumer bundle target Chrome Desktop 75.
This is a compatibility target, not a record of a direct Chrome 75 browser
run. Camera access still requires HTTPS or localhost, user permission, and an
available device. The repository's Next/MUI demo is a separate consumer and is
not included in this target.

Automated verification has a practical floor of Chrome 83, since Playwright's
CDP constraints make Chrome 75/76 automation impossible. This automation gate
runs as a local manual script before release, not in CI.

## Basic Usage

```tsx
import { Webcam } from "@cp949/react-webcam";

export function CameraView() {
  return (
    <div style={{ width: 640, height: "auto" }}>
      <Webcam
        webcamOptions={{ aspectRatio: 16 / 9 }}
        visibleFlipButton
        visibleCameraDirectionButton
      />
    </div>
  );
}
```

Using `fitMode` to match a fixed parent container:

```tsx
<div style={{ width: 640, height: 480 }}>
  <Webcam fitMode='cover' webcamOptions={{ audioEnabled: true }} />
</div>
```

## Props

`Webcam` also accepts a `ref` to a `WebcamHandle` (see the Ref Handle section
below) in addition to the props listed here.

| Prop                           | Type                                                                  | Default          | Description                                                                                          |
| ------------------------------- | ---------------------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------- |
| `style`                        | `React.CSSProperties`                                                 | —                | Inline style for the root element.                                                                  |
| `className`                    | `string`                                                              | —                | Class name for the root element.                                                                    |
| `children`                     | `React.ReactNode`                                                     | —                | Rendered inside the root element, overlaid on the video.                                            |
| `disabled`                     | `boolean`                                                             | `false`          | Keeps the component mounted without requesting camera access (see Disabled State below).            |
| `disabledFallback`             | `React.ReactNode`                                                     | —                | Custom UI rendered instead of the built-in placeholder while `disabled`.                             |
| `errorFallback`                | `React.ReactNode \| ((detail: WebcamErrorDetail) => React.ReactNode)` | —                | Custom UI for the `denied` / `unavailable` / `unsupported` / `insecure` / `error` phases. Does not cover `playback-error`. |
| `onStateChange`                | `(state: WebcamDetail) => void`                                       | —                | Called whenever `WebcamDetail` changes (see Observe Runtime State below).                            |
| `fitMode`                      | `"unset" \| "fill" \| "cover" \| "contain"`                           | `"unset"`        | How the video fills its box when `webcamOptions.aspectRatio` is not set.                             |
| `flipped`                      | `boolean`                                                             | —                | Horizontal flip value for controlled mode. Use with `onFlippedChange` so the parent updates the state (see `flipped` below). |
| `onFlippedChange`              | `(value: boolean) => void`                                            | —                | Use with `flipped`. Called when a flip change is requested.                                        |
| `defaultFlipped`               | `boolean`                                                             | `false`          | Initial flip state for uncontrolled mode. Applied once on mount.                                    |
| `webcamOptions`                | `WebcamOptions`                                                       | —                | Camera options for controlled mode (`facingMode`, `aspectRatio`, `audioEnabled`, `deviceId`, `size`, ...). Use with `onWebcamOptionsChange` so the parent updates the state (see `webcamOptions` below). |
| `onWebcamOptionsChange`        | `(options: WebcamOptions) => void`                                    | —                | Use with `webcamOptions`. Called when an option change is requested.                               |
| `defaultWebcamOptions`         | `WebcamOptions`                                                       | —                | Initial camera options for uncontrolled mode. Applied once on mount.                                |
| `visibleFlipButton`            | `boolean`                                                             | `false`          | Shows the built-in flip toggle button.                                                              |
| `visibleCameraDirectionButton` | `boolean`                                                             | `false`          | Shows the built-in front/rear camera button.                                                        |
| `visibleAspectRatioButton`     | `boolean`                                                             | `false`          | Shows the built-in aspect ratio button.                                                              |
| `visibleSnapshotButton`        | `boolean`                                                             | `false`          | Shows the built-in snapshot button.                                                                  |
| `visibleVideoSizeDebug`        | `boolean`                                                             | `false`          | Shows a debug overlay with the video element size.                                                  |
| `visibleConstraintsDebug`      | `boolean`                                                             | `false`          | Shows a debug overlay with the active `MediaStreamConstraints`.                                     |
| `labels`                       | `WebcamLabels`                                                        | Korean defaults  | Overrides for built-in button labels (see Labels And Localization below).                            |

## Disabled State

Use `disabled` when the webcam should stay mounted but must not request camera
access yet.

When `disabled={true}`:

- `getUserMedia()` is not called
- the component stays in the existing `idle` flow
- a built-in text-free placeholder with a soft gradient and camera icon is
  rendered by default

When `disabled` becomes `false` again, the webcam resumes its normal request
flow.

### Default Placeholder

```tsx
<Webcam disabled />
```

### Custom Disabled Fallback

Pass `disabledFallback` to replace the built-in placeholder completely.

```tsx
<Webcam
  disabled
  disabledFallback={
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        background: "#111",
        color: "#fff",
      }}
    >
      Camera is disabled
    </div>
  }
/>
```

### Custom Error Fallback

Pass `errorFallback` to render custom UI for error states such as permission
denial, missing cameras, unsupported browsers, or insecure contexts. When passed
as a function, it receives the current `WebcamDetail` so you can branch on
`errorCode`.

```tsx
<Webcam
  errorFallback={(detail) => (
    <div>
      {detail.errorCode === "device-not-found"
        ? "No camera is connected."
        : "Camera could not be started."}
    </div>
  )}
/>
```

`playback-error` is not covered by `errorFallback` because the stream is still
alive and only video playback failed.

### Toggle Disabled State

```tsx
import { useState } from "react";
import { Webcam } from "@cp949/react-webcam";

export function DisabledExample() {
  const [disabled, setDisabled] = useState(true);

  return (
    <>
      <button type='button' onClick={() => setDisabled((prev) => !prev)}>
        Toggle webcam
      </button>

      <div style={{ width: 640, height: "auto" }}>
        <Webcam disabled={disabled} />
      </div>
    </>
  );
}
```

## Observe Runtime State With `onStateChange`

`onStateChange` fires whenever `WebcamDetail` changes. `pausePlayback()` does
not change `WebcamDetail`, so it does not emit `onStateChange`. On
`resumePlayback()`, the component may keep the current state, clear
`playback-error`, or publish `playback-error` again when playback still fails.

```tsx
import { Webcam, type WebcamDetail } from "@cp949/react-webcam";

export function CameraView() {
  function handleStateChange(detail: WebcamDetail) {
    switch (detail.phase) {
      case "live":
        console.log("stream started:", detail.mediaStream);
        break;
      case "playback-error":
        console.warn("playback blocked:", detail.error);
        break;
      case "denied":
        console.warn("camera permission denied");
        break;
      case "unavailable":
        console.warn("camera unavailable or already in use");
        break;
      case "insecure":
        console.error("camera access requires HTTPS or localhost");
        break;
      case "unsupported":
        console.error("camera access is not supported in this browser");
        break;
      case "error":
        if (detail.errorCode === "track-ended") {
          console.warn("camera track ended, ask the user to restart it");
        } else {
          console.error("camera error:", detail.errorCode, detail.error);
        }
        break;
    }
  }

  return (
    <div style={{ width: 640, height: "auto" }}>
      <Webcam webcamOptions={{ aspectRatio: 16 / 9 }} onStateChange={handleStateChange} />
    </div>
  );
}
```

### State Flow

```text
idle -> requesting -> live
               -> denied
               -> unavailable
               -> unsupported
               -> insecure
               -> error

live -> playback-error
playback-error -> live
live -> error
live -> requesting -> live   (automatic restart after webcamOptions changes)
```

`WebcamDetail` is a discriminated union keyed by `phase`.

```ts
function handleDetail(detail: WebcamDetail) {
  if (detail.phase === "live") {
    console.log(detail.mediaStream);
    console.log(detail.constraints);
  } else if (detail.phase === "playback-error") {
    console.warn("playback failed:", detail.error);
    console.log(detail.mediaStream);
  } else if (detail.phase === "denied") {
    console.warn(detail.errorCode);
    console.warn(detail.error);
  } else if (detail.phase === "error") {
    console.error(detail.errorCode, detail.error);
  } else if (detail.phase === "insecure") {
    console.error(detail.errorCode);
  }
}
```

## Ref Handle, `WebcamHandle`

Use `ref` to obtain a `WebcamHandle` for imperative snapshot capture, device
inspection, and webcam option updates.

```tsx
import { useRef } from "react";
import { Webcam, type WebcamHandle } from "@cp949/react-webcam";

export function CameraWithSnapshot() {
  const webcamRef = useRef<WebcamHandle>(null);

  function handleSnapshot() {
    const canvas = webcamRef.current?.snapshotToCanvas();
    if (!canvas) return;

    const imageDataUrl = canvas.toDataURL("image/png");
    console.log(imageDataUrl);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          // upload(blob);
        }
      },
      "image/jpeg",
      0.9,
    );
  }

  return (
    <div>
      <div style={{ width: 640, height: "auto" }}>
        <Webcam ref={webcamRef} webcamOptions={{ aspectRatio: 16 / 9 }} />
      </div>
      <button type='button' onClick={handleSnapshot}>
        Take snapshot
      </button>
    </div>
  );
}
```

### `WebcamHandle` API

| Method                       | Description                                                              |
| ---------------------------- | ------------------------------------------------------------------------ |
| `snapshotToCanvas(options?)` | Returns the current frame as `HTMLCanvasElement`, or `null` before ready |
| `getPlayingVideoDeviceId()`  | Returns the current video track device ID                                |
| `getPlayingAudioDeviceId()`  | Returns the current audio track device ID                                |
| `setFlipped(value)`          | Updates the horizontal flip state                                        |
| `setWebcamOptions(updater)`  | Updates webcam options                                                   |
| `pausePlayback()`            | Pauses only video playback, while keeping the camera stream alive        |
| `resumePlayback()`           | Resumes paused video playback                                            |

> `pausePlayback()` and `resumePlayback()` only call `video.pause()` and
> `video.play()`. They do not stop the camera hardware or stop any
> `MediaStreamTrack`. The camera LED can remain on, and track-ended detection
> still runs. `pausePlayback()` does not emit `onStateChange`, while
> `resumePlayback()` can publish `playback-error` on failure.

> `HTMLVideoElement` and `MediaStream` are not exposed directly from the
> handle. Read stream information from `WebcamDetail` inside `onStateChange`.

## List Media Devices

Use the public utilities when you need device lists before rendering.

```tsx
import {
  listAudioInputDevices,
  listMediaDevices,
  listVideoInputDevices,
} from "@cp949/react-webcam";

const allDevices = await listMediaDevices();
const cameras = await listVideoInputDevices();
const microphones = await listAudioInputDevices();
```

The return type is the browser-native `MediaDeviceInfo[]`.

To pass the first device in the list to `Webcam`, put its `deviceId` in
`webcamOptions`.

```tsx
const selectedDeviceId = allDevices[0]?.deviceId;

<Webcam webcamOptions={{ deviceId: selectedDeviceId }} />;
```

## Labels And Localization

The built-in button labels default to Korean. Pass the `labels` prop when you
want English or app-specific strings.

```tsx
<Webcam
  visibleFlipButton
  visibleCameraDirectionButton
  visibleAspectRatioButton
  visibleSnapshotButton
  labels={{
    flip: "Mirror",
    cameraDirection: "Front / Rear Camera",
    facingModeBack: "Rear",
    facingModeFront: "Front",
    facingModeDefault: "Default",
    aspectRatio: "Aspect ratio",
    aspectRatioAuto: "Auto",
    snapshot: "Take snapshot",
  }}
/>
```

## State Ownership, Controlled / Uncontrolled

`flipped` and `webcamOptions` follow standard React controlled/uncontrolled
patterns.

### `flipped`

| Pattern                       | Behavior                                                                          |
| ----------------------------- | --------------------------------------------------------------------------------- |
| `flipped` + `onFlippedChange` | Fully controlled. Buttons and ref updates call `onFlippedChange` only             |
| `flipped`                     | Controlled without a change callback. Button and ref change requests are ignored |
| `defaultFlipped`              | Uncontrolled. Initial value only, then internal state is managed by the component |
| Neither prop                  | Uncontrolled, default initial value `false`                                       |

```tsx
import { useState } from "react";
import { Webcam } from "@cp949/react-webcam";

export function FlipOwnershipExample() {
  const [flipped, setFlipped] = useState(false);

  return (
    <>
      <Webcam flipped={flipped} onFlippedChange={setFlipped} visibleFlipButton />

      <Webcam defaultFlipped visibleFlipButton />
    </>
  );
}
```

### `webcamOptions`

| Pattern                                   | Behavior                   |
| ----------------------------------------- | -------------------------- |
| `webcamOptions` + `onWebcamOptionsChange` | Fully controlled           |
| `webcamOptions`                           | Controlled without a change callback. Internal change requests are ignored |
| `defaultWebcamOptions`                    | Uncontrolled               |
| Neither prop                              | Uncontrolled with defaults |

```tsx
import { useState } from "react";
import { Webcam, type WebcamOptions } from "@cp949/react-webcam";

export function WebcamOptionsOwnershipExample() {
  const [options, setOptions] = useState<WebcamOptions>({
    facingMode: "user",
    aspectRatio: 16 / 9,
  });

  return (
    <>
      <Webcam
        webcamOptions={options}
        onWebcamOptionsChange={setOptions}
        visibleCameraDirectionButton
        visibleAspectRatioButton
      />

      <Webcam
        defaultWebcamOptions={{ facingMode: "environment", aspectRatio: 4 / 3 }}
        visibleCameraDirectionButton
        visibleAspectRatioButton
      />
    </>
  );
}
```

## Runtime Constraints

- This package only works in browser environments.
- Camera access requires a secure context, HTTPS or `localhost`.
- If no usable device exists, or another app holds the device, the component
  can enter the `unavailable` state.
- Browser autoplay policy can block `video.play()`, producing the
  `playback-error` state. In that case the camera stream remains alive, and you
  can recover to `live` after user interaction by calling `resumePlayback()`.

## Demo App

`apps/demo` is not a replacement for the package README. It is a learning and
verification app for the public API.

- Basic Usage
- Common Controls
- Controlled State
- Device Selection
- Pause / Resume
- Ref Handle
- State Inspector
- Recipes
