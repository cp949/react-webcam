# @cp949/react-webcam

React 18/19를 지원하는 웹캠 컴포넌트 라이브러리입니다.

- controlled / uncontrolled 상태 소유권을 지원합니다.
- `WebcamHandle` ref로 snapshot, 옵션 변경, playback pause/resume을 제어할 수 있습니다.
- `onStateChange`로 권한 거부, autoplay 차단, 장치 unavailable 같은 런타임 상태를 다룰 수 있습니다.

자세한 저장소 운영 방법과 개발 명령은 루트 README에서 다룹니다.

## 설치

```bash
pnpm add @cp949/react-webcam
# npm install @cp949/react-webcam
```

**React 18과 19를 지원합니다.** React 17 이하는 지원하지 않습니다.

```bash
pnpm add react@^18 react-dom@^18
# 또는
pnpm add react@^19 react-dom@^19
```

## 브라우저 호환성 목표

pack된 라이브러리 산출물과 소비자 번들의 목표 하한은 Chrome Desktop 75입니다.
이는 호환성 목표이며 Chrome 75 브라우저 직접 실행 기록은 아닙니다. 카메라 접근에는
HTTPS 또는 localhost, 사용자 권한, 사용 가능한 장치가 필요합니다. 저장소의 Next/MUI
demo는 별도 소비자이므로 이 목표에 포함하지 않습니다.

자동화 검증의 실제 하한은 Chrome 83입니다(Playwright의 CDP 제약으로 Chrome 75/76
자동화가 불가능하기 때문입니다). 이 자동화 게이트는 CI가 아니라 릴리스 전 로컬 수동
스크립트로 실행됩니다.

## 기본 사용법

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

`fitMode`로 부모 컨테이너에 맞추는 경우:

```tsx
<div style={{ width: 640, height: 480 }}>
  <Webcam fitMode='cover' webcamOptions={{ audioEnabled: true }} />
</div>
```

## Props

`Webcam`은 아래 표의 props 외에 `ref`로 `WebcamHandle`도 받을 수 있습니다(자세한
내용은 뒤의 ref handle 절 참고).

| Prop                            | 타입                                                                   | 기본값           | 설명                                                                                          |
| ------------------------------- | ---------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------- |
| `style`                         | `React.CSSProperties`                                                  | —                | 루트 엘리먼트에 적용할 인라인 스타일입니다.                                                     |
| `className`                     | `string`                                                                | —                | 루트 엘리먼트에 적용할 클래스명입니다.                                                          |
| `children`                      | `React.ReactNode`                                                      | —                | 루트 엘리먼트 내부, 비디오 위에 렌더링됩니다.                                                   |
| `disabled`                      | `boolean`                                                               | `false`          | 카메라 요청 없이 컴포넌트를 비활성 상태로 유지합니다(뒤의 비활성 상태 절 참고).                 |
| `disabledFallback`              | `React.ReactNode`                                                      | —                | `disabled`일 때 기본 placeholder 대신 렌더링할 커스텀 UI입니다.                                 |
| `errorFallback`                 | `React.ReactNode \| ((detail: WebcamErrorDetail) => React.ReactNode)`  | —                | `denied` / `unavailable` / `unsupported` / `insecure` / `error` 상태의 커스텀 UI입니다. `playback-error`는 포함하지 않습니다. |
| `onStateChange`                 | `(state: WebcamDetail) => void`                                        | —                | `WebcamDetail`이 바뀔 때마다 호출됩니다(뒤의 상태 변화 감지 절 참고).                           |
| `fitMode`                       | `"unset" \| "fill" \| "cover" \| "contain"`                            | `"unset"`        | `webcamOptions.aspectRatio`가 없을 때 비디오를 박스에 맞추는 방식입니다.                        |
| `flipped`                       | `boolean`                                                               | —                | 제어형 좌우 반전 상태입니다. `onFlippedChange`가 없으면 읽기 전용입니다(뒤의 `flipped` 절 참고). |
| `onFlippedChange`               | `(value: boolean) => void`                                             | —                | 제어 모드에서 반전 변경이 요청될 때 호출됩니다.                                                 |
| `defaultFlipped`                | `boolean`                                                               | `false`          | 비제어 모드의 초기 반전 상태입니다. 마운트 시 한 번만 적용됩니다.                               |
| `webcamOptions`                 | `WebcamOptions`                                                         | —                | 제어형 카메라 옵션(`facingMode`, `aspectRatio`, `audioEnabled`, `deviceId`, `size` 등)입니다. `onWebcamOptionsChange`가 없으면 읽기 전용입니다(뒤의 `webcamOptions` 절 참고). |
| `onWebcamOptionsChange`         | `(options: WebcamOptions) => void`                                     | —                | 제어 모드에서 옵션 변경이 요청될 때 호출됩니다.                                                 |
| `defaultWebcamOptions`          | `WebcamOptions`                                                         | —                | 비제어 모드의 초기 카메라 옵션입니다. 마운트 시 한 번만 적용됩니다.                             |
| `visibleFlipButton`             | `boolean`                                                               | `false`          | 내장 좌우 반전 버튼 표시 여부입니다.                                                            |
| `visibleCameraDirectionButton`  | `boolean`                                                               | `false`          | 내장 전/후면 카메라 버튼 표시 여부입니다.                                                       |
| `visibleAspectRatioButton`      | `boolean`                                                               | `false`          | 내장 화면 비율 버튼 표시 여부입니다.                                                            |
| `visibleSnapshotButton`         | `boolean`                                                               | `false`          | 내장 스냅샷 버튼 표시 여부입니다.                                                               |
| `visibleVideoSizeDebug`         | `boolean`                                                               | `false`          | 비디오 요소 크기를 보여주는 디버그 오버레이입니다.                                              |
| `visibleConstraintsDebug`       | `boolean`                                                               | `false`          | 현재 적용된 `MediaStreamConstraints`를 보여주는 디버그 오버레이입니다.                          |
| `labels`                        | `WebcamLabels`                                                          | 한국어 기본값    | 내장 버튼 라벨을 부분적으로 덮어씁니다(뒤의 라벨과 로컬라이제이션 절 참고).                     |

