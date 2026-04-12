/**
 * 웹캠 스트림 요청, 재시작, 트랙 종료 반응을 검증하는 생명주기 테스트 파일이다.
 */
import { act, render, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useWebcamController } from "../src/hooks/useWebcamController.js";
import { BrowserMediaDevices } from "../src/utils/media-devices.js";
import { Webcam } from "../src/Webcam.js";
import { createFakeMediaStream, mockGetUserMedia } from "./test-utils.js";
import { advanceToStreamLoad } from "./webcam-test-helpers.js";

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
// useWebcamController 스트림 생명주기
// ---------------------------------------------------------------------------

describe("useWebcamController – stream lifecycle", () => {
  let fakeStream: MediaStream;
  let getUserMediaMock: ReturnType<typeof vi.fn>;
  let stopSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    fakeStream = createFakeMediaStream();
    getUserMediaMock = mockGetUserMedia(fakeStream);
    stopSpy = vi.spyOn(BrowserMediaDevices, "stopStream");
  });

  it("requests stream when videoElement and constraints are both ready", async () => {
    const { result } = renderHook(() => useWebcamController());

    const videoEl = document.createElement("video");
    act(() => {
      result.current.setVideoElement(videoEl);
      result.current.setWebcamOptions({ audioEnabled: false });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(getUserMediaMock).toHaveBeenCalledTimes(1);
    expect(result.current.mediaStreamResult.mediaStream).toBe(fakeStream);
  });

  it("stops previous stream and requests new one when webcamOptions change", async () => {
    const fakeStream1 = createFakeMediaStream();
    const fakeStream2 = createFakeMediaStream();
    const mock = vi.fn().mockResolvedValueOnce(fakeStream1).mockResolvedValueOnce(fakeStream2);
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: mock },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useWebcamController());

    const videoEl = document.createElement("video");
    act(() => {
      result.current.setVideoElement(videoEl);
      result.current.setWebcamOptions({ audioEnabled: false, facingMode: "user" });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(mock).toHaveBeenCalledTimes(1);
    expect(result.current.mediaStreamResult.mediaStream).toBe(fakeStream1);

    act(() => {
      result.current.setWebcamOptions({ audioEnabled: false, facingMode: "environment" });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(mock).toHaveBeenCalledTimes(2);
    expect(stopSpy).toHaveBeenCalledWith(fakeStream1);
    expect(result.current.mediaStreamResult.mediaStream).toBe(fakeStream2);
  });

  it("stops active stream when hook unmounts", async () => {
    const { result, unmount } = renderHook(() => useWebcamController());

    const videoEl = document.createElement("video");
    act(() => {
      result.current.setVideoElement(videoEl);
      result.current.setWebcamOptions({ audioEnabled: false });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.mediaStreamResult.mediaStream).toBe(fakeStream);

    unmount();

    expect(stopSpy).toHaveBeenCalledWith(fakeStream);
  });

  it("does not publish stale stream when request is superseded", async () => {
    let resolveFirst!: (s: MediaStream) => void;
    const staleStream = createFakeMediaStream();
    const freshStream = createFakeMediaStream();

    const mock = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<MediaStream>((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValueOnce(freshStream);

    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: mock },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useWebcamController());

    const videoEl = document.createElement("video");
    act(() => {
      result.current.setVideoElement(videoEl);
      result.current.setWebcamOptions({ audioEnabled: false, facingMode: "user" });
    });

    // 첫 번째 요청이 실제로 시작되도록 타이머를 진행한다.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(mock).toHaveBeenCalledTimes(1);

    // 첫 번째 요청이 끝나기 전에 옵션을 바꿔 새 요청을 만든다.
    act(() => {
      result.current.setWebcamOptions({ audioEnabled: false, facingMode: "environment" });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    // 두 번째 요청이 시작되었는지 확인한다.
    expect(mock).toHaveBeenCalledTimes(2);

    // 이제 오래된 첫 번째 요청을 뒤늦게 resolve한다.
    await act(async () => {
      resolveFirst(staleStream);
      await Promise.resolve();
    });

    // 오래된 스트림은 publish되지 않고 즉시 정리되어야 한다.
    expect(result.current.mediaStreamResult.mediaStream).toBe(freshStream);
    expect(stopSpy).toHaveBeenCalledWith(staleStream);
  });

  it("returns to idle when pending request is abandoned because video element is removed", async () => {
    let resolveRequest!: (stream: MediaStream) => void;
    const lateStream = createFakeMediaStream();

    const mock = vi.fn().mockImplementation(
      () =>
        new Promise<MediaStream>((resolve) => {
          resolveRequest = resolve;
        }),
    );

    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: mock },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useWebcamController());

    const videoEl = document.createElement("video");
    act(() => {
      result.current.setVideoElement(videoEl);
      result.current.setWebcamOptions({ audioEnabled: false });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.webcamDetail.phase).toBe("requesting");

    act(() => {
      result.current.setVideoElement(undefined);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.webcamDetail.phase).toBe("idle");
    expect(result.current.mediaStreamResult).toEqual({});

    await act(async () => {
      resolveRequest(lateStream);
      await Promise.resolve();
    });

    expect(result.current.webcamDetail.phase).toBe("idle");
    expect(stopSpy).toHaveBeenCalledWith(lateStream);
  });
});

// ---------------------------------------------------------------------------
// 스트림 재시작 상태 전이 순서
// ---------------------------------------------------------------------------

describe("stream restart state transitions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("does not emit idle during restart when facingMode changes", async () => {
    const stream1 = createFakeMediaStream();
    const stream2 = createFakeMediaStream();
    const getUserMediaMock = vi.fn().mockResolvedValueOnce(stream1).mockResolvedValueOnce(stream2);
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: getUserMediaMock },
      writable: true,
      configurable: true,
    });

    const statuses: string[] = [];
    const onStateChange = vi.fn((s: { phase: string }) => {
      statuses.push(s.phase);
    });

    const { rerender } = render(
      <Webcam
        webcamOptions={{ audioEnabled: false, facingMode: "user" }}
        onStateChange={onStateChange}
      />,
    );

    // 첫 번째 스트림 live까지 진행
    await advanceToStreamLoad();

    const afterFirstLiveIdx = statuses.lastIndexOf("live");
    expect(afterFirstLiveIdx).toBeGreaterThanOrEqual(0);

    // facingMode 변경으로 재시작
    rerender(
      <Webcam
        webcamOptions={{ audioEnabled: false, facingMode: "environment" }}
        onStateChange={onStateChange}
      />,
    );

    await advanceToStreamLoad();

    // live 이후 두 번째 requesting 이전에 idle이 끼어들면 안 된다
    const afterFirstLive = statuses.slice(afterFirstLiveIdx + 1);
    const idleIdx = afterFirstLive.indexOf("idle");
    const requestingIdx = afterFirstLive.indexOf("requesting");

    // idle이 없거나, requesting보다 뒤에 나와야 한다
    if (idleIdx !== -1 && requestingIdx !== -1) {
      expect(idleIdx).toBeGreaterThan(requestingIdx);
    } else {
      // idle 자체가 없으면 조건 충족
      expect(idleIdx).toBe(-1);
    }

    // 두 번째 스트림이 live 상태로 끝나야 한다
    const lastStatus = statuses[statuses.length - 1];
    expect(lastStatus).toBe("live");
  });
});

