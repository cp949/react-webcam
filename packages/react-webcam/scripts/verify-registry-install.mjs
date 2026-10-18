#!/usr/bin/env node
/**
 * 레지스트리에 게시된 패키지를 임시 프로젝트에 설치해 소비자 관점으로 검증한다.
 *
 * 사용법: node scripts/verify-registry-install.mjs <정확한 버전>
 *
 * 검증 항목:
 * - 설치된 버전이 요청한 버전과 같다.
 * - ESM `import`와 CJS `require`로 공개 런타임 export를 읽는다.
 * - TypeScript가 공개 타입을 해석하고 JSX로 `Webcam`을 쓸 수 있다.
 *
 * 기대하는 런타임 export는 `src/index.ts`에서 뽑는다. 워크플로는 태그 커밋을 체크아웃하므로
 * 게시한 버전의 공개 표면과 일치한다.
 *
 * 환경 변수:
 * - VERIFY_INDEX_SOURCE: 기대 export를 뽑을 index.ts 경로. 기본 `../src/index.ts`.
 * - VERIFY_ATTEMPTS: 설치 재시도 횟수. 기본 5.
 * - VERIFY_INTERVAL_MS: 재시도 간격. 기본 30000.
 *
 * 게시 직후에는 레지스트리 전파 지연으로 설치가 실패할 수 있어 설치만 재시도한다.
 */
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);

const PACKAGE_NAME = "@cp949/react-webcam";

const TYPE_CHECK_SOURCE = `import { Webcam, useWebcam } from "${PACKAGE_NAME}";
import type { WebcamDetail, WebcamHandle, WebcamOptions, WebcamProps } from "${PACKAGE_NAME}";

declare const handle: WebcamHandle;
declare const detail: WebcamDetail;
declare const options: WebcamOptions;
declare const props: WebcamProps;

export const detailPhase: string = detail.phase;
export const canvas: HTMLCanvasElement | null = handle.snapshotToCanvas();
export const element = <Webcam {...props} webcamOptions={options} />;
export const hook = useWebcam;
`;

const TSCONFIG = {
  compilerOptions: {
    strict: true,
    noEmit: true,
    module: "esnext",
    moduleResolution: "bundler",
    target: "es2020",
    lib: ["es2020", "dom"],
    jsx: "react-jsx",
    types: [],
  },
  include: ["check.tsx"],
};

/** `export { a, b } from` 형태의 런타임 export 이름을 뽑는다. `export type`은 제외한다. */
export function extractRuntimeExports(source) {
  const names = [];
  for (const match of source.matchAll(/^export \{([^}]*)\} from/gm)) {
    for (const entry of match[1].split(",")) {
      const name = entry.trim();
      if (name) names.push(name);
    }
  }
  return names;
}

/** `latest`나 범위가 아닌 정확한 버전만 받는다. 태그 버전 설치 검증이 목적이다. */
export function assertExactVersion(version) {
  if (typeof version !== "string" || !/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error(`정확한 버전이 필요하다. 받은 값: ${JSON.stringify(version)}`);
  }
}

/** 작업이 실패하면 간격을 두고 다시 시도한다. 모두 실패하면 마지막 오류를 던진다. */
export async function retry(task, { attempts, intervalMs, sleep, onRetry }) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await task(attempt);
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      onRetry?.(attempt, error);
      await sleep(intervalMs);
    }
  }
  throw lastError;
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** 명령을 실행하고 실패하면 명령과 출력을 담은 오류를 던진다. */
async function exec(command, args, cwd) {
  try {
    return await run(command, args, { cwd });
  } catch (error) {
    const output = [error.stdout, error.stderr].filter(Boolean).join("\n").trim();
    throw new Error(`${command} ${args.join(" ")} 실패\n${output}`, { cause: error });
  }
}

/** 임시 프로젝트에 정확한 버전을 설치한다. 타입 검사용 도구도 함께 설치한다. */
async function installFromRegistry(projectDir, version) {
  await exec(
    "npm",
    [
      "install",
      "--no-audit",
      "--no-fund",
      "--ignore-scripts",
      "--save-exact",
      `${PACKAGE_NAME}@${version}`,
      "react",
      "react-dom",
      "typescript",
      "@types/react",
      "@types/react-dom",
    ],
    projectDir,
  );
}