## 비활성 상태 - `disabled`

웹캠을 마운트한 채로 유지하되, 아직 카메라 접근을 요청하면 안 되는 경우
`disabled`를 사용할 수 있습니다.

`disabled={true}`이면:

- `getUserMedia()`를 호출하지 않습니다.
- 컴포넌트는 기존 `idle` 흐름에 머뭅니다.
- 기본으로 텍스트 없는 soft gradient + 카메라 아이콘 placeholder를 렌더링합니다.

다시 `disabled={false}`가 되면 웹캠은 일반적인 요청 흐름으로 복귀합니다.

### 기본 placeholder

```tsx
<Webcam disabled />
```

### 커스텀 비활성 fallback

`disabledFallback`을 전달하면 기본 placeholder를 완전히 대체할 수 있습니다.

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

### 커스텀 에러 fallback

`errorFallback`을 전달하면 권한 거부, 카메라 없음, 브라우저 미지원 같은 오류
상태에서 커스텀 UI를 렌더링할 수 있습니다. 함수로 전달하면 현재
`WebcamDetail`을 받아 오류 원인별 메시지를 분기할 수 있습니다.

```tsx
<Webcam
  errorFallback={(detail) => (
    <div>
      {detail.errorCode === "device-not-found"
        ? "연결된 카메라가 없습니다."
        : "카메라를 시작할 수 없습니다."}
    </div>
  )}
/>
```

`playback-error`는 스트림이 살아 있는 재생 오류이므로 `errorFallback` 대상이 아닙니다.

### 비활성 상태 토글

```tsx
import { useState } from "react";
import { Webcam } from "@cp949/react-webcam";

export function DisabledExample() {
  const [disabled, setDisabled] = useState(true);

  return (
    <>
      <button type='button' onClick={() => setDisabled((prev) => !prev)}>
        웹캠 토글
      </button>

      <div style={{ width: 640, height: "auto" }}>
        <Webcam disabled={disabled} />
      </div>
    </>
  );
}
```

## 상태 변화 감지 - `onStateChange`

`onStateChange`는 `WebcamDetail`이 변경될 때마다 호출됩니다. `pausePlayback()`은 `WebcamDetail`을 변경하지 않으므로 `onStateChange`를 발생시키지 않습니다. `resumePlayback()`은 성공 시 보통 현재 상태를 유지하거나 `playback-error`를 해제하고, 실패 시 `playback-error`를 발생시킬 수 있습니다.

```tsx
import { Webcam, type WebcamDetail } from "@cp949/react-webcam";

export function CameraView() {
  function handleStateChange(detail: WebcamDetail) {
    switch (detail.phase) {
      case "live":
        console.log("스트림 시작:", detail.mediaStream);
        break;
      case "playback-error":
        console.warn("재생 차단:", detail.error);
        break;
      case "denied":
        console.warn("카메라 권한이 거부되었습니다.");
        break;
      case "unavailable":
        console.warn("카메라를 찾을 수 없거나 사용 중입니다.");
        break;
      case "insecure":
        console.error("HTTPS 환경에서만 카메라를 사용할 수 있습니다.");
        break;
      case "unsupported":
        console.error("이 브라우저는 카메라를 지원하지 않습니다.");
        break;
      case "error":
        if (detail.errorCode === "track-ended") {
          console.warn("카메라 트랙이 종료되었습니다. 재시작을 안내하세요.");
        } else {
          console.error("오류:", detail.errorCode, detail.error);
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

### 상태 흐름

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
live -> requesting -> live   (webcamOptions 변경 시 자동 재시작)
```

`WebcamDetail`은 `phase`를 기준으로 분기하는 discriminated union입니다.

```ts
function handleDetail(detail: WebcamDetail) {
  if (detail.phase === "live") {
    console.log(detail.mediaStream);
    console.log(detail.constraints);
  } else if (detail.phase === "playback-error") {
    console.warn("재생 실패:", detail.error);
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

## ref handle - `WebcamHandle`

`ref` prop으로 `WebcamHandle`을 받아 스냅샷 캡처, 디바이스 조회, 옵션 변경을 명령형으로 제어할 수 있습니다.

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
        스냅샷 찍기
      </button>
    </div>
  );
}
```

