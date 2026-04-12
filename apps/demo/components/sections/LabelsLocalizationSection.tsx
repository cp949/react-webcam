'use client';

import { useMemo, useState } from 'react';
import { Webcam } from '@cp949/react-webcam';
import type { WebcamLabels } from '@cp949/react-webcam';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { CODE_SNIPPETS } from '../../lib/code-snippets';
import { DEMO_SECTIONS } from '../../lib/demo-sections';
import { CodeBlockCard } from '../shared/CodeBlockCard';
import { ExampleCard } from '../shared/ExampleCard';
import { SectionIntroCard } from '../shared/SectionIntroCard';

const section = DEMO_SECTIONS.find((s) => s.id === 'labels')!;

const LOCALE_LABELS: Record<'ko' | 'en', WebcamLabels> = {
  ko: {
    flip: '미러',
    snapshot: '스냅샷',
    cameraDirection: '전면/후면 카메라',
    facingModeBack: '후면',
    facingModeFront: '전면',
    facingModeDefault: '기본',
    aspectRatio: '크기 비율',
    aspectRatioAuto: '자동',
  },
  en: {
    flip: 'Mirror',
    snapshot: 'Take snapshot',
    cameraDirection: 'Front / Rear Camera',
    facingModeBack: 'Rear',
    facingModeFront: 'Front',
    facingModeDefault: 'Default',
    aspectRatio: 'Aspect ratio',
    aspectRatioAuto: 'Auto',
  },
};

/** labels prop으로 내장 UI 문구를 로컬라이즈하는 예제를 보여준다. */
export default function LabelsLocalizationSection() {
  const [locale, setLocale] = useState<'ko' | 'en'>('ko');
  const labels = useMemo(() => LOCALE_LABELS[locale], [locale]);

  return (
    <Box>
      <Stack spacing={3} direction="column">
        <SectionIntroCard
          title={section.title}
          description={section.description}
          keywords={section.keywords}
        />

        <Alert severity="info" variant="outlined">
          <Typography variant="body2">
            <code>labels</code> prop으로 내장 버튼과 popover 메뉴 문구를 서비스 번역값에 맞게
            덮어쓸 수 있습니다. 아래 토글을 바꾸면 전면/후면/기본 라벨이 함께 바뀝니다.
          </Typography>
        </Alert>

        <ExampleCard title="라이브 예제">
          <Stack spacing={2}>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={locale}
              onChange={(_event, value: 'ko' | 'en' | null) => {
                if (value) {
                  setLocale(value);
                }
              }}
            >
              <ToggleButton value="ko">한국어</ToggleButton>
              <ToggleButton value="en">English</ToggleButton>
            </ToggleButtonGroup>

            <Typography variant="body2" color="text.secondary">
              현재 카메라 방향 라벨: {labels.facingModeFront} / {labels.facingModeBack} /{' '}
              {labels.facingModeDefault}
            </Typography>

            <Webcam
              labels={labels}
              visibleFlipButton
              visibleSnapshotButton
              visibleCameraDirectionButton
              visibleAspectRatioButton
              style={{ maxWidth: '100%', borderRadius: 8 }}
            />
          </Stack>
        </ExampleCard>

        <CodeBlockCard code={CODE_SNIPPETS.labels} />
      </Stack>
    </Box>
  );
}
