/**
 * useMediaDevices 공개 훅의 장치 조회, devicechange 갱신, label 상태, 오류 전달을 검증한다.
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useMediaDevices } from "../src/index.js";

/** 테스트용 MediaDeviceInfo. */
function device(kind: MediaDeviceKind, deviceId: string, label = ""): MediaDeviceInfo {
  return { kind, deviceId, label, groupId: "g", toJSON: () => ({}) } as MediaDeviceInfo;
}

/** enumerateDevices와 devicechange 구독을 흉내 낸 navigator.mediaDevices를 설치한다. */
function installMediaDevices(initial: MediaDeviceInfo[]) {
  let current = initial;
  const listeners = new Set<() => void>();
  const enumerateDevices = vi.fn(async () => current);
  const addEventListener = vi.fn((type: string, listener: () => void) => {
    if (type === "devicechange") listeners.add(listener);
  });
  const removeEventListener = vi.fn((type: string, listener: () => void) => {
    if (type === "devicechange") listeners.delete(listener);
  });
  Object.defineProperty(navigator, "mediaDevices", {
    value: { enumerateDevices, addEventListener, removeEventListener },
    writable: true,
    configurable: true,
  });
  return {
    enumerateDevices,
    removeEventListener,
    listenerCount: () => listeners.size,
    /** 장치 목록을 바꾸고 devicechange를 발생시킨다. */
    async change(next: MediaDeviceInfo[]) {
      current = next;
      await act(async () => {
        listeners.forEach((listener) => listener());
      });
    },
    setDevices(next: MediaDeviceInfo[]) {
      current = next;
    },
  };
}

/** 마운트 직후 비동기 조회가 끝나도록 마이크로태스크를 비운다. */
async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("useMediaDevices", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("마운트하면 장치 목록을 조회한다", async () => {
    installMediaDevices([device("videoinput", "cam1"), device("audioinput", "mic1")]);
    const { result } = renderHook(() => useMediaDevices());
    expect(result.current.devices).toEqual([]);
    await flush();
    expect(result.current.devices.map((d) => d.deviceId)).toEqual(["cam1", "mic1"]);
    expect(result.current.error).toBeUndefined();
  });

  it("kind를 주면 해당 종류만 반환한다", async () => {
    installMediaDevices([device("videoinput", "cam1"), device("audioinput", "mic1")]);
    const { result } = renderHook(() => useMediaDevices("videoinput"));
    await flush();
    expect(result.current.devices.map((d) => d.deviceId)).toEqual(["cam1"]);
  });

  it("devicechange가 발생하면 목록을 자동으로 갱신한다", async () => {
    const env = installMediaDevices([device("videoinput", "cam1")]);
    const { result } = renderHook(() => useMediaDevices("videoinput"));
    await flush();
    expect(result.current.devices).toHaveLength(1);

    await env.change([device("videoinput", "cam1"), device("videoinput", "cam2")]);
    expect(result.current.devices.map((d) => d.deviceId)).toEqual(["cam1", "cam2"]);
  });

  it("label이 비어 있으면 labelsAvailable이 false이고 refresh 뒤 label이 오면 true가 된다", async () => {
    const env = installMediaDevices([device("videoinput", "cam1")]);
    const { result } = renderHook(() => useMediaDevices("videoinput"));
    await flush();
    expect(result.current.labelsAvailable).toBe(false);

    env.setDevices([device("videoinput", "cam1", "FaceTime HD")]);
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.labelsAvailable).toBe(true);
  });

  it("장치가 하나도 없으면 labelsAvailable이 false다", async () => {
    installMediaDevices([]);
    const { result } = renderHook(() => useMediaDevices());
    await flush();
    expect(result.current.labelsAvailable).toBe(false);
  });

  it("언마운트하면 devicechange 구독을 해제한다", async () => {
    const env = installMediaDevices([device("videoinput", "cam1")]);
    const { unmount } = renderHook(() => useMediaDevices());
    await flush();
    expect(env.listenerCount()).toBe(1);
    unmount();
    expect(env.listenerCount()).toBe(0);
  });

  it("조회에 실패하면 던지지 않고 error로 전달한다", async () => {
    const env = installMediaDevices([]);
    env.enumerateDevices.mockRejectedValueOnce(new Error("enumerate failed"));
    const { result } = renderHook(() => useMediaDevices());
    await flush();
    expect(result.current.error?.message).toBe("enumerate failed");

    // 다음 조회가 성공하면 오류를 지운다.
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.error).toBeUndefined();
  });

  it("navigator.mediaDevices가 없으면 unsupported-browser 오류를 error로 전달한다", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      value: undefined,
      writable: true,
      configurable: true,
    });
    const { result } = renderHook(() => useMediaDevices());
    await flush();
    expect(result.current.error?.message).toMatch(/mediaDevices/);
    expect(result.current.devices).toEqual([]);
  });

  it("늦게 끝난 이전 조회가 최신 결과를 덮어쓰지 않는다", async () => {
    const env = installMediaDevices([]);
    let resolveFirst!: (list: MediaDeviceInfo[]) => void;
    env.enumerateDevices.mockImplementationOnce(
      () => new Promise<MediaDeviceInfo[]>((resolve) => (resolveFirst = resolve)),
    );
    const { result } = renderHook(() => useMediaDevices());

    env.setDevices([device("videoinput", "new")]);
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.devices.map((d) => d.deviceId)).toEqual(["new"]);

    await act(async () => {
      resolveFirst([device("videoinput", "stale")]);
    });
    expect(result.current.devices.map((d) => d.deviceId)).toEqual(["new"]);
  });
});
