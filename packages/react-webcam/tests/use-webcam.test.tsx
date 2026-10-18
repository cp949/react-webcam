/**
 * 외부 video를 쓰는 공개 훅의 프레임 준비 상태, 재시도와 스트림 정리를 검증한다.
 */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useWebcam } from "../src/index.js";
import { createFakeMediaStream, mockGetUserMedia } from "./test-utils.js";
import { advanceToStreamLoad } from "./webcam-test-helpers.js";

/** 메타데이터와 첫 프레임 도착을 따로 제어한다. */
function createVideo() {
  const video = document.createElement("video");
  Object.defineProperties(video, {
    videoWidth: { value: 1280, configurable: true, writable: true },
    videoHeight: { value: 720, configurable: true, writable: true },
    readyState: { value: 1, configurable: true, writable: true },
  });
  return video;
}

/** 브라우저의 프레임 준비 상태 변화와 해당 이벤트를 함께 흉내 낸다. */
function setReadyState(video: HTMLVideoElement, state: number, event = "loadeddata") {
  Object.defineProperty(video, "readyState", { value: state, configurable: true, writable: true });
  act(() => {
    video.dispatchEvent(new Event(event));
  });
}

describe("외부 video용 useWebcam", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockGetUserMedia(createFakeMediaStream());
  });

  it("요소가 없으면 카메라를 요청하지 않는다", async () => {
    const request = vi.spyOn(navigator.mediaDevices, "getUserMedia");
    const { result } = renderHook(() => useWebcam({ videoElement: null }));
    await advanceToStreamLoad();
    expect(request).not.toHaveBeenCalled();
    expect(result.current.detail.phase).toBe("idle");
    expect(result.current.isFrameReady).toBe(false);
  });

  it("외부 video에 옵션을 적용하고 기존 표시 스타일을 보존한다", async () => {
    const video = createVideo();
    video.style.transform = "rotateY(180deg)";
    video.style.objectFit = "cover";
    const request = vi.spyOn(navigator.mediaDevices, "getUserMedia");
    const { result, rerender } = renderHook(() =>
      useWebcam({
        videoElement: video,
        webcamOptions: { facingMode: "user", size: { width: 1280 } },
      }),
    );
    await advanceToStreamLoad();
    expect(result.current.detail.phase).toBe("live");
    expect(video.srcObject).toBeTruthy();
    expect(request).toHaveBeenLastCalledWith(
      expect.objectContaining({
        video: expect.objectContaining({ facingMode: { ideal: "user" }, width: { ideal: 1280 } }),
      }),
    );
    expect(video.style.transform).toBe("rotateY(180deg)");
    expect(video.style.objectFit).toBe("cover");
    rerender();
    await advanceToStreamLoad();
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("메타데이터만 있으면 false이고 첫 프레임과 크기가 있으면 true다", async () => {
    const video = createVideo();
    const { result } = renderHook(() => useWebcam({ videoElement: video }));
    await advanceToStreamLoad();
    expect(result.current.isFrameReady).toBe(false);
    setReadyState(video, 2);
    expect(result.current.isFrameReady).toBe(true);
    setReadyState(video, 1, "emptied");
    expect(result.current.isFrameReady).toBe(false);
  });

  it("프레임이 있어도 영상 크기가 0이면 준비되지 않는다", async () => {
    const video = createVideo();
    Object.defineProperty(video, "videoWidth", { value: 0, configurable: true });
    const { result } = renderHook(() => useWebcam({ videoElement: video }));
    await advanceToStreamLoad();
    setReadyState(video, 2);
    expect(result.current.isFrameReady).toBe(false);
  });

  it("재생 실패를 알리고 사용자 재생 요청 뒤 복구한다", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const play = vi
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockRejectedValueOnce(new DOMException("blocked", "NotAllowedError"))
      .mockResolvedValue(undefined);
    const video = createVideo();
    const { result } = renderHook(() => useWebcam({ videoElement: video }));
    await advanceToStreamLoad();
    setReadyState(video, 2);
    expect(result.current.detail.phase).toBe("playback-error");
    expect(result.current.isFrameReady).toBe(false);
    await act(async () => {
      result.current.resumePlayback();
    });
    expect(result.current.detail.phase).toBe("live");
    expect(result.current.isFrameReady).toBe(true);
    expect(play).toHaveBeenCalledTimes(2);
  });

  it("재시도는 같은 옵션으로 새 스트림을 얻고 이전 트랙을 정리한다", async () => {
    const first = createFakeMediaStream();
    const second = createFakeMediaStream();
    const request = vi
      .spyOn(navigator.mediaDevices, "getUserMedia")
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(second);
    const video = createVideo();
    const { result } = renderHook(() => useWebcam({ videoElement: video }));
    await advanceToStreamLoad();
    setReadyState(video, 2);
    expect(result.current.isFrameReady).toBe(true);
    setReadyState(video, 0, "emptied");
    act(() => {
      result.current.retry();
    });
    await advanceToStreamLoad();
    expect(request).toHaveBeenCalledTimes(2);
    expect(first.getTracks()[0]!.stop).toHaveBeenCalled();
    expect(video.srcObject).toBe(second);
    expect(result.current.isFrameReady).toBe(false);
    setReadyState(video, 2);
    expect(result.current.isFrameReady).toBe(true);
  });

  it("요청 실패 뒤 재시도로 복구한다", async () => {
    const stream = createFakeMediaStream();
    vi.spyOn(navigator.mediaDevices, "getUserMedia")
      .mockRejectedValueOnce(new DOMException("denied", "NotAllowedError"))
      .mockResolvedValueOnce(stream);
    const video = createVideo();
    const { result } = renderHook(() => useWebcam({ videoElement: video }));
    await advanceToStreamLoad();
    expect(result.current.detail.phase).toBe("denied");
    act(() => {
      result.current.retry();
    });
    await advanceToStreamLoad();
    expect(result.current.detail).toMatchObject({ phase: "live", mediaStream: stream });
  });

  it("권한 응답 대기 중 재시도하면 늦게 도착한 이전 스트림을 정리한다", async () => {
    const staleStream = createFakeMediaStream();
    const currentStream = createFakeMediaStream();
    let resolveFirst!: (stream: MediaStream) => void;
    const firstRequest = new Promise<MediaStream>((resolve) => {
      resolveFirst = resolve;
    });
    const request = vi
      .spyOn(navigator.mediaDevices, "getUserMedia")
      .mockReturnValueOnce(firstRequest)
      .mockResolvedValueOnce(currentStream);
    const video = createVideo();
    const { result } = renderHook(() => useWebcam({ videoElement: video }));
    await advanceToStreamLoad();
    expect(result.current.detail.phase).toBe("requesting");
    act(() => {
      result.current.retry();
    });
    await advanceToStreamLoad();
    expect(request).toHaveBeenCalledTimes(2);
    setReadyState(video, 2);
    expect(result.current.isFrameReady).toBe(true);

    await act(async () => {
      resolveFirst(staleStream);
    });

    expect(staleStream.getTracks()[0]!.stop).toHaveBeenCalledTimes(1);
    expect(currentStream.getTracks()[0]!.stop).not.toHaveBeenCalled();
    expect(video.srcObject).toBe(currentStream);
    expect(result.current.detail).toMatchObject({ phase: "live", mediaStream: currentStream });
    expect(result.current.isFrameReady).toBe(true);
  });

  it("disabled면 요청하지 않고 활성화 후 비활성화하면 트랙과 연결을 정리한다", async () => {
    const stream = createFakeMediaStream();
    mockGetUserMedia(stream);
    const request = vi.spyOn(navigator.mediaDevices, "getUserMedia");
    const video = createVideo();
    const { result, rerender } = renderHook(
      ({ disabled }) => useWebcam({ videoElement: video, disabled }),
      { initialProps: { disabled: true } },
    );
    act(() => {
      result.current.retry();
    });
    await advanceToStreamLoad();
    expect(request).not.toHaveBeenCalled();
    rerender({ disabled: false });
    await advanceToStreamLoad();
    setReadyState(video, 2);
    expect(result.current.isFrameReady).toBe(true);
    rerender({ disabled: true });
    expect(result.current.detail.phase).toBe("idle");
    expect(result.current.isFrameReady).toBe(false);
    expect(stream.getTracks()[0]!.stop).toHaveBeenCalled();
    expect(video.srcObject).toBeNull();
  });

  it("video 교체와 언마운트 때 이전 요소에서 스트림을 분리한다", async () => {
    const firstVideo = createVideo();
    const { rerender, unmount } = renderHook(({ video }) => useWebcam({ videoElement: video }), {
      initialProps: { video: firstVideo },
    });
    await advanceToStreamLoad();
    const secondVideo = createVideo();
    rerender({ video: secondVideo });
    await advanceToStreamLoad();
    expect(firstVideo.srcObject).toBeNull();
    expect(secondVideo.srcObject).toBeTruthy();
    unmount();
    expect(secondVideo.srcObject).toBeNull();
  });

  it("예기치 않은 트랙 종료 뒤 프레임 준비 상태를 해제한다", async () => {
    const stream = createFakeMediaStream();
    mockGetUserMedia(stream);
    const video = createVideo();
    const { result } = renderHook(() => useWebcam({ videoElement: video }));
    await advanceToStreamLoad();
    setReadyState(video, 2);
    act(() => {
      stream.fireTrackEnded();
    });
    expect(result.current.detail).toMatchObject({ errorCode: "track-ended" });
    expect(result.current.isFrameReady).toBe(false);
  });
});
