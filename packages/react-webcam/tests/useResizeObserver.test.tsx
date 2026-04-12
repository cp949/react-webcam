/**
 * useResizeObserver 훅의 observe·disconnect와 rect 반영을 검증하는 테스트 파일이다.
 */
import { act, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useResizeObserver } from "../src/hooks/useResizeObserver.js";

describe("useResizeObserver", () => {
  it("mount 시 observe를 호출하고 unmount 시 disconnect를 호출한다", () => {
    const observe = vi.fn();
    const disconnect = vi.fn();

    vi.spyOn(globalThis, "ResizeObserver").mockImplementation(function MockRO() {
      return {
        observe,
        unobserve: vi.fn(),
        disconnect,
      };
    } as unknown as typeof ResizeObserver);

    function Probe() {
      const [ref] = useResizeObserver<HTMLDivElement>();
      return <div ref={ref} data-testid='probe' />;
    }

    const { unmount } = render(<Probe />);

    expect(observe).toHaveBeenCalledTimes(1);
    expect(observe.mock.calls[0]?.[0]).toBeInstanceOf(HTMLDivElement);

    unmount();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it("ResizeObserver callback 결과를 rect state로 반영한다", async () => {
    let capturedCallback: ResizeObserverCallback | undefined;

    vi.spyOn(globalThis, "ResizeObserver").mockImplementation(function MockRO(
      this: unknown,
      cb: ResizeObserverCallback,
    ) {
      capturedCallback = cb;
      return {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      };
    } as unknown as typeof ResizeObserver);

    function Probe() {
      const [ref, rect] = useResizeObserver<HTMLDivElement>();
      return <div ref={ref} data-width={rect.width} data-height={rect.height} />;
    }

    const { container } = render(<Probe />);
    const node = container.firstElementChild as HTMLDivElement;

    expect(node.dataset["width"]).toBe("0");
    expect(node.dataset["height"]).toBe("0");

    await act(async () => {
      capturedCallback?.(
        [
          {
            contentRect: {
              x: 0,
              y: 0,
              width: 320,
              height: 180,
              top: 0,
              left: 0,
              bottom: 180,
              right: 320,
              toJSON: () => ({}),
            },
          } as ResizeObserverEntry,
        ],
        {} as ResizeObserver,
      );
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    expect(node.dataset["width"]).toBe("320");
    expect(node.dataset["height"]).toBe("180");
  });
});

describe("useResizeObserver — ResizeObserver 부재 환경", () => {
  it("ResizeObserver가 없어도 render 단계에서 throw하지 않는다", () => {
    // ResizeObserver를 전역에서 제거한다.
    const originalRO = (globalThis as any).ResizeObserver;
    delete (globalThis as any).ResizeObserver;

    try {
      function Probe() {
        const [ref, rect] = useResizeObserver<HTMLDivElement>();
        return <div ref={ref} data-width={rect.width} />;
      }

      // 렌더링 단계에서 예외가 나지 않아야 fallback 경로가 안전하다고 볼 수 있다.
      expect(() => render(<Probe />)).not.toThrow();
    } finally {
      (globalThis as any).ResizeObserver = originalRO;
    }
  });

  it("ResizeObserver가 없을 때도 초기 측정값을 rect로 반영한다", async () => {
    const originalRO = (globalThis as any).ResizeObserver;
    delete (globalThis as any).ResizeObserver;

    try {
      const getBoundingClientRect = vi
        .spyOn(HTMLElement.prototype, "getBoundingClientRect")
        .mockReturnValue({
          x: 0,
          y: 0,
          width: 320,
          height: 180,
          top: 0,
          left: 0,
          bottom: 180,
          right: 320,
          toJSON: () => ({}),
        } as DOMRect);

      function Probe() {
        const [ref, rect] = useResizeObserver<HTMLDivElement>();
        return <div ref={ref} data-width={rect.width} data-height={rect.height} />;
      }

      const { container } = render(<Probe />);
      const node = container.firstElementChild as HTMLDivElement;

      await act(async () => {
        await Promise.resolve();
      });

      expect(Number(node.dataset["width"])).toBe(320);
      expect(Number(node.dataset["height"])).toBe(180);
      getBoundingClientRect.mockRestore();
    } finally {
      (globalThis as any).ResizeObserver = originalRO;
    }
  });
});
