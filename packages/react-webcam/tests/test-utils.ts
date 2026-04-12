/**
 * 테스트 전역 환경과 공용 목 객체를 준비하는 유틸 파일이다.
 */
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// ResizeObserver 목
// observeElementSize()는 비디오 요소마다 ResizeObserver를 하나씩 만든다.
// 테스트에서는 충돌만 막으면 되므로 no-op 구현으로 충분하다.
// 초기 크기 값은 getBoundingClientRect()를 통해 계속 흘러간다.
// ---------------------------------------------------------------------------
class MockResizeObserver {
  observe(_target: Element) {
    // observe() 호출 전 getBoundingClientRect()로 초기 값이 이미 발행되므로 이것만으로 충분하다.
  }

  unobserve(_target: Element) {}

  disconnect() {}
}

// 모든 테스트 전에 전역 ResizeObserver 목을 설치한다.
globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

// happy-dom은 기본적으로 isSecureContext를 false로 둔다.
// 테스트에서는 insecure-context 가드가 기본 동작을 가로막지 않도록 true로 고정한다.
// 이 가드를 직접 검증하는 테스트는 필요할 때 개별적으로 덮어쓴다.
Object.defineProperty(window, "isSecureContext", {
  value: true,
  configurable: true,
  writable: false,
});

// ---------------------------------------------------------------------------
// 가짜 MediaStream도 srcObject에 넣을 수 있도록 허용한다.
// happy-dom은 타입을 엄격히 검사하지만 테스트에서는 유연한 대입이 필요하다.
// ---------------------------------------------------------------------------

// Safari/모바일 자동 재생 감지를 위해 호출하는 play()가 기본적으로는 조용히 성공하도록 둔다.
// 자동 재생 실패를 검증하는 테스트는 각자 재정의하면 된다.
Object.defineProperty(HTMLMediaElement.prototype, "play", {
  value: () => Promise.resolve(),
  configurable: true,
  writable: true,
});

Object.defineProperty(HTMLMediaElement.prototype, "srcObject", {
  set(value: unknown) {
    (this as HTMLMediaElement & { _srcObject?: unknown })._srcObject = value;
  },
  get() {
    return (this as HTMLMediaElement & { _srcObject?: unknown })._srcObject ?? null;
  },
  configurable: true,
});

// ---------------------------------------------------------------------------
// 내부 디버그 로그로 인한 console.log 잡음을 줄인다.
// ---------------------------------------------------------------------------
vi.spyOn(console, "log").mockImplementation(() => {});

afterEach(() => {
  // 타이머와 목을 되돌리기 전에 먼저 언마운트해 cleanup이 같은 가짜 타이머 환경에서 실행되게 한다.
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
  // restoreAllMocks 이후에도 로그 억제를 유지한다.
  vi.spyOn(console, "log").mockImplementation(() => {});
});

// ---------------------------------------------------------------------------
// 헬퍼
// ---------------------------------------------------------------------------

type CreateFakeMediaStreamOptions = {
  includeAudio?: boolean;
};

/** 테스트에서 `fireTrackEnded()` 또는 `fireAudioTrackEnded()`를 호출할 수 있는 가짜 MediaStream 타입이다. */
export type FakeMediaStream = MediaStream & {
  fireTrackEnded: () => void;
  fireAudioTrackEnded: () => void;
};

