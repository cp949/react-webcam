'use client';

import { useState } from 'react';
import { Webcam } from '@cp949/react-webcam';
import type { WebcamDetail } from '@cp949/react-webcam';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { DEMO_SECTIONS } from '../../lib/demo-sections';
import { CODE_SNIPPETS } from '../../lib/code-snippets';
import { CodeBlockCard } from '../shared/CodeBlockCard';
import { ExampleCard } from '../shared/ExampleCard';
import { SectionIntroCard } from '../shared/SectionIntroCard';

// 'basic' 섹션 메타데이터
const section = DEMO_SECTIONS.find((s) => s.id === 'basic')!;

/** Webcam 컴포넌트의 최소 구성과 주요 시각 옵션을 소개하는 기본 사용법 섹션 */
export default function BasicUsageSection() {
  const [phase, setPhase] = useState<WebcamDetail['phase']>('idle');

  return (
    <Box>
      <Stack spacing={3} direction="column">
        {/* 1. 섹션 소개 */}
        <SectionIntroCard
          title={section.title}
          description={section.description}
          keywords={section.keywords}
        />

        {/* 2. 라이브 예제 */}
        <ExampleCard title="라이브 예제">
          <Webcam
            onStateChange={(detail) => setPhase(detail.phase)}
            visibleFlipButton
            visibleCameraDirectionButton
            style={{ maxWidth: '100%', borderRadius: 8 }}
          />
          {phase !== 'live' && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              카메라 접근 허용이 필요합니다
            </Typography>
          )}
        </ExampleCard>

        {/* 3. 예제 코드 */}
        <CodeBlockCard code={CODE_SNIPPETS['basic']} />
      </Stack>
    </Box>
  );
}
