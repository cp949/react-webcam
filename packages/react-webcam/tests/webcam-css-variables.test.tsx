/**
 * 공개 CSS 변수 계약을 검증하는 테스트 파일이다.
 * 변수 이름은 공개 API이므로 이름과 기본값을 함께 고정한다.
 */
import { fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FlipButton } from "../src/components/FlipButton.js";
import { MenuPopup } from "../src/components/primitives/MenuPopup.js";
import { SnapshotButton } from "../src/components/SnapshotButton.js";
import { Webcam } from "../src/Webcam.js";
import { createFakeMediaStream, mockGetUserMedia } from "./test-utils.js";
import { advanceToStreamLoad } from "./webcam-test-helpers.js";

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

describe("공개 CSS 변수", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockGetUserMedia(createFakeMediaStream());
  });

  it("--webcam-bg는 루트와 video 배경의 기본값을 #1e1e1e로 둔다", async () => {
    const { container } = render(<Webcam webcamOptions={{ audioEnabled: false }} />);
    await advanceToStreamLoad();

    const root = container.firstElementChild as HTMLElement;
    const video = container.querySelector("video") as HTMLVideoElement;
    expect(root.style.backgroundColor).toBe("var(--webcam-bg, #1e1e1e)");
    expect(video.style.backgroundColor).toBe("var(--webcam-bg, #1e1e1e)");
  });

  it("--webcam-disabled-bg는 비활성 루트와 placeholder 배경의 기본값을 #f7f8fa로 둔다", async () => {
    const { container, getByTestId } = render(
      <Webcam disabled webcamOptions={{ audioEnabled: false }} />,
    );
    await advanceToStreamLoad();

    const root = container.firstElementChild as HTMLElement;
    expect(root.style.backgroundColor).toBe("var(--webcam-disabled-bg, #f7f8fa)");
    expect(getByTestId("webcam-disabled-placeholder").style.backgroundColor).toBe(
      "var(--webcam-disabled-bg, #f7f8fa)",
    );
  });

  it("--webcam-accent는 스냅샷 버튼 호버 색의 기본값을 #1976d2로 둔다", () => {
    const { container } = render(<SnapshotButton onClick={() => {}} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.color).toBe("#fff");

    fireEvent.mouseEnter(container.querySelector("button")!);

    expect(root.style.color).toBe("var(--webcam-accent, #1976d2)");
  });

  it("--webcam-flip-active는 반전 켜짐 색의 기본값을 #ff7600으로 둔다", () => {
    const { container } = render(<FlipButton flipped onChange={() => {}} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.color).toBe("var(--webcam-flip-active, #ff7600)");
  });

  it("메뉴 변수는 배경·글자색·z-index·호버 배경의 기본값을 유지한다", () => {
    const { getByRole, getAllByRole } = render(
      <MenuPopup
        open
        onClose={() => {}}
        items={[
          { label: "A", onClick: () => {} },
          { label: "B", onClick: () => {} },
        ]}
      />,
    );

    const menu = getByRole("menu");
    expect(menu.style.backgroundColor).toBe("var(--webcam-menu-bg, #fff)");
    expect(menu.style.zIndex).toBe("var(--webcam-menu-z-index, 1300)");

    // 메뉴가 열리면 첫 항목이 포커스를 받으므로, 포커스 없는 둘째 항목으로 호버를 확인한다.
    const item = getAllByRole("menuitem")[1]!;
    expect(item.style.color).toBe("var(--webcam-menu-fg, #000)");

    fireEvent.mouseEnter(item);
    expect(item.style.backgroundColor).toBe("var(--webcam-menu-hover-bg, #f5f5f5)");
    fireEvent.mouseLeave(item);
    expect(item.style.backgroundColor).not.toContain("--webcam-menu-hover-bg");
  });
});
