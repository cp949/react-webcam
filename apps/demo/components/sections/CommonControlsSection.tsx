'use client';

import { useState } from 'react';
import { Webcam } from '@cp949/react-webcam';
import type { WebcamOptions } from '@cp949/react-webcam';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { DEMO_SECTIONS } from '../../lib/demo-sections';
import { CODE_SNIPPETS } from '../../lib/code-snippets';
import { CodeBlockCard } from '../shared/CodeBlockCard';
import { ExampleCard } from '../shared/ExampleCard';
import { SectionIntroCard } from '../shared/SectionIntroCard';

// 'controls' 섹션 메타데이터
const section = DEMO_SECTIONS.find((s) => s.id === 'controls')!;

/** facingMode·aspectRatio 등 webcamOptions를 인터랙티브하게 조작하는 공통 컨트롤 섹션 */
export default function CommonControlsSection() {
  const [options, setOptions] = useState<WebcamOptions>({
    facingMode: 'user',
    aspectRatio: 4 / 3,
  });

  return (
    <Stack direction="column" spacing={3}>
      {/* 1. 섹션 소개 */}
      <SectionIntroCard
        title={section.title}
        description={section.description}
        keywords={section.keywords}
      />

      {/* 2. 컨트롤 패널 */}
      <Card variant="outlined">
        <CardHeader title="컨트롤 패널" />
        <CardContent>
          <Stack direction="column" spacing={2}>
            {/* facingMode 토글 */}
            <div>
              <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block' }}>
                facingMode
              </Typography>
              <ToggleButtonGroup
                exclusive
                value={options.facingMode ?? 'user'}
                onChange={(_e, value) => {
                  if (value !== null) {
                    setOptions((prev) => ({ ...prev, facingMode: value }));
                  }
                }}
                size="small"
              >
                <ToggleButton value="user">전면 카메라</ToggleButton>
                <ToggleButton value="environment">후면 카메라</ToggleButton>
              </ToggleButtonGroup>
            </div>

            {/* aspectRatio 토글 */}
            <div>
              <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block' }}>
                aspectRatio
              </Typography>
              <ToggleButtonGroup
                exclusive
                value={options.aspectRatio ?? 4 / 3}
                onChange={(_e, value) => {
                  if (value !== null) {
                    setOptions((prev) => ({ ...prev, aspectRatio: value }));
                  }
                }}
                size="small"
              >
                <ToggleButton value={4 / 3}>4:3</ToggleButton>
                <ToggleButton value={16 / 9}>16:9</ToggleButton>
                <ToggleButton value={1}>1:1</ToggleButton>
              </ToggleButtonGroup>
            </div>
          </Stack>
        </CardContent>
      </Card>

      {/* 3. 라이브 예제 */}
      <ExampleCard title="라이브 예제">
        <Webcam
          webcamOptions={options}
          onWebcamOptionsChange={setOptions}
          style={{ maxWidth: '100%', borderRadius: 8 }}
        />
      </ExampleCard>

      {/* 4. 코드 블록 */}
      <CodeBlockCard code={CODE_SNIPPETS['controls']} />
    </Stack>
  );
}
