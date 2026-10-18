/**
 * 외부 스타일링에 쓰는 슬롯 클래스 이름 계약을 검증하는 테스트 파일이다.
 * README "Styling"에 적은 클래스 이름은 공개 API이므로 이름 변경을 막는다.
 */
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Webcam } from "../src/Webcam.js";
import { createFakeMediaStream, mockGetUserMedia } from "./test-utils.js";
import { advanceToStreamLoad, markVideoReady } from "./webcam-test-helpers.js";

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

describe("슬롯 클래스 이름 계약", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockGetUserMedia(createFakeMediaStream());
  });

  /** 모든 내장 버튼을 켠 Webcam을 렌더링한다. */
  async function renderAllSlots() {
    const view = render(
      <Webcam
        className='custom-root'
        webcamOptions={{ audioEnabled: false }}
        controls={{ flip: true, cameraDirection: true, aspectRatio: true, snapshot: true }}
      />,
    );
    await advanceToStreamLoad();
    // 내장 버튼은 첫 프레임이 준비된 뒤에 나타난다.
    await markVideoReady(view.container.querySelector("video")!);
    return view;
  }

  it("루트에 Webcam-root와 사용자 className을 함께 붙인다", async () => {
    const { container } = await renderAllSlots();
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains("Webcam-root")).toBe(true);
    expect(root.classList.contains("custom-root")).toBe(true);
  });

  it("video에 Webcam-video를 붙인다", async () => {
    const { container } = await renderAllSlots();
    expect(container.querySelector("video.Webcam-video")).not.toBeNull();
  });

  it("옵션 버튼 3종에 각자의 -root와 Webcam-optionBtn을 붙인다", async () => {
    const { container } = await renderAllSlots();
    for (const name of ["FlipButton", "FacingModeButton", "AspectRatioButton"]) {
      const slot = container.querySelector(`.${name}-root`);
      expect(slot, name).not.toBeNull();
      expect(slot!.classList.contains("Webcam-optionBtn"), name).toBe(true);
    }
  });

  it("스냅샷 버튼에 SnapshotButton-root를 붙인다", async () => {
    const { container } = await renderAllSlots();
    expect(container.querySelector(".SnapshotButton-root")).not.toBeNull();
  });

  it("모든 내장 버튼 안의 button에 x_btn을 붙인다", async () => {
    const { container } = await renderAllSlots();
    for (const name of ["FlipButton", "FacingModeButton", "AspectRatioButton", "SnapshotButton"]) {
      expect(container.querySelector(`.${name}-root button.x_btn`), name).not.toBeNull();
    }
  });
});
