'use client';

import { useState } from 'react';
import { Webcam } from '@cp949/react-webcam';
import type { WebcamOptions, WebcamProps } from '@cp949/react-webcam';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';
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
  const [fitMode, setFitMode] = useState<WebcamProps['fitMode']>('cover');
  const [defaultPreset, setDefaultPreset] = useState<'portrait' | 'square'>('portrait');
  const [defaultDemoKey, setDefaultDemoKey] = useState(0);
  const [lockedFacingMode, setLockedFacingMode] = useState<'user' | 'environment'>('user');

  const defaultWebcamOptions: WebcamOptions =
    defaultPreset === 'portrait'
      ? { aspectRatio: 3 / 4, facingMode: 'environment' }
      : { aspectRatio: 1, facingMode: 'user' };

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
        <Box sx={{ width: '100%', maxWidth: 720, height: 300 }}>
          <Webcam
            webcamOptions={options}
            onWebcamOptionsChange={setOptions}
            style={{ width: '100%', height: '100%', borderRadius: 8 }}
          />
        </Box>
        <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
          <Chip label={`facingMode: ${String(options.facingMode ?? 'default')}`} size="small" variant="outlined" />
          <Chip label={`aspectRatio: ${String(options.aspectRatio ?? 'auto')}`} size="small" variant="outlined" />
        </Stack>
      </ExampleCard>

      <ExampleCard title="fitMode 전용 예제 (aspectRatio 없음)">
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            fitMode는 aspectRatio가 없을 때만 실제 레이아웃에 영향을 줍니다.
          </Typography>
          <div>
            <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block' }}>
              fitMode
            </Typography>
            <ToggleButtonGroup
              exclusive
              value={fitMode}
              onChange={(_e, value: WebcamProps['fitMode'] | null) => {
                if (value) {
                  setFitMode(value);
                }
              }}
              size="small"
            >
              <ToggleButton value="cover">cover</ToggleButton>
              <ToggleButton value="contain">contain</ToggleButton>
              <ToggleButton value="fill">fill</ToggleButton>
              <ToggleButton value="unset">unset</ToggleButton>
            </ToggleButtonGroup>
          </div>
          <Box
            sx={{
              width: '100%',
              maxWidth: 720,
              height: 300,
              p: 1,
              borderRadius: 2,
              background:
                'repeating-linear-gradient(45deg, rgba(25, 118, 210, 0.08), rgba(25, 118, 210, 0.08) 12px, transparent 12px, transparent 24px)',
            }}
          >
            <Webcam
              webcamOptions={{ facingMode: options.facingMode }}
              fitMode={fitMode}
              style={{ width: '100%', height: '100%', borderRadius: 8 }}
            />
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Chip label={`fitMode: ${fitMode}`} size="small" variant="outlined" />
            <Chip label={`facingMode: ${String(options.facingMode ?? 'default')}`} size="small" variant="outlined" />
            <Chip label="aspectRatio: 없음" size="small" variant="outlined" />
          </Stack>
        </Stack>
      </ExampleCard>

      <ExampleCard title="defaultWebcamOptions 초기값">
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            <code>defaultWebcamOptions</code>는 마운트 시 한 번만 적용됩니다. 프리셋을 바꾼 뒤 다시
            마운트 버튼을 눌러 초기값을 재적용해 보세요.
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={defaultPreset}
              onChange={(_e, value: 'portrait' | 'square' | null) => {
                if (value) {
                  setDefaultPreset(value);
                }
              }}
            >
              <ToggleButton value="portrait">세로 3:4</ToggleButton>
              <ToggleButton value="square">정사각형 1:1</ToggleButton>
            </ToggleButtonGroup>
            <Button variant="outlined" size="small" onClick={() => setDefaultDemoKey((prev) => prev + 1)}>
              기본값 다시 적용
            </Button>
          </Stack>
          <Box sx={{ width: '100%', maxWidth: 420, height: 300 }}>
            <Webcam
              key={defaultDemoKey}
              defaultWebcamOptions={defaultWebcamOptions}
              visibleCameraDirectionButton
              visibleAspectRatioButton
              style={{ width: '100%', height: '100%', borderRadius: 8 }}
            />
          </Box>
          <Typography variant="body2">
            현재 초기값 프리셋: {defaultPreset === 'portrait' ? '세로 3:4 / environment' : '정사각형 1:1 / user'}
          </Typography>
        </Stack>
      </ExampleCard>

      <ExampleCard title="읽기 전용 controlled webcamOptions">
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            <code>webcamOptions</code>만 전달하고 <code>onWebcamOptionsChange</code>를 생략하면 읽기
            전용 controlled 상태가 됩니다. 내장 버튼은 보여도 내부 변경은 반영되지 않습니다.
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setLockedFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
            >
              부모에서 facingMode 변경
            </Button>
            <Chip label={`locked facingMode: ${lockedFacingMode}`} size="small" variant="outlined" />
          </Stack>
          <Box sx={{ width: '100%', maxWidth: 420, height: 300 }}>
            <Webcam
              webcamOptions={{ facingMode: lockedFacingMode, aspectRatio: 16 / 9 }}
              visibleCameraDirectionButton
              visibleAspectRatioButton
              style={{ width: '100%', height: '100%', borderRadius: 8 }}
            />
          </Box>
        </Stack>
      </ExampleCard>

      {/* 4. 코드 블록 */}
      <CodeBlockCard code={CODE_SNIPPETS['controls']} />
    </Stack>
  );
}