/** node_modules에 설치된 버전이 요청한 버전과 같은지 확인한다. */
async function assertInstalledVersion(projectDir, version) {
  const manifestPath = path.join(projectDir, "node_modules", PACKAGE_NAME, "package.json");
  const installed = JSON.parse(await readFile(manifestPath, "utf8")).version;
  if (installed !== version) {
    throw new Error(`설치된 버전이 다르다. 요청 ${version}, 설치 ${installed}`);
  }
}

/** 공개 런타임 export가 모두 있는지 확인하는 검사 코드를 만든다. */
function exportCheckSource(loader, runtimeExports) {
  return `const pkg = ${loader};
const missing = ${JSON.stringify(runtimeExports)}.filter((name) => !(name in pkg));
if (missing.length > 0) {
  console.error("누락된 export: " + missing.join(", "));
  process.exit(1);
}
`;
}

async function verifyEsm(projectDir, runtimeExports) {
  await writeFile(
    path.join(projectDir, "check.mjs"),
    exportCheckSource(`await import("${PACKAGE_NAME}")`, runtimeExports),
  );
  await exec("node", ["check.mjs"], projectDir);
}

async function verifyCjs(projectDir, runtimeExports) {
  await writeFile(
    path.join(projectDir, "check.cjs"),
    exportCheckSource(`require("${PACKAGE_NAME}")`, runtimeExports),
  );
  await exec("node", ["check.cjs"], projectDir);
}

async function verifyTypes(projectDir) {
  await writeFile(path.join(projectDir, "check.tsx"), TYPE_CHECK_SOURCE);
  await writeFile(path.join(projectDir, "tsconfig.json"), JSON.stringify(TSCONFIG, null, 2));
  await exec("npx", ["--no-install", "tsc", "-p", "."], projectDir);
}

/** 레지스트리에서 설치한 패키지를 검증한다. */
export async function verifyRegistryInstall(
  version,
  { attempts, intervalMs, indexSourcePath, log = console.log },
) {
  assertExactVersion(version);
  const runtimeExports = extractRuntimeExports(await readFile(indexSourcePath, "utf8"));
  if (runtimeExports.length === 0) {
    throw new Error(`${indexSourcePath}에서 런타임 export를 찾지 못했다.`);
  }
  const projectDir = await mkdtemp(path.join(tmpdir(), "react-webcam-registry-"));
  try {
    await writeFile(
      path.join(projectDir, "package.json"),
      JSON.stringify({ name: "registry-install-check", private: true, type: "module" }),
    );

    log(`${PACKAGE_NAME}@${version} 설치를 시도한다. 최대 ${attempts}회, 간격 ${intervalMs}ms.`);
    await retry(() => installFromRegistry(projectDir, version), {
      attempts,
      intervalMs,
      sleep: delay,
      onRetry: (attempt, error) =>
        log(`설치 ${attempt}회 실패. ${intervalMs}ms 뒤 다시 시도한다.\n${error.message}`),
    });

    await assertInstalledVersion(projectDir, version);
    log("설치 버전 확인 통과.");
    await verifyEsm(projectDir, runtimeExports);
    log("ESM import 통과.");
    await verifyCjs(projectDir, runtimeExports);
    log("CJS require 통과.");
    await verifyTypes(projectDir);
    log("타입 검사 통과.");
  } finally {
    await rm(projectDir, { recursive: true, force: true });
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  try {
    await verifyRegistryInstall(process.argv[2], {
      attempts: Number(process.env.VERIFY_ATTEMPTS ?? 5),
      intervalMs: Number(process.env.VERIFY_INTERVAL_MS ?? 30000),
      indexSourcePath:
        process.env.VERIFY_INDEX_SOURCE ??
        fileURLToPath(new URL("../src/index.ts", import.meta.url)),
    });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
