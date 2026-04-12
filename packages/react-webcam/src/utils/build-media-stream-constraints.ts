import type { WebcamOptions } from "../webcam-types.js";

/** 웹캠 옵션과 요소 크기를 `getUserMedia` 제약 조건으로 변환한다. */
export function buildMediaStreamConstraints(
  options: WebcamOptions,
  elementSize: { width: number; height: number },
): MediaStreamConstraints {
  // facingMode와 deviceId를 함께 강제하면 상충하는 입력 장치 선택이 생길 수 있다.
  // 어떤 값을 우선할지는 호출부에서 결정하고, 여기서는 전달된 값을 그대로 반영한다.

  // deviceId가 있으면 facingMode를 억제한다 (deviceId가 우선)
  const hasDeviceId = Boolean(options.deviceId);
  const facingMode = !hasDeviceId && options.facingMode ? { ideal: options.facingMode } : undefined;
  const deviceId = options.deviceId
    ? options.deviceSelectionStrategy === "exact"
      ? { exact: options.deviceId }
      : { ideal: options.deviceId }
    : undefined;
  const aspectRatio = options.aspectRatio || 0;
  const audioEnabled = options.audioEnabled;

  // 너비, 높이, 종횡비가 일부 충돌하더라도 직접 보정하지 않고 브라우저 제약 조건 계산에 맡긴다.
  const size = options.size === "element-size" ? elementSize : options.size;
  const W = size?.width || 0;
  const H = size?.height || 0;

  // 목표 프레임레이트와 최대 프레임레이트 조합을 제약 조건으로 정리한다.
  let frameRate: MediaTrackConstraintSet["frameRate"];
  if (options.frameRate && options.maxFrameRate) {
    frameRate = { ideal: options.frameRate, max: options.maxFrameRate };
  } else if (options.frameRate) {
    frameRate = { ideal: options.frameRate };
  } else if (options.maxFrameRate) {
    frameRate = { max: options.maxFrameRate };
  }

  const constraints: MediaStreamConstraints = {
    video: {
      width: W > 0 ? { ideal: W } : undefined,
      height: H > 0 ? { ideal: H } : undefined,
      aspectRatio: aspectRatio > 0 ? { ideal: aspectRatio } : undefined,
      frameRate,
      facingMode: facingMode,
      deviceId,
    },
    audio: audioEnabled || false,
  };

  return constraints;
}
