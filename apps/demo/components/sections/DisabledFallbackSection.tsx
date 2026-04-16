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

const section = DEMO_SECTIONS.find((item) => item.id === 'disabled-fallback')!;

/** custom disabledFallback으로 기본 placeholder를 대체하는 섹션 */
export default function DisabledFallbackSection() {
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
          <Box
            data-testid="disabled-fallback-viewport"
            sx={{
              width: '100%',
              maxWidth: 640,
              aspectRatio: '16 / 9',
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: 'grey.900',
            }}
          >
            <Webcam
              disabled={disabled}
              onStateChange={(detail) => setPhase(detail.phase)}
              style={{ width: '100%', height: '100%', borderRadius: 8 }}
              disabledFallback={
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 3,
                    background:
                      'linear-gradient(180deg, rgba(15,23,42,0.96) 0%, rgba(17,24,39,0.92) 100%)',
                  }}
                >
                  <Card
                    variant="outlined"
                    sx={{
                      width: '100%',
                      maxWidth: 320,
                      borderColor: 'rgba(255,255,255,0.16)',
                      bgcolor: 'rgba(255,255,255,0.06)',
                      color: 'common.white',
                    }}
                  >
                    <CardContent>
                      <Stack spacing={1.5}>
                        <Chip
                          size="small"
                          label="Custom disabledFallback"
                          sx={{ alignSelf: 'flex-start', color: 'common.white' }}
                        />
                        <Typography variant="h6">Camera is disabled</Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.72)' }}>
                          disabledFallback으로 기본 placeholder를 완전히 대체한 예제입니다.
                        </Typography>
                        <Button variant="contained" onClick={() => setDisabled(false)}>
                          Enable camera
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>
              }
            />
          </Box>

          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Chip
              label={`disabled: ${String(disabled)}`}
              color={disabled ? 'default' : 'primary'}
              variant="outlined"
            />
            <Chip
              label={`phase: ${displayPhase}`}
              color={displayPhase === 'live' ? 'success' : 'default'}
              variant="outlined"
            />
          </Stack>
        </Stack>
      </ExampleCard>

      <Card variant="outlined">
        <CardHeader title="핵심 포인트" />
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="body2">
              이 예제는 기본 placeholder 대신 custom disabledFallback UI를 렌더링합니다.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              fallback 안의 CTA 버튼이 disabled=false로 전환되면서 바로 실제 webcam 요청 흐름을 시작합니다.
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <CodeBlockCard code={CODE_SNIPPETS['disabled-fallback']} />
    </Stack>
  );
}
