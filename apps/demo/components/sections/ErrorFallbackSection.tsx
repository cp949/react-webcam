"use client";

import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import { Webcam } from "@cp949/react-webcam";
import type { WebcamErrorDetail } from "@cp949/react-webcam";
import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CODE_SNIPPETS } from "../../lib/code-snippets";
import { DEMO_SECTIONS } from "../../lib/demo-sections";
import { CodeBlockCard } from "../shared/CodeBlockCard";
import { ExampleCard } from "../shared/ExampleCard";
import { SectionIntroCard } from "../shared/SectionIntroCard";

const section = DEMO_SECTIONS.find((item) => item.id === "error-fallback")!;

/** errorCode별 제목과 사용자 안내 문구를 고른다. */
function describeError(errorCode: WebcamErrorDetail["errorCode"]) {
  switch (errorCode) {
    case "permission-denied":
      return {
        title: "Camera permission denied",
        message: "브라우저 설정에서 카메라 권한을 허용한 뒤 다시 시도하세요.",
      };
    case "device-in-use":
      return {
        title: "Camera is in use",
        message: "다른 앱이 카메라를 사용 중입니다. 해당 앱을 종료한 뒤 다시 시도하세요.",
      };
    case "device-not-found":
      return {
        title: "Camera is unavailable",
        message: "카메라가 없거나 선택한 장치를 사용할 수 없을 때 렌더링됩니다.",
      };
    default:
      return {
        title: "Camera could not be started",
        message: "카메라를 시작하지 못했습니다. 다시 시도해 보세요.",
      };
  }
}

/** custom errorFallback으로 카메라 요청 실패 UI를 대체하는 섹션 */
export default function ErrorFallbackSection() {
  const [retryCount, setRetryCount] = useState(0);
  const forcedMissingCameraOptions = {
    audioEnabled: false,
    deviceId: "__missing_camera__",
    aspectRatio: 16 / 9,
  };

  const renderErrorFallback = (detail: WebcamErrorDetail, { retry }: { retry: () => void }) => {
    const { title, message } = describeError(detail.errorCode);

    return (
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
          bgcolor: "#101418",
          color: "common.white",
        }}
      >
        <Stack
          spacing={1.5}
          sx={{
            width: "100%",
            maxWidth: 360,
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              bgcolor: "rgba(244, 67, 54, 0.16)",
              color: "#ff8a80",
            }}
          >
            <ErrorOutlineIcon />
          </Box>
          <Chip
            size='small'
            label={detail.errorCode}
            sx={{
              color: "common.white",
              borderColor: "rgba(255,255,255,0.18)",
              bgcolor: "rgba(255,255,255,0.08)",
            }}
            variant='outlined'
          />
          <Typography variant='h6'>{title}</Typography>
          <Typography variant='body2' sx={{ color: "rgba(255,255,255,0.74)" }}>
            {message}
          </Typography>
          <Button
            size='small'
            variant='contained'
            onClick={() => {
              setRetryCount((count) => count + 1);
              retry();
            }}
          >
            Retry
          </Button>
          <Typography variant='caption' sx={{ color: "rgba(255,255,255,0.5)" }}>
            재시도 {retryCount}회
          </Typography>
        </Stack>
      </Box>
    );
  };

  return (
    <Stack spacing={3}>
      <SectionIntroCard
        title={section.title}
        description={section.description}
        keywords={section.keywords}
      />

      <ExampleCard title='라이브 예제'>
        <Stack spacing={2}>
          <Box
            data-testid='error-fallback-viewport'
            sx={{
              width: "100%",
              maxWidth: 640,
              aspectRatio: "16 / 9",
              borderRadius: 2,
              overflow: "hidden",
              bgcolor: "#101418",
            }}
          >
            <Webcam
              webcamOptions={forcedMissingCameraOptions}
              style={{ width: "100%", height: "100%", borderRadius: 8 }}
              errorFallback={renderErrorFallback}
            />
          </Box>
        </Stack>
      </ExampleCard>

      <Card variant='outlined'>
        <CardHeader title='핵심 포인트' />
        <CardContent>
          <Stack spacing={1}>
            <Typography variant='body2'>
              errorFallback은 권한 거부, 카메라 없음, 브라우저 미지원, 보안 컨텍스트 오류 같은 error
              계열 phase에서 렌더링됩니다.
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              fallback 함수는 WebcamDetail과 retry 헬퍼를 받아 errorCode별 메시지와 CTA를 다르게
              구성할 수 있습니다. 이 예제는 존재하지 않는 장치를 고정해 두어 Retry를 눌러도 같은
              오류로 돌아옵니다. playback-error는 스트림이 살아 있는 재생 실패라서 이 fallback
              대상이 아닙니다.
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <CodeBlockCard code={CODE_SNIPPETS["error-fallback"]} />
    </Stack>
  );
}
