/**
 * playVideo의 결과 분기를 검증하는 테스트.
 * 재생 성공, 일반 실패, AbortError 무시, 오류 정규화를 다룬다.
 */

import { describe, expect, it, vi } from "vitest";
import { playVideo } from "../src/utils/play-video.js";

/** play()가 주어진 결과로 끝나는 비디오 요소 대역을 만든다. */
function createVideo(play: () => Promise<void>): HTMLVideoElement {
  return { play } as unknown as HTMLVideoElement;
}

describe("playVideo", () => {
  it("재생에 성공하면 onOk를 호출하고 onError는 호출하지 않는다", async () => {
    const onOk = vi.fn();
    const onError = vi.fn();

    playVideo(
      createVideo(() => Promise.resolve()),
      onOk,
      onError,
    );
    await Promise.resolve();
    await Promise.resolve();

    expect(onOk).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it("재생이 Error로 실패하면 같은 Error 객체로 onError를 호출한다", async () => {
    const failure = new DOMException("blocked", "NotAllowedError");
    const onOk = vi.fn();
    const onError = vi.fn();

    playVideo(
      createVideo(() => Promise.reject(failure)),
      onOk,
      onError,
    );
    await Promise.resolve();
    await Promise.resolve();

    expect(onError).toHaveBeenCalledWith(failure);
    expect(onOk).not.toHaveBeenCalled();
  });

  it("Error가 아닌 값으로 실패하면 Error로 바꿔 onError에 전달한다", async () => {
    const onError = vi.fn();

    playVideo(
      createVideo(() => Promise.reject("차단됨")),
      vi.fn(),
      onError,
    );
    await Promise.resolve();
    await Promise.resolve();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][0].message).toBe("차단됨");
  });

  it("AbortError로 실패하면 onError를 호출하지 않는다", async () => {
    const onError = vi.fn();
    const abort = new DOMException("interrupted", "AbortError");

    playVideo(
      createVideo(() => Promise.reject(abort)),
      vi.fn(),
      onError,
    );
    await Promise.resolve();
    await Promise.resolve();

    expect(onError).not.toHaveBeenCalled();
  });
});
