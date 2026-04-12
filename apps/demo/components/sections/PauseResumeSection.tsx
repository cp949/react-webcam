'use client';

import { useRef, useState } from 'react';
import { Webcam } from '@cp949/react-webcam';
import type { WebcamHandle } from '@cp949/react-webcam';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { CODE_SNIPPETS } from '../../lib/code-snippets';
import { DEMO_SECTIONS } from '../../lib/demo-sections';
import { CodeBlockCard } from '../shared/CodeBlockCard';
import { ExampleCard } from '../shared/ExampleCard';
import { SectionIntroCard } from '../shared/SectionIntroCard';
import { StateLogCard } from '../shared/StateLogCard';

export default function PauseResumeSection() {
  const webcamRef = useRef<WebcamHandle>(null);
  const [lastAction, setLastAction] = useState<string>('없음');
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);

  const section = DEMO_SECTIONS.find((s) => s.id === 'pause-resume')!;

  const handlePause = () => {
    webcamRef.current?.pausePlayback();
    setLastAction('pausePlayback()');
  };

  const handleResume = () => {
    webcamRef.current?.resumePlayback();
    setLastAction('resumePlayback()');
  };

  const handleSnapshot = () => {
    const canvas = webcamRef.current?.snapshotToCanvas();
    if (!canvas) {
      setLastAction('snapshotToCanvas() - 준비 전');
      return;
    }

    setSnapshotUrl(canvas.toDataURL('image/png'));
    setLastAction('snapshotToCanvas()');
  };

  return (
    <Stack direction="column" spacing={3}>
      <SectionIntroCard
        title={section.title}
        description={section.description}
        keywords={section.keywords}
      />

      {/* 주의 사항 안내 */}
      <Stack spacing={1}>
        <Alert severity="info">
          <Typography variant="body2">
            <strong>pausePlayback()</strong>은 video 요소의 재생만 멈춥니다. 카메라 스트림(MediaStream)은
            계속 활성 상태로 유지되며, 카메라 LED도 꺼지지 않습니다.
          </Typography>
        </Alert>
        <Alert severity="warning">
          <Typography variant="body2">
            <strong>paused 상태(phase)는 없습니다.</strong> pausePlayback() 호출 후에도
            WebcamSnapshot의 status 값은 변하지 않습니다.
          </Typography>
        </Alert>
        <Alert severity="warning">
          <Typography variant="body2">
            <strong>resumePlayback()</strong>은 브라우저의 autoplay 정책에 의해 다시 차단될 수
            있습니다. 차단되면 status가 <code>playback-error</code>로 전환됩니다.
          </Typography>
        </Alert>
        <Alert severity="success">
          <Typography variant="body2">
            <strong>snapshotToCanvas()</strong>은 paused 상태처럼 playback이 멈춘 뒤에도 마지막
            프레임 기준으로 계속 동작할 수 있습니다.
          </Typography>
        </Alert>
      </Stack>

      <ExampleCard title="Pause / Resume playback">
        <Webcam ref={webcamRef} />
        <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }}>
          <Button variant="outlined" size="small" onClick={handlePause}>
            Pause playback
          </Button>
          <Button variant="outlined" size="small" onClick={handleResume}>
            Resume playback
          </Button>
          <Button variant="outlined" size="small" onClick={handleSnapshot}>
            Snapshot
          </Button>
        </Stack>
        <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
          마지막 액션: {lastAction}
        </Typography>
        {snapshotUrl && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
              마지막 스냅샷 미리보기
            </Typography>
            <Box
              component="img"
              src={snapshotUrl}
              alt="Pause/Resume demo snapshot"
              sx={{
                width: 160,
                maxWidth: '100%',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}
            />
          </Box>
        )}
      </ExampleCard>

      <StateLogCard
        title="호출 메모"
        data={{
          lastAction,
          // pausePlayback()/resumePlayback()은 playback만 제어하며 스트림은 유지된다.
          streamKept: true,
          snapshotCaptured: snapshotUrl !== null,
        }}
      />

      <CodeBlockCard code={CODE_SNIPPETS['pause-resume']} />
    </Stack>
  );
}
