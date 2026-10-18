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
        controls={{ flip: true, cameraDirection: true }}
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

| Prop                    | Type                                                                                                  | Default         | Description                                                                                                                                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `style`                 | `React.CSSProperties`                                                                                 | —               | Inline style for the root element.                                                                                                                                                                       |
| `className`             | `string`                                                                                              | —               | Class name for the root element.                                                                                                                                                                         |
| `children`              | `React.ReactNode`                                                                                     | —               | Rendered inside the root element, overlaid on the video.                                                                                                                                                 |
| `disabled`              | `boolean`                                                                                             | `false`         | Keeps the component mounted without requesting camera access (see Disabled State below).                                                                                                                 |
| `disabledFallback`      | `React.ReactNode`                                                                                     | —               | Custom UI rendered instead of the built-in placeholder while `disabled`.                                                                                                                                 |
| `autoRecover`           | `boolean`                                                                                             | `false`         | Requests the stream once when the tab becomes visible again after a `track-ended` error (see Custom Error Fallback below).                                                                               |
| `errorFallback`         | `React.ReactNode \| ((detail: WebcamErrorDetail, helpers: { retry: () => void }) => React.ReactNode)` | —               | Custom UI for the `denied` / `unavailable` / `unsupported` / `insecure` / `error` phases. Does not cover `playback-error`.                                                                               |
| `onStateChange`         | `(state: WebcamDetail) => void`                                                                       | —               | Called whenever `WebcamDetail` changes (see Observe Runtime State below).                                                                                                                                |
| `fitMode`               | `"unset" \| "fill" \| "cover" \| "contain"`                                                           | `"unset"`       | How the video fills its box when `webcamOptions.aspectRatio` is not set.                                                                                                                                 |
| `flipped`               | `boolean`                                                                                             | —               | Horizontal flip value for controlled mode. Use with `onFlippedChange` so the parent updates the state (see `flipped` below).                                                                             |
| `onFlippedChange`       | `(value: boolean) => void`                                                                            | —               | Use with `flipped`. Called when a flip change is requested.                                                                                                                                              |
| `defaultFlipped`        | `boolean`                                                                                             | `false`         | Initial flip state for uncontrolled mode. Applied once on mount.                                                                                                                                         |
| `webcamOptions`         | `WebcamOptions`                                                                                       | —               | Camera options for controlled mode (`facingMode`, `aspectRatio`, `audioEnabled`, `deviceId`, `size`, ...). Use with `onWebcamOptionsChange` so the parent updates the state (see `webcamOptions` below). |
| `onWebcamOptionsChange` | `(options: WebcamOptions) => void`                                                                    | —               | Use with `webcamOptions`. Called when an option change is requested.                                                                                                                                     |
| `defaultWebcamOptions`  | `WebcamOptions`                                                                                       | —               | Initial camera options for uncontrolled mode. Applied once on mount.                                                                                                                                     |
| `controls`              | `WebcamControls`                                                                                      | `{}`            | Chooses the built-in control buttons to show: `flip`, `cameraDirection`, `aspectRatio`, `snapshot`. Each defaults to `false`.                                                                            |
| `onSnapshot`            | `(canvas: HTMLCanvasElement) => void`                                                                 | —               | Receives the captured frame (original resolution) when the built-in snapshot button is clicked. Requires `controls.snapshot`.                                                                            |
| `debug`                 | `WebcamDebug`                                                                                         | `{}`            | Chooses the debug overlays to show: `videoSize` (video element size), `constraints` (active `MediaStreamConstraints`). Each defaults to `false`.                                                         |
| `labels`                | `WebcamLabels`                                                                                        | Korean defaults | Overrides for built-in button labels (see Labels And Localization below).                                                                                                                                |

### Migration To 3.0.0

The six `visible*` props are replaced by two objects. Update every use.

| 2.x                            | 3.0                                    |
| ------------------------------ | -------------------------------------- |
| `visibleFlipButton`            | `controls={{ flip: true }}`            |
| `visibleCameraDirectionButton` | `controls={{ cameraDirection: true }}` |
| `visibleAspectRatioButton`     | `controls={{ aspectRatio: true }}`     |
| `visibleSnapshotButton`        | `controls={{ snapshot: true }}`        |
| `visibleVideoSizeDebug`        | `debug={{ videoSize: true }}`          |
| `visibleConstraintsDebug`      | `debug={{ constraints: true }}`        |

