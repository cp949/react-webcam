'use client';

import { Webcam } from '@cp949/react-webcam';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { DEMO_SECTIONS } from '../../lib/demo-sections';
import { CODE_SNIPPETS } from '../../lib/code-snippets';
import { CodeBlockCard } from '../shared/CodeBlockCard';
import { ExampleCard } from '../shared/ExampleCard';
import { SectionIntroCard } from '../shared/SectionIntroCard';

const section = DEMO_SECTIONS.find((item) => item.id === 'visual-debug')!;

/** className, children, debug props처럼 시각 보조 목적의 props를 모아서 보여주는 섹션 */
export default function VisualDebugPropsSection() {
  return (
    <Stack spacing={3}>
      <SectionIntroCard
        title={section.title}
        description={section.description}
        keywords={section.keywords}
      />

      <Alert severity="info" variant="outlined">
        <Typography variant="body2">
          이 섹션은 기능 토글보다는 레이아웃 보조에 가까운 prop을 한곳에 모아 보여줍니다.
          overlay child, className 기반 스타일링, 내부 debug UI를 함께 확인할 수 있습니다.
        </Typography>
      </Alert>

      <ExampleCard title="children + className + debug props">
        <Stack spacing={2}>
          <Box sx={{ width: '100%', maxWidth: 720, height: 320 }}>
            <Webcam
              className="demo-visual-debug-webcam"
              visibleVideoSizeDebug
              visibleConstraintsDebug
              webcamOptions={{ aspectRatio: 16 / 9, facingMode: 'user' }}
              style={{ width: '100%', height: '100%', borderRadius: 16 }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 12,
                  left: 12,
                  zIndex: 2,
                }}
              >
                <Chip color="primary" label="Overlay badge child" size="small" />
              </Box>
            </Webcam>
          </Box>

          <Typography variant="body2" color="text.secondary">
            파란 외곽선은 <code>className</code>으로 입힌 스타일이고, 좌상단 배지는{' '}
            <code>children</code> overlay입니다. 비디오 크기와 media constraints는 debug prop으로
            함께 노출됩니다.
          </Typography>
        </Stack>
      </ExampleCard>

      <CodeBlockCard code={CODE_SNIPPETS['visual-debug']} />
    </Stack>
  );
}
