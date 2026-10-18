/**
 * 제어형 prop에 변경 콜백이 없을 때 출력하는 console.warn을 검증하는 테스트.
 * flipped와 webcamOptions 각각의 출력 조건, 한 번만 출력하는 규칙, 경고가 없어야 하는 경우를 다룬다.
 */

import { act, render } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WebcamHandle } from "../src/Webcam.js";
import { Webcam } from "../src/Webcam.js";
import { createFakeMediaStream, mockGetUserMedia } from "./test-utils.js";

vi.mock("../src/hooks/useResizeObserver.js", () => ({
  useResizeObserver: () =>
    [
      (_el: HTMLElement | null) => {},
      { x: 0, y: 0, width: 800, height: 600, top: 0, left: 0, bottom: 600, right: 800 },
    ] as const,
}));

describe("제어형 prop 변경 요청 경고", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockGetUserMedia(createFakeMediaStream());
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("flipped만 제어하고 onFlippedChange가 없을 때 setFlipped를 호출하면 경고를 출력한다", async () => {
    const ref = createRef<WebcamHandle>();
    render(<Webcam ref={ref} flipped={false} webcamOptions={{ audioEnabled: false }} />);

    await act(async () => {
      ref.current?.setFlipped(true);
    });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain("onFlippedChange");
  });

  it("webcamOptions만 제어하고 onWebcamOptionsChange가 없을 때 setWebcamOptions를 호출하면 경고를 출력한다", async () => {
    const ref = createRef<WebcamHandle>();
    render(<Webcam ref={ref} webcamOptions={{ audioEnabled: false }} />);

    await act(async () => {
      ref.current?.setWebcamOptions({ audioEnabled: false, facingMode: "environment" });
    });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain("onWebcamOptionsChange");
  });

  it("같은 prop의 변경 요청이 반복돼도 경고는 한 번만 출력한다", async () => {
    const ref = createRef<WebcamHandle>();
    render(<Webcam ref={ref} webcamOptions={{ audioEnabled: false }} />);

    await act(async () => {
      ref.current?.setWebcamOptions({ audioEnabled: false, facingMode: "environment" });
      ref.current?.setWebcamOptions({ audioEnabled: false, facingMode: "user" });
    });

    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("onFlippedChange와 onWebcamOptionsChange가 있으면 경고하지 않는다", async () => {
    const ref = createRef<WebcamHandle>();
    render(
      <Webcam
        ref={ref}
        flipped={false}
        onFlippedChange={() => {}}
        webcamOptions={{ audioEnabled: false }}
        onWebcamOptionsChange={() => {}}
      />,
    );

    await act(async () => {
      ref.current?.setFlipped(true);
      ref.current?.setWebcamOptions({ audioEnabled: false, facingMode: "environment" });
    });

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("비제어 모드에서는 경고하지 않는다", async () => {
    const ref = createRef<WebcamHandle>();
    render(
      <Webcam ref={ref} defaultFlipped={false} defaultWebcamOptions={{ audioEnabled: false }} />,
    );

    await act(async () => {
      ref.current?.setFlipped(true);
      ref.current?.setWebcamOptions({ audioEnabled: false, facingMode: "environment" });
    });

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("제어형 prop에 콜백이 없어도 변경 요청이 없으면 경고하지 않는다", async () => {
    render(<Webcam flipped={false} webcamOptions={{ audioEnabled: false }} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(warnSpy).not.toHaveBeenCalled();
  });
});
