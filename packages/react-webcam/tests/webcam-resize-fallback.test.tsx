/**
 * Webcam 루트 크기 측정이 ResizeObserver 없이도 동작하는지 검증한다.
 */
import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createFakeMediaStream, mockGetUserMedia } from "./test-utils.js";

describe("Webcam – ResizeObserver fallback", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("renders a video element after fallback root measurement when ResizeObserver is absent", async () => {
    const originalRO = (globalThis as any).ResizeObserver;
    delete (globalThis as any).ResizeObserver;

    const rectSpy = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      bottom: 600,
      right: 800,
      toJSON: () => ({}),
    } as DOMRect);

    try {
      mockGetUserMedia(createFakeMediaStream());
      const { Webcam } = await import("../src/Webcam.js");
      const { container } = render(<Webcam webcamOptions={{ audioEnabled: false }} />);

      await act(async () => {
        await Promise.resolve();
      });

      expect(container.querySelector("video")).not.toBeNull();
    } finally {
      rectSpy.mockRestore();
      (globalThis as any).ResizeObserver = originalRO;
    }
  });
});
