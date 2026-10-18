"use client";

import { Webcam } from "@cp949/react-webcam";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useRef, useState } from "react";
import { CODE_SNIPPETS } from "../../lib/code-snippets";
import { DEMO_SECTIONS } from "../../lib/demo-sections";
import { CodeBlockCard } from "../shared/CodeBlockCard";
import { ExampleCard } from "../shared/ExampleCard";
import { SectionIntroCard } from "../shared/SectionIntroCard";
import { StateLogCard } from "../shared/StateLogCard";

type CapturedSnapshot = {
  url: string;
  sizeKb: string;
  width: number;
  height: number;
};

type UploadStatus = "idle" | "uploading" | "done";

const FAKE_UPLOAD_MS = 800;

/** 내장 스냅샷 버튼의 onSnapshot으로 캔버스를 받아 Blob 변환·저장·가짜 업로드를 시연하는 섹션 */
export default function SnapshotSection() {
  const [captured, setCaptured] = useState<CapturedSnapshot | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const urlRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const section = DEMO_SECTIONS.find((s) => s.id === "snapshot")!;

  // 언마운트 시 object URL과 타이머를 정리한다.
  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSnapshot = (canvas: HTMLCanvasElement) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        if (timerRef.current) clearTimeout(timerRef.current);
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        setCaptured({
          url,
          sizeKb: (blob.size / 1024).toFixed(1),
          width: canvas.width,
          height: canvas.height,
        });
        setUploadStatus("idle");
      },
      "image/jpeg",
      0.9,
    );
  };

  // 실제로 보내지 않는다. 업로드 중 상태 전이만 시연한다.
  const handleFakeUpload = () => {
    setUploadStatus("uploading");
    timerRef.current = setTimeout(() => setUploadStatus("done"), FAKE_UPLOAD_MS);
  };

  return (
    <Stack direction='column' spacing={3}>
      <SectionIntroCard
        title={section.title}
        description={section.description}
        keywords={section.keywords}
      />

      <ExampleCard title='라이브 예제'>
        <Webcam
          visibleSnapshotButton
          onSnapshot={handleSnapshot}
          webcamOptions={{ aspectRatio: 16 / 9 }}
        />
        <Typography variant='caption' sx={{ mt: 1, display: "block" }}>
          카메라 아래의 스냅샷 버튼을 누르면 onSnapshot이 원본 해상도 캔버스를 받습니다.
        </Typography>
      </ExampleCard>

      {captured && (
        <ExampleCard title='캡처 결과'>
          <Stack spacing={1.5}>
            <img
              src={captured.url}
              alt='캡처한 스냅샷'
              style={{ maxWidth: "100%", borderRadius: 4 }}
            />
            <Stack direction='row' spacing={1} sx={{ flexWrap: "wrap" }}>
              <Chip size='small' label={`${captured.sizeKb} KB`} />
              <Chip size='small' label={`${captured.width}x${captured.height}`} />
              <Chip size='small' label='image/jpeg 0.9' />
            </Stack>
            <Stack direction='row' spacing={1}>
              <Button
                component='a'
                href={captured.url}
                download='snapshot.jpg'
                variant='outlined'
                size='small'
              >
                저장
              </Button>
              <Button
                variant='outlined'
                size='small'
                onClick={handleFakeUpload}
                disabled={uploadStatus === "uploading"}
              >
                업로드 (가짜)
              </Button>
            </Stack>
            {uploadStatus !== "idle" && (
              <Typography variant='body2'>
                {uploadStatus === "uploading"
                  ? "업로드 중..."
                  : `업로드 완료 (가짜): ${captured.sizeKb} KB`}
              </Typography>
            )}
          </Stack>
        </ExampleCard>
      )}

      <Alert severity='info'>
        <Typography variant='body2'>
          업로드 버튼은 서버로 아무것도 보내지 않습니다. Blob 크기만 보여 주고 완료 상태를 흉내
          냅니다.
        </Typography>
      </Alert>

      <StateLogCard
        title='스냅샷 상태'
        data={{ captured: captured !== null, uploadStatus, sizeKb: captured?.sizeKb ?? null }}
      />

      <CodeBlockCard code={CODE_SNIPPETS["snapshot"]} />
    </Stack>
  );
}
