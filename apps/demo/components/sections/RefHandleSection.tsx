"use client";

import { useRef, useState } from "react";
import { Webcam } from "@cp949/react-webcam";
import type { WebcamHandle } from "@cp949/react-webcam";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Chip from "@mui/material/Chip";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CODE_SNIPPETS } from "../../lib/code-snippets";
import { DEMO_SECTIONS } from "../../lib/demo-sections";
import { CodeBlockCard } from "../shared/CodeBlockCard";
import { ExampleCard } from "../shared/ExampleCard";
import { SectionIntroCard } from "../shared/SectionIntroCard";
import { StateLogCard } from "../shared/StateLogCard";

/** 저장 이미지의 방향 선택값이다. "follow"는 미리보기를 따르고 나머지는 `flipped` 옵션으로 덮어쓴다. */
type SaveDirection = "follow" | "upright" | "mirrored";

/** 크롭 비율 선택값이다. "none"은 크롭하지 않는다. */
type CropRatio = "none" | "1:1" | "4:3" | "16:9";

/** 선택값을 `snapshotToCanvas`의 `aspectRatio` 옵션(너비/높이)으로 바꾼다. 크롭하지 않으면 생략한다. */
function toAspectRatioOption(ratio: CropRatio): number | undefined {
  if (ratio === "1:1") return 1;
  if (ratio === "4:3") return 4 / 3;
  if (ratio === "16:9") return 16 / 9;
  return undefined;
}

/** 상태 로그에 표시할 저장 방향의 한글 라벨이다. */
const SAVE_DIRECTION_LABELS: Record<SaveDirection, string> = {
  follow: "미리보기 따름",
  upright: "정방향",
  mirrored: "반전",
};

/** 선택값을 `snapshotToCanvas`의 `flipped` 옵션으로 바꾼다. 미리보기를 따르면 생략한다. */
function toFlippedOption(direction: SaveDirection): boolean | undefined {
  if (direction === "upright") return false;
  if (direction === "mirrored") return true;
  return undefined;
}

