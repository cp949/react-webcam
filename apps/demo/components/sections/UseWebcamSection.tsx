"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useWebcam } from "@cp949/react-webcam";
import { CODE_SNIPPETS } from "../../lib/code-snippets";
import { DEMO_SECTIONS } from "../../lib/demo-sections";
import { CodeBlockCard } from "../shared/CodeBlockCard";
import { ExampleCard } from "../shared/ExampleCard";
import { SectionIntroCard } from "../shared/SectionIntroCard";
import { StateLogCard } from "../shared/StateLogCard";

/** 앱이 소유한 video에 useWebcam을 연결하고 상태와 제어 함수를 확인하는 섹션 */
export default function UseWebcamSection() {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [hidden, setHidden] = useState(false);
  const [muted, setMuted] = useState(true);
  const [disabled, setDisabled] = useState(false);

  const camera = useWebcam({
    videoElement,
    webcamOptions: { facingMode: "user", size: { width: 1280 } },
    disabled,
  });

  const section = DEMO_SECTIONS.find((s) => s.id === "use-webcam")!;
  const { detail } = camera;

  return (
    <Stack direction='column' spacing={3}>
      <SectionIntroCard
        title={section.title}
        description={section.description}
        keywords={section.keywords}
      />

      <Alert severity='info'>
        <Typography variant='body2'>
          훅은 video의 <strong>muted</strong>, <strong>playsInline</strong>을 바꾸지 않습니다.
          muted를 끄고 카메라를 다시 시도하면 브라우저 autoplay 정책에 따라{" "}
          <strong>playback-error</strong>가 될 수 있습니다. 이 경우 isFrameReady는 false로 남고,
          재생 다시 시도 버튼(사용자 조작)으로 복구합니다.
        </Typography>
      </Alert>

      <ExampleCard title='앱이 소유한 video'>
        <Stack spacing={2}>
          <Box sx={{ bgcolor: "grey.900", borderRadius: 1, overflow: "hidden", minHeight: 100 }}>
            {/* 훅은 이 요소의 스타일을 건드리지 않으므로 display를 앱이 직접 정한다 */}
            <video
              ref={setVideoElement}
              muted={muted}
              playsInline
              style={{ display: hidden ? "none" : "block", width: "100%" }}
            />
            {hidden && (
              <Typography sx={{ p: 2, color: "grey.400" }} variant='body2'>
                video가 display: none입니다. 카메라는 계속 동작합니다.
              </Typography>
            )}
          </Box>

          <Stack direction='row' spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
            <Chip
              label={`phase: ${detail.phase}`}
              color={detail.phase === "live" ? "success" : "default"}
              size='small'
            />
            <Chip
              label={`isFrameReady: ${String(camera.isFrameReady)}`}
              color={camera.isFrameReady ? "success" : "default"}
              size='small'
            />
            {"errorCode" in detail && (
              <Chip label={`errorCode: ${detail.errorCode}`} color='error' size='small' />
            )}
          </Stack>

          <Stack direction='row' spacing={1} sx={{ flexWrap: "wrap" }}>
            <Button variant='outlined' onClick={camera.retry}>
              카메라 다시 시도
            </Button>
            <Button variant='outlined' onClick={camera.pausePlayback}>
              재생 멈춤
            </Button>
            <Button variant='outlined' onClick={camera.resumePlayback}>
              재생 다시 시도
            </Button>
          </Stack>

          <Stack direction='row' spacing={2} sx={{ flexWrap: "wrap" }}>
            <FormControlLabel
              control={<Switch checked={hidden} onChange={(e) => setHidden(e.target.checked)} />}
              label='video 숨기기 (display: none)'
            />
            <FormControlLabel
              control={<Switch checked={muted} onChange={(e) => setMuted(e.target.checked)} />}
              label='muted'
            />
            <FormControlLabel
              control={
                <Switch checked={disabled} onChange={(e) => setDisabled(e.target.checked)} />
              }
              label='disabled'
            />
          </Stack>
        </Stack>
      </ExampleCard>

      <StateLogCard
        title='훅 상태'
        data={{
          phase: detail.phase,
          errorCode: "errorCode" in detail ? detail.errorCode : undefined,
          isFrameReady: camera.isFrameReady,
        }}
      />

      <CodeBlockCard code={CODE_SNIPPETS["use-webcam"]} />
    </Stack>
  );
}
