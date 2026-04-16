'use client';

import { useState } from 'react';
import { Webcam } from '@cp949/react-webcam';
import type { WebcamPhase } from '@cp949/react-webcam';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { CODE_SNIPPETS } from '../../lib/code-snippets';
import { DEMO_SECTIONS } from '../../lib/demo-sections';
import { CodeBlockCard } from '../shared/CodeBlockCard';
import { ExampleCard } from '../shared/ExampleCard';
import { SectionIntroCard } from '../shared/SectionIntroCard';

const section = DEMO_SECTIONS.find((item) => item.id === 'disabled-state')!;

/** disabled prop으로 카메라 요청 시작을 지연하는 흐름을 보여주는 섹션 */
export default function DisabledStateSection() {
  const [disabled, setDisabled] = useState(true);
  const [phase, setPhase] = useState<WebcamPhase>('idle');

  const displayPhase: WebcamPhase = disabled ? 'idle' : phase;

  return (
    <Stack spacing={3}>
      <SectionIntroCard
        title={section.title}
        description={section.description}
        keywords={section.keywords}
      />

      <ExampleCard title="라이브 예제">
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={() => setDisabled((prev) => !prev)}
            >
              {disabled ? '카메라 활성화' : '카메라 비활성화'}
            </Button>
            <Chip
              label={`disabled: ${String(disabled)}`}
              color={disabled ? 'default' : 'primary'}
              variant="outlined"
            />
            <Chip
              label={displayPhase}
              color={displayPhase === 'live' ? 'success' : 'default'}
              variant="outlined"
            />
          </Stack>

          <Box
            data-testid="disabled-state-viewport"
            sx={{
              width: '100%',
              maxWidth: 640,
              aspectRatio: '16 / 9',
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: disabled ? '#f7f8fa' : 'grey.900',
            }}
          >
            <Webcam
              disabled={disabled}
              onStateChange={(detail) => setPhase(detail.phase)}
              style={{ width: '100%', height: '100%', borderRadius: 8 }}
            />
          </Box>
        </Stack>
      </ExampleCard>

      <Card variant="outlined">
        <CardHeader title="현재 상태" />
        <CardContent>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="body2" color="text.secondary">
                disabled
              </Typography>
              <Chip size="small" label={String(disabled)} variant="outlined" />
              <Typography variant="body2" color="text.secondary">
                phase
              </Typography>
              <Chip size="small" label={displayPhase} variant="outlined" />
            </Stack>

            <Typography variant="body2">
              disabled=true이면 카메라 요청을 시작하지 않습니다
            </Typography>
            <Typography variant="body2" color="text.secondary">
              disabled=false로 바꾸면 일반적인 권한 요청과 스트림 시작 흐름으로 돌아갑니다.
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <CodeBlockCard code={CODE_SNIPPETS['disabled-state']} />
    </Stack>
  );
}