- `onSnapshot` stays a top-level prop. It still needs `controls.snapshot`.
- Types `WebcamControls` and `WebcamDebug` are exported.

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
`errorCode`. The second argument provides `retry()`, which requests the camera
again with the same options.

```tsx
<Webcam
  errorFallback={(detail, { retry }) => (
    <div>
      {detail.errorCode === "device-not-found"
        ? "No camera is connected."
        : "Camera could not be started."}
      <button onClick={retry}>Try again</button>
    </div>
  )}
/>
```

The browser may not show the permission prompt again after a denial. In that
case, `retry()` fails with the same error until the user allows access in the
browser settings.

`playback-error` is not covered by `errorFallback` because the stream is still
alive and only video playback failed.

Some mobile browsers end the camera track while the tab is in the background,
which produces a `track-ended` error. Set `autoRecover` to request the stream
again when the tab becomes visible. It requests at most once per visibility
change and ignores other errors such as permission denial.

```tsx
<Webcam autoRecover />
```

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

## Use An Existing Video Element

`useWebcam` manages camera access and playback for a video element owned by
your application. It preserves the element's `transform` and `objectFit` styles
and does not render UI. Set `muted` and `playsInline` on the video yourself.
The hook never changes them, because the element belongs to your application.

```tsx
import { useState } from "react";
import { useWebcam } from "@cp949/react-webcam";

export function CameraSource() {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const camera = useWebcam({
    videoElement,
    webcamOptions: { facingMode: "user", size: { width: 1280 } },
  });

  return (
    <>
      <video ref={setVideoElement} muted playsInline />
      <output>{camera.isFrameReady ? "Frame ready" : camera.detail.phase}</output>
      <button onClick={camera.retry}>Retry camera</button>
      <button onClick={camera.resumePlayback}>Resume playback</button>
    </>
  );
}
```

- `videoElement` accepts an existing `HTMLVideoElement`, `null`, or `undefined`.
  Use state or a callback ref so that attaching or replacing the element triggers
  a render. A video with `display: none` also works with explicit camera sizing.
- `webcamOptions` accepts the same options as `Webcam`. `disabled` prevents
  requests and stops an existing stream; no element also means no request.
- `detail.phase === "live"` means the stream was acquired. It does not guarantee
  that `play()` succeeded or that a frame has arrived. Use `isFrameReady` before
  starting face detection: it requires the current stream, `readyState >= 2`
  (`HAVE_CURRENT_DATA`), positive video dimensions, the `live` phase, and a video
  track that is not `muted`. The track becomes `muted` without `ended` when
  another app takes the camera or the page goes to the background; `phase` stays
  `live` and `isFrameReady` turns `false` until the track is `unmuted`.
  A paused video may still have a usable frame; this flag does not mean frames
  keep advancing.
- `retry()` stops the current stream and requests a new one with the same options.
  It also works after access failure or `track-ended`, but does not bypass browser
  permission requirements or request anything while disabled.
- `pausePlayback()` pauses only the video. `resumePlayback()` retries playback;
  failures appear as `playback-error` in `detail`.
- `autoRecover: true` calls `retry()` when the tab becomes visible after a
  `track-ended` error. It acts at most once per visibility change, ignores other
  errors, and does nothing while `disabled`. It defaults to `false`.
- The hook calls `play()` as soon as it attaches the stream. If the browser's
  autoplay policy rejects that call (for example, `muted` is missing), `detail.phase`
  becomes `playback-error` and `isFrameReady` stays `false`. Set `muted` and
  `playsInline` before passing the element. Without `playsInline`, iOS Safari does
  not play inline. After a playback failure, call `resumePlayback()` from a user gesture.
  Chrome 83 in the project's automation container did not block unmuted playback,
  so that environment cannot reproduce this failure.
- Element replacement and unmount stop owned tracks and detach the owned stream
  from the video. Avoid managing the same video's `srcObject` or camera stream
  from another controller at the same time.

## Camera Error Classification

### Migration To 2.0.0

`SecurityError` now reports `security-error` / `error` instead of
`insecure-context` / `insecure`. Update branches that previously treated every
`SecurityError` as an HTTPS problem. Actual insecure contexts still report
`insecure-context` / `insecure`.

