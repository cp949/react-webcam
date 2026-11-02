/** 비디오 프레임을 캔버스로 복사하는 순수 유틸이다. */
import type { SnapshotOptions } from "../types/webcam-controller.js";

/**
 * 현재 비디오 프레임을 캔버스로 복사해 반환한다.
 * - 비디오 해상도가 0이면 null을 반환한다.
 * - canvas context를 얻을 수 없으면 null을 반환한다.
 * - `aspectRatio`가 지정되면 원본 가운데를 그 비율로 잘라 낸다.
 * - `sizeConstraints`가 지정되면 잘라 낸 크기를 기준으로 비율을 유지하며 축소한다.
 * - 반전 여부는 `options.flipped`가 있으면 그 값을, 없으면 `flipped` 인자를 따른다.
 * - 처리 순서는 크롭, 축소, 반전이다.
 */
export function snapshotToCanvas(
  video: HTMLVideoElement,
  flipped: boolean,
  options?: SnapshotOptions,
): HTMLCanvasElement | null {
  const canvas = options?.canvas ?? document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return null;

  // 1단계: 가운데 크롭 영역(sx, sy, sw, sh)을 정한다. 옵션이 없거나 유효하지 않으면 전체 프레임이다.
  let sx = 0;
  let sy = 0;
  let sw = vw;
  let sh = vh;
  const ratio = options?.aspectRatio;
  if (ratio !== undefined && Number.isFinite(ratio) && ratio > 0) {
    const videoRatio = vw / vh;
    if (videoRatio > ratio) {
      sw = Math.max(1, Math.round(vh * ratio));
      sx = Math.round((vw - sw) / 2);
    } else if (videoRatio < ratio) {
      sh = Math.max(1, Math.round(vw / ratio));
      sy = Math.round((vh - sh) / 2);
    }
  }
  // 반올림 결과가 원본 크기와 같으면 크롭이 없는 것으로 본다.
  const cropped = sw !== vw || sh !== vh;

  // 2단계: 크롭 결과(sw, sh)를 기준으로 축소한다.
  let w = sw;
  let h = sh;
  const sc = options?.sizeConstraints;
  if (sc) {
    if ("maxWidth" in sc && sw > sc.maxWidth) {
      w = sc.maxWidth;
      h = Math.round(sh * (sc.maxWidth / sw));
    } else if ("maxHeight" in sc && sh > sc.maxHeight) {
      h = sc.maxHeight;
      w = Math.round(sw * (sc.maxHeight / sh));
    }
  }

  canvas.width = w;
  canvas.height = h;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = options?.imageSmoothEnabled ?? true;
  // 옵션이 현재 반전 상태보다 우선한다.
  const shouldFlip = options?.flipped ?? flipped;
  if (shouldFlip) {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }
  // 크롭이 없으면 기존 5인자 호출을 유지한다. 크롭 영역은 거의 좌우 대칭이라 반전해도 같은 영역이다.
  // 남는 폭이 홀수면 왼쪽 여백이 오른쪽보다 1px 크다.
  if (cropped) {
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, w, h);
  } else {
    ctx.drawImage(video, 0, 0, w, h);
  }
  return canvas;
}
