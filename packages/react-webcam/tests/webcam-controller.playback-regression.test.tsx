/**
 * 재생 실패와 Safari 계열 이벤트 순서 문제를 다루는 회귀 테스트 파일이다.
 */
import { act, render, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useWebcamController } from "../src/hooks/useWebcamController.js";
import { Webcam } from "../src/Webcam.js";
import { createFakeMediaStream, mockGetUserMedia } from "./test-utils.js";
import { advanceToStreamLoad, attachController } from "./webcam-test-helpers.js";

// ---------------------------------------------------------------------------
// rootWidth가 즉시 800으로 잡히도록 useResizeObserver를 목 처리한다.
// 이 설정이 없으면 rootWidth가 0에 머물러 비디오 요소가 렌더링되지 않는다.
// ---------------------------------------------------------------------------
vi.mock("../src/hooks/useResizeObserver.js", () => ({
  useResizeObserver: () =>
    [
      (_el: HTMLElement | null) => {},
      { x: 0, y: 0, width: 800, height: 600, top: 0, left: 0, bottom: 600, right: 800 },
    ] as const,
}));

// ---------------------------------------------------------------------------
// Webcam Safari·모바일 재생 안정성
// ---------------------------------------------------------------------------

describe("Webcam – Safari/모바일 재생 안정성", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockGetUserMedia(createFakeMediaStream());
  });

  it("video 요소에 playsInline 속성이 존재한다", () => {
    const { container } = render(<Webcam />);
    const video = container.querySelector("video")!;
    expect(video).not.toBeNull();
    // playsInline은 boolean attribute — 속성 자체가 존재하는지 확인한다
    expect(video.hasAttribute("playsinline")).toBe(true);
  });

  it("autoPlay가 차단되면 playback-error 상태로 전환하고 console.warn을 출력한다", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const autoPlayError = Object.assign(new Error("autoplay blocked"), {
      name: "NotAllowedError",
    });
    vi.spyOn(HTMLMediaElement.prototype, "play").mockRejectedValue(autoPlayError);

    const { result } = renderHook(() => useWebcamController());

    attachController(result);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    // play() 실패는 playback-error 상태로 전환된다
    expect(result.current.webcamDetail.phase).toBe("playback-error");
    // 조용히 실패하지 않는다 — console.warn이 호출되어야 한다
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[react-webcam] autoPlay blocked or failed:"),
      autoPlayError,
    );
  });

  it("play()에서 AbortError가 오면 경고를 출력하지 않는다", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const abortError = Object.assign(new Error("aborted"), { name: "AbortError" });
    vi.spyOn(HTMLMediaElement.prototype, "play").mockRejectedValue(abortError);

    const { result } = renderHook(() => useWebcamController());

    attachController(result);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    // AbortError는 정상적인 srcObject 교체 시 발생하는 것이므로 경고 없이 무시한다
    const webcamWarns = warnSpy.mock.calls.filter(
      ([msg]) => typeof msg === "string" && msg.includes("[react-webcam]"),
    );
    expect(webcamWarns).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// useWebcamController videoSize 준비 상태 회귀 테스트
// Safari 계열에서 loadeddata와 loadedmetadata 순서가 뒤바뀌는 경우를 방어한다.
// ---------------------------------------------------------------------------

describe("useWebcamController – videoSize readiness (Safari 이벤트 순서)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockGetUserMedia(createFakeMediaStream());
  });

  it("video 준비 전 snapshotToCanvas는 null을 반환한다 (videoWidth/Height = 0)", () => {
    const { result } = renderHook(() => useWebcamController());

    const videoEl = document.createElement("video");
    // videoWidth/videoHeight가 0인 상태 (기본값)
    act(() => {
      result.current.setVideoElement(videoEl);
    });

    expect(result.current.snapshotToCanvas()).toBeNull();
  });

  it("regression: loadeddata가 loadedmetadata보다 먼저 와도 videoSize가 정상 갱신된다", async () => {
    const { result } = renderHook(() => useWebcamController());

    const videoEl = document.createElement("video");
    Object.defineProperty(videoEl, "videoWidth", { value: 1280, configurable: true });
    Object.defineProperty(videoEl, "videoHeight", { value: 720, configurable: true });

    act(() => {
      result.current.setVideoElement(videoEl);
    });

    // loadeddata를 먼저 dispatch (iOS Safari 시나리오)
    await act(async () => {
      videoEl.dispatchEvent(new Event("loadeddata"));
      await Promise.resolve();
    });

    expect(result.current.videoSize).toEqual({ width: 1280, height: 720 });

    // 그 후 loadedmetadata가 와도 상태가 꼬이지 않는다
    await act(async () => {
      videoEl.dispatchEvent(new Event("loadedmetadata"));
      await Promise.resolve();
    });

    expect(result.current.videoSize).toEqual({ width: 1280, height: 720 });
  });

  it("loadedmetadata가 먼저 오고 loadeddata가 뒤에 와도 videoSize가 정상 갱신된다", async () => {
    const { result } = renderHook(() => useWebcamController());

    const videoEl = document.createElement("video");
    Object.defineProperty(videoEl, "videoWidth", { value: 640, configurable: true });
    Object.defineProperty(videoEl, "videoHeight", { value: 480, configurable: true });

    act(() => {
      result.current.setVideoElement(videoEl);
    });

    // loadedmetadata 먼저 (정상 순서)
    await act(async () => {
      videoEl.dispatchEvent(new Event("loadedmetadata"));
      await Promise.resolve();
    });

    expect(result.current.videoSize).toEqual({ width: 640, height: 480 });

    // loadeddata가 뒤에 와도 videoSize가 유지된다
    await act(async () => {
      videoEl.dispatchEvent(new Event("loadeddata"));
      await Promise.resolve();
    });

    expect(result.current.videoSize).toEqual({ width: 640, height: 480 });
  });

  it("regression: videoWidth/Height가 0인 상태에서 loadeddata가 와도 videoSize는 undefined를 유지한다", async () => {
    const { result } = renderHook(() => useWebcamController());

    const videoEl = document.createElement("video");
    // videoWidth/videoHeight가 0 — 메타데이터가 아직 없는 상태

    act(() => {
      result.current.setVideoElement(videoEl);
    });

    await act(async () => {
      videoEl.dispatchEvent(new Event("loadeddata"));
      await Promise.resolve();
    });

    // 크기 정보가 없으면 videoSize를 갱신하지 않는다
    expect(result.current.videoSize).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// play failure – regression coverage
// ---------------------------------------------------------------------------

describe("play failure", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("emits playback-error state when play() rejects with non-AbortError", async () => {
    const fakeStream = createFakeMediaStream();
    mockGetUserMedia(fakeStream);

    // 브라우저 자동 재생 정책이 play()를 막는 상황을 흉내 낸다.
    const playError = Object.assign(new Error("NotAllowedError"), { name: "NotAllowedError" });
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      value: () => Promise.reject(playError),
      configurable: true,
      writable: true,
    });

    const onStateChange = vi.fn();
    render(<Webcam webcamOptions={{ audioEnabled: false }} onStateChange={onStateChange} />);

    await advanceToStreamLoad();

    const playbackErrorCalls = onStateChange.mock.calls.filter(
      ([s]) => s.phase === "playback-error",
    );
    expect(playbackErrorCalls.length).toBeGreaterThanOrEqual(1);
    expect(playbackErrorCalls[0][0]).toMatchObject({
      phase: "playback-error",
      mediaStream: fakeStream,
    });
  });

  it("does NOT emit playback-error when play() rejects with AbortError", async () => {
    const fakeStream = createFakeMediaStream();
    mockGetUserMedia(fakeStream);

    // AbortError는 경고 없이 무시되어야 한다.
    const abortError = Object.assign(new Error("AbortError"), { name: "AbortError" });
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      value: () => Promise.reject(abortError),
      configurable: true,
      writable: true,
    });

    const onStateChange = vi.fn();
    render(<Webcam webcamOptions={{ audioEnabled: false }} onStateChange={onStateChange} />);

    await advanceToStreamLoad();

    const playbackErrorCalls = onStateChange.mock.calls.filter(
      ([s]) => s.phase === "playback-error",
    );
    expect(playbackErrorCalls.length).toBe(0);

    // 스트림은 여전히 live 상태까지 도달해야 한다.
    const liveCalls = onStateChange.mock.calls.filter(([s]) => s.phase === "live");
    expect(liveCalls.length).toBeGreaterThanOrEqual(1);
  });

  it("regression: stale play rejection does not overwrite current live state", async () => {
    let rejectFirstPlay!: (reason?: unknown) => void;
    const playMock = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<void>((_, reject) => {
            rejectFirstPlay = reject;
          }),
      )
      .mockResolvedValue(undefined);
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      value: playMock,
      configurable: true,
      writable: true,
    });

    const fakeStream1 = createFakeMediaStream();
    const fakeStream2 = createFakeMediaStream();
    const getUserMediaMock = vi
      .fn()
      .mockResolvedValueOnce(fakeStream1)
      .mockResolvedValueOnce(fakeStream2);
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: getUserMediaMock },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useWebcamController());
    const videoEl = document.createElement("video");
    Object.defineProperty(videoEl, "videoWidth", {
      value: 1280,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(videoEl, "videoHeight", {
      value: 720,
      configurable: true,
      writable: true,
    });

    act(() => {
      result.current.setVideoElement(videoEl);
      result.current.setWebcamOptions({ audioEnabled: false, facingMode: "user" });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
      videoEl.dispatchEvent(new Event("loadedmetadata"));
      await Promise.resolve();
    });

    act(() => {
      result.current.setWebcamOptions({ audioEnabled: false, facingMode: "environment" });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
      videoEl.dispatchEvent(new Event("loadedmetadata"));
      await Promise.resolve();
    });

    await act(async () => {
      rejectFirstPlay(
        Object.assign(new Error("stale autoplay failure"), { name: "NotAllowedError" }),
      );
      await Promise.resolve();
    });

    expect(result.current.webcamDetail.phase).toBe("live");
    if (result.current.webcamDetail.phase === "live") {
      expect(result.current.webcamDetail.mediaStream).toBe(fakeStream2);
    }
  });

  it("recovers from playback-error when playback later succeeds for the same stream", async () => {
    let shouldReject = true;
    const playMock = vi.fn().mockImplementation(() => {
      if (shouldReject) {
        return Promise.reject(
          Object.assign(new Error("autoplay blocked"), { name: "NotAllowedError" }),
        );
      }
      return Promise.resolve();
    });
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      value: playMock,
      configurable: true,
      writable: true,
    });

    const fakeStream = createFakeMediaStream();
    mockGetUserMedia(fakeStream);

    const { result } = renderHook(() => useWebcamController());
    const videoEl = document.createElement("video");
    Object.defineProperty(videoEl, "videoWidth", { value: 1280, configurable: true });
    Object.defineProperty(videoEl, "videoHeight", { value: 720, configurable: true });

    act(() => {
      result.current.setVideoElement(videoEl);
      result.current.setWebcamOptions({ audioEnabled: false });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
      videoEl.dispatchEvent(new Event("loadedmetadata"));
      await Promise.resolve();
    });

    expect(result.current.webcamDetail.phase).toBe("playback-error");
    expect(result.current.isLoaded).toBe(false);

    shouldReject = false;

    await act(async () => {
      await videoEl.play();
      videoEl.dispatchEvent(new Event("playing"));
      await Promise.resolve();
    });

    expect(result.current.webcamDetail.phase).toBe("live");
    expect(result.current.isLoaded).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// pausePlayback / resumePlayback 회귀
