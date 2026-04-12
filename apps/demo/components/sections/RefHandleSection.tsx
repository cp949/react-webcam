'use client';

import { useRef, useState } from 'react';
import { Webcam } from '@cp949/react-webcam';
import type { WebcamHandle } from '@cp949/react-webcam';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { CODE_SNIPPETS } from '../../lib/code-snippets';
import { DEMO_SECTIONS } from '../../lib/demo-sections';
import { CodeBlockCard } from '../shared/CodeBlockCard';
import { ExampleCard } from '../shared/ExampleCard';
import { SectionIntroCard } from '../shared/SectionIntroCard';
import { StateLogCard } from '../shared/StateLogCard';

/** ref handle을 통한 명령형 제어 — snapshotToCanvas, setFlipped, setWebcamOptions 사용법을 시연하는 섹션 */
export default function RefHandleSection() {
  const webcamRef = useRef<WebcamHandle>(null);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string>('없음');

  const section = DEMO_SECTIONS.find((s) => s.id === 'ref-handle')!;

  const handleSnapshot = () => {
    const canvas = webcamRef.current?.snapshotToCanvas();
    if (canvas) {
      setSnapshotUrl(canvas.toDataURL('image/png'));
      setLastAction('스냅샷 찍음');
    } else {
      setLastAction('웹캠이 준비되지 않았습니다');
    }
  };

  const handleFlip = () => {
    webcamRef.current?.setFlipped((v) => !v);
    setLastAction('좌우 반전 토글');
  };

  const handleBackCamera = () => {
    webcamRef.current?.setWebcamOptions((prev) => ({ ...prev, facingMode: 'environment' }));
    setLastAction('후면 카메라로 전환');
  };

  const handleFrontCamera = () => {
    webcamRef.current?.setWebcamOptions((prev) => ({ ...prev, facingMode: 'user' }));
    setLastAction('전면 카메라로 전환');
  };

  return (
    <Stack direction="column" spacing={3}>
      {/* 1. 섹션 소개 */}
      <SectionIntroCard
        title={section.title}
        description={section.description}
        keywords={section.keywords}
      />

      {/* 2. 라이브 예제 + 명령형 제어 */}
      <ExampleCard title="라이브 예제 + 명령형 제어">
        <Webcam ref={webcamRef} visibleFlipButton />
        <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }}>
          <Button variant="outlined" size="small" onClick={handleSnapshot}>
            스냅샷
          </Button>
          <Button variant="outlined" size="small" onClick={handleFlip}>
            좌우 반전
          </Button>
          <Button variant="outlined" size="small" onClick={handleBackCamera}>
            후면 카메라
          </Button>
          <Button variant="outlined" size="small" onClick={handleFrontCamera}>
            전면 카메라
          </Button>
        </Stack>
        <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
          마지막 액션: {lastAction}
        </Typography>
      </ExampleCard>

      {/* 3. 스냅샷 미리보기 카드 (snapshotUrl이 있을 때만 표시) */}
      {snapshotUrl !== null && (
        <Card variant="outlined">
          <CardHeader title="스냅샷 미리보기" />
          <CardContent>
            <img src={snapshotUrl} alt="스냅샷" style={{ maxWidth: '100%', borderRadius: 4 }} />
            <Button
              variant="outlined"
              size="small"
              onClick={() => setSnapshotUrl(null)}
              sx={{ mt: 1 }}
            >
              초기화
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 4. 상태 로그 */}
      <StateLogCard
        title="API 호출 결과"
        data={{ lastAction, snapshotCaptured: snapshotUrl !== null }}
      />

      {/* 5. 코드 블록 */}
      <CodeBlockCard code={CODE_SNIPPETS['ref-handle']} />
    </Stack>
  );
}
