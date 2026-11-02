/**
 * `Webcam`의 `onFrameReadyChange` prop과 `WebcamHandle.isFrameReady()`를 검증한다.
 * happy-dom은 readyState를 올리지 않으므로 속성을 직접 심고 이벤트를 발생시킨다.
 */
import { act, render } from "@testing-library/react";
import { createRef, StrictMode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WebcamHandle } from "../src/Webcam.js";
import { Webcam } from "../src/Webcam.js";
import { createFakeMediaStream, mockGetUserMedia, type FakeMediaStream } from "./test-utils.js";
import { advanceToStreamLoad } from "./webcam-test-helpers.js";

vi.mock("../src/hooks/useResizeObserver.js", () => ({
  useResizeObserver: () =>
    [
      (_el: HTMLElement | null) => {},
      { x: 0, y: 0, width: 800, height: 600, top: 0, left: 0, bottom: 600, right: 800 },
    ] as const,
}));

/** 비디오 요소에 readyState와 크기를 심고 프레임 도착 이벤트를 발생시킨다. */
async function deliverFrame(video: HTMLVideoElement, readyState = 2) {
  Object.defineProperties(video, {
    videoWidth: { value: 1280, configurable: true, writable: true },
    videoHeight: { value: 720, configurable: true, writable: true },
    readyState: { value: readyState, configurable: true, writable: true },
  });
  await act(async () => {
    video.dispatchEvent(new Event("loadeddata"));
    await Promise.resolve();
  });
}

