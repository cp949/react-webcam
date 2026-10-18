/** 레지스트리 설치 검증 스크립트의 재시도와 버전 검사를 검증한다. 네트워크는 쓰지 않는다. */
import assert from "node:assert/strict";
import test from "node:test";
import { assertExactVersion, extractRuntimeExports, retry } from "./verify-registry-install.mjs";

/** 호출 횟수와 대기 간격을 기록하는 가짜 sleep을 만든다. */
function createSleepProbe() {
  const waits = [];
  return { waits, sleep: async (ms) => void waits.push(ms) };
}

test("첫 시도에 성공하면 대기하지 않는다", async () => {
  const { waits, sleep } = createSleepProbe();
  const result = await retry(async () => "ok", { attempts: 5, intervalMs: 30000, sleep });
  assert.equal(result, "ok");
  assert.deepEqual(waits, []);
});

test("실패 뒤 성공하면 시도 사이마다 간격만큼 대기하고 결과를 돌려준다", async () => {
  const { waits, sleep } = createSleepProbe();
  let calls = 0;
  const result = await retry(
    async () => {
      calls += 1;
      if (calls < 3) throw new Error(`실패 ${calls}`);
      return "ok";
    },
    { attempts: 5, intervalMs: 30000, sleep },
  );
  assert.equal(result, "ok");
  assert.equal(calls, 3);
  assert.deepEqual(waits, [30000, 30000]);
});

test("모든 시도가 실패하면 마지막 오류를 던지고 마지막 시도 뒤에는 대기하지 않는다", async () => {
  const { waits, sleep } = createSleepProbe();
  let calls = 0;
  await assert.rejects(
    retry(
      async () => {
        calls += 1;
        throw new Error(`실패 ${calls}`);
      },
      { attempts: 5, intervalMs: 30000, sleep },
    ),
    { message: "실패 5" },
  );
  assert.equal(calls, 5);
  assert.equal(waits.length, 4);
});

test("정확한 버전만 허용한다", () => {
  assert.doesNotThrow(() => assertExactVersion("2.0.0"));
  assert.doesNotThrow(() => assertExactVersion("2.1.0-rc.1"));
  for (const bad of ["", "latest", "v2.0.0", "^2.0.0", "2.0", undefined]) {
    assert.throws(() => assertExactVersion(bad), /버전/);
  }
});

test("index.ts에서 런타임 export 이름만 뽑고 타입 export는 제외한다", () => {
  const source = `
export { useA } from "./a.js";
export type { TypeA } from "./a.js";
export {
  funcB,
  funcC,
} from "./b.js";
export type {
  TypeB,
} from "./b.js";
export { CONST_D } from "./d.js";
`;
  assert.deepEqual(extractRuntimeExports(source), ["useA", "funcB", "funcC", "CONST_D"]);
});

test("실제 src/index.ts에서 Webcam과 useWebcam을 뽑는다", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../src/index.ts", import.meta.url), "utf8");
  const names = extractRuntimeExports(source);
  assert.ok(names.includes("Webcam"));
  assert.ok(names.includes("useWebcam"));
  assert.ok(!names.includes("WebcamHandle"));
});
