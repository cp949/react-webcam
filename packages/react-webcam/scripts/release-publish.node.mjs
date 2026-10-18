/** 릴리스 설정이 pnpm 배포에 대화형 터미널을 전달하고 dry-run을 보존하는지 검증한다. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const releaseConfig = JSON.parse(
  readFileSync(new URL("../.release-it.json", import.meta.url), "utf8"),
);
const { default: NpmPlugin } = await import(
  new URL("./plugin/npm/npm.js", import.meta.resolve("release-it"))
);

/** 실제 npm 플러그인을 사용하되 외부 명령 실행 경계에서 배포를 차단한다. */
function createPublishProbe({ isCI = false, isDryRun = false } = {}) {
  const calls = [];
  const plugin = new NpmPlugin({
    namespace: "npm",
    options: releaseConfig,
    container: {
      config: { isCI, isDryRun, getContext: () => ({}), setContext() {} },
      prompt: { register() {}, show: ({ task }) => task() },
      spinner: { show: ({ task }) => task() },
      shell: {
        exec: async (command, options) => {
          calls.push({ command, interactive: options.interactive });
          return "";
        },
      },
    },
  });
  plugin.setContext({ name: "@cp949/react-webcam", private: false, tag: "latest" });
  return { plugin, calls };
}

test("일반 릴리스는 pnpm에 대화형 입출력을 전달한다", async () => {
  const { plugin, calls } = createPublishProbe();
  await plugin.release();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].command[0], "pnpm");
  assert.equal(calls[0].command[1], "publish");
  assert.ok(calls[0].command.includes("--no-git-checks"));
  assert.equal(calls[0].interactive, true);
  assert.equal(releaseConfig.hooks?.["after:release"], undefined);
});

test("CI dry-run은 배포 명령에 --dry-run을 전달한다", async () => {
  const { plugin, calls } = createPublishProbe({ isCI: true, isDryRun: true });
  await plugin.release();
  assert.equal(calls.length, 1);
  assert.ok(calls[0].command.includes("--dry-run"));
  assert.equal(calls[0].interactive, false);
});