/** 비디오 트랙 하나와 선택적 오디오 트랙을 가진 최소한의 가짜 MediaStream을 만든다. */
export function createFakeMediaStream(options?: CreateFakeMediaStreamOptions): FakeMediaStream {
  // 테스트에서 `ended`를 직접 발생시킬 수 있도록 비디오 트랙 리스너를 실제처럼 저장한다.
  const videoTrackListeners: Map<string, EventListenerOrEventListenerObject[]> = new Map();

  const videoTrack = {
    id: "video-track-1",
    label: "fake-camera",
    kind: "video",
    enabled: true,
    muted: false,
    readyState: "live",
    stop: vi.fn(),
    getSettings: vi.fn(() => ({ deviceId: "fake-device-id" })),
    addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => {
      if (!videoTrackListeners.has(type)) videoTrackListeners.set(type, []);
      videoTrackListeners.get(type)!.push(listener);
    },
    removeEventListener: (type: string, listener: EventListenerOrEventListenerObject) => {
      const list = videoTrackListeners.get(type) ?? [];
      const idx = list.indexOf(listener);
      if (idx !== -1) list.splice(idx, 1);
    },
    dispatchEvent: vi.fn(),
    onended: null,
    onmute: null,
    onunmute: null,
    clone: vi.fn(),
    getCapabilities: vi.fn(() => ({})),
    getConstraints: vi.fn(() => ({})),
    applyConstraints: vi.fn(() => Promise.resolve()),
  } as unknown as MediaStreamTrack;

  // 오디오 트랙도 비디오 트랙처럼 실제로 리스너를 저장하고 발행할 수 있도록 만든다.
  const audioTrackListeners: Map<string, EventListenerOrEventListenerObject[]> = new Map();

  const audioTrack = {
    id: "audio-track-1",
    label: "fake-microphone",
    kind: "audio",
    enabled: true,
    muted: false,
    readyState: "live",
    stop: vi.fn(),
    getSettings: vi.fn(() => ({ deviceId: "fake-audio-device-id" })),
    addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => {
      if (!audioTrackListeners.has(type)) audioTrackListeners.set(type, []);
      audioTrackListeners.get(type)!.push(listener);
    },
    removeEventListener: (type: string, listener: EventListenerOrEventListenerObject) => {
      const list = audioTrackListeners.get(type) ?? [];
      const idx = list.indexOf(listener);
      if (idx !== -1) list.splice(idx, 1);
    },
    dispatchEvent: vi.fn(),
    onended: null,
    onmute: null,
    onunmute: null,
    clone: vi.fn(),
    getCapabilities: vi.fn(() => ({})),
    getConstraints: vi.fn(() => ({})),
    applyConstraints: vi.fn(() => Promise.resolve()),
  } as unknown as MediaStreamTrack;

  /** 카메라 분리 상황을 흉내 내기 위해 비디오 트랙에 `ended` 이벤트를 발생시킨다. */
  function fireTrackEnded() {
    const listeners = videoTrackListeners.get("ended") ?? [];
    const event = new Event("ended");
    for (const listener of listeners) {
      if (typeof listener === "function") {
        listener(event);
      } else {
        listener.handleEvent(event);
      }
    }
  }

  /** 마이크 분리 상황을 흉내 내기 위해 오디오 트랙에 `ended` 이벤트를 발생시킨다. */
  function fireAudioTrackEnded() {
    const listeners = audioTrackListeners.get("ended") ?? [];
    const event = new Event("ended");
    for (const listener of listeners) {
      if (typeof listener === "function") {
        listener(event);
      } else {
        listener.handleEvent(event);
      }
    }
  }

  return {
    id: "fake-stream-1",
    active: true,
    getTracks: () => (options?.includeAudio ? [videoTrack, audioTrack] : [videoTrack]),
    getVideoTracks: () => [videoTrack],
    getAudioTracks: () => (options?.includeAudio ? [audioTrack] : []),
    addTrack: vi.fn(),
    removeTrack: vi.fn(),
    clone: vi.fn(),
    getTrackById: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onaddtrack: null,
    onremovetrack: null,
    onactive: null,
    oninactive: null,
    fireTrackEnded,
    fireAudioTrackEnded,
  } as unknown as FakeMediaStream;
}

/** 주어진 스트림으로 resolve되는 navigator.mediaDevices.getUserMedia 목을 설치한다. */
export function mockGetUserMedia(stream: MediaStream): ReturnType<typeof vi.fn> {
  const mock = vi.fn().mockResolvedValue(stream);
  Object.defineProperty(navigator, "mediaDevices", {
    value: { getUserMedia: mock },
    writable: true,
    configurable: true,
  });
  return mock;
}
