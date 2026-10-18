/**
 * useDeepCompareEffect의 실행 시점을 검증하는 테스트.
 * 깊은 비교로 동등한 의존성은 effect를 다시 실행하지 않고, 값이 바뀌면 정리 함수 후 다시 실행한다.
 */

import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDeepCompareEffect } from "../src/hooks/useDeepCompareEffect.js";

describe("useDeepCompareEffect", () => {
  it("마운트 시 effect를 한 번 실행한다", () => {
    const effect = vi.fn();

    renderHook(() => useDeepCompareEffect(effect, [{ a: 1 }]));

    expect(effect).toHaveBeenCalledTimes(1);
  });

  it("참조만 다르고 내용이 같은 의존성이면 effect를 다시 실행하지 않는다", () => {
    const effect = vi.fn();
    const { rerender } = renderHook(({ opts }) => useDeepCompareEffect(effect, [opts]), {
      initialProps: { opts: { a: 1, nested: { b: [1, 2] } } },
    });

    rerender({ opts: { a: 1, nested: { b: [1, 2] } } });

    expect(effect).toHaveBeenCalledTimes(1);
  });

  it("중첩 값이 바뀌면 effect를 다시 실행한다", () => {
    const effect = vi.fn();
    const { rerender } = renderHook(({ opts }) => useDeepCompareEffect(effect, [opts]), {
      initialProps: { opts: { a: 1, nested: { b: [1, 2] } } },
    });

    rerender({ opts: { a: 1, nested: { b: [1, 3] } } });

    expect(effect).toHaveBeenCalledTimes(2);
  });

  it("의존성이 바뀌면 이전 정리 함수를 먼저 호출한 뒤 effect를 다시 실행한다", () => {
    const order: string[] = [];
    const { rerender } = renderHook(
      ({ opts }) =>
        useDeepCompareEffect(() => {
          order.push(`run:${opts.a}`);
          return () => {
            order.push(`cleanup:${opts.a}`);
          };
        }, [opts]),
      { initialProps: { opts: { a: 1 } } },
    );

    rerender({ opts: { a: 2 } });

    expect(order).toEqual(["run:1", "cleanup:1", "run:2"]);
  });

  it("언마운트 시 정리 함수를 호출한다", () => {
    const cleanup = vi.fn();
    const { unmount } = renderHook(() => useDeepCompareEffect(() => cleanup, [{ a: 1 }]));

    unmount();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("의존성이 바뀐 렌더의 effect 클로저를 실행한다", () => {
    const seen: number[] = [];
    const { rerender } = renderHook(
      ({ opts, tag }) =>
        useDeepCompareEffect(() => {
          seen.push(tag);
        }, [opts]),
      { initialProps: { opts: { a: 1 }, tag: 1 } },
    );

    // 의존성이 같으면 tag가 바뀌어도 effect를 실행하지 않는다.
    rerender({ opts: { a: 1 }, tag: 2 });
    rerender({ opts: { a: 2 }, tag: 3 });

    expect(seen).toEqual([1, 3]);
  });
});
