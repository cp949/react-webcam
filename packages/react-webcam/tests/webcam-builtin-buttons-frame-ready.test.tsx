/**
 * 내장 스냅샷 버튼은 프레임이 준비된 뒤에만 표시된다.
 * 옵션 버튼(flip, cameraDirection, aspectRatio)은 영상 크기가 확인되면 표시하고 트랙 mute 중에도 유지한다.
 */
import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Webcam } from "../src/Webcam.js";
import { createFakeMediaStream, mockGetUserMedia, type FakeMediaStream } from "./test-utils.js";
import { advanceToStreamLoad, markFrameReady, markVideoReady } from "./webcam-test-helpers.js";

vi.mock("../src/hooks/useResizeObserver.js", () => ({
  useResizeObserver: () =>
    [
      (_el: HTMLElement | null) => {},
      { x: 0, y: 0, width: 800, height: 600, top: 0, left: 0, bottom: 600, right: 800 },
    ] as const,
}));

describe("내장 버튼 표시 기준", () => {
  let stream: FakeMediaStream;

  beforeEach(() => {
    vi.useFakeTimers();
    stream = createFakeMediaStream();
    mockGetUserMedia(stream);
  });

  function renderWithButtons() {
    return render(
      <Webcam
        webcamOptions={{ audioEnabled: false }}
        controls={{ flip: true, cameraDirection: true, aspectRatio: true, snapshot: true }}
      />,
    );
  }

  /** 옵션 버튼 3종이 모두 있는지 확인한다. */
  function hasOptionButtons(container: HTMLElement) {
    return ["FlipButton", "FacingModeButton", "AspectRatioButton"].every(
      (name) => container.querySelector(`.${name}-root`) !== null,
    );
  }

  /** 옵션 버튼 3종이 모두 없는지 확인한다. */
  function hasNoOptionButtons(container: HTMLElement) {
    return ["FlipButton", "FacingModeButton", "AspectRatioButton"].every(
      (name) => container.querySelector(`.${name}-root`) === null,
    );
  }

  it("메타데이터만 있으면 옵션 버튼은 보이고 스냅샷 버튼은 숨긴다", async () => {
    const { container } = renderWithButtons();
    await advanceToStreamLoad();
    // readyState가 2 미만이라 프레임은 아직 없다.
    await markVideoReady(container.querySelector("video")!);

    expect(hasOptionButtons(container)).toBe(true);
    expect(container.querySelector(".SnapshotButton-root")).toBeNull();
  });

  it("영상 크기를 알기 전에는 옵션 버튼도 스냅샷 버튼도 숨긴다", async () => {
    const { container } = renderWithButtons();
    await advanceToStreamLoad();

    expect(hasNoOptionButtons(container)).toBe(true);
    expect(container.querySelector(".SnapshotButton-root")).toBeNull();
  });

  it("프레임이 도착하면 옵션 버튼과 스냅샷 버튼을 모두 표시한다", async () => {
    const { container } = renderWithButtons();
    await advanceToStreamLoad();
    await markFrameReady(container.querySelector("video")!);

    expect(hasOptionButtons(container)).toBe(true);
    expect(container.querySelector(".SnapshotButton-root")).not.toBeNull();
  });

  it("트랙이 mute되면 스냅샷 버튼만 사라지고 unmute되면 돌아온다", async () => {
    const { container } = renderWithButtons();
    await advanceToStreamLoad();
    await markFrameReady(container.querySelector("video")!);
    expect(container.querySelector(".SnapshotButton-root")).not.toBeNull();

    await act(async () => {
      stream.fireTrackMute();
    });
    expect(container.querySelector(".SnapshotButton-root")).toBeNull();
    expect(hasOptionButtons(container)).toBe(true);

    await act(async () => {
      stream.fireTrackUnmute();
    });
    expect(container.querySelector(".SnapshotButton-root")).not.toBeNull();
    expect(hasOptionButtons(container)).toBe(true);
  });
});