`WebcamErrorCode` gains `security-error` and `policy-blocked`; update exhaustive
switches or code-to-message mappings. A confirmed policy block reports
`policy-blocked` / `denied`. An unconfirmed `NotAllowedError` keeps the existing
`permission-denied` / `denied` classification.

- `insecure-context`: the page is outside a secure context. This check runs
  before API support checks, including when HTTP makes `mediaDevices` absent.
- `policy-blocked` (`denied` phase): the browser's policy inspection API confirms
  that a requested camera or microphone is blocked. Both `permissionsPolicy`
  and the older `featurePolicy` API are supported when available.
- `permission-denied`: `NotAllowedError` or `PermissionDeniedError` without a
  confirmed policy block. This code does not prove that the user clicked Deny;
  policy inspection is not available in every browser.
- `security-error` (`error` phase): the browser returned `SecurityError` because
  media access is disabled for the document. It is not classified as HTTP usage.

### Error Codes, Causes, And Actions

`detail.errorCode` is always present in the `denied`, `unavailable`, `unsupported`,
`insecure`, and `error` phases. Causes that code cannot fix need guidance text from
the consumer.

| errorCode                 | phase         | Cause                                                                                                  | Consumer action                                                                                    |
| ------------------------- | ------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `permission-denied`       | `denied`      | `NotAllowedError` or `PermissionDeniedError`. No policy block was confirmed.                           | Tell the user to allow access in the browser's site settings. `retry()` fails until then.          |
| `policy-blocked`          | `denied`      | Permissions-Policy or the iframe `allow` attribute blocks the requested camera or mic.                 | Set the header on the host page or `allow="camera; microphone"` on the iframe.                     |
| `security-error`          | `error`       | Media use is disabled for the document and the browser returned `SecurityError`.                       | Check the document policy and iframe settings. Do not show HTTPS guidance.                         |
| `device-not-found`        | `unavailable` | No matching input device exists (`NotFoundError`).                                                     | Ask the user to connect a camera, then call `retry()`.                                             |
| `device-in-use`           | `unavailable` | Another app or tab holds the device, or the hardware failed to start (`NotReadableError`).             | Ask the user to close the other app, then call `retry()`.                                          |
| `constraints-unsatisfied` | `error`       | No device meets the constraints (`OverconstrainedError`). Example: an unknown `deviceId` with `exact`. | Use `deviceSelectionStrategy: "ideal"` or relax resolution and `deviceId` constraints.             |
| `unsupported-browser`     | `unsupported` | `navigator.mediaDevices` or `getUserMedia` is missing.                                                 | Point the user to a supported browser. `retry()` cannot recover.                                   |
| `insecure-context`        | `insecure`    | The page runs outside a secure context, such as plain HTTP.                                            | Serve over HTTPS or `localhost`.                                                                   |
| `aborted`                 | `error`       | The browser aborted the request (`AbortError`).                                                        | Call `retry()`.                                                                                    |
| `track-ended`             | `error`       | The video track ended unexpectedly. Example: the camera was unplugged.                                 | Call `retry()` or enable `autoRecover`. An audio track ending reports `audioEnded`, not this code. |
| `unknown`                 | `error`       | An exception outside the categories above.                                                             | Log `detail.error`'s `name` and `message`, and offer `retry()`.                                    |

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

If only the audio track ends (for example, the microphone is unplugged), the phase stays `live`
and the video keeps playing. `detail.audioEnded` becomes `true`. A video track ending still
moves to `error` with `track-ended`.

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
| `getDetail()`                | Returns the current `WebcamDetail`, same value as `onStateChange`        |
| `getPlayingVideoDeviceId()`  | Returns the current video track device ID                                |
| `getPlayingAudioDeviceId()`  | Returns the current audio track device ID                                |
| `setFlipped(value)`          | Updates the horizontal flip state                                        |
| `setWebcamOptions(updater)`  | Updates webcam options                                                   |
| `pausePlayback()`            | Pauses only video playback, while keeping the camera stream alive        |
| `resumePlayback()`           | Resumes paused video playback                                            |
| `retry()`                    | Requests the camera stream again with the same options                   |

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

### Follow Device Changes with `useMediaDevices`

`useMediaDevices(kind?)` loads the device list after mount and refreshes it on every
`devicechange` event, such as plugging in or unplugging a USB camera.