describe("Webcam onFrameReadyChange / isFrameReady", () => {
  let stream: FakeMediaStream;

  beforeEach(() => {
    vi.useFakeTimers();
    stream = createFakeMediaStream();
    mockGetUserMedia(stream);
  });

  it("프레임이 오기 전에는 콜백을 호출하지 않고 isFrameReady는 false다", async () => {
    const onFrameReadyChange = vi.fn();
    const ref = createRef<WebcamHandle>();
    render(
      <Webcam
        ref={ref}
        webcamOptions={{ audioEnabled: false }}
        onFrameReadyChange={onFrameReadyChange}
      />,
    );
    await advanceToStreamLoad();

    expect(ref.current!.getDetail().phase).toBe("live");
    expect(onFrameReadyChange).not.toHaveBeenCalled();
    expect(ref.current!.isFrameReady()).toBe(false);
  });

  it("프레임이 도착하면 true로 한 번 호출한다", async () => {
    const onFrameReadyChange = vi.fn();
    const ref = createRef<WebcamHandle>();
    render(
      <Webcam
        ref={ref}
        webcamOptions={{ audioEnabled: false }}
        onFrameReadyChange={onFrameReadyChange}
      />,
    );
    await advanceToStreamLoad();
    await deliverFrame(document.querySelector("video")!);

    expect(onFrameReadyChange).toHaveBeenCalledTimes(1);
    expect(onFrameReadyChange).toHaveBeenLastCalledWith(true);
    expect(ref.current!.isFrameReady()).toBe(true);
  });

  it("비디오 트랙이 mute되면 false, unmute되면 true로 호출한다", async () => {
    const onFrameReadyChange = vi.fn();
    render(
      <Webcam webcamOptions={{ audioEnabled: false }} onFrameReadyChange={onFrameReadyChange} />,
    );
    await advanceToStreamLoad();
    await deliverFrame(document.querySelector("video")!);
    onFrameReadyChange.mockClear();

    await act(async () => {
      stream.fireTrackMute();
    });
    expect(onFrameReadyChange).toHaveBeenCalledTimes(1);
    expect(onFrameReadyChange).toHaveBeenLastCalledWith(false);

    await act(async () => {
      stream.fireTrackUnmute();
    });
    expect(onFrameReadyChange).toHaveBeenCalledTimes(2);
    expect(onFrameReadyChange).toHaveBeenLastCalledWith(true);
  });

  it("retry 후에는 false로 내려가고 새 프레임에서 다시 true가 된다", async () => {
    const onFrameReadyChange = vi.fn();
    const ref = createRef<WebcamHandle>();
    render(
      <Webcam
        ref={ref}
        webcamOptions={{ audioEnabled: false }}
        onFrameReadyChange={onFrameReadyChange}
      />,
    );
    await advanceToStreamLoad();
    const video = document.querySelector("video")!;
    await deliverFrame(video);
    onFrameReadyChange.mockClear();

    // 새 스트림은 프레임 도착 전이므로 readyState를 되돌린다.
    Object.defineProperty(video, "readyState", { value: 0, configurable: true, writable: true });
    mockGetUserMedia(createFakeMediaStream());
    await act(async () => {
      ref.current!.retry();
    });
    await advanceToStreamLoad();

    expect(onFrameReadyChange.mock.calls).toEqual([[false]]);
    expect(ref.current!.isFrameReady()).toBe(false);

    await deliverFrame(video);
    expect(onFrameReadyChange.mock.calls).toEqual([[false], [true]]);
  });

  it("disabled로 바뀌면 false로 호출한다", async () => {
    const onFrameReadyChange = vi.fn();
    const { rerender } = render(
      <Webcam webcamOptions={{ audioEnabled: false }} onFrameReadyChange={onFrameReadyChange} />,
    );
    await advanceToStreamLoad();
    await deliverFrame(document.querySelector("video")!);
    onFrameReadyChange.mockClear();

    rerender(
      <Webcam
        disabled
        webcamOptions={{ audioEnabled: false }}
        onFrameReadyChange={onFrameReadyChange}
      />,
    );
    await advanceToStreamLoad();

    expect(onFrameReadyChange.mock.calls).toEqual([[false]]);
  });

  it("같은 ready 상태에서 이벤트가 다시 와도 호출하지 않는다", async () => {
    const onFrameReadyChange = vi.fn();
    const { rerender } = render(
      <Webcam webcamOptions={{ audioEnabled: false }} onFrameReadyChange={onFrameReadyChange} />,
    );
    await advanceToStreamLoad();
    const video = document.querySelector("video")!;
    await deliverFrame(video);
    // 같은 ready 상태에서 이벤트가 다시 와도 통지하지 않는다.
    // 중복 억제 ref 자체는 첫 케이스(마운트 시 false 미호출)와 StrictMode 케이스가 검증한다.
    await deliverFrame(video, 4);
    rerender(
      <Webcam webcamOptions={{ audioEnabled: false }} onFrameReadyChange={onFrameReadyChange} />,
    );

    expect(onFrameReadyChange).toHaveBeenCalledTimes(1);
  });

  it("콜백만 바뀌어서는 호출하지 않고 이후 변화는 최신 콜백으로 보낸다", async () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(
      <Webcam webcamOptions={{ audioEnabled: false }} onFrameReadyChange={first} />,
    );
    await advanceToStreamLoad();
    await deliverFrame(document.querySelector("video")!);
    first.mockClear();

    rerender(<Webcam webcamOptions={{ audioEnabled: false }} onFrameReadyChange={second} />);
    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();

    await act(async () => {
      stream.fireTrackMute();
    });
    expect(first).not.toHaveBeenCalled();
    expect(second.mock.calls).toEqual([[false]]);
  });

  it("같은 commit에서 onStateChange가 onFrameReadyChange보다 먼저 호출된다", async () => {
    const calls: string[] = [];
    const ref = createRef<WebcamHandle>();
    render(
      <Webcam
        ref={ref}
        webcamOptions={{ audioEnabled: false }}
        onStateChange={(detail) => calls.push(`state:${detail.phase}`)}
        onFrameReadyChange={(ready) => calls.push(`ready:${ready}`)}
      />,
    );
    await advanceToStreamLoad();
    const video = document.querySelector("video")!;
    await deliverFrame(video);
    calls.length = 0;

    // live 중 retry하면 requesting 전환과 ready false가 같은 commit에서 나간다.
    Object.defineProperty(video, "readyState", { value: 0, configurable: true, writable: true });
    mockGetUserMedia(createFakeMediaStream());
    await act(async () => {
      ref.current!.retry();
    });

    expect(calls.slice(0, 2)).toEqual(["state:requesting", "ready:false"]);
  });

  it("언마운트 시에는 호출하지 않는다", async () => {
    const onFrameReadyChange = vi.fn();
    const { unmount } = render(
      <Webcam webcamOptions={{ audioEnabled: false }} onFrameReadyChange={onFrameReadyChange} />,
    );
    await advanceToStreamLoad();
    await deliverFrame(document.querySelector("video")!);
    onFrameReadyChange.mockClear();

    unmount();

    expect(onFrameReadyChange).not.toHaveBeenCalled();
  });

  it("언마운트 뒤에는 캐시한 핸들의 isFrameReady가 false다", async () => {
    const ref = createRef<WebcamHandle>();
    const { unmount } = render(<Webcam ref={ref} webcamOptions={{ audioEnabled: false }} />);
    const cached = ref.current!;
    await advanceToStreamLoad();
    await deliverFrame(document.querySelector("video")!);
    expect(cached.isFrameReady()).toBe(true);

    unmount();

    expect(cached.isFrameReady()).toBe(false);
  });

  it("StrictMode에서도 false 호출 없이 true가 한 번만 온다", async () => {
    const onFrameReadyChange = vi.fn();
    render(
      <StrictMode>
        <Webcam webcamOptions={{ audioEnabled: false }} onFrameReadyChange={onFrameReadyChange} />
      </StrictMode>,
    );
    await advanceToStreamLoad();
    expect(onFrameReadyChange).not.toHaveBeenCalled();

    await deliverFrame(document.querySelector("video")!);

    expect(onFrameReadyChange.mock.calls).toEqual([[true]]);
  });

  it("StrictMode에서도 핸들의 isFrameReady가 true를 돌려준다", async () => {
    const ref = createRef<WebcamHandle>();
    render(
      <StrictMode>
        <Webcam ref={ref} webcamOptions={{ audioEnabled: false }} />
      </StrictMode>,
    );
    await advanceToStreamLoad();
    await deliverFrame(document.querySelector("video")!);

    expect(ref.current!.isFrameReady()).toBe(true);
  });
});
