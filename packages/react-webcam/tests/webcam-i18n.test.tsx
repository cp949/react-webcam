/**
 * 버튼 라벨의 기본 한국어 값과 사용자 지정 라벨 덮어쓰기를 검증하는 테스트 파일이다.
 */
import { act, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AspectRatioButton } from "../src/components/AspectRatioButton.js";
import { FacingModeButton } from "../src/components/FacingModeButton.js";
import { FlipButton } from "../src/components/FlipButton.js";
import { SnapshotButton } from "../src/components/SnapshotButton.js";
import { Webcam } from "../src/Webcam.js";
import { createFakeMediaStream, mockGetUserMedia } from "./test-utils.js";
import { markVideoReady } from "./webcam-test-helpers.js";

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
// WebcamLabels 기본 한국어 라벨
// ---------------------------------------------------------------------------

describe("WebcamLabels: default Korean labels", () => {
  it('SnapshotButton renders with default label "스냅샷" when no label prop is given', () => {
    const { container } = render(<SnapshotButton onClick={() => {}} />);
    const btn = container.querySelector("button")!;
    expect(btn.getAttribute("title")).toBe("스냅샷");
    expect(btn.getAttribute("aria-label")).toBe("스냅샷");
  });

  it('FlipButton renders with default label "미러" when no label prop is given', () => {
    const { container } = render(<FlipButton flipped={false} onChange={() => {}} />);
    const btn = container.querySelector("button")!;
    expect(btn.getAttribute("title")).toBe("미러");
    expect(btn.getAttribute("aria-label")).toBe("미러");
  });

  it('FacingModeButton renders with default label "전면/후면 카메라" when no label prop is given', () => {
    const { container } = render(<FacingModeButton onChange={() => {}} />);
    const btn = container.querySelector("button")!;
    expect(btn.getAttribute("title")).toBe("전면/후면 카메라");
    expect(btn.getAttribute("aria-label")).toBe("전면/후면 카메라");
  });

  it('AspectRatioButton renders with default label "크기 비율" when no label prop is given', () => {
    const { container } = render(<AspectRatioButton onChange={() => {}} />);
    const btn = container.querySelector("button")!;
    expect(btn.getAttribute("title")).toBe("크기 비율");
    expect(btn.getAttribute("aria-label")).toBe("크기 비율");
  });

  it("FacingModeButton menu shows default Korean items when no menuLabels given", async () => {
    const { container } = render(<FacingModeButton onChange={() => {}} />);
    const btn = container.querySelector("button")!;
    await act(async () => {
      btn.click();
    });
    const items = Array.from(container.querySelectorAll('[role="menuitem"]')).map(
      (el) => el.textContent,
    );
    expect(items).toContain("후면");
    expect(items).toContain("전면");
    expect(items).toContain("기본");
  });

  it("AspectRatioButton menu shows default Korean auto label when no autoLabel given", async () => {
    const { container } = render(<AspectRatioButton onChange={() => {}} />);
    const btn = container.querySelector("button")!;
    await act(async () => {
      btn.click();
    });
    const items = Array.from(container.querySelectorAll('[role="menuitem"]')).map(
      (el) => el.textContent,
    );
    expect(items).toContain("자동");
  });
});

// ---------------------------------------------------------------------------
// WebcamLabels 사용자 지정 라벨 우선 적용
// ---------------------------------------------------------------------------

describe("WebcamLabels: custom labels override defaults", () => {
  it("SnapshotButton uses custom label for title and aria-label", () => {
    const { container } = render(<SnapshotButton onClick={() => {}} label='Take Photo' />);
    const btn = container.querySelector("button")!;
    expect(btn.getAttribute("title")).toBe("Take Photo");
    expect(btn.getAttribute("aria-label")).toBe("Take Photo");
  });

  it("FlipButton uses custom label for title and aria-label", () => {
    const { container } = render(<FlipButton flipped={false} onChange={() => {}} label='Mirror' />);
    const btn = container.querySelector("button")!;
    expect(btn.getAttribute("title")).toBe("Mirror");
    expect(btn.getAttribute("aria-label")).toBe("Mirror");
  });

  it("FacingModeButton uses custom button label", () => {
    const { container } = render(<FacingModeButton onChange={() => {}} label='Switch Camera' />);
    const btn = container.querySelector("button")!;
    expect(btn.getAttribute("title")).toBe("Switch Camera");
    expect(btn.getAttribute("aria-label")).toBe("Switch Camera");
  });

  it("FacingModeButton uses custom menuLabels for menu items", async () => {
    const { container } = render(
      <FacingModeButton
        onChange={() => {}}
        menuLabels={{ back: "Rear", front: "Front", default: "Auto" }}
      />,
    );
    const btn = container.querySelector("button")!;
    await act(async () => {
      btn.click();
    });
    const items = Array.from(container.querySelectorAll('[role="menuitem"]')).map(
      (el) => el.textContent,
    );
    expect(items).toContain("Rear");
    expect(items).toContain("Front");
    expect(items).toContain("Auto");
    expect(items).not.toContain("후면");
    expect(items).not.toContain("전면");
  });

  it("AspectRatioButton uses custom button label", () => {
    const { container } = render(<AspectRatioButton onChange={() => {}} label='Aspect' />);
    const btn = container.querySelector("button")!;
    expect(btn.getAttribute("title")).toBe("Aspect");
    expect(btn.getAttribute("aria-label")).toBe("Aspect");
  });

  it("AspectRatioButton uses custom autoLabel in menu", async () => {
    const { container } = render(<AspectRatioButton onChange={() => {}} autoLabel='Original' />);
    const btn = container.querySelector("button")!;
    await act(async () => {
      btn.click();
    });
    const items = Array.from(container.querySelectorAll('[role="menuitem"]')).map(
      (el) => el.textContent,
    );
    expect(items).toContain("Original");
    expect(items).not.toContain("자동");
  });

  it("Webcam labels prop overrides button aria-labels via labels.flip", async () => {
    vi.useFakeTimers();
    mockGetUserMedia(createFakeMediaStream());

    render(
      <Webcam
        webcamOptions={{ audioEnabled: false }}
        visibleFlipButton
        labels={{ flip: "Mirror Image" }}
      />,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    const video = document.querySelector("video")!;
    await markVideoReady(video);

    const flipBtn = document.querySelector(".FlipButton-root button") as HTMLButtonElement;
    expect(flipBtn.getAttribute("title")).toBe("Mirror Image");
    expect(flipBtn.getAttribute("aria-label")).toBe("Mirror Image");
  });
});
