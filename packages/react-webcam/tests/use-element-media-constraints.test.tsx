/**
 * `size: "element-size"`에서 요소 크기 변화가 constraints 갱신으로 이어지는 기준을 검증한다.
 * 작은 크기 변화는 같은 constraints를 유지해 스트림 재요청을 막아야 한다.
 */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useElementMediaConstraints } from "../src/hooks/useElementMediaConstraints.js";
import type { WebcamOptions } from "../src/webcam-types.js";

// observeElementSize를 목 처리해 테스트가 요소 크기를 직접 밀어 넣는다.
const sizeListener = vi.hoisted(() => ({
  emit: (_size: { width: number; height: number }) => {},
}));
vi.mock("../src/utils/observe-element-size.js", () => ({
  observeElementSize: (
    _el: HTMLElement,
    callback: (size: { width: number; height: number }) => void,
  ) => {
    sizeListener.emit = callback;
    return () => {};
  },
}));

const ELEMENT_SIZE_OPTIONS: WebcamOptions = { audioEnabled: false, size: "element-size" };

/** 요소 크기를 바꾸고 debounce(100ms)가 지나도록 시간을 진행한다. */
async function resizeTo(width: number, height: number) {
  // 크기 상태가 렌더되어 debounce 타이머가 걸린 뒤에 시간을 진행한다.
  act(() => {
    sizeListener.emit({ width, height });
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(150);
  });
}

/** constraints에서 요청한 비디오 너비를 읽는다. */
function idealWidth(constraints: MediaStreamConstraints | undefined) {
  const video = constraints?.video as MediaTrackConstraints | undefined;
  return (video?.width as ConstrainULongRange | undefined)?.ideal;
}

describe("useElementMediaConstraints: element-size 재계산 기준", () => {
  const video = document.createElement("video");

  beforeEach(() => {
    vi.useFakeTimers();
  });

  /** 훅을 렌더링하고 첫 크기 640x480으로 constraints를 만든다. */
  async function renderAt640(options: WebcamOptions = ELEMENT_SIZE_OPTIONS) {
    const hook = renderHook(
      ({ opts }: { opts: WebcamOptions }) => useElementMediaConstraints(video, opts),
      { initialProps: { opts: options } },
    );
    await resizeTo(640, 480);
    return hook;
  }

  it("처음 측정한 크기로 constraints를 만든다", async () => {
    const { result } = await renderAt640();
    expect(idealWidth(result.current)).toBe(640);
  });

  it("마지막 적용 크기와 10% 미만 차이면 같은 constraints 참조를 유지한다", async () => {
    const { result } = await renderAt640();
    const first = result.current;

    await resizeTo(660, 490);

    expect(result.current).toBe(first);
  });

  it("10% 이상 차이 나면 새 크기로 constraints를 갱신한다", async () => {
    const { result } = await renderAt640();

    await resizeTo(800, 600);

    expect(idealWidth(result.current)).toBe(800);
  });

  it("조금씩 늘려도 마지막 적용 크기 기준으로 누적되면 갱신한다", async () => {
    const { result } = await renderAt640();
    const first = result.current;

    await resizeTo(680, 480);
    await resizeTo(700, 480);
    expect(result.current).toBe(first);

    await resizeTo(720, 480);
    expect(idealWidth(result.current)).toBe(720);
  });

  it("높이만 10% 이상 바뀌어도 갱신한다", async () => {
    const { result } = await renderAt640();
    const first = result.current;

    await resizeTo(640, 600);

    expect(result.current).not.toBe(first);
  });

  it("크기가 비슷해도 다른 옵션이 바뀌면 적용 크기로 constraints를 다시 만든다", async () => {
    const { result, rerender } = await renderAt640();
    await resizeTo(660, 490);

    rerender({ opts: { ...ELEMENT_SIZE_OPTIONS, facingMode: "environment" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });

    const videoConstraints = result.current?.video as MediaTrackConstraints;
    expect(videoConstraints.facingMode).toEqual({ ideal: "environment" });
    expect(idealWidth(result.current)).toBe(640);
  });
});