/** ref handle을 통한 명령형 제어 — snapshotToCanvas(flipped, aspectRatio), isFrameReady, getVideoElement, setFlipped, setWebcamOptions 사용법을 시연하는 섹션 */
export default function RefHandleSection() {
  const webcamRef = useRef<WebcamHandle>(null);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string>("없음");
  const [frameReady, setFrameReady] = useState(false);
  const [videoInfo, setVideoInfo] = useState<string>("없음");
  const [saveDirection, setSaveDirection] = useState<SaveDirection>("follow");
  const [cropRatio, setCropRatio] = useState<CropRatio>("none");
  const [snapshotSize, setSnapshotSize] = useState<string>("없음");

  const section = DEMO_SECTIONS.find((s) => s.id === "ref-handle")!;

  const handleSnapshot = () => {
    // flipped를 생략하면 미리보기 방향을 따르고, 지정하면 저장 이미지만 덮어쓴다.
    // aspectRatio를 지정하면 원본 가운데를 그 비율로 잘라 낸다.
    const canvas = webcamRef.current?.snapshotToCanvas({
      flipped: toFlippedOption(saveDirection),
      aspectRatio: toAspectRatioOption(cropRatio),
    });
    if (canvas) {
      setSnapshotUrl(canvas.toDataURL("image/png"));
      setSnapshotSize(`${canvas.width}x${canvas.height}`);
      setLastAction(
        `스냅샷 찍음 (저장 방향: ${SAVE_DIRECTION_LABELS[saveDirection]}, 크롭 비율: ${cropRatio === "none" ? "없음" : cropRatio})`,
      );
    } else {
      setLastAction("웹캠이 준비되지 않았습니다");
    }
  };

  const handleFlip = () => {
    webcamRef.current?.setFlipped((v) => !v);
    setLastAction("좌우 반전 토글");
  };

  const handleVideoInfo = () => {
    // getVideoElement()는 읽기 용도다. 저장하지 않고 필요할 때마다 호출한다.
    const video = webcamRef.current?.getVideoElement();
    if (video) {
      // 콜백으로 받은 frameReady와 핸들이 지금 돌려주는 값을 나란히 보여 준다.
      const handleReady = webcamRef.current?.isFrameReady();
      setVideoInfo(
        `${video.videoWidth}x${video.videoHeight}, readyState ${video.readyState}, isFrameReady() ${String(handleReady)}`,
      );
      setLastAction("video 정보 조회");
    } else {
      setVideoInfo("video 요소 없음 (null)");
      setLastAction("video 요소가 없습니다");
    }
  };

  const handleBackCamera = () => {
    webcamRef.current?.setWebcamOptions((prev) => ({ ...prev, facingMode: "environment" }));
    setLastAction("후면 카메라로 전환");
  };

  const handleFrontCamera = () => {
    webcamRef.current?.setWebcamOptions((prev) => ({ ...prev, facingMode: "user" }));
    setLastAction("전면 카메라로 전환");
  };

  return (
    <Stack direction='column' spacing={3}>
      {/* 1. 섹션 소개 */}
      <SectionIntroCard
        title={section.title}
        description={section.description}
        keywords={section.keywords}
      />

      {/* 2. 라이브 예제 + 명령형 제어 */}
      <ExampleCard title='라이브 예제 + 명령형 제어'>
        <Webcam ref={webcamRef} controls={{ flip: true }} onFrameReadyChange={setFrameReady} />
        <Stack direction='row' spacing={1} sx={{ mt: 2, alignItems: "center" }}>
          <Chip
            size='small'
            label={frameReady ? "프레임 준비됨" : "프레임 대기 중"}
            color={frameReady ? "success" : "default"}
          />
          <Typography variant='caption'>onFrameReadyChange: {String(frameReady)}</Typography>
        </Stack>
        <Stack direction='row' spacing={1} sx={{ mt: 2, alignItems: "center", flexWrap: "wrap" }}>
          <Typography variant='caption'>저장 방향</Typography>
          <ToggleButtonGroup
            exclusive
            size='small'
            value={saveDirection}
            onChange={(_, value: SaveDirection | null) => {
              if (value) setSaveDirection(value);
            }}
          >
            <ToggleButton value='follow'>미리보기 따름</ToggleButton>
            <ToggleButton value='upright'>정방향</ToggleButton>
            <ToggleButton value='mirrored'>반전</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        <Stack direction='row' spacing={1} sx={{ mt: 2, alignItems: "center", flexWrap: "wrap" }}>
          <Typography variant='caption'>크롭 비율</Typography>
          <ToggleButtonGroup
            exclusive
            size='small'
            value={cropRatio}
            onChange={(_, value: CropRatio | null) => {
              if (value) setCropRatio(value);
            }}
          >
            <ToggleButton value='none'>없음</ToggleButton>
            <ToggleButton value='1:1'>1:1</ToggleButton>
            <ToggleButton value='4:3'>4:3</ToggleButton>
            <ToggleButton value='16:9'>16:9</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        <Stack direction='row' spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
          <Button variant='outlined' size='small' disabled={!frameReady} onClick={handleSnapshot}>
            스냅샷
          </Button>
          <Button variant='outlined' size='small' onClick={handleVideoInfo}>
            video 정보
          </Button>
          <Button variant='outlined' size='small' onClick={handleFlip}>
            좌우 반전
          </Button>
          <Button variant='outlined' size='small' onClick={handleBackCamera}>
            후면 카메라
          </Button>
          <Button variant='outlined' size='small' onClick={handleFrontCamera}>
            전면 카메라
          </Button>
        </Stack>
        <Typography variant='caption' sx={{ mt: 1, display: "block" }}>
          마지막 액션: {lastAction}
        </Typography>
      </ExampleCard>

      {/* 3. 스냅샷 미리보기 카드 (snapshotUrl이 있을 때만 표시) */}
      {snapshotUrl !== null && (
        <Card variant='outlined'>
          <CardHeader title='스냅샷 미리보기' />
          <CardContent>
            <img src={snapshotUrl} alt='스냅샷' style={{ maxWidth: "100%", borderRadius: 4 }} />
            <Button
              variant='outlined'
              size='small'
              onClick={() => setSnapshotUrl(null)}
              sx={{ mt: 1 }}
            >
              초기화
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 4. 상태 로그 */}
      <StateLogCard
        title='API 호출 결과'
        data={{
          lastAction,
          frameReady,
          saveDirection: SAVE_DIRECTION_LABELS[saveDirection],
          cropRatio: cropRatio === "none" ? "없음" : cropRatio,
          snapshotSize,
          videoInfo,
          snapshotCaptured: snapshotUrl !== null,
        }}
      />

      {/* 5. 코드 블록 */}
      <CodeBlockCard code={CODE_SNIPPETS["ref-handle"]} />
    </Stack>
  );
}
