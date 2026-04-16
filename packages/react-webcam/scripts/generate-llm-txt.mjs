/**
 * 패키지 빌드 산출물과 메타데이터를 읽어 최종 `llm.txt` 파일을 생성하는 실행 스크립트다.
 */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { extractDeclarationsFromDtsText, renderLlmTxt } from "./llm-txt-generator.mjs";

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST_DTS_PATH = resolve(PACKAGE_ROOT, "dist/index.d.ts");
const PACKAGE_JSON_PATH = resolve(PACKAGE_ROOT, "package.json");
const OUTPUT_PATH = resolve(PACKAGE_ROOT, "llm.txt");

const KEY_SYMBOLS = [
  "Webcam",
  "WebcamHandle",
  "WebcamDetail",
  "WebcamOptions",
  "WebcamProps",
  "WebcamPhase",
  "WebcamErrorCode",
  "SnapshotOptions",
  "listMediaDevices",
  "listVideoInputDevices",
  "listAudioInputDevices",
];

const GUIDANCE = {
  disabled:
    "Use disabled as a stream-request gate: the webcam stays mounted, but it must not request camera access yet.",
  snapshotToCanvas:
    "snapshotToCanvas() may return null before the webcam is ready, so always null-check before using the canvas.",
  deviceSelection:
    "When you need a specific camera, pair deviceId with deviceSelectionStrategy=\"exact\"; use \"ideal\" when you only want a preference.",
  playbackError:
    "Autoplay or playback failures should surface as playback-error; resumePlayback() may still fail under autoplay policy and should be treated as a best-effort retry.",
  trackEnded:
    "Track-ended guidance should tell consumers to listen for track-ended and restart the stream when the camera stops.",
  controlledMode:
    "Controlled-mode guidance should explain that webcamOptions plus onWebcamOptionsChange is the fully controlled path, while defaultWebcamOptions is for uncontrolled ownership.",
  pausePlayback:
    "pausePlayback() pauses only playback, does not stop the camera hardware, and does not emit onStateChange by itself.",
  antiPattern:
    "Avoid anti-patterns like assuming playback-error means permission denial or calling pausePlayback() to stop hardware.",
};

/**
 * 패키지 메타데이터와 declaration 출력을 조합해 `llm.txt`를 기록한다.
 */
async function main() {
  const [packageJsonRaw, dtsText] = await Promise.all([
    readFile(PACKAGE_JSON_PATH, "utf8"),
    readFile(DIST_DTS_PATH, "utf8"),
  ]);

  const packageJson = JSON.parse(packageJsonRaw);
  const declarations = extractDeclarationsFromDtsText(dtsText, KEY_SYMBOLS);
  const output = renderLlmTxt({
    packageJson,
    declarationText: dtsText,
    keySymbols: KEY_SYMBOLS,
    declarations,
    guidance: GUIDANCE,
  });

  await writeFile(OUTPUT_PATH, output, "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
