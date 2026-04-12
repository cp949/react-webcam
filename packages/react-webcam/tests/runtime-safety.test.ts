/**
 * 브라우저 번들 런타임 안전성 회귀 테스트
 *
 * 목적: `process.env.NODE_ENV`를 직접 참조하는 코드가 브라우저 환경에서
 * `process is not defined` ReferenceError를 발생시키는 현상을 재현한다.
 */
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useCustomCompareEffect } from "../src/hooks/useCustomCompareEffect.js";
import { useDeepCompareEffect } from "../src/hooks/useDeepCompareEffect.js";
import { observeElementSize } from "../src/utils/observe-element-size.js";

/**
 * process 객체를 일시적으로 제거해 브라우저 환경을 시뮬레이션한 뒤 복원한다.
 */
function withoutProcess<T>(fn: () => T): T {
  const savedProcess = (globalThis as Record<string, unknown>)["process"];
  delete (globalThis as Record<string, unknown>)["process"];
  try {
    return fn();
  } finally {
    (globalThis as Record<string, unknown>)["process"] = savedProcess;
  }
}

describe("browser runtime safety", () => {
  it("useDeepCompareEffect does not throw ReferenceError when process is undefined", () => {
    // process가 없는 브라우저 환경에서 훅 호출이 안전해야 한다.
    expect(() => {
      withoutProcess(() => {
        renderHook(() => {
          useDeepCompareEffect(() => {}, [{ key: "value" }]);
        });
      });
    }).not.toThrow();
  });

  it("useCustomCompareEffect does not throw ReferenceError when process is undefined", () => {
    // process가 없는 브라우저 환경에서 훅 호출이 안전해야 한다.
    expect(() => {
      withoutProcess(() => {
        renderHook(() => {
          useCustomCompareEffect(
            () => {},
            [{ key: "value" }],
            (a, b) => a === b,
          );
        });
      });
    }).not.toThrow();
  });
});

describe("ResizeObserver runtime safety", () => {
  it("observeElementSize does not throw when ResizeObserver is absent", () => {
    const originalRO = (globalThis as any).ResizeObserver;
    delete (globalThis as any).ResizeObserver;

    try {
      const el = document.createElement("div");
      const callback = vi.fn();

      // ResizeObserver가 없어도 fallback 경로로 안전하게 정리되어야 한다.
      expect(() => {
        const cleanup = observeElementSize(el, callback);
        cleanup();
      }).not.toThrow();

      // fallback 측정값은 최소 한 번 콜백으로 전달되어야 한다.
      expect(callback).toHaveBeenCalledTimes(1);
    } finally {
      (globalThis as any).ResizeObserver = originalRO;
    }
  });
});
