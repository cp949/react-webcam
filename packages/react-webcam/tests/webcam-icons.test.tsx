/**
 * `icons` prop으로 내장 버튼 아이콘을 교체하는 계약을 검증하는 테스트 파일이다.
 */
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Webcam, type WebcamIcons } from "../src/Webcam.js";
import { createFakeMediaStream, mockGetUserMedia } from "./test-utils.js";
import { advanceToStreamLoad, markVideoReady } from "./webcam-test-helpers.js";

// rootWidth가 즉시 잡히도록 useResizeObserver를 목 처리한다.
vi.mock("../src/hooks/useResizeObserver.js", () => ({
  useResizeObserver: () =>
    [
      (_el: HTMLElement | null) => {},
      { x: 0, y: 0, width: 800, height: 600, top: 0, left: 0, bottom: 600, right: 800 },
    ] as const,
}));

const BUTTON_ROOTS = {
  flip: ".FlipButton-root",
  cameraDirection: ".FacingModeButton-root",
  aspectRatio: ".AspectRatioButton-root",
  snapshot: ".SnapshotButton-root",
} as const;

describe("icons prop", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockGetUserMedia(createFakeMediaStream());
  });

  async function renderWithIcons(icons?: WebcamIcons) {
    const view = render(
      <Webcam
        webcamOptions={{ audioEnabled: false }}
        controls={{ flip: true, cameraDirection: true, aspectRatio: true, snapshot: true }}
        icons={icons}
      />,
    );
    await advanceToStreamLoad();
    await markVideoReady(view.container.querySelector("video")!);
    return view;
  }

  it("icons를 주지 않으면 버튼마다 기본 svg 아이콘을 렌더링한다", async () => {
    const { container } = await renderWithIcons();
    for (const [name, root] of Object.entries(BUTTON_ROOTS)) {
      expect(container.querySelector(`${root} button svg`), name).not.toBeNull();
    }
  });

  it.each(Object.keys(BUTTON_ROOTS) as (keyof WebcamIcons)[])(
    "%s 아이콘을 교체하면 기본 svg 대신 전달한 노드를 렌더링한다",
    async (name) => {
      const { container } = await renderWithIcons({
        [name]: <span data-testid={`custom-${name}`}>X</span>,
      });
      const button = container.querySelector(`${BUTTON_ROOTS[name]} button`)!;
      expect(button.querySelector(`[data-testid="custom-${name}"]`)).not.toBeNull();
      expect(button.querySelector("svg")).toBeNull();
    },
  );

  it("지정하지 않은 버튼은 기본 아이콘을 유지한다", async () => {
    const { container } = await renderWithIcons({ snapshot: <span>S</span> });
    expect(container.querySelector(".SnapshotButton-root button svg")).toBeNull();
    expect(container.querySelector(".FlipButton-root button svg")).not.toBeNull();
    expect(container.querySelector(".FacingModeButton-root button svg")).not.toBeNull();
    expect(container.querySelector(".AspectRatioButton-root button svg")).not.toBeNull();
  });

  it("아이콘을 교체해도 title과 aria-label은 라벨을 유지한다", async () => {
    const { container } = await renderWithIcons({ flip: <span>F</span> });
    const button = container.querySelector(".FlipButton-root button")!;
    expect(button.getAttribute("aria-label")).toBe("미러");
    expect(button.getAttribute("title")).toBe("미러");
  });
});
