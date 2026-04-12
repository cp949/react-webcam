// 각 섹션의 핵심 TSX 코드 예시

import type { DemoSectionId } from './types';

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
import type { WebcamOptions } from '@cp949/react-webcam';

export default function ControlsExample() {
  const [options, setOptions] = useState<WebcamOptions>({
    facingMode: 'user',
    aspectRatio: 4 / 3,
  });

  return (
    <Webcam
      webcamOptions={options}
      onWebcamOptionsChange={setOptions}
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
}`,

  'device-selection': `import { useEffect, useMemo, useState } from 'react';
import {
  Webcam,
  listMediaDevices,
  listAudioInputDevices,
  listVideoInputDevices,
} from '@cp949/react-webcam';

export default function DeviceSelectionExample() {
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string>('');

  useEffect(() => {
    async function load() {
      const [all, videos, audios] = await Promise.all([
        listMediaDevices(),
        listVideoInputDevices(),
        listAudioInputDevices(),
      ]);
      console.log(all);
      setVideoDevices(videos);
      setAudioDevices(audios);
      setDeviceId(videos[0]?.deviceId ?? '');
    }

    void load();
  }, []);

  const webcamOptions = useMemo(
    () => ({
      audioEnabled: false,
      deviceId: deviceId || undefined,
    }),
    [deviceId],
  );

  return (
    <>
      <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
        {videoDevices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || '(권한 필요)'}
          </option>
        ))}
      </select>

      <Webcam webcamOptions={webcamOptions} visibleCameraDirectionButton />

      <pre>{JSON.stringify({ videoDevices, audioDevices }, null, 2)}</pre>
    </>
  );
}`,

  'ref-handle': `import { useRef } from 'react';
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

  'pause-resume': `import { useRef, useState } from 'react';
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
};
