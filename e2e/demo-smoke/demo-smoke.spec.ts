/**
 * 데모 앱의 각 섹션을 실브라우저로 열어 진입 스모크를 확인한다.
 *
 * - 섹션마다 콘솔 오류와 페이지 오류가 0건이어야 한다.
 * - 카메라를 켜는 섹션은 가짜 장치의 영상 프레임(videoWidth > 0)에 도달해야 한다.
 *
 * Playwright 번들 Chromium과 --use-fake-device-for-media-stream을 쓴다.
 * 실행은 `pnpm test:demo-smoke`로 한다. 실제 카메라와 Chrome 83 floor는 검증하지 않는다.
 */
import { expect, test } from "@playwright/test";

import { DEMO_SECTIONS } from "../../apps/demo/lib/demo-sections";

/**
 * 섹션별로 첫 진입 때 카메라 프레임에 도달해야 하는지 정한다.
 * false인 섹션은 의도적으로 카메라를 켜지 않거나 오류 상태를 보여 준다.
 */
const EXPECT_LIVE: Record<string, boolean> = {
  basic: true,
  controls: true,
  labels: true,
  controlled: true,
  "device-selection": true,
  "ref-handle": true,
  snapshot: true,
  state: true,
  "disabled-state": false, // disabled로 시작한다.
  "disabled-fallback": false, // disabled로 시작한다.
  "error-fallback": false, // 없는 장치를 고정해 오류를 보여 준다.
  recipes: true,
  "pause-resume": true,
  "use-webcam": true,
  "visual-debug": true,
};

/** 정규식 메타 문자를 이스케이프한다. */
function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("EXPECT_LIVE가 모든 데모 섹션을 정의한다", () => {
  expect(Object.keys(EXPECT_LIVE).sort()).toEqual(
    DEMO_SECTIONS.map((section) => section.id).sort(),
  );
});

for (const section of DEMO_SECTIONS) {
  test(`섹션 진입: ${section.title}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(`console: ${message.text()}`);
    });
    page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

    await page.goto("/");
    await page
      .getByRole("button", { name: new RegExp(`^${escapeRegExp(section.title)}`) })
      .first()
      .click();

    if (EXPECT_LIVE[section.id]) {
      await page.waitForFunction(
        () =>
          Array.from(document.querySelectorAll("video")).some(
            (video) => video.srcObject !== null && video.videoWidth > 0,
          ),
        undefined,
        { timeout: 15_000 },
      );
    } else {
      // 오류나 disabled 상태가 화면에 반영될 시간을 준다.
      await page.waitForTimeout(1_000);
    }

    expect(errors).toEqual([]);
  });
}
