/**
 * snapshot-to-canvas 순수 헬퍼를 검증하는 단위 테스트 파일이다.
 */

import { describe, expect, it, vi } from "vitest";
import { snapshotToCanvas } from "../src/utils/snapshot-to-canvas.js";

// ---------------------------------------------------------------------------
// 헬퍼
// ---------------------------------------------------------------------------

/** 지정한 메타데이터 크기를 가진 테스트용 비디오 요소를 만든다. */
function makeVideo(videoWidth: number, videoHeight: number): HTMLVideoElement {
  const video = document.createElement("video");
  Object.defineProperty(video, "videoWidth", { value: videoWidth, configurable: true });
  Object.defineProperty(video, "videoHeight", { value: videoHeight, configurable: true });
  return video;
}

/** 2D 컨텍스트를 감시 가능한 스파이 객체로 대체한 캔버스를 만든다. */
function makeCanvas(ctxOverrides: Partial<CanvasRenderingContext2D> = {}) {
  const canvas = document.createElement("canvas");
  const ctx = {
    setTransform: vi.fn(),
    imageSmoothingEnabled: true,
    drawImage: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    ...ctxOverrides,
  };
  vi.spyOn(canvas, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
  return { canvas, ctx };
}

// ---------------------------------------------------------------------------
// 비디오 미준비
// ---------------------------------------------------------------------------

describe("snapshotToCanvas – video not ready", () => {
  it.each([
    [0, 480],
    [640, 0],
  ])("returns null when video size is not ready (%i x %i)", (width, height) => {
    const video = makeVideo(width, height);
    const { canvas } = makeCanvas();
    expect(snapshotToCanvas(video, false, { canvas })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 캔버스 컨텍스트 없음
// ---------------------------------------------------------------------------

describe("snapshotToCanvas – no canvas context", () => {
  it("returns null when getContext returns null", () => {
    const video = makeVideo(640, 480);
    const canvas = document.createElement("canvas");
    vi.spyOn(canvas, "getContext").mockReturnValue(null);
    expect(snapshotToCanvas(video, false, { canvas })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 기본 캡처
// ---------------------------------------------------------------------------

describe("snapshotToCanvas – basic capture", () => {
  it("copies the current frame onto the provided canvas", () => {
    const video = makeVideo(640, 480);
    const { canvas, ctx } = makeCanvas();
    const result = snapshotToCanvas(video, false, { canvas });
    expect(result).toBe(canvas);
    expect(canvas.width).toBe(640);
    expect(canvas.height).toBe(480);
    expect(ctx.drawImage).toHaveBeenCalledWith(video, 0, 0, 640, 480);
  });

  it("creates a new canvas when none is provided", () => {
    const video = makeVideo(320, 240);
    const { canvas: autoCanvas } = makeCanvas();
    vi.spyOn(document, "createElement").mockReturnValueOnce(autoCanvas as unknown as HTMLElement);
    const result = snapshotToCanvas(video, false);
    vi.restoreAllMocks();
    expect(result).not.toBeNull();
    expect(result?.width).toBe(320);
    expect(result?.height).toBe(240);
  });
});

// ---------------------------------------------------------------------------
// 좌우 반전 처리
// ---------------------------------------------------------------------------

describe("snapshotToCanvas – flip", () => {
  it("translates and scales when flipped=true", () => {
    const video = makeVideo(640, 480);
    const { canvas, ctx } = makeCanvas();
    snapshotToCanvas(video, true, { canvas });
    expect(ctx.translate).toHaveBeenCalledWith(640, 0);
    expect(ctx.scale).toHaveBeenCalledWith(-1, 1);
  });
});

// ---------------------------------------------------------------------------
// 크기 제한
// ---------------------------------------------------------------------------

describe("snapshotToCanvas – sizeConstraints", () => {
  it("scales down while preserving aspect ratio when maxWidth is exceeded", () => {
    const video = makeVideo(1280, 720);
    const { canvas } = makeCanvas();
    snapshotToCanvas(video, false, { canvas, sizeConstraints: { maxWidth: 640 } });
    expect(canvas.width).toBe(640);
    expect(canvas.height).toBe(360);
  });

  it("scales down while preserving aspect ratio when maxHeight is exceeded", () => {
    const video = makeVideo(1280, 960);
    const { canvas } = makeCanvas();
    snapshotToCanvas(video, false, { canvas, sizeConstraints: { maxHeight: 480 } });
    expect(canvas.height).toBe(480);
    expect(canvas.width).toBe(640);
  });
});

// ---------------------------------------------------------------------------
// 이미지 스무딩 옵션
// ---------------------------------------------------------------------------

describe("snapshotToCanvas – imageSmoothEnabled", () => {
  it("defaults imageSmoothingEnabled to true", () => {
    const video = makeVideo(640, 480);
    const { canvas, ctx } = makeCanvas();
    snapshotToCanvas(video, false, { canvas });
    expect(ctx.imageSmoothingEnabled).toBe(true);
  });

  it("sets imageSmoothingEnabled to false when option is false", () => {
    const video = makeVideo(640, 480);
    const { canvas, ctx } = makeCanvas();
    snapshotToCanvas(video, false, { canvas, imageSmoothEnabled: false });
    expect(ctx.imageSmoothingEnabled).toBe(false);
  });
});
