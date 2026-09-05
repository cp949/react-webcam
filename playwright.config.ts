import { defineConfig, devices } from "@playwright/test";

const CHROME83_PREVIEW_PORT = 4501;

// Playwright는 --project 필터와 무관하게 webServer 배열과 project 정의를
// 항상 평가한다(scrolla가 겪은 문제). CHROME83_WEBSERVER 없이 host에서
// `playwright test`를 그대로 돌리면 존재하지 않는 /usr/bin/chromium
// executablePath 때문에 실패하므로, project 정의 자체를 게이트한다
// (inspecta가 scrolla의 이 실패를 고친 패턴).
const chrome83Gate = Boolean(process.env.CHROME83_WEBSERVER);

export default defineConfig({
  testDir: "./e2e/chrome83-floor",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  reporter: "list",
  // run-chrome83-floor.mjs가 컨테이너의 no-TTY pnpm 확인 프롬프트를 우회하려고
  // CI=true를 설정한다. @playwright/test@1.62.1 자체는 CI 환경변수를 보고
  // retries 기본값을 0에서 2로 올리지 않는다(그 패턴은 npm init playwright가
  // 만드는 설정 템플릿에만 있다) — 다만 CI 감지에 따라 기본 reporter는
  // 실제로 달라지므로(그래서 위 reporter: "list"를 명시한다), 재현성을 위해
  // retries도 상황과 무관하게 0으로 명시 고정한다.
  retries: 0,
  webServer: chrome83Gate
    ? [
        {
          command:
            "pnpm --filter chrome83-floor-e2e build && node e2e/chrome83-floor/scripts/serve.mjs",
          url: `http://127.0.0.1:${CHROME83_PREVIEW_PORT}/index.html`,
          // 매번 새 컨테이너로 도는 1회성 검증이라 서버 재사용 이득이 없고,
          // stale preview 재사용은 거짓 통과/거짓 실패를 만든다.
          reuseExistingServer: false,
          timeout: 60_000,
        },
      ]
    : [],
  projects: chrome83Gate
    ? [
        {
          // Chrome83(Debian snapshot 고정 바이너리, docker/chrome83) floor
          // validation 전용. 공식 호환성 목표는 Chrome75(ADR 0001)이지만
          // Playwright/CDP 제약으로 83이 실제 검증 가능한 최소 버전이다.
          // "Chrome 83 자동 검증 통과"로만 기록하고 "Chrome 75 실행"으로
          // 표기하지 않는다.
          name: "chrome83-floor",
          use: {
            ...devices["Desktop Chrome"],
            baseURL: `http://127.0.0.1:${CHROME83_PREVIEW_PORT}`,
            launchOptions: {
              executablePath: "/usr/bin/chromium",
              args: [
                "--no-sandbox",
                "--use-fake-device-for-media-stream",
                "--use-fake-ui-for-media-stream",
              ],
            },
          },
        },
      ]
    : [],
});