// ---------------------------------------------------------------------------

describe("pausePlayback / resumePlayback 회귀", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  /**
   * live 상태까지 진행하는 공통 헬퍼.
   * play()를 성공시키고 싶을 때 beforeSetup 콜백에서 HTMLMediaElement.prototype.play를 재정의한다.
   */
  async function setupLiveController(beforeSetup?: () => void) {
    const fakeStream = createFakeMediaStream();
    mockGetUserMedia(fakeStream);

    beforeSetup?.();

    const { result } = renderHook(() => useWebcamController());
    const videoEl = document.createElement("video");
    Object.defineProperty(videoEl, "videoWidth", { value: 1280, configurable: true });
    Object.defineProperty(videoEl, "videoHeight", { value: 720, configurable: true });

    act(() => {
      result.current.setVideoElement(videoEl);
      result.current.setWebcamOptions({ audioEnabled: false });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
      videoEl.dispatchEvent(new Event("loadedmetadata"));
      await Promise.resolve();
    });

    return { result, videoEl, fakeStream };
  }

  it("pausePlayback() 호출이 stream track을 stop하지 않는다", async () => {
    const { result, fakeStream } = await setupLiveController();

    // 초기 play()가 없으면 playback-error — play()는 test-utils에서 이미 성공으로 정의되어 있다.
    expect(result.current.webcamDetail.phase).toBe("live");

    // 비디오 트랙의 stop을 감시한다.
    const [videoTrack] = fakeStream.getVideoTracks();
    const stopSpy = vi.spyOn(videoTrack, "stop");

    act(() => {
      result.current.pausePlayback();
    });

    expect(stopSpy).not.toHaveBeenCalled();
    // pausePlayback은 WebcamDetail을 변경하지 않으므로 phase가 live를 유지해야 한다.
    expect(result.current.webcamDetail.phase).toBe("live");
  });

  it("pausePlayback() 호출이 onStateChange를 발생시키지 않는다", async () => {
    // useWebcamController를 직접 사용해 onStateChange에 해당하는 webcamDetail 변화를 감시한다.
    const { result } = await setupLiveController();

    expect(result.current.webcamDetail.phase).toBe("live");

    // live 안정화 이후의 webcamDetail 참조를 기록한다.
    const detailBefore = result.current.webcamDetail;

    act(() => {
      result.current.pausePlayback();
    });

    // pausePlayback은 WebcamDetail을 변경하지 않으므로 참조가 동일해야 한다.
    expect(result.current.webcamDetail).toBe(detailBefore);
  });

  it("resumePlayback() 성공 시 live 상태가 유지된다", async () => {
    const { result } = await setupLiveController(() => {
      vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    });
    const playSpy = vi.mocked(HTMLMediaElement.prototype.play);

    expect(result.current.webcamDetail.phase).toBe("live");

    // 초기 스트림 로드 시점의 play() 호출 횟수를 기록한다.
    const callsBeforeResume = playSpy.mock.calls.length;

    await act(async () => {
      result.current.resumePlayback();
      await Promise.resolve();
    });

    // play()가 한 번 더 호출되었고 상태는 live를 유지한다.
    expect(playSpy.mock.calls.length).toBeGreaterThan(callsBeforeResume);
    expect(result.current.webcamDetail.phase).toBe("live");
  });

  it("resumePlayback() 실패 시 playback-error로 반영된다", async () => {
    // 초기 스트림 로드(자동재생) 시점에는 성공하고, resumePlayback 시점에 실패한다.
    const notAllowedError = Object.assign(new Error("autoplay blocked"), {
      name: "NotAllowedError",
    });
    const playSpy = vi
      .fn()
      .mockResolvedValueOnce(undefined) // 초기 자동재생: 성공
      .mockRejectedValue(notAllowedError); // 이후 resumePlayback: 실패

    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      value: playSpy,
      configurable: true,
      writable: true,
    });

    const { result } = await setupLiveController();

    // 초기 자동재생 성공 후 live 상태여야 한다.
    expect(result.current.webcamDetail.phase).toBe("live");

    await act(async () => {
      result.current.resumePlayback();
      // play().catch() 핸들러가 microtask queue 두 단계를 거치므로 두 번 flush한다
      await Promise.resolve();
      await Promise.resolve();
    });

    // play() 실패가 playback-error로 반영되어야 한다.
    expect(result.current.webcamDetail.phase).toBe("playback-error");
  });

  it("resumePlayback() playing 이벤트로 playback-error에서 복구된다", async () => {
    // 초기 자동재생에서 실패하여 playback-error 상태로 만든다.
    let shouldReject = true;
    const playSpy = vi.fn().mockImplementation(() => {
      if (shouldReject) {
        return Promise.reject(
          Object.assign(new Error("autoplay blocked"), { name: "NotAllowedError" }),
        );
      }
      return Promise.resolve();
    });

    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      value: playSpy,
      configurable: true,
      writable: true,
    });

    const { result, videoEl } = await setupLiveController();

    // 초기 자동재생 실패 → playback-error 상태
    expect(result.current.webcamDetail.phase).toBe("playback-error");

    // 이제 play()가 성공하도록 전환하고 resumePlayback 호출
    shouldReject = false;

    await act(async () => {
      result.current.resumePlayback();
      await Promise.resolve();
      // playing 이벤트가 onPlaybackStart 경로로 playback-error를 해제한다.
      videoEl.dispatchEvent(new Event("playing"));
      await Promise.resolve();
    });

    // playback-error가 해제되어 live 상태로 복구되어야 한다.
    expect(result.current.webcamDetail.phase).toBe("live");
  });

  it("resumePlayback() 성공만으로 playback-error에서 복구된다", async () => {
    let shouldReject = true;
    const playSpy = vi.fn().mockImplementation(() => {
      if (shouldReject) {
        return Promise.reject(
          Object.assign(new Error("autoplay blocked"), { name: "NotAllowedError" }),
        );
      }
      return Promise.resolve();
    });

    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      value: playSpy,
      configurable: true,
      writable: true,
    });

    const { result } = await setupLiveController();

    expect(result.current.webcamDetail.phase).toBe("playback-error");

    shouldReject = false;

    await act(async () => {
      result.current.resumePlayback();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.webcamDetail.phase).toBe("live");
  });
});
