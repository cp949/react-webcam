import { useWebcam } from "@cp949/react-webcam";
import { createElement, useEffect } from "react";
import { createRoot } from "react-dom/client";

/** 테스트가 읽는 훅 상태. 라이브러리 공개 API가 아니라 harness 전용 창구다. */
type HarnessState = {
  phase: string;
  errorCode: string | undefined;
  isFrameReady: boolean;
  streamId: string | undefined;
  retry: () => void;
};
type HarnessWindow = Window & { __harness?: HarnessState; __video?: HTMLVideoElement };

const params = new URLSearchParams(location.search);
// muted=0이면 호출자가 muted를 빠뜨린 상황을 재현한다.
const mutedAttribute = params.get("muted") !== "0";
const audioEnabled = params.get("audio") === "1";

// 소비자 앱처럼 숨긴 video를 imperative로 만든다.
const video = document.createElement("video");
video.muted = mutedAttribute;
video.playsInline = true;
video.style.display = "none";
document.body.appendChild(video);
(window as HarnessWindow).__video = video;

function Probe() {
  const camera = useWebcam({
    videoElement: video,
    webcamOptions: { facingMode: "user", size: { width: 1280 }, audioEnabled },
  });
  const { detail, isFrameReady, retry } = camera;
  const errorCode = "errorCode" in detail ? detail.errorCode : undefined;
  const stream = "mediaStream" in detail ? detail.mediaStream : undefined;
  useEffect(() => {
    (window as HarnessWindow).__harness = {
      phase: detail.phase,
      errorCode,
      isFrameReady,
      streamId: stream?.id,
      retry,
    };
  });
  return null;
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("harness: #root 요소를 찾을 수 없습니다.");
const root = createRoot(rootElement);
root.render(createElement(Probe));

document.getElementById("harness-unmount")?.addEventListener("click", () => root.unmount());
