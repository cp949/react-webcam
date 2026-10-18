import { ensureError } from "./ensure-error.js";

/**
 * 비디오 재생을 시도하고 결과를 콜백으로 전달한다.
 *
 * - `AbortError`는 srcObject 교체나 중단으로 요청이 취소된 정상 경로라서 무시한다.
 * - 그 밖의 실패(자동재생 차단 등)는 `Error`로 정규화해 `onError`로 보낸다.
 * - `onOk`가 던진 예외도 `onError`로 간다.
 */
export function playVideo(
  video: HTMLVideoElement,
  onOk: () => void,
  onError: (error: Error) => void,
): void {
  video
    .play()
    .then(onOk)
    .catch((err: unknown) => {
      if ((err as { name?: string })?.name === "AbortError") return;
      onError(ensureError(err));
    });
}