// ---------------------------------------------------------------------------
// 트랙 생명주기 회귀 테스트
// ---------------------------------------------------------------------------

describe("track lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("track ended event transitions state away from live", async () => {
    const fakeStream = createFakeMediaStream();
    mockGetUserMedia(fakeStream);

    const onStateChange = vi.fn();
    render(<Webcam webcamOptions={{ audioEnabled: false }} onStateChange={onStateChange} />);

    // 먼저 웹캠을 live 상태까지 올린다.
    await advanceToStreamLoad();

    const liveCalls = onStateChange.mock.calls.filter(([s]) => s.phase === "live");
    expect(liveCalls.length).toBeGreaterThanOrEqual(1);

    const liveCallCount = onStateChange.mock.calls.length;

    // 비디오 트랙에 ended 이벤트를 발생시켜 카메라 분리 또는 권한 철회 상황을 흉내 낸다.
    await act(async () => {
      fakeStream.fireTrackEnded();
      await Promise.resolve();
    });

    // 구현이 ended 이벤트에 반응해 onStateChange를 한 번 더 호출해야 하며,
    // 그 최종 상태는 더 이상 live가 아니어야 한다.
    const callsAfterEnded = onStateChange.mock.calls.slice(liveCallCount);
    expect(callsAfterEnded.length).toBeGreaterThan(0);

    const lastStatus = onStateChange.mock.lastCall?.[0]?.phase;
    expect(lastStatus).not.toBe("live");
  });
});

// ---------------------------------------------------------------------------
// 오디오 트랙 생명주기
// ---------------------------------------------------------------------------

