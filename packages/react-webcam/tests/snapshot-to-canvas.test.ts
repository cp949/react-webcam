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
// 반전 오버라이드
// ---------------------------------------------------------------------------

describe("snapshotToCanvas – flipped 오버라이드", () => {
  it("현재 상태가 반전이어도 flipped: false면 translate/scale을 호출하지 않는다", () => {
    const video = makeVideo(640, 480);
    const { canvas, ctx } = makeCanvas();
    snapshotToCanvas(video, true, { canvas, flipped: false });
    expect(ctx.translate).not.toHaveBeenCalled();
    expect(ctx.scale).not.toHaveBeenCalled();
    expect(ctx.drawImage).toHaveBeenCalledWith(video, 0, 0, 640, 480);
  });

  it("현재 상태가 정방향이어도 flipped: true면 반전한다", () => {
    const video = makeVideo(640, 480);
    const { canvas, ctx } = makeCanvas();
    snapshotToCanvas(video, false, { canvas, flipped: true });
    expect(ctx.translate).toHaveBeenCalledWith(640, 0);
    expect(ctx.scale).toHaveBeenCalledWith(-1, 1);
  });

  it("flipped를 생략하면 현재 상태를 따른다", () => {
    const video = makeVideo(640, 480);
    const flippedCase = makeCanvas();
    snapshotToCanvas(video, true, { canvas: flippedCase.canvas });
    expect(flippedCase.ctx.scale).toHaveBeenCalledWith(-1, 1);

    const plainCase = makeCanvas();
    snapshotToCanvas(video, false, { canvas: plainCase.canvas });
    expect(plainCase.ctx.scale).not.toHaveBeenCalled();
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
// 가운데 크롭
// ---------------------------------------------------------------------------

describe("snapshotToCanvas – aspectRatio 가운데 크롭", () => {
  it("16:9 원본에 1:1을 지정하면 좌우를 잘라 낸다", () => {
    const video = makeVideo(1280, 720);
    const { canvas, ctx } = makeCanvas();
    snapshotToCanvas(video, false, { canvas, aspectRatio: 1 });
    expect(ctx.drawImage).toHaveBeenCalledWith(video, 280, 0, 720, 720, 0, 0, 720, 720);
    expect(canvas.width).toBe(720);
    expect(canvas.height).toBe(720);
  });

  it("4:3 원본에 16:9를 지정하면 위아래를 잘라 낸다", () => {
    const video = makeVideo(640, 480);
    const { canvas, ctx } = makeCanvas();
    snapshotToCanvas(video, false, { canvas, aspectRatio: 16 / 9 });
    // sh = round(640 / (16/9)) = 360, sy = round((480 - 360) / 2) = 60
    expect(ctx.drawImage).toHaveBeenCalledWith(video, 0, 60, 640, 360, 0, 0, 640, 360);
    expect(canvas.width).toBe(640);
    expect(canvas.height).toBe(360);
  });

  it("크롭 뒤 크기에 sizeConstraints를 적용한다", () => {
    const video = makeVideo(1280, 720);
    const { canvas, ctx } = makeCanvas();
    snapshotToCanvas(video, false, {
      canvas,
      aspectRatio: 1,
      sizeConstraints: { maxWidth: 360 },
    });
    expect(ctx.drawImage).toHaveBeenCalledWith(video, 280, 0, 720, 720, 0, 0, 360, 360);
    expect(canvas.width).toBe(360);
    expect(canvas.height).toBe(360);
  });

  it("크롭 결과가 sizeConstraints보다 작으면 축소하지 않는다", () => {
    const video = makeVideo(1280, 720);
    const { canvas } = makeCanvas();
    // 원본 폭 1280은 한도 800을 넘지만 크롭 뒤 폭 720은 넘지 않는다.
    snapshotToCanvas(video, false, { canvas, aspectRatio: 1, sizeConstraints: { maxWidth: 800 } });
    expect(canvas.width).toBe(720);
    expect(canvas.height).toBe(720);
  });

  it("원본과 같은 비율이면 기존 5인자 drawImage를 쓴다", () => {
    const video = makeVideo(640, 480);
    const { canvas, ctx } = makeCanvas();
    snapshotToCanvas(video, false, { canvas, aspectRatio: 4 / 3 });
    expect(ctx.drawImage).toHaveBeenCalledWith(video, 0, 0, 640, 480);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    "aspectRatio %s는 무시한다",
    (aspectRatio) => {
      const video = makeVideo(640, 480);
      const { canvas, ctx } = makeCanvas();
      snapshotToCanvas(video, false, { canvas, aspectRatio });
      expect(ctx.drawImage).toHaveBeenCalledWith(video, 0, 0, 640, 480);
      expect(canvas.width).toBe(640);
      expect(canvas.height).toBe(480);
    },
  );

  it("극단적인 비율에서도 잘라 낸 변은 최소 1이다", () => {
    const video = makeVideo(1280, 720);
    const { canvas, ctx } = makeCanvas();
    snapshotToCanvas(video, false, { canvas, aspectRatio: 0.0001 });
    // sw = max(1, round(720 * 0.0001)) = 1
    expect(ctx.drawImage).toHaveBeenCalledWith(video, 640, 0, 1, 720, 0, 0, 1, 720);
    expect(canvas.width).toBe(1);
  });

  it("세로 방향으로 극단적인 비율이어도 잘라 낸 높이는 최소 1이다", () => {
    const video = makeVideo(640, 480);
    const { canvas, ctx } = makeCanvas();
    snapshotToCanvas(video, false, { canvas, aspectRatio: 10000 });
    // sh = max(1, round(640 / 10000)) = 1, sy = round((480 - 1) / 2) = 240
    expect(ctx.drawImage).toHaveBeenCalledWith(video, 0, 240, 640, 1, 0, 0, 640, 1);
    expect(canvas.height).toBe(1);
  });

  it("세로 크롭 뒤 높이에 maxHeight를 적용한다", () => {
    const video = makeVideo(640, 480);
    const { canvas, ctx } = makeCanvas();
    snapshotToCanvas(video, false, {
      canvas,
      aspectRatio: 16 / 9,
      sizeConstraints: { maxHeight: 180 },
    });
    // 크롭 640x360 → maxHeight 180이면 320x180
    expect(ctx.drawImage).toHaveBeenCalledWith(video, 0, 60, 640, 360, 0, 0, 320, 180);
    expect(canvas.width).toBe(320);
    expect(canvas.height).toBe(180);
  });

  it("남는 폭이 홀수면 왼쪽 여백이 1px 크다", () => {
    const video = makeVideo(1281, 720);
    const { canvas, ctx } = makeCanvas();
    snapshotToCanvas(video, false, { canvas, aspectRatio: 1 });
    // 남는 폭 561 → sx = round(280.5) = 281, 오른쪽 여백은 280
    expect(ctx.drawImage).toHaveBeenCalledWith(video, 281, 0, 720, 720, 0, 0, 720, 720);
  });

  it("재사용 캔버스의 크기가 결과 크기로 바뀐다", () => {
    const video = makeVideo(1280, 720);
    const { canvas } = makeCanvas();
    canvas.width = 50;
    canvas.height = 50;
    snapshotToCanvas(video, false, { canvas, aspectRatio: 1 });
    expect(canvas.width).toBe(720);
    expect(canvas.height).toBe(720);
  });

  it("크롭과 반전을 함께 쓰면 translate가 출력 폭 기준이다", () => {
    const video = makeVideo(1280, 720);
    const { canvas, ctx } = makeCanvas();
    snapshotToCanvas(video, true, { canvas, aspectRatio: 1 });
    expect(ctx.translate).toHaveBeenCalledWith(720, 0);
    expect(ctx.scale).toHaveBeenCalledWith(-1, 1);
    expect(ctx.drawImage).toHaveBeenCalledWith(video, 280, 0, 720, 720, 0, 0, 720, 720);
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
