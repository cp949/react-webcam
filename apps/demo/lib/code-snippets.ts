// 각 섹션의 핵심 TSX 코드 예시

import type { DemoSectionId } from "./types";

export const CODE_SNIPPETS: Record<DemoSectionId, string> = {
  basic: `import { Webcam } from '@cp949/react-webcam';

export default function BasicExample() {
  return (
    <Webcam
      visibleFlipButton
      visibleCameraDirectionButton
    />
  );
}`,

  controls: `import { useState } from 'react';
import { Webcam } from '@cp949/react-webcam';
import type { WebcamOptions, WebcamProps } from '@cp949/react-webcam';

export default function ControlsExample() {
  const [options, setOptions] = useState<WebcamOptions>({
    facingMode: 'user',
    aspectRatio: 4 / 3,
  });
  const [fitMode, setFitMode] = useState<WebcamProps['fitMode']>('cover');
  const [defaultPreset, setDefaultPreset] = useState<'portrait' | 'square'>('portrait');
  const [defaultDemoKey, setDefaultDemoKey] = useState(0);
  const [lockedFacingMode, setLockedFacingMode] = useState<'user' | 'environment'>('user');

  const defaultWebcamOptions =
    defaultPreset === 'portrait'
      ? { aspectRatio: 3 / 4, facingMode: 'environment' }
      : { aspectRatio: 1, facingMode: 'user' };

  return (
    <>
      <Webcam
        webcamOptions={options}
        onWebcamOptionsChange={setOptions}
      />

      {/* aspectRatio 없이 fitMode만 보여주는 전용 예제 */}
      <div>
        <button onClick={() => setFitMode('cover')}>cover</button>
        <button onClick={() => setFitMode('contain')}>contain</button>
        <button onClick={() => setFitMode('fill')}>fill</button>
        <button onClick={() => setFitMode('unset')}>unset</button>
        <Webcam
          webcamOptions={{ facingMode: options.facingMode }}
          fitMode={fitMode}
          style={{ width: '100%', height: 320 }}
        />
      </div>

      <div>
        <button onClick={() => setDefaultPreset('portrait')}>세로 3:4</button>
        <button onClick={() => setDefaultPreset('square')}>정사각형 1:1</button>
        <button onClick={() => setDefaultDemoKey((prev) => prev + 1)}>
          기본값 다시 적용
        </button>
        <Webcam
          key={defaultDemoKey}
          defaultWebcamOptions={defaultWebcamOptions}
          visibleAspectRatioButton
          visibleCameraDirectionButton
        />
      </div>

      <div>
        <button
          onClick={() =>
            setLockedFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))
          }
        >
          부모에서 facingMode 변경
        </button>
        <Webcam
          webcamOptions={{ facingMode: lockedFacingMode, aspectRatio: 16 / 9 }}
          visibleCameraDirectionButton
          visibleAspectRatioButton
        />
      </div>
    </>
  );
}`,

  labels: `import { useState } from 'react';
import { Webcam } from '@cp949/react-webcam';

export default function LabelsExample() {
  const [locale, setLocale] = useState<'ko' | 'en'>('ko');

  const labels =
    locale === 'ko'
      ? {
          flip: '미러',
          snapshot: '스냅샷',
          cameraDirection: '전면/후면 카메라',
          facingModeBack: '후면',
          facingModeFront: '전면',
          facingModeDefault: '기본',
          aspectRatio: '크기 비율',
          aspectRatioAuto: '자동',
        }
      : {
          flip: 'Mirror',
          snapshot: 'Take snapshot',
          cameraDirection: 'Front / Rear Camera',
          facingModeBack: 'Rear',
          facingModeFront: 'Front',
          facingModeDefault: 'Default',
          aspectRatio: 'Aspect ratio',
          aspectRatioAuto: 'Auto',
        };

  return (
    <Webcam
      labels={labels}
      visibleFlipButton
      visibleSnapshotButton
      visibleCameraDirectionButton
      visibleAspectRatioButton
    />
  );
}`,

  controlled: `import { useState } from 'react';
import { Webcam } from '@cp949/react-webcam';

// Controlled: 부모가 flipped 상태를 소유
function ControlledExample() {
  const [flipped, setFlipped] = useState(false);
  return (
    <Webcam
      flipped={flipped}
      onFlippedChange={setFlipped}
      visibleFlipButton
    />
  );
}

// Uncontrolled: 컴포넌트 내부가 상태를 소유
function UncontrolledExample() {
  return <Webcam defaultFlipped={false} visibleFlipButton />;
}

// Read-only controlled: 부모가 값은 주지만 변경 콜백은 생략
function ReadonlyControlledExample() {
  const [flipped, setFlipped] = useState(true);

  return (
    <>
      <Webcam flipped={flipped} visibleFlipButton />
      <button onClick={() => setFlipped((value) => !value)}>
        부모에서만 토글
      </button>
    </>
  );
}`,

  "device-selection": `import { useEffect, useMemo, useState } from 'react';
import { Webcam, useMediaDevices } from '@cp949/react-webcam';

export default function DeviceSelectionExample() {
  // devicechange(USB 카메라 꽂기·뽑기)마다 devices가 자동으로 갱신된다.
  const { devices, labelsAvailable, error, refresh } = useMediaDevices('videoinput');
  const [deviceId, setDeviceId] = useState<string>('');

  // 선택한 장치가 뽑히면 첫 장치로 돌린다.
  useEffect(() => {
    setDeviceId((current) =>
      devices.some((d) => d.deviceId === current) ? current : (devices[0]?.deviceId ?? ''),
    );
  }, [devices]);

  const webcamOptions = useMemo(
    () => ({
      audioEnabled: false,
      deviceId: deviceId || undefined,
    }),
    [deviceId],
  );

  if (error) return <p>카메라 목록을 불러오지 못했습니다: {error.message}</p>;

  return (
    <>
      <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
        {devices.map((device, index) => (
          <option key={device.deviceId} value={device.deviceId}>
            {/* 권한 허용 전에는 label이 비어 있으므로 대체 이름을 쓴다. */}
            {labelsAvailable ? device.label : \`카메라 \${index + 1}\`}
          </option>
        ))}
      </select>
      <button onClick={() => void refresh()}>새로고침</button>

      <Webcam webcamOptions={webcamOptions} visibleCameraDirectionButton />
    </>
  );
}`,

  "ref-handle": `import { useRef } from 'react';
import { Webcam } from '@cp949/react-webcam';
import type { WebcamHandle } from '@cp949/react-webcam';

export default function RefHandleExample() {
  const ref = useRef<WebcamHandle>(null);

  const handleSnapshot = () => {
    const canvas = ref.current?.snapshotToCanvas();
    if (canvas) {
      // canvas를 이미지로 변환 또는 표시
      document.body.appendChild(canvas);
    }
  };

  return (
    <>
      <Webcam ref={ref} />
      <button onClick={handleSnapshot}>스냅샷 찍기</button>
      <button onClick={() => ref.current?.setFlipped(true)}>
        좌우 반전
      </button>
    </>
  );
}`,

  snapshot: `import { Webcam } from '@cp949/react-webcam';

export default function SnapshotExample() {
  const handleSnapshot = (canvas: HTMLCanvasElement) => {
    // canvas는 비디오 원본 해상도다. 필요하면 직접 줄여서 쓴다.
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        console.log('snapshot', blob.type, blob.size);
        // upload(blob);
      },
      'image/jpeg',
      0.9,
    );
  };

  return <Webcam visibleSnapshotButton onSnapshot={handleSnapshot} />;
}`,

  state: `import { useState } from 'react';
import { Webcam } from '@cp949/react-webcam';
import type { WebcamSnapshot } from '@cp949/react-webcam';

export default function StateInspectorExample() {
  const [snapshot, setSnapshot] = useState<WebcamSnapshot | null>(null);

  return (
    <>
      <Webcam onStateChange={setSnapshot} />
      <pre>{JSON.stringify(snapshot, null, 2)}</pre>
    </>
  );
}`,

  "disabled-state": `import { useState } from 'react';
import { Webcam } from '@cp949/react-webcam';
import type { WebcamPhase } from '@cp949/react-webcam';

export default function DisabledStateExample() {
  const [disabled, setDisabled] = useState(true);
  const [phase, setPhase] = useState<WebcamPhase>('idle');

  const displayPhase = disabled ? 'idle' : phase;

  return (
    <>
      <button type="button" onClick={() => setDisabled((prev) => !prev)}>
        {disabled ? '카메라 활성화' : '카메라 비활성화'}
      </button>

      <div style={{ width: '100%', maxWidth: 640, aspectRatio: '4 / 3' }}>
        <Webcam
          disabled={disabled}
          onStateChange={(detail) => setPhase(detail.phase)}
          style={{ width: '100%', height: '100%', borderRadius: 8 }}
        />
      </div>

      <p>disabled: {String(disabled)}</p>
      <p>phase: {displayPhase}</p>
    </>
  );
}`,

  "disabled-fallback": `import { useState } from 'react';
import { Webcam } from '@cp949/react-webcam';
import type { WebcamPhase } from '@cp949/react-webcam';

export default function DisabledFallbackExample() {
  const [disabled, setDisabled] = useState(true);
  const [phase, setPhase] = useState<WebcamPhase>('idle');

  return (
    <Webcam
      disabled={disabled}
      onStateChange={(detail) => setPhase(detail.phase)}
      disabledFallback={
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'grid',
            placeItems: 'center',
            background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)',
            color: '#fff',
          }}
        >
          <div>
            <strong>Camera is disabled</strong>
            <p>disabledFallback으로 기본 placeholder를 완전히 대체합니다.</p>
            <button type="button" onClick={() => setDisabled(false)}>
              Enable camera
            </button>
          </div>
        </div>
      }
    />
  );
}`,

  "error-fallback": `import { Webcam } from '@cp949/react-webcam';
import type { WebcamErrorDetail } from '@cp949/react-webcam';

export default function ErrorFallbackExample() {
  return (
    <Webcam
      webcamOptions={{
        audioEnabled: false,
        deviceId: '__missing_camera__',
        aspectRatio: 16 / 9,
      }}
      errorFallback={(detail: WebcamErrorDetail, { retry }) => (
        <div>
          <strong>
            {detail.errorCode === 'device-not-found'
              ? 'Camera is unavailable'
              : 'Camera could not be started'}
          </strong>
          <p>errorCode: {detail.errorCode}</p>
          <button type="button" onClick={retry}>
            Retry
          </button>
        </div>
      )}
    />
  );
}`,

  recipes: `import { useRef, useState } from 'react';
import { Webcam } from '@cp949/react-webcam';
import type { WebcamHandle, WebcamSnapshot } from '@cp949/react-webcam';

// 프로필 촬영 패턴
export default function ProfileCaptureRecipe() {
  const ref = useRef<WebcamHandle>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('idle');

  const handleCapture = () => {
    const canvas = ref.current?.snapshotToCanvas();
    if (canvas) {
      setCaptured(canvas.toDataURL('image/jpeg'));
    }
  };

  const handleStateChange = (s: WebcamSnapshot) => {
    setStatus(s.status);
  };

  return (
    <div>
      <Webcam
        ref={ref}
        onStateChange={handleStateChange}
        webcamOptions={{ facingMode: 'user', aspectRatio: 1 }}
        visibleFlipButton
      />
      <p>상태: {status}</p>
      <button onClick={handleCapture} disabled={status !== 'live'}>
        촬영
      </button>
      {captured && <img src={captured} alt="캡처된 프로필" />}
    </div>
  );
}`,

  "pause-resume": `import { useRef, useState } from 'react';
import { Webcam } from '@cp949/react-webcam';
import type { WebcamHandle } from '@cp949/react-webcam';

export default function PauseResumeExample() {
  const webcamRef = useRef<WebcamHandle>(null);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);

  const handlePause = () => {
    // pausePlayback()은 video 요소의 재생을 멈춥니다.
    // 카메라 스트림(MediaStream)은 계속 활성 상태로 유지됩니다.
    // WebcamSnapshot의 status는 'paused' phase로 전환되지 않습니다.
    webcamRef.current?.pausePlayback();
  };

  const handleResume = () => {
    // resumePlayback()은 video 요소의 재생을 다시 시작합니다.
    // autoplay 정책에 의해 다시 차단되면 'playback-error' 상태가 될 수 있습니다.
    webcamRef.current?.resumePlayback();
  };

  const handleSnapshot = () => {
    // paused 뒤에도 snapshotToCanvas()는 마지막 프레임 기준으로 동작할 수 있습니다.
    const canvas = webcamRef.current?.snapshotToCanvas();
    if (canvas) {
      setSnapshotUrl(canvas.toDataURL('image/png'));
    }
  };

  return (
    <>
      <Webcam ref={webcamRef} />
      <button onClick={handlePause}>Pause playback</button>
      <button onClick={handleResume}>Resume playback</button>
      <button onClick={handleSnapshot}>Snapshot</button>
      {snapshotUrl && <img src={snapshotUrl} alt="snapshot preview" />}
    </>
  );
}`,

  "use-webcam": `import { useState } from 'react';
import { useWebcam } from '@cp949/react-webcam';

export default function UseWebcamExample() {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const camera = useWebcam({
    videoElement,
    webcamOptions: { facingMode: 'user', size: { width: 1280 } },
  });

  return (
    <>
      {/* muted와 playsInline은 호출자가 설정합니다. 훅은 바꾸지 않습니다. */}
      <video ref={setVideoElement} muted playsInline style={{ display: 'none' }} />
      <p>
        phase: {camera.detail.phase} / isFrameReady: {String(camera.isFrameReady)}
      </p>
      <button onClick={camera.retry}>카메라 다시 시도</button>
      <button onClick={camera.pausePlayback}>재생 멈춤</button>
      {/* play()가 막혀 playback-error가 되면 사용자 조작 안에서 호출합니다. */}
      <button onClick={camera.resumePlayback}>재생 다시 시도</button>
    </>
  );
}`,

  "visual-debug": `import { Webcam } from '@cp949/react-webcam';

const styles = \`
  .demo-visual-debug-webcam {
    border: 3px solid rgba(25, 118, 210, 0.65);
    box-shadow: 0 0 0 6px rgba(25, 118, 210, 0.12);
  }
\`;

export default function VisualDebugExample() {
  return (
    <>
      <style>{styles}</style>
      <Webcam
        className="demo-visual-debug-webcam"
        visibleVideoSizeDebug
        visibleConstraintsDebug
        webcamOptions={{ aspectRatio: 16 / 9, facingMode: 'user' }}
      >
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 2,
          }}
        >
          Overlay badge child
        </div>
      </Webcam>
    </>
  );
}`,
};