describe("audio track lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("audio track ended 이벤트가 error 상태로 전환된다", async () => {
    const fakeStream = createFakeMediaStream({ includeAudio: true });
    mockGetUserMedia(fakeStream);

    const onStateChange = vi.fn();
    render(<Webcam webcamOptions={{ audioEnabled: true }} onStateChange={onStateChange} />);

    await advanceToStreamLoad();

    const liveCalls = onStateChange.mock.calls.filter(([s]) => s.phase === "live");
    expect(liveCalls.length).toBeGreaterThanOrEqual(1);

    const liveCallCount = onStateChange.mock.calls.length;

    // audio track에 ended 이벤트를 발생시킨다
    await act(async () => {
      fakeStream.fireAudioTrackEnded();
      await Promise.resolve();
    });

    const callsAfterEnded = onStateChange.mock.calls.slice(liveCallCount);
    expect(callsAfterEnded.length).toBeGreaterThan(0);

    const lastStatus = onStateChange.mock.lastCall?.[0]?.phase;
    // audio track 종료도 live 상태를 벗어나야 한다
    expect(lastStatus).not.toBe("live");
  });

  it("audio-only 종료와 video-only 종료를 구분할 수 있다", async () => {
    // audio track만 종료: errorCode가 track-ended 이고 error.message에 audio가 포함
    const audioOnlyStream = createFakeMediaStream({ includeAudio: true });
    mockGetUserMedia(audioOnlyStream);

    const onStateChange = vi.fn();
    render(<Webcam webcamOptions={{ audioEnabled: true }} onStateChange={onStateChange} />);

    await advanceToStreamLoad();

    await act(async () => {
      audioOnlyStream.fireAudioTrackEnded();
      await Promise.resolve();
    });

    const lastState = onStateChange.mock.lastCall?.[0];
    expect(lastState?.phase).toBe("error");
    expect(lastState?.errorCode).toBe("track-ended");
    // audio track 종료임을 구분 가능해야 한다 (error.message에 audio 관련 내용 포함)
    expect(lastState?.error?.message).toMatch(/audio/i);
  });
});

// ---------------------------------------------------------------------------
// pause 상태에서의 생명주기 경계
// ---------------------------------------------------------------------------

describe("pause 상태에서의 생명주기 경계", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("pause 상태에서 device 변경 시 재시작 계약이 유지된다", async () => {
    const stream1 = createFakeMediaStream();
    const stream2 = createFakeMediaStream();
    const getUserMediaMock = vi.fn().mockResolvedValueOnce(stream1).mockResolvedValueOnce(stream2);
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: getUserMediaMock },
      writable: true,
      configurable: true,
    });

    // video.pause()를 감시하기 위해 spy를 준비한다.
    const pauseSpy = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});

    const { result } = renderHook(() => useWebcamController());
    const videoEl = document.createElement("video");

    // live 상태까지 진행한다.
    act(() => {
      result.current.setVideoElement(videoEl);
      result.current.setWebcamOptions({ audioEnabled: false, facingMode: "user" });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.webcamDetail.phase).toBe("live");
    expect(result.current.mediaStreamResult.mediaStream).toBe(stream1);

    // pausePlayback() 호출 — video.pause()만 호출되어야 한다.
    act(() => {
      result.current.pausePlayback();
    });

    expect(pauseSpy).toHaveBeenCalledTimes(1);
    // pause 후에도 phase는 live를 유지해야 한다.
    expect(result.current.webcamDetail.phase).toBe("live");

    // pause 상태에서 webcamOptions를 변경하면 스트림 재요청이 일어나야 한다.
    act(() => {
      result.current.setWebcamOptions({ audioEnabled: false, facingMode: "environment" });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    // 두 번째 스트림 요청이 완료되어 live 상태가 되어야 한다.
    expect(getUserMediaMock).toHaveBeenCalledTimes(2);
    expect(result.current.webcamDetail.phase).toBe("live");
    expect(result.current.mediaStreamResult.mediaStream).toBe(stream2);
  });

  it("track ended 이벤트 발생 시 live 상태에서 벗어난다", async () => {
    const fakeStream = createFakeMediaStream();
    mockGetUserMedia(fakeStream);

    // video.pause()를 감시하기 위해 spy를 준비한다.
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});

    const onStateChange = vi.fn();
    render(<Webcam webcamOptions={{ audioEnabled: false }} onStateChange={onStateChange} />);

    // live 상태까지 진행한다.
    await advanceToStreamLoad();

    const liveCalls = onStateChange.mock.calls.filter(([s]) => s.phase === "live");
    expect(liveCalls.length).toBeGreaterThanOrEqual(1);

    // pausePlayback은 Webcam 컴포넌트의 handle을 통해 호출할 수 없으므로
    // 비디오 요소에 직접 pause()를 호출한 상황과 동일한 시나리오로 검증한다.
    // track ended 이벤트가 pause 상태에서 발생하면 error phase로 전환되어야 한다.
    // (useWebcamStreamLifecycle은 ctx.canceled 여부만 보므로 pause 상태는 영향을 주지 않는다.)

    const liveCallCount = onStateChange.mock.calls.length;

    // 비디오 트랙에 ended 이벤트를 발생시킨다 (카메라 분리/권한 회수 시나리오).
    await act(async () => {
      fakeStream.fireTrackEnded();
      await Promise.resolve();
    });

    // ended 이벤트에 반응해 onStateChange가 추가로 호출되어야 한다.
    const callsAfterEnded = onStateChange.mock.calls.slice(liveCallCount);
    expect(callsAfterEnded.length).toBeGreaterThan(0);

    // 최종 상태는 live가 아니어야 한다 (error 또는 그 외 상태).
    const lastStatus = onStateChange.mock.lastCall?.[0]?.phase;
    expect(lastStatus).not.toBe("live");
  });
});

