/**
 * `WebcamHandle.getVideoElement()`가 렌더된 `<video>`를 읽기용으로 돌려주는지 검증한다.
 */
import { act, render } from "@testing-library/react";
import { createRef, StrictMode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WebcamHandle } from "../src/Webcam.js";
import { Webcam } from "../src/Webcam.js";
import { createFakeMediaStream, mockGetUserMedia } from "./test-utils.js";
import { advanceToStreamLoad } from "./webcam-test-helpers.js";

// rootWidth를 테스트마다 바꿀 수 있게 한다. 0이면 video가 렌더되지 않는다.
const resizeState = vi.hoisted(() => ({ width: 800 }));

vi.mock("../src/hooks/useResizeObserver.js", () => ({
  useResizeObserver: () =>
    [
      (_el: HTMLElement | null) => {},
      {
        x: 0,
        y: 0,
        width: resizeState.width,
        height: 600,
        top: 0,
        left: 0,
        bottom: 600,
        right: resizeState.width,
      },
    ] as const,
}));

describe("WebcamHandle.getVideoElement", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resizeState.width = 800;
    mockGetUserMedia(createFakeMediaStream());
  });

  it("렌더된 video 요소와 같은 요소를 돌려준다", async () => {
    const ref = createRef<WebcamHandle>();
    render(<Webcam ref={ref} webcamOptions={{ audioEnabled: false }} />);
    await advanceToStreamLoad();

    const video = document.querySelector("video");
    expect(video).not.toBeNull();
    expect(ref.current!.getVideoElement()).toBe(video);
  });

  it("스트림이 live가 되면 null이 아니다", async () => {
    const ref = createRef<WebcamHandle>();
    render(<Webcam ref={ref} webcamOptions={{ audioEnabled: false }} />);
    await advanceToStreamLoad();

    expect(ref.current!.getDetail().phase).toBe("live");
    expect(ref.current!.getVideoElement()).not.toBeNull();
  });

  it("disabled이면 null이고 해제하면 새 video 요소를 돌려준다", async () => {
    const ref = createRef<WebcamHandle>();
    const { rerender } = render(
      <Webcam ref={ref} disabled webcamOptions={{ audioEnabled: false }} />,
    );
    expect(ref.current!.getVideoElement()).toBeNull();

    rerender(<Webcam ref={ref} webcamOptions={{ audioEnabled: false }} />);
    await advanceToStreamLoad();

    expect(ref.current!.getVideoElement()).toBe(document.querySelector("video"));
    expect(ref.current!.getVideoElement()).not.toBeNull();
  });

  it("마운트된 상태에서 disabled로 바꾸면 null이 된다", async () => {
    const ref = createRef<WebcamHandle>();
    const { rerender } = render(<Webcam ref={ref} webcamOptions={{ audioEnabled: false }} />);
    await advanceToStreamLoad();
    expect(ref.current!.getVideoElement()).not.toBeNull();

    rerender(<Webcam ref={ref} disabled webcamOptions={{ audioEnabled: false }} />);
    await advanceToStreamLoad();

    expect(document.querySelector("video")).toBeNull();
    expect(ref.current!.getVideoElement()).toBeNull();
  });

  it("StrictMode에서도 마운트 뒤 null이 아닌 요소를 돌려준다", async () => {
    const ref = createRef<WebcamHandle>();
    render(
      <StrictMode>
        <Webcam ref={ref} webcamOptions={{ audioEnabled: false }} />
      </StrictMode>,
    );
    await advanceToStreamLoad();

    expect(ref.current!.getVideoElement()).not.toBeNull();
    expect(ref.current!.getVideoElement()).toBe(document.querySelector("video"));
  });

  it("retry 뒤에도 같은 요소를 돌려준다", async () => {
    const ref = createRef<WebcamHandle>();
    render(<Webcam ref={ref} webcamOptions={{ audioEnabled: false }} />);
    await advanceToStreamLoad();
    const before = ref.current!.getVideoElement();

    mockGetUserMedia(createFakeMediaStream());
    await act(async () => {
      ref.current!.retry();
    });
    await advanceToStreamLoad();

    expect(before).not.toBeNull();
    expect(ref.current!.getVideoElement()).toBe(before);
  });

  it("마운트 직후 캐시한 핸들도 최신 요소를 돌려준다", async () => {
    const ref = createRef<WebcamHandle>();
    render(<Webcam ref={ref} webcamOptions={{ audioEnabled: false }} />);
    const cached = ref.current!;

    await advanceToStreamLoad();

    expect(cached.getVideoElement()).toBe(document.querySelector("video"));
  });

  it("언마운트 뒤에는 캐시한 핸들이 null을 돌려준다", async () => {
    const ref = createRef<WebcamHandle>();
    const { unmount } = render(<Webcam ref={ref} webcamOptions={{ audioEnabled: false }} />);
    const cached = ref.current!;
    await advanceToStreamLoad();
    expect(cached.getVideoElement()).not.toBeNull();

    unmount();

    expect(cached.getVideoElement()).toBeNull();
  });

  it("루트 너비를 아직 모르면(0) video가 없어 null이다", async () => {
    resizeState.width = 0;
    const ref = createRef<WebcamHandle>();
    render(<Webcam ref={ref} webcamOptions={{ audioEnabled: false }} />);
    await advanceToStreamLoad();

    expect(document.querySelector("video")).toBeNull();
    expect(ref.current!.getVideoElement()).toBeNull();
  });
});
