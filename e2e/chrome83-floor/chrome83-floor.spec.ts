import { expect, test } from "@playwright/test";

test("Chrome83에서 마운트, getUserMedia, 스냅샷, unmount 시 track stop을 검증한다", async ({ page }) => {
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

  const snapshotButton = page.getByRole("button", { name: "스냅샷" });
  await expect(snapshotButton).toBeVisible({ timeout: 15_000 });

  await snapshotButton.click();
  await expect(page.getByAltText("snapshot preview")).toBeVisible();

  const stopCallsBeforeUnmount = await page.evaluate(
    () => (window as unknown as { __trackStopCalls: number }).__trackStopCalls,
  );

  await page.getByRole("button", { name: "언마운트" }).click();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __trackStopCalls: number }).__trackStopCalls))
    .toBeGreaterThan(stopCallsBeforeUnmount);
});