```tsx
import { useMediaDevices } from "@cp949/react-webcam";

function CameraPicker({ onSelect }: { onSelect: (deviceId: string) => void }) {
  const { devices, labelsAvailable, error, refresh } = useMediaDevices("videoinput");

  if (error) return <p>Could not list cameras: {error.message}</p>;

  return (
    <select onChange={(e) => onSelect(e.target.value)} onFocus={() => void refresh()}>
      {devices.map((device, index) => (
        <option key={device.deviceId} value={device.deviceId}>
          {labelsAvailable ? device.label : `Camera ${index + 1}`}
        </option>
      ))}
    </select>
  );
}
```

| Field             | Description                                                                       |
| ----------------- | --------------------------------------------------------------------------------- |
| `devices`         | Last loaded devices. Empty before the first load.                                 |
| `labelsAvailable` | `true` when there are devices and all have a `label`.                             |
| `error`           | Last load error, or `undefined`. The hook does not throw.                         |
| `refresh()`       | Loads the list again. Call it after the user grants permission to get the labels. |

Before camera or microphone permission is granted, browsers return an empty `label`.
When `labelsAvailable` is `false`, show a fallback name such as `Camera 1`.

## Recipes

### QR Scan: Start When A Frame Is Ready

Start the frame-callback loop after `isFrameReady` becomes `true`.
`live` alone does not guarantee that a frame has arrived, so do not use `detail.phase` as the start signal.
The app picks `decode`. Wrap `BarcodeDetector` or a QR decoding library.
Pass stable references for `decode` and `onResult`. A changed reference restarts the loop.
In browsers without `requestVideoFrameCallback`, switch to `requestAnimationFrame`.

```tsx
import { useEffect, useState } from "react";
import { useWebcam } from "@cp949/react-webcam";

export function QrScanner({
  decode,
  onResult,
}: {
  decode: (video: HTMLVideoElement) => Promise<string | null>;
  onResult: (text: string) => void;
}) {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const { isFrameReady } = useWebcam({
    videoElement: video,
    webcamOptions: { facingMode: "environment" },
  });

  useEffect(() => {
    if (!video || !isFrameReady) return;
    let canceled = false;
    let handle = 0;

    const scan = async () => {
      const text = await decode(video).catch(() => null);
      if (canceled) return;
      if (text) {
        onResult(text);
        return;
      }
      handle = video.requestVideoFrameCallback(scan);
    };

    handle = video.requestVideoFrameCallback(scan);
    return () => {
      canceled = true;
      video.cancelVideoFrameCallback(handle);
    };
  }, [video, isFrameReady, decode, onResult]);

  return <video ref={setVideo} muted playsInline />;
}
```

### Permission Denied Guide With `retry`

Both `permission-denied` and `policy-blocked` land in the `denied` phase.
After a denial, the browser may not show the prompt again.
`retry()` fails with the same error until the user allows access in the browser settings.
Write the guidance text with that in mind. For per-code actions, see the "Error Codes, Causes, And Actions" table.

```tsx
<Webcam
  errorFallback={(detail, { retry }) =>
    detail.phase === "denied" ? (
      <div>
        <p>Camera access is required. Allow it from the camera icon in the address bar.</p>
        <button onClick={retry}>I allowed it, try again</button>
      </div>
    ) : (
      <div>
        <p>The camera could not start. ({detail.errorCode})</p>
        <button onClick={retry}>Try again</button>
      </div>
    )
  }
/>
```

### Upload A Snapshot As A `Blob`

Call `canvas.toBlob` directly on the canvas that `onSnapshot` receives.
`toBlob` passes `null` on failure, so wrap it in a `Promise` and turn that into an error.
`/api/snapshots` is an example path. Replace it with your upload endpoint.

```tsx
function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      type,
      quality,
    );
  });
}

async function uploadSnapshot(canvas: HTMLCanvasElement) {
  const body = new FormData();
  body.append("file", await toBlob(canvas, "image/jpeg", 0.9), "snapshot.jpg");
  const response = await fetch("/api/snapshots", { method: "POST", body });
  if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
}

<Webcam
  controls={{ snapshot: true }}
  onSnapshot={(canvas) => {
    uploadSnapshot(canvas).catch(console.error);
  }}
/>;
```

## Styling

### CSS Variables

The package ships no stylesheet. Colors are inline styles that read CSS
variables with the current value as the fallback, so nothing changes until you
set a variable. Set them on `Webcam` or any ancestor.