// ---------------------------------------------------------------------------
// 장치 전환 생명주기
// ---------------------------------------------------------------------------

describe("device switch lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("webcamOptions deviceId 변경 시 이전 stream이 정리된다", async () => {
    const stream1 = createFakeMediaStream();
    const stream2 = createFakeMediaStream();
    const getUserMediaMock = vi.fn().mockResolvedValueOnce(stream1).mockResolvedValueOnce(stream2);

    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: getUserMediaMock },
      writable: true,
      configurable: true,
    });

    const stopSpy = vi.spyOn(BrowserMediaDevices, "stopStream");

    const { result } = renderHook(() => useWebcamController());
    const videoEl = document.createElement("video");

    act(() => {
      result.current.setVideoElement(videoEl);
      result.current.setWebcamOptions({ audioEnabled: false, deviceId: "cam-001" });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.mediaStreamResult.mediaStream).toBe(stream1);

    act(() => {
      result.current.setWebcamOptions({ audioEnabled: false, deviceId: "cam-002" });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(stopSpy).toHaveBeenCalledWith(stream1);
    expect(result.current.mediaStreamResult.mediaStream).toBe(stream2);
  });

  it("deviceId cam-a → cam-b → cam-a rapid switch 시 stale 요청이 늦게 resolve되어도 마지막 요청만 publish된다", async () => {
    let resolveFirst!: (s: MediaStream) => void;
    let resolveSecond!: (s: MediaStream) => void;

    const streamA1 = createFakeMediaStream(); // 첫 번째 cam-a 요청 (stale)
    const streamB = createFakeMediaStream(); // cam-b 요청 (stale)
    const streamA2 = createFakeMediaStream(); // 두 번째 cam-a 요청 (최종)

    const mock = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<MediaStream>((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise<MediaStream>((resolve) => {
            resolveSecond = resolve;
          }),
      )
      .mockResolvedValueOnce(streamA2);

    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: mock },
      writable: true,
      configurable: true,
    });

    const stopSpy = vi.spyOn(BrowserMediaDevices, "stopStream");

    const { result } = renderHook(() => useWebcamController());
    const videoEl = document.createElement("video");

    // 첫 번째 요청: cam-a (pending)
    act(() => {
      result.current.setVideoElement(videoEl);
      result.current.setWebcamOptions({ audioEnabled: false, deviceId: "cam-a" });
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(mock).toHaveBeenCalledTimes(1);

    // 두 번째 요청: cam-b (첫 번째 요청 취소, pending)
    act(() => {
      result.current.setWebcamOptions({ audioEnabled: false, deviceId: "cam-b" });
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(mock).toHaveBeenCalledTimes(2);

    // 세 번째 요청: cam-a (두 번째 요청 취소, 즉시 resolve)
    act(() => {
      result.current.setWebcamOptions({ audioEnabled: false, deviceId: "cam-a" });
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(mock).toHaveBeenCalledTimes(3);

    // 세 번째 요청이 이미 resolve되어 streamA2가 활성 상태여야 한다.
    expect(result.current.mediaStreamResult.mediaStream).toBe(streamA2);

    // 오래된 요청들을 뒤늦게 resolve한다 — stale이므로 상태에 영향을 줘서는 안 된다.
    await act(async () => {
      resolveFirst(streamA1);
      await Promise.resolve();
    });
    await act(async () => {
      resolveSecond(streamB);
      await Promise.resolve();
    });

    // 마지막 요청(streamA2)만 publish 상태를 유지해야 한다.
    expect(result.current.mediaStreamResult.mediaStream).toBe(streamA2);
    // stale 스트림들은 즉시 정리되어야 한다.
    expect(stopSpy).toHaveBeenCalledWith(streamA1);
    expect(stopSpy).toHaveBeenCalledWith(streamB);
  });
});
