/** Chrome 83에서 실제 영상 프레임, 스냅샷과 언마운트 시 트랙 정리를 검증한다. */
import { expect, test, type Page } from "@playwright/test";

/** 최신 Playwright의 checkVisibility 의존 없이 실제 마우스로 버튼을 누른다. */
async function clickButton(page: Page, selector: string) {
  const point = await page.evaluate((selector) => {
    const button = document.querySelector<HTMLButtonElement>(selector);
    if (!button || button.disabled) throw new Error(`사용 가능한 버튼이 없다: ${selector}`);
    button.scrollIntoView({ block: "center", inline: "center" });
    const rect = button.getBoundingClientRect();
    const style = getComputedStyle(button);
    if (!rect.width || !rect.height || style.visibility === "hidden" || style.display === "none") {
      throw new Error(`버튼이 보이지 않는다: ${selector}`);
    }
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }, selector);
  await page.mouse.click(point.x, point.y);
}

test("Chrome83에서 마운트, getUserMedia, 스냅샷, unmount 시 track stop을 검증한다", async ({
  page,
}) => {
  // 라이브러리 코드를 건드리지 않고 실제 MediaStreamTrack.stop() 호출을
  // 계측하기 위해 페이지 스크립트 실행 전에 주입한다.
  await page.addInitScript(() => {
    (window as unknown as { __trackStopCalls: number }).__trackStopCalls = 0;
    const originalStop = MediaStreamTrack.prototype.stop;
    MediaStreamTrack.prototype.stop = function stop(this: MediaStreamTrack) {
      (window as unknown as { __trackStopCalls: number }).__trackStopCalls += 1;
      return originalStop.call(this);
    };
  });

  await page.goto("/index.html");

  // Playwright 1.64의 role/visibility 검사는 Chrome 83에 없는 checkVisibility를 호출한다.
  // 폴리필을 주입하면 제품의 호환성 문제를 가릴 수 있어 기본 DOM API로 준비 상태를 확인한다.
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const video = document.querySelector("video");
          const button = document.querySelector<HTMLButtonElement>('button[aria-label="스냅샷"]');
          return (
            !!video && video.readyState >= 2 && video.videoWidth > 0 && !!button && !button.disabled
          );
        }),
      { timeout: 15_000 },
    )
    .toBe(true);

  await clickButton(page, 'button[aria-label="스냅샷"]');
  await expect
    .poll(() =>
      page.evaluate(() => {
        const image = document.querySelector<HTMLImageElement>('img[alt="snapshot preview"]');
        return (
          !!image && image.complete && image.naturalWidth > 0 && image.getClientRects().length > 0
        );
      }),
    )
    .toBe(true);

  const stopCallsBeforeUnmount = await page.evaluate(
    () => (window as unknown as { __trackStopCalls: number }).__trackStopCalls,
  );

  await clickButton(page, "#harness-unmount");
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { __trackStopCalls: number }).__trackStopCalls),
    )
    .toBeGreaterThan(stopCallsBeforeUnmount);
});
