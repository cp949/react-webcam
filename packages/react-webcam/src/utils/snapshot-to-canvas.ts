/** 비디오 프레임을 캔버스로 복사하는 순수 유틸이다. */
import type { SnapshotOptions } from "../types/webcam-controller.js";

/**
 * 현재 비디오 프레임을 캔버스로 복사해 반환한다.
 * - 비디오 해상도가 0이면 null을 반환한다.
 * - canvas context를 얻을 수 없으면 null을 반환한다.
 * - `sizeConstraints`가 지정되면 비율을 유지하며 축소한다.
 * - `flipped`가 true이면 좌우 반전을 적용한다.
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

  let w = vw;
  let h = vh;
  const sc = options?.sizeConstraints;
  if (sc) {
    if ("maxWidth" in sc && vw > sc.maxWidth) {
      w = sc.maxWidth;
      h = Math.round(vh * (sc.maxWidth / vw));
    } else if ("maxHeight" in sc && vh > sc.maxHeight) {
      h = sc.maxHeight;
      w = Math.round(vw * (sc.maxHeight / vh));
    }
  }

  canvas.width = w;
  canvas.height = h;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = options?.imageSmoothEnabled ?? true;
  if (flipped) {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, 0, 0, w, h);
  return canvas;
}