### `WebcamHandle` API

| 메서드                       | 설명                                                         |
| ---------------------------- | ------------------------------------------------------------ |
| `snapshotToCanvas(options?)` | 현재 프레임을 `HTMLCanvasElement`로 반환. 준비 전이면 `null` |
| `getPlayingVideoDeviceId()`  | 재생 중인 비디오 트랙의 디바이스 ID                          |
| `getPlayingAudioDeviceId()`  | 재생 중인 오디오 트랙의 디바이스 ID                          |
| `setFlipped(value)`          | 좌우 반전 상태 변경                                          |
| `setWebcamOptions(updater)`  | 카메라 옵션 갱신                                             |
| `pausePlayback()`            | video 재생을 일시 정지한다. 카메라 스트림은 유지된다         |
| `resumePlayback()`           | 일시 정지된 video 재생을 재개한다                            |

> `pausePlayback()`과 `resumePlayback()`은 `video.pause()` / `video.play()`만 호출합니다. 카메라 하드웨어를 끄거나 `MediaStreamTrack`을 stop하지 않습니다. 카메라 LED는 계속 켜져 있으며, track-ended 이벤트 감지도 계속 작동합니다. `pausePlayback()`은 `onStateChange`를 발생시키지 않지만, `resumePlayback()`은 실패 시 `playback-error`를 publish할 수 있습니다.

> `HTMLVideoElement`와 `MediaStream` 객체는 handle에서 직접 노출하지 않습니다.
> 스트림 정보가 필요하면 `onStateChange`의 `WebcamDetail`을 통해 읽으세요.

## 디바이스 목록 조회

렌더링 전에 시스템의 입력 디바이스 목록이 필요하면 공개 유틸 함수를 사용할 수 있습니다.

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

반환 타입은 브라우저 기본 `MediaDeviceInfo[]`입니다.

## 라벨과 로컬라이제이션

내장 버튼 라벨의 기본값은 한국어입니다. 영어 UI나 서비스 문구에 맞추려면
`labels` prop으로 필요한 항목만 덮어쓰면 됩니다.

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
    aspectRatio: "Aspect Ratio",
    aspectRatioAuto: "Auto",
    snapshot: "Take snapshot",
  }}
/>
```

## 상태 소유권 - Controlled / Uncontrolled

`flipped`와 `webcamOptions`는 React의 표준 controlled/uncontrolled 패턴을 따릅니다.

### `flipped` 소유권

| 사용 방법                     | 동작                                                                                   |
| ----------------------------- | -------------------------------------------------------------------------------------- |
| `flipped` + `onFlippedChange` | 완전 controlled. 버튼/ref 변경 시 `onFlippedChange`만 호출하고 내부 상태는 바꾸지 않음 |
| `flipped`                     | read-only controlled. 버튼/ref 변경이 무시됨                                           |
| `defaultFlipped`              | uncontrolled. 마운트 시 초기값 지정, 이후 내부 상태를 라이브러리가 관리                |
| 둘 다 미지정                  | uncontrolled, 초기값 `false`                                                           |

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

첫 번째 `Webcam`은 상위 컴포넌트가 반전 상태를 소유하는 controlled 예제이고, 두 번째 `Webcam`은 초기값만 넘기고 이후 상태를 내부에서 관리하는 uncontrolled 예제입니다.

### `webcamOptions` 소유권

| 사용 방법                                 | 동작                      |
| ----------------------------------------- | ------------------------- |
| `webcamOptions` + `onWebcamOptionsChange` | 완전 controlled           |
| `webcamOptions`                           | read-only controlled      |
| `defaultWebcamOptions`                    | uncontrolled              |
| 둘 다 미지정                              | uncontrolled, 기본값 사용 |

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

첫 번째는 카메라 방향과 비율 변경 결과를 상위 상태에 반영하는 controlled 예제이고, 두 번째는 초기 옵션만 지정한 뒤 내부 상태에 맡기는 uncontrolled 예제입니다.

## 런타임 제약

- 브라우저 환경에서만 동작합니다.
- 카메라 접근은 HTTPS 또는 `localhost` 보안 컨텍스트가 필요합니다.
- 실제 장치가 없거나 다른 앱이 장치를 점유 중이면 `unavailable` 상태가 될 수 있습니다.
- 브라우저 autoplay 정책에 의해 `video.play()`가 차단되면 `playback-error` 상태가 됩니다. 이 경우 카메라 스트림은 살아 있으며, 사용자 인터랙션 후 `resumePlayback()`을 호출해 `live`로 복구할 수 있습니다.

## 학습용 데모 앱

`apps/demo`는 패키지 README를 대체하는 문서가 아니라, 실제 동작을 실험하고 검증하는 학습용 앱입니다.

- Basic Usage
- Common Controls
- Controlled State
- Device Selection
- Pause / Resume
- Ref Handle
- State Inspector
- Recipes
