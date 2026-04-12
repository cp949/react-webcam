/**
 * useWebcamController가 외부에 노출하는 상태와 DOM 연동 surface를 검증하는 테스트 파일이다.
 */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useWebcamController } from "../src/hooks/useWebcamController.js";
import { buildMediaStreamConstraints } from "../src/utils/build-media-stream-constraints.js";
import { createFakeMediaStream, mockGetUserMedia } from "./test-utils.js";
import { createControllerVideoElement } from "./webcam-test-helpers.js";

// ---------------------------------------------------------------------------
// useWebcamController 공개 surface
// flipped, webcamOptions, snapshotToCanvas, deviceId, videoSize, isLoaded를 다룬다.
// ---------------------------------------------------------------------------

describe("useWebcamController – controller surface", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockGetUserMedia(createFakeMediaStream());
  });

  it("exposes flipped state that starts false", () => {
    const { result } = renderHook(() => useWebcamController());
    expect(result.current.flipped).toBe(false);
  });

  it("setFlipped updates flipped state", () => {
    const { result } = renderHook(() => useWebcamController());
    act(() => {
      result.current.setFlipped(true);
    });
    expect(result.current.flipped).toBe(true);
  });

  it("setFlipped accepts an updater function", () => {
    const { result } = renderHook(() => useWebcamController());
    act(() => {
      result.current.setFlipped((prev) => !prev);
    });
    expect(result.current.flipped).toBe(true);
  });

  it("exposes default webcamOptions with audioEnabled false", () => {
    const { result } = renderHook(() => useWebcamController());
    expect(result.current.webcamOptions.audioEnabled).toBe(false);
  });

  it("setWebcamOptions updates options", () => {
    const { result } = renderHook(() => useWebcamController());
    act(() => {
      result.current.setWebcamOptions({ audioEnabled: true });
    });
    expect(result.current.webcamOptions.audioEnabled).toBe(true);
  });

  it("setWebcamOptions accepts an updater function", () => {
    const { result } = renderHook(() => useWebcamController());
    act(() => {
      result.current.setWebcamOptions((prev) => ({ ...prev, audioEnabled: true }));
    });
    expect(result.current.webcamOptions.audioEnabled).toBe(true);
  });

  it("snapshotToCanvas returns null when no video element is set", () => {
    const { result } = renderHook(() => useWebcamController());
    expect(result.current.snapshotToCanvas()).toBeNull();
  });

  it("snapshotToCanvas returns a canvas element when video has valid dimensions", () => {
    const { result } = renderHook(() => useWebcamController());

    const videoEl = createControllerVideoElement({ width: 640, height: 480 });

    act(() => {
      result.current.setVideoElement(videoEl);
    });

    const canvas = document.createElement("canvas");
    const mockCtx = {
      setTransform: vi.fn(),
      imageSmoothingEnabled: true,
      drawImage: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
    };
    vi.spyOn(canvas, "getContext").mockReturnValue(mockCtx as unknown as CanvasRenderingContext2D);

    const output = result.current.snapshotToCanvas({ canvas });
    expect(output).toBe(canvas);
    expect(canvas.width).toBe(640);
    expect(canvas.height).toBe(480);
    expect(mockCtx.drawImage).toHaveBeenCalledWith(videoEl, 0, 0, 640, 480);
  });

  it("isLoaded is false initially and becomes true after stream is acquired", async () => {
    const fakeStream = createFakeMediaStream();
    mockGetUserMedia(fakeStream);
    const { result } = renderHook(() => useWebcamController());

    expect(result.current.isLoaded).toBe(false);

    const videoEl = document.createElement("video");
    act(() => {
      result.current.setVideoElement(videoEl);
      result.current.setWebcamOptions({ audioEnabled: false });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.isLoaded).toBe(false);

    Object.defineProperty(videoEl, "videoWidth", { value: 1280, configurable: true });
    Object.defineProperty(videoEl, "videoHeight", { value: 720, configurable: true });

    await act(async () => {
      videoEl.dispatchEvent(new Event("loadedmetadata"));
      await Promise.resolve();
    });

    expect(result.current.isLoaded).toBe(true);
  });

  it("getPlayingVideoDeviceId returns undefined when no stream is loaded", () => {
    const { result } = renderHook(() => useWebcamController());
    expect(result.current.getPlayingVideoDeviceId()).toBeUndefined();
  });

  it("getPlayingVideoDeviceId returns deviceId from the active video track", async () => {
    const { result } = renderHook(() => useWebcamController());

    const videoEl = document.createElement("video");
    act(() => {
      result.current.setVideoElement(videoEl);
      result.current.setWebcamOptions({ audioEnabled: false });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.getPlayingVideoDeviceId()).toBe("fake-device-id");
  });

  it("getPlayingAudioDeviceId returns deviceId from the active audio track", async () => {
    mockGetUserMedia(createFakeMediaStream({ includeAudio: true }));

    const { result } = renderHook(() => useWebcamController());

    const videoEl = document.createElement("video");
    act(() => {
      result.current.setVideoElement(videoEl);
      result.current.setWebcamOptions({ audioEnabled: true });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.getPlayingAudioDeviceId()).toBe("fake-audio-device-id");
  });

  it("captures videoSize immediately when the attached video already has metadata", async () => {
    const { result } = renderHook(() => useWebcamController());

    const videoEl = createControllerVideoElement({ width: 1280, height: 720 });

    act(() => {
      result.current.setVideoElement(videoEl);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.videoSize).toEqual({ width: 1280, height: 720 });
  });
});

// ---------------------------------------------------------------------------
// useWebcamController DOM 이벤트 흐름
// videoSize 동기화, debug 이벤트, ResizeObserver 기반 제약 재계산을 본다.
// ---------------------------------------------------------------------------

describe("useWebcamController – DOM event flows", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockGetUserMedia(createFakeMediaStream());
  });

  it("captures videoSize immediately and stays in sync when loadedmetadata fires later", async () => {
    const { result } = renderHook(() => useWebcamController());

    const videoEl = createControllerVideoElement({ width: 1280, height: 720 });

    act(() => {
      result.current.setVideoElement(videoEl);
    });

    expect(result.current.videoSize).toEqual({ width: 1280, height: 720 });

    await act(async () => {
      videoEl.dispatchEvent(new Event("loadedmetadata"));
      await Promise.resolve();
    });

    expect(result.current.videoSize).toEqual({ width: 1280, height: 720 });
  });

  it("loadedmetadata event also updates webcamDetail.videoSize", async () => {
    const { result } = renderHook(() => useWebcamController());

    const videoEl = createControllerVideoElement({ width: 1920, height: 1080 });

    act(() => {
      result.current.setVideoElement(videoEl);
    });

    await act(async () => {
      videoEl.dispatchEvent(new Event("loadedmetadata"));
      await Promise.resolve();
    });

    expect(result.current.webcamDetail.videoSize).toEqual({ width: 1920, height: 1080 });
  });

  it("videoSize 공개 값은 항상 webcamDetail.videoSize와 동일하다", async () => {
    const { result } = renderHook(() => useWebcamController());

    const videoEl = createControllerVideoElement({ width: 800, height: 600 });

    act(() => {
      result.current.setVideoElement(videoEl);
    });

    await act(async () => {
      videoEl.dispatchEvent(new Event("loadedmetadata"));
      await Promise.resolve();
    });

    expect(result.current.videoSize).toEqual(result.current.webcamDetail.videoSize);

    act(() => {
      result.current.setVideoElement(undefined);
    });

    expect(result.current.videoSize).toBeUndefined();
    expect(result.current.webcamDetail.videoSize).toBeUndefined();
  });

  it("hook exposes setDebugVideoEvents to toggle debug listener registration", async () => {
    const { result } = renderHook(() => useWebcamController());

    // 컨트롤러에 setDebugVideoEvents 함수가 노출되어야 한다.
    expect(typeof (result.current as any).setDebugVideoEvents).toBe("function");
  });

  it("debug event listeners are registered on videoElement when debug mode is enabled", async () => {
    const { result } = renderHook(() => useWebcamController());

    const videoEl = document.createElement("video");
    const addEventListenerSpy = vi.spyOn(videoEl, "addEventListener");

    act(() => {
      result.current.setVideoElement(videoEl);
      (result.current as any).setDebugVideoEvents(true);
    });

    await act(async () => {
      await Promise.resolve();
    });

    // 디버그 리스너는 여러 이벤트를 등록하므로 핵심 이벤트 몇 가지만 확인한다.
    const registeredEvents = addEventListenerSpy.mock.calls.map(([event]) => event);
    expect(registeredEvents).toContain("loadstart");
    expect(registeredEvents).toContain("canplay");
    expect(registeredEvents).toContain("error");
  });

  it("debug event listeners are NOT registered when debug mode is off (default)", async () => {
    const { result } = renderHook(() => useWebcamController());

    const videoEl = document.createElement("video");
    const addEventListenerSpy = vi.spyOn(videoEl, "addEventListener");

    act(() => {
      result.current.setVideoElement(videoEl);
    });

    await act(async () => {
      await Promise.resolve();
    });

    const registeredEvents = addEventListenerSpy.mock.calls.map(([event]) => event);
    // 일반 모드에서는 디버그 전용 이벤트가 등록되지 않아야 한다.
    expect(registeredEvents).not.toContain("loadstart");
    expect(registeredEvents).not.toContain("canplay");
  });

  it("ResizeObserver callback triggers constraint recomputation", async () => {
    let capturedRoCallback: ResizeObserverCallback | undefined;
    const mockRoInstance = { observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() };
    // `new ResizeObserver(cb)`가 동작하도록 화살표 함수 대신 일반 함수를 쓴다.
    vi.spyOn(globalThis, "ResizeObserver").mockImplementation(function MockRO(
      this: unknown,
      cb: ResizeObserverCallback,
    ) {
      capturedRoCallback = cb;
      return mockRoInstance;
    } as unknown as typeof ResizeObserver);

    const { result } = renderHook(() => useWebcamController());

    const videoEl = document.createElement("video");
    act(() => {
      result.current.setVideoElement(videoEl);
      result.current.setWebcamOptions({ audioEnabled: false, size: "element-size" });
    });

    // happy-dom의 기본 getBoundingClientRect()는 0,0을 돌려주므로 초기 elementSize도 0,0이다.
    // 100ms debounce를 비워 제약 계산 effect가 안정되게 만든다.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    // 다음 단계 전에 ResizeObserver callback이 제대로 잡혔는지 확인한다.
    expect(capturedRoCallback).toBeDefined();

    // callback 실행 전에 새 요소 크기를 주입해 resize 상황을 흉내 낸다.
    vi.spyOn(videoEl, "getBoundingClientRect").mockReturnValue({
      width: 640,
      height: 480,
      top: 0,
      left: 0,
      right: 640,
      bottom: 480,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    // ResizeObserver callback을 실행하면 setElementSize({640, 480})를 거쳐 다시 렌더링된다.
    await act(async () => {
      capturedRoCallback!([{} as ResizeObserverEntry], mockRoInstance as unknown as ResizeObserver);
    });

    // elementSize 변경 뒤 제약 계산 effect가 건 100ms debounce를 다시 비운다.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    // 이제 constraints가 640x480 크기를 반영해야 한다.
    const video = result.current.constraints?.video as MediaTrackConstraints | undefined;
    expect(video?.width).toEqual(expect.objectContaining({ ideal: 640 }));
    expect(video?.height).toEqual(expect.objectContaining({ ideal: 480 }));
  });
});

// ---------------------------------------------------------------------------
// useWebcamController의 제어/비제어 surface
// setFlipped/setWebcamOptions는 비제어 모드 전용 연산이다.
// Webcam 컴포넌트에서 제어 prop이 있을 때 이 setter들은 무시돼야 한다.
// 여기서는 hook 자체의 setter surface(비제어 동작)를 확인한다.
// ---------------------------------------------------------------------------

describe("useWebcamController controlled/uncontrolled surface", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockGetUserMedia(createFakeMediaStream());
  });

  it("setFlipped is an available function on the hook surface (uncontrolled mode)", () => {
    // setFlipped가 hook surface에 존재하는지 확인한다.
    // 이 setter는 비제어 모드 전용으로 동작한다.
    const { result } = renderHook(() => useWebcamController());
    expect(typeof result.current.setFlipped).toBe("function");
  });

  it("setWebcamOptions is an available function on the hook surface (uncontrolled mode)", () => {
    // setWebcamOptions가 hook surface에 존재하는지 확인한다.
    // 이 setter는 비제어 모드 전용으로 동작한다.
    const { result } = renderHook(() => useWebcamController());
    expect(typeof result.current.setWebcamOptions).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// buildMediaStreamConstraints 제약 생성 계약
// ---------------------------------------------------------------------------

describe("buildMediaStreamConstraints", () => {
  it("maxFrameRate만 지정되면 ideal이 아니라 max 제약만 사용한다", () => {
    const constraints = buildMediaStreamConstraints(
      { audioEnabled: false, maxFrameRate: 15 },
      { width: 1280, height: 720 },
    );

    expect(constraints.video).toMatchObject({
      frameRate: { max: 15 },
    });
    expect((constraints.video as MediaTrackConstraints).frameRate).not.toMatchObject({
      ideal: 15,
    });
  });

  it("deviceId가 있으면 facingMode 제약을 제거한다", () => {
    const constraints = buildMediaStreamConstraints(
      { audioEnabled: false, deviceId: "cam-001", facingMode: "user" },
      { width: 640, height: 480 },
    );
    // deviceId가 있으면 facingMode를 제거해야 한다
    expect((constraints.video as MediaTrackConstraints).facingMode).toBeUndefined();
  });

  it("deviceSelectionStrategy: exact 시 deviceId를 exact 제약으로 빌드한다", () => {
    const constraints = buildMediaStreamConstraints(
      { audioEnabled: false, deviceId: "cam-001", deviceSelectionStrategy: "exact" } as any,
      { width: 0, height: 0 },
    );
    expect((constraints.video as MediaTrackConstraints).deviceId).toEqual({ exact: "cam-001" });
  });

  it("deviceSelectionStrategy: ideal 시 deviceId를 ideal 제약으로 빌드한다", () => {
    const constraints = buildMediaStreamConstraints(
      { audioEnabled: false, deviceId: "cam-001", deviceSelectionStrategy: "ideal" } as any,
      { width: 0, height: 0 },
    );
    expect((constraints.video as MediaTrackConstraints).deviceId).toEqual({ ideal: "cam-001" });
  });

  it("deviceId 없으면 facingMode를 그대로 사용한다", () => {
    const constraints = buildMediaStreamConstraints(
      { audioEnabled: false, facingMode: "user" },
      { width: 0, height: 0 },
    );
    expect((constraints.video as MediaTrackConstraints).facingMode).toEqual({ ideal: "user" });
  });
});

// ---------------------------------------------------------------------------
// pausePlayback / resumePlayback 공개 surface 확인
// ---------------------------------------------------------------------------

describe("useWebcamController – pausePlayback / resumePlayback surface", () => {
  it("useWebcamController는 pausePlayback을 노출한다", () => {
    const { result } = renderHook(() => useWebcamController());
    expect(typeof result.current.pausePlayback).toBe("function");
  });

  it("useWebcamController는 resumePlayback을 노출한다", () => {
    const { result } = renderHook(() => useWebcamController());
    expect(typeof result.current.resumePlayback).toBe("function");
  });
});
