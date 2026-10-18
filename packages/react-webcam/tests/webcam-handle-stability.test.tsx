/**
 * Webcam ref 핸들의 안정성을 검증하는 테스트.
 * 상태가 바뀌어도 핸들 객체가 유지되고, 미리 캐시한 핸들도 최신 상태와 최신 콜백을 쓴다.
 */

import { act, render } from "@testing-library/react";
import { createRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WebcamHandle } from "../src/Webcam.js";
import { Webcam } from "../src/Webcam.js";
import { createFakeMediaStream, mockGetUserMedia } from "./test-utils.js";
import { advanceToStreamLoad } from "./webcam-test-helpers.js";

vi.mock("../src/hooks/useResizeObserver.js", () => ({
  useResizeObserver: () =>
    [
      (_el: HTMLElement | null) => {},
      { x: 0, y: 0, width: 800, height: 600, top: 0, left: 0, bottom: 600, right: 800 },
    ] as const,
}));

describe("Webcam ref 핸들 안정성", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockGetUserMedia(createFakeMediaStream());
  });

  it("스트림이 연결돼 상태가 바뀌어도 ref.current 객체가 바뀌지 않는다", async () => {
    const ref = createRef<WebcamHandle>();
    render(<Webcam ref={ref} webcamOptions={{ audioEnabled: false }} />);
    const handleBefore = ref.current;

    await advanceToStreamLoad();

    expect(handleBefore).not.toBeNull();
    expect(ref.current).toBe(handleBefore);
  });

  it("prop 콜백이 바뀌어도 ref.current 객체가 바뀌지 않는다", async () => {
    const ref = createRef<WebcamHandle>();
    const { rerender } = render(
      <Webcam ref={ref} flipped={false} onFlippedChange={() => {}} webcamOptions={{}} />,
    );
    const handleBefore = ref.current;

    rerender(<Webcam ref={ref} flipped={false} onFlippedChange={() => {}} webcamOptions={{}} />);

    expect(ref.current).toBe(handleBefore);
  });

  it("마운트 직후 캐시한 핸들의 getDetail은 최신 상태를 돌려준다", async () => {
    const ref = createRef<WebcamHandle>();
    render(<Webcam ref={ref} webcamOptions={{ audioEnabled: false }} />);
    const cached = ref.current!;

    await advanceToStreamLoad();

    expect(cached.getDetail().phase).toBe("live");
  });

  it("마운트 직후 캐시한 핸들의 resumePlayback은 현재 비디오 요소와 스트림으로 재생을 요청한다", async () => {
    const ref = createRef<WebcamHandle>();
    render(<Webcam ref={ref} webcamOptions={{ audioEnabled: false }} />);
    const cached = ref.current!;

    await advanceToStreamLoad();
    const video = document.querySelector("video")!;
    const playSpy = vi.spyOn(video, "play").mockResolvedValue(undefined);

    cached.resumePlayback();

    expect(playSpy).toHaveBeenCalledTimes(1);
  });

  it("캐시한 핸들의 setFlipped은 최신 onFlippedChange를 호출한다", async () => {
    const ref = createRef<WebcamHandle>();
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(
      <Webcam ref={ref} flipped={false} onFlippedChange={first} webcamOptions={{}} />,
    );
    const cached = ref.current!;

    rerender(<Webcam ref={ref} flipped={false} onFlippedChange={second} webcamOptions={{}} />);
    await act(async () => {
      cached.setFlipped(true);
    });

    expect(second).toHaveBeenCalledWith(true);
    expect(first).not.toHaveBeenCalled();
  });
});
