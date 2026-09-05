import { Webcam } from "@cp949/react-webcam";
import { createElement } from "react";
import { createRoot } from "react-dom/client";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("harness: #root 요소를 찾을 수 없습니다.");
const root = createRoot(rootElement);

root.render(
  createElement(Webcam, { webcamOptions: { audioEnabled: false }, visibleSnapshotButton: true }),
);

// harness 전용 언마운트 트리거. 라이브러리 공개 API가 아니라 테스트가
// track.stop() 호출을 확인하기 위한 진입점이다.
const unmountButton = document.getElementById("harness-unmount");
unmountButton?.addEventListener("click", () => root.unmount());
