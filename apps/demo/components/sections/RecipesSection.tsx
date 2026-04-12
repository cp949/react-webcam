'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useRef, useState } from 'react';
import { Webcam } from '@cp949/react-webcam';
import type { WebcamHandle, WebcamDetail } from '@cp949/react-webcam';
import { CODE_SNIPPETS } from '../../lib/code-snippets';
import { DEMO_SECTIONS } from '../../lib/demo-sections';
import { CodeBlockCard } from '../shared/CodeBlockCard';
import { ExampleCard } from '../shared/ExampleCard';
import { SectionIntroCard } from '../shared/SectionIntroCard';

/** 1:1 비율 웹캠과 스냅샷 촬영, onStateChange 콜백을 결합한 프로필 촬영 예제 */
function ProfileCaptureRecipe() {
  const ref = useRef<WebcamHandle>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [webcamStatus, setWebcamStatus] = useState<string>('idle');

  const handleCapture = () => {
    const canvas = ref.current?.snapshotToCanvas();
    if (canvas) {
      setCaptured(canvas.toDataURL('image/jpeg'));
    }
  };

  const handleStateChange = (s: WebcamDetail) => {
    setWebcamStatus(s.phase);
  };

  // 상태 chip 색상 결정
  const statusColor =
    webcamStatus === 'live'
      ? 'success'
      : webcamStatus === 'requesting'
        ? 'info'
        : 'default';

  return (
    <ExampleCard title="Recipe 1 — 프로필 촬영">
      <Stack direction="column" spacing={2}>
        <Webcam
          ref={ref}
          onStateChange={handleStateChange}
          webcamOptions={{ facingMode: 'user', aspectRatio: 1 }}
          visibleFlipButton
        />
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Chip label={`상태: ${webcamStatus}`} color={statusColor} size="small" />
          <Button
            variant="contained"
            size="small"
            onClick={handleCapture}
            disabled={webcamStatus !== 'live'}
          >
            촬영
          </Button>
          {captured && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => setCaptured(null)}
            >
              다시 찍기
            </Button>
          )}
        </Stack>
        {captured && (
          <Box>
            <img
              src={captured}
              alt="캡처된 프로필"
              style={{ maxWidth: '100%', borderRadius: 8, display: 'block' }}
            />
          </Box>
        )}
      </Stack>
    </ExampleCard>
  );
}

/** 3:4 비율로 문서 스캔에 적합한 세로형 촬영 예제 */
function PortraitRatioRecipe() {
  return (
    <ExampleCard title="Recipe 2 — 세로 비율 촬영">
      <Stack direction="column" spacing={2}>
        <Typography variant="body2" color="text.secondary">
          문서 촬영이나 세로형 사진에 적합한 3:4 비율 예제입니다.
        </Typography>
        <Webcam
          webcamOptions={{ aspectRatio: 3 / 4 }}
          visibleFlipButton
          visibleCameraDirectionButton
        />
      </Stack>
    </ExampleCard>
  );
}

/** 웹캠 위에 실시간 상태 Chip을 오버레이하는 상태 배지 통합 패턴 예제 */
function StatusBadgeRecipe() {
  const [status, setStatus] = useState<string>('idle');

  const handleStateChange = (s: WebcamDetail) => {
    setStatus(s.phase);
  };

  // 상태별 chip 색상
  const chipColor =
    status === 'live'
      ? 'success'
      : status === 'requesting'
        ? 'info'
        : status === 'idle'
          ? 'default'
          : 'error';

  return (
    <ExampleCard title="Recipe 3 — 상태 배지 통합">
      <Stack direction="column" spacing={2}>
        <Typography variant="body2" color="text.secondary">
          앱 UI에 상태 배지를 통합하는 패턴입니다.
        </Typography>
        <Box sx={{ position: 'relative', display: 'inline-block' }}>
          <Webcam onStateChange={handleStateChange} />
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              zIndex: 1,
            }}
          >
            <Chip label={`실시간 상태: ${status}`} color={chipColor} size="small" />
          </Box>
        </Box>
      </Stack>
    </ExampleCard>
  );
}

/** 실용적인 웹캠 활용 패턴 3가지(프로필 촬영, 세로 비율, 상태 배지)를 모아 보여주는 레시피 섹션 */
export default function RecipesSection() {
  const section = DEMO_SECTIONS.find((s) => s.id === 'recipes')!;

  return (
    <Stack direction="column" spacing={3}>
      {/* 섹션 소개 */}
      <SectionIntroCard
        title={section.title}
        description={section.description}
        keywords={section.keywords}
      />

      {/* Recipe 1: 프로필 촬영 */}
      <ProfileCaptureRecipe />

      {/* Recipe 2: 세로 비율 촬영 */}
      <PortraitRatioRecipe />

      {/* Recipe 3: 상태 배지 통합 */}
      <StatusBadgeRecipe />

      {/* 코드 예시 */}
      <CodeBlockCard code={CODE_SNIPPETS['recipes']} />
    </Stack>
  );
}