```tsx
<div style={{ "--webcam-bg": "#000", "--webcam-accent": "#e91e63" } as React.CSSProperties}>
  <Webcam controls={{ snapshot: true }} />
</div>
```

| Variable                 | Default   | Affects                                          |
| ------------------------ | --------- | ------------------------------------------------ |
| `--webcam-bg`            | `#1e1e1e` | Root and video background                        |
| `--webcam-disabled-bg`   | `#f7f8fa` | Root and placeholder background while `disabled` |
| `--webcam-accent`        | `#1976d2` | Snapshot button color on hover                   |
| `--webcam-flip-active`   | `#ff7600` | Flip button color while flipped                  |
| `--webcam-menu-bg`       | `#fff`    | Popup menu background                            |
| `--webcam-menu-fg`       | `#000`    | Popup menu item text color                       |
| `--webcam-menu-hover-bg` | `#f5f5f5` | Popup menu item background on hover              |
| `--webcam-menu-z-index`  | `1300`    | Popup menu `z-index`                             |

These names are public API. Renaming one is a breaking change. Other colors, such
as the button overlays, are not configurable. A `style` prop value still wins
over the variables for the properties it sets.

### Class Names

Use these class names to target the built-in elements from your own CSS. They are
public API, and renaming one is a breaking change.

| Class                                                                                       | Element                                                     |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `Webcam-root`                                                                               | Root `div`. Your `className` is added next to it            |
| `Webcam-video`                                                                              | The `video` element                                         |
| `Webcam-optionBtn`                                                                          | Wrapper of the flip, camera direction, aspect ratio buttons |
| `FlipButton-root`, `FacingModeButton-root`, `AspectRatioButton-root`, `SnapshotButton-root` | Wrapper of each built-in button                             |
| `x_btn`                                                                                     | The `button` inside each built-in button wrapper            |

Colors and layout are inline styles, so a class rule loses to them unless it uses
`!important`. Prefer the CSS variables above for colors. Other classes, such as the
`x_fullHeight` and `x_fixedHeight` state markers on the root, are internal and may change.

## Labels And Localization

The built-in button labels default to Korean. Pass the `WEBCAM_LABELS_EN`
preset to switch the built-in UI to English.

```tsx
import { Webcam, WEBCAM_LABELS_EN } from "@cp949/react-webcam";

<Webcam
  controls={{ flip: true, cameraDirection: true, aspectRatio: true, snapshot: true }}
  labels={WEBCAM_LABELS_EN}
/>;
```

For app-specific strings, pass only the keys you want to override to `labels`.

```tsx
<Webcam controls={{ flip: true }} labels={{ ...WEBCAM_LABELS_EN, flip: "Selfie view" }} />
```

To receive the captured frame when the built-in snapshot button is clicked, pass
`onSnapshot`. The canvas has the original video resolution.

```tsx
<Webcam
  controls={{ snapshot: true }}
  onSnapshot={(canvas) => {
    canvas.toBlob((blob) => blob && upload(blob), "image/jpeg", 0.9);
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
| `flipped`                     | Controlled without a change callback. Button and ref change requests are ignored  |
| `defaultFlipped`              | Uncontrolled. Initial value only, then internal state is managed by the component |
| Neither prop                  | Uncontrolled, default initial value `false`                                       |

```tsx
import { useState } from "react";
import { Webcam } from "@cp949/react-webcam";

export function FlipOwnershipExample() {
  const [flipped, setFlipped] = useState(false);

  return (
    <>
      <Webcam flipped={flipped} onFlippedChange={setFlipped} controls={{ flip: true }} />

      <Webcam defaultFlipped controls={{ flip: true }} />
    </>
  );
}
```

### `webcamOptions`

| Pattern                                   | Behavior                                                                   |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| `webcamOptions` + `onWebcamOptionsChange` | Fully controlled                                                           |
| `webcamOptions`                           | Controlled without a change callback. Internal change requests are ignored |
| `defaultWebcamOptions`                    | Uncontrolled                                                               |
| Neither prop                              | Uncontrolled with defaults                                                 |

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
        controls={{ cameraDirection: true, aspectRatio: true }}
      />

      <Webcam
        defaultWebcamOptions={{ facingMode: "environment", aspectRatio: 4 / 3 }}
        controls={{ cameraDirection: true, aspectRatio: true }}
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
