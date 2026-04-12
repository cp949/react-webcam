/**
 * useWebcamController의 상태 전환과 union 계약을 검증하는 테스트 파일이다.
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
// useWebcamController의 webcamDetail 전환
// ---------------------------------------------------------------------------

describe("useWebcamController – webcamDetail 전환", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("초기 상태는 idle이다", () => {
    const { result } = renderHook(() => useWebcamController());
    expect(result.current.webcamDetail.phase).toBe("idle");
  });

  it("stream 취득 성공 시 최종 상태는 live이고 mediaStream이 담긴다", async () => {
    const fakeStream = createFakeMediaStream();
    mockGetUserMedia(fakeStream);

    const { result } = renderHook(() => useWebcamController());

    attachController(result);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.webcamDetail).toMatchObject({ phase: "live", mediaStream: fakeStream });
  });

  it("getUserMedia 대기 중에는 requesting 상태다", async () => {
    // never-resolving promise로 requesting 상태를 고정한다
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: vi.fn().mockImplementation(() => new Promise(() => {})) },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useWebcamController());

    attachController(result);

    // constraints 계산(100ms debounce)이 끝날 만큼 진행한다
    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });

    expect(result.current.webcamDetail.phase).toBe("requesting");
  });

  it("NotAllowedError → phase: denied, errorCode: permission-denied", async () => {
    const err = Object.assign(new Error("denied"), { name: "NotAllowedError" });
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: vi.fn().mockRejectedValue(err) },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useWebcamController());
    attachController(result);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.webcamDetail).toMatchObject({
      phase: "denied",
      errorCode: "permission-denied",
    });
  });

  it("NotFoundError → phase: unavailable, errorCode: device-not-found", async () => {
    const err = Object.assign(new Error("not found"), { name: "NotFoundError" });
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: vi.fn().mockRejectedValue(err) },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useWebcamController());
    attachController(result);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.webcamDetail).toMatchObject({
      phase: "unavailable",
      errorCode: "device-not-found",
    });
  });

  it("NotReadableError → phase: unavailable, errorCode: device-in-use", async () => {
    const err = Object.assign(new Error("in use"), { name: "NotReadableError" });
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: vi.fn().mockRejectedValue(err) },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useWebcamController());
    attachController(result);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.webcamDetail).toMatchObject({
      phase: "unavailable",
      errorCode: "device-in-use",
    });
  });

  it("navigator.mediaDevices 미지원 → phase: unsupported, errorCode: unsupported-browser", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useWebcamController());
    attachController(result);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.webcamDetail).toMatchObject({
      phase: "unsupported",
      errorCode: "unsupported-browser",
    });
  });
});

// ---------------------------------------------------------------------------
// WebcamDetail 구별 유니온 계약
// ---------------------------------------------------------------------------

describe("WebcamDetail union 계약", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("idle 상태에는 mediaStream과 errorCode가 없다", () => {
    const { result } = renderHook(() => useWebcamController());
    const state = result.current.webcamDetail;
    expect(state.phase).toBe("idle");
    // idle variant에는 mediaStream/errorCode 필드가 없다 (union 계약)
    expect("mediaStream" in state).toBe(false);
    expect("errorCode" in state).toBe(false);
  });

  it("live 상태에서 status 분기 시 mediaStream이 타입 안전하게 존재한다", async () => {
    const fakeStream = createFakeMediaStream();
    mockGetUserMedia(fakeStream);
    const { result } = renderHook(() => useWebcamController());
    attachController(result);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    const state = result.current.webcamDetail;
    expect(state.phase).toBe("live");
    if (state.phase === "live") {
      // live 분기 내에서 mediaStream은 반드시 MediaStream 타입이다
      expect(state.mediaStream).toBe(fakeStream);
    }
  });

  it("denied 상태에서 status 분기 시 errorCode가 타입 안전하게 존재한다", async () => {
    const err = Object.assign(new Error("not allowed"), { name: "NotAllowedError" });
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: vi.fn().mockRejectedValue(err) },
      writable: true,
      configurable: true,
    });
    const { result } = renderHook(() => useWebcamController());
    attachController(result);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    const state = result.current.webcamDetail;
    expect(state.phase).toBe("denied");
    if (state.phase === "denied") {
      // denied 분기 내에서 errorCode는 반드시 WebcamErrorCode 타입이다
      expect(state.errorCode).toBe("permission-denied");
      expect(state.error).toBeInstanceOf(Error);
    }
  });
});

// ---------------------------------------------------------------------------
// onStateChange 호출 순서와 payload 계약
// ---------------------------------------------------------------------------

describe("onStateChange", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("옵션 변경 시 idle로 튀지 않고 live → requesting → live 순서로 다시 전환된다", async () => {
    type State = import("../src/webcam-types.js").WebcamDetail;
    const firstStream = createFakeMediaStream();
    const secondStream = createFakeMediaStream();
    const getUserMedia = vi
      .fn()
      .mockResolvedValueOnce(firstStream)
      .mockResolvedValueOnce(secondStream);

    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia },
      writable: true,
      configurable: true,
    });

    const onStateChange = vi.fn((s: State) => s);
    const { rerender } = render(
      <Webcam
        webcamOptions={{ audioEnabled: false, facingMode: "user" }}
        onStateChange={onStateChange}
      />,
    );

    await advanceToStreamLoad();

    rerender(
      <Webcam
        webcamOptions={{ audioEnabled: false, facingMode: "environment" }}
        onStateChange={onStateChange}
      />,
    );

    await advanceToStreamLoad();

    const statuses = onStateChange.mock.calls.map(([s]) => s.phase);
    const liveIndices = statuses
      .map((status, index) => (status === "live" ? index : -1))
      .filter((index) => index >= 0);

    expect(liveIndices).toHaveLength(2);
    expect(statuses.slice(liveIndices[0], liveIndices[1] + 1)).toEqual([
      "live",
      "requesting",
      "live",
    ]);
  });

  it("성공 흐름에서 requesting → live 순으로 호출된다", async () => {
    type State = import("../src/webcam-types.js").WebcamDetail;
    const stream = createFakeMediaStream();
    mockGetUserMedia(stream);
    const onStateChange = vi.fn((s: State) => s);

    render(<Webcam webcamOptions={{ audioEnabled: false }} onStateChange={onStateChange} />);

    await advanceToStreamLoad();

    const statuses = onStateChange.mock.calls.map(([s]) => s.phase);
    expect(statuses).toContain("requesting");
    expect(statuses).toContain("live");

    const lastState = onStateChange.mock.lastCall?.[0];
    expect(lastState).toMatchObject({ phase: "live", mediaStream: stream });
  });

  it("권한 거부 시 denied 상태를 전달한다", async () => {
    type State = import("../src/webcam-types.js").WebcamDetail;
    vi.spyOn(navigator.mediaDevices, "getUserMedia").mockRejectedValue(
      Object.assign(new Error("NotAllowedError"), { name: "NotAllowedError" }),
    );
    const onStateChange = vi.fn((s: State) => s);

    render(<Webcam webcamOptions={{ audioEnabled: false }} onStateChange={onStateChange} />);

    await advanceToStreamLoad();

    const statuses = onStateChange.mock.calls.map(([s]) => s.phase);
    expect(statuses).toContain("denied");

    const deniedState = onStateChange.mock.calls.find(([s]) => s.phase === "denied")?.[0];
    expect(deniedState).toMatchObject({ phase: "denied", errorCode: "permission-denied" });
  });

  it("비-Error 예외도 Error로 정규화해서 전달한다", async () => {
    type State = import("../src/webcam-types.js").WebcamDetail;
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: vi.fn().mockRejectedValue("camera exploded") },
      writable: true,
      configurable: true,
    });
    const onStateChange = vi.fn((s: State) => s);

    render(<Webcam webcamOptions={{ audioEnabled: false }} onStateChange={onStateChange} />);

    await advanceToStreamLoad();

    const errorState = onStateChange.mock.calls.find(([s]) => s.phase === "error")?.[0];
    expect(errorState).toBeDefined();
    expect(errorState?.phase).toBe("error");
    if (errorState?.phase !== "error") {
      throw new Error("expected error state");
    }
    expect(errorState.error).toBeInstanceOf(Error);
    expect(errorState.error.message).toContain("camera exploded");
  });
});

// ---------------------------------------------------------------------------
// pause/resume은 WebcamPhase를 오염시키지 않는다
// ---------------------------------------------------------------------------

describe("pause/resume은 WebcamPhase를 오염시키지 않는다", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  /**
   * live 상태까지 진행하는 공통 헬퍼.
   */
  async function setupLiveController() {
    const fakeStream = createFakeMediaStream();
    mockGetUserMedia(fakeStream);

    const { result } = renderHook(() => useWebcamController());

    attachController(result);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    return { result, fakeStream };
  }

  const validPhases = [
    "idle",
    "requesting",
    "live",
    "playback-error",
    "denied",
    "unavailable",
    "unsupported",
    "insecure",
    "error",
  ];

  it("pausePlayback 이후 phase에 paused가 없다", async () => {
    const { result } = await setupLiveController();

    expect(result.current.webcamDetail.phase).toBe("live");

    act(() => {
      result.current.pausePlayback();
    });

    // pausePlayback은 WebcamPhase를 변경하지 않으므로 phase가 'live'를 유지해야 한다.
    expect(result.current.webcamDetail.phase).not.toBe("paused");
    expect(result.current.webcamDetail.phase).toBe("live");
  });

  it("pausePlayback/resumePlayback은 알 수 없는 phase를 생성하지 않는다", async () => {
    const { result } = await setupLiveController();

    expect(validPhases).toContain(result.current.webcamDetail.phase);

    act(() => {
      result.current.pausePlayback();
    });

    // pause 이후에도 phase는 유효한 WebcamPhase 범위 안에 있어야 한다.
    expect(validPhases).toContain(result.current.webcamDetail.phase);

    await act(async () => {
      result.current.resumePlayback();
      await Promise.resolve();
    });

    // resume 이후에도 phase는 유효한 WebcamPhase 범위 안에 있어야 한다.
    expect(validPhases).toContain(result.current.webcamDetail.phase);
  });

  it("WebcamDetail의 phase에 paused가 존재하지 않는다 (타입 계약)", async () => {
    const { result } = await setupLiveController();

    act(() => {
      result.current.pausePlayback();
    });

    const phaseAfterPause = result.current.webcamDetail.phase;

    // 'paused'는 WebcamPhase에 존재하지 않는 값이므로 validPhases에 없다.
    expect(validPhases).not.toContain("paused");
    // 실제 값은 반드시 validPhases 안에 있어야 한다.
    expect(validPhases).toContain(phaseAfterPause);
  });
});

// ---------------------------------------------------------------------------
// audio lifecycle 상태 계약
// ---------------------------------------------------------------------------

describe("audio lifecycle 상태 계약", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("audioEnabled true + audio track ended → error 상태, track-ended errorCode", async () => {
    const fakeStream = createFakeMediaStream({ includeAudio: true });
    mockGetUserMedia(fakeStream);

    const { result } = renderHook(() => useWebcamController());
    attachController(result, { audioEnabled: true });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.webcamDetail.phase).toBe("live");

    await act(async () => {
      fakeStream.fireAudioTrackEnded();
      await Promise.resolve();
    });

    expect(result.current.webcamDetail.phase).toBe("error");
    expect(result.current.webcamDetail).toMatchObject({
      errorCode: "track-ended",
    });
  });
});
