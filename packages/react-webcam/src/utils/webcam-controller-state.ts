/** 웹캠 상태 전환 규칙을 순수 함수로 모은 유틸이다. */
import type { MediaStreamLoadResult, WebcamDetail, WebcamErrorCode } from "../webcam-types.js";

/** 오류 상태 variant의 phase 값 — WebcamDetailError의 phase 필드와 일치한다. */
export type WebcamErrorPhase = "denied" | "unavailable" | "unsupported" | "insecure" | "error";

/**
 * `WebcamErrorCode`를 오류 상태 phase로 변환한다.
 * 에러 코드가 어느 생명주기 상태에 해당하는지 단일 위치에서 관리한다.
 */
export function errorCodeToPhase(code: WebcamErrorCode): WebcamErrorPhase {
  switch (code) {
    case "permission-denied":
      return "denied";
    case "device-not-found":
    case "device-in-use":
      return "unavailable";
    case "unsupported-browser":
      return "unsupported";
    case "insecure-context":
      return "insecure";
    default:
      return "error";
  }
}

/**
 * 기존 detail에 videoSize를 덮어 쓴 새 detail을 반환한다.
 * 값이 같으면 동일 참조를 그대로 반환해 불필요한 리렌더를 막는다.
 */
export function patchDetailVideoSize(
  detail: WebcamDetail,
  videoSize: { width: number; height: number } | undefined,
): WebcamDetail {
  const prevVideoSize = detail.videoSize;
  const same =
    prevVideoSize?.width === videoSize?.width && prevVideoSize?.height === videoSize?.height;

  if (same) return detail;
  if (!videoSize && !prevVideoSize) return detail;

  return { ...detail, videoSize } as WebcamDetail;
}

/**
 * WebcamDetail으로부터 `MediaStreamLoadResult`를 도출한다.
 * - live 상태이면 `{ mediaStream }` 반환
 * - error 계열 상태이면 `{ error }` 반환
 * - 그 외(idle, requesting)이면 `{}` 반환
 */
export function mediaStreamResultFromDetail(detail: WebcamDetail): MediaStreamLoadResult {
  if (detail.phase === "live" || detail.phase === "playback-error") {
    return { mediaStream: detail.mediaStream };
  }
  if (
    detail.phase === "denied" ||
    detail.phase === "unavailable" ||
    detail.phase === "unsupported" ||
    detail.phase === "insecure" ||
    detail.phase === "error"
  ) {
    return { error: detail.error };
  }
  return {};
}
