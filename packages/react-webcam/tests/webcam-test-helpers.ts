/**
 * 웹캠 테스트에서 반복되는 타이머 진행과 비디오 준비 절차를 모아 둔 헬퍼 파일이다.
 */
import { act } from "@testing-library/react";
import { vi } from "vitest";
import type { WebcamOptions } from "../src/webcam-types.js";

// ---------------------------------------------------------------------------
// 타이머 헬퍼
// ---------------------------------------------------------------------------

/**
 * constraints$의 debounceTime(100)과 그 뒤에 남은 비동기 작업까지 한 번에 비운다.
 */
export async function advanceToStreamLoad(): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });
}

// ---------------------------------------------------------------------------
// 비디오 요소 헬퍼
// ---------------------------------------------------------------------------

/**
 * 필요하면 videoWidth/videoHeight를 먼저 심고 loadedmetadata를 발생시킨다.
 * 컨트롤러가 비디오를 준비 완료 상태로 인식해야 할 때 사용한다.
 */
export async function markVideoReady(
  video: HTMLVideoElement,
  size: { width?: number; height?: number } = {},
): Promise<void> {
  Object.defineProperty(video, "videoWidth", {
    value: size.width ?? 1280,
    configurable: true,
  });
  Object.defineProperty(video, "videoHeight", {
    value: size.height ?? 720,
    configurable: true,
  });
  await act(async () => {
    video.dispatchEvent(new Event("loadedmetadata"));
    await Promise.resolve();
  });
}

/**
 * 미리 videoWidth/videoHeight를 설정한 비디오 요소를 만든다.
 * 이벤트 없이 메타데이터 준비 상태를 흉내 내야 하는 surface 테스트에 쓴다.
 */
export function createControllerVideoElement(size?: {
  width: number;
  height: number;
}): HTMLVideoElement {
  const videoEl = document.createElement("video");
  if (size) {
    Object.defineProperty(videoEl, "videoWidth", { value: size.width, configurable: true });
    Object.defineProperty(videoEl, "videoHeight", { value: size.height, configurable: true });
  }
  return videoEl;
}

// ---------------------------------------------------------------------------
// 컨트롤러 연결 헬퍼
// ---------------------------------------------------------------------------

interface AttachTarget {
  setVideoElement: (el: HTMLVideoElement | null | undefined) => void;
  setWebcamOptions: (
    opts: WebcamOptions | undefined | ((prev: WebcamOptions) => WebcamOptions),
  ) => void;
}

/**
 * setVideoElement와 setWebcamOptions를 한 번의 act()에서 호출해 스트림 요청을 시작한다.
 * 호출자는 반환된 비디오 요소에 직접 이벤트를 발생시킬 수 있다.
 */
export function attachController(
  result: { current: AttachTarget },
  options: WebcamOptions = { audioEnabled: false },
): HTMLVideoElement {
  const videoEl = document.createElement("video");
  act(() => {
    result.current.setVideoElement(videoEl);
    result.current.setWebcamOptions(options);
  });
  return videoEl;
}
