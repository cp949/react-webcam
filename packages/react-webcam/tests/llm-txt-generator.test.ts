/**
 * llm.txt 생성 계약을 잠그는 테스트 파일이다.
 */
/// <reference path="./types/llm-txt-generator.d.ts" />
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { extractDeclarationsFromDtsText, renderLlmTxt } from "../scripts/llm-txt-generator.mjs";

const PACKAGE_JSON_PATH = resolve(process.cwd(), "package.json");
const DECLARATION_TEXT = `
declare function listMediaDevices(): Promise<MediaDeviceInfo[]>;
declare function listVideoInputDevices(): Promise<MediaDeviceInfo[]>;
declare function listAudioInputDevices(): Promise<MediaDeviceInfo[]>;

type WithVideoSize = {
  videoSize?: {
    width: number;
    height: number;
  };
};

type WebcamDetailError = WithVideoSize & {
  phase: "denied" | "unavailable" | "unsupported" | "insecure" | "error";
  errorCode: WebcamErrorCode;
  error: Error;
  constraints: MediaStreamConstraints;
};

type WebcamDetail =
  | (WithVideoSize & {
      phase: "idle";
    })
  | (WithVideoSize & {
      phase: "requesting";
      constraints: MediaStreamConstraints;
    })
  | (WithVideoSize & {
      phase: "live";
      mediaStream: MediaStream;
      constraints: MediaStreamConstraints;
    })
  | (WithVideoSize & {
      phase: "playback-error";
      mediaStream: MediaStream;
      constraints: MediaStreamConstraints;
      error: Error;
    })
  | WebcamDetailError;

type WebcamOptions = {
  audioEnabled?: boolean;
  size?: { width?: number; height?: number } | "element-size";
  aspectRatio?: number;
  deviceId?: string;
  facingMode?: "user" | "environment";
  deviceSelectionStrategy?: "ideal" | "exact";
  frameRate?: number;
  maxFrameRate?: number;
};

type WebcamLabels = {
  snapshot?: string;
  flip?: string;
  cameraDirection?: string;
  facingModeBack?: string;
  facingModeFront?: string;
  facingModeDefault?: string;
  aspectRatio?: string;
  aspectRatioAuto?: string;
};

interface WebcamProps {
  style?: React.CSSProperties;
  className?: string;
  disabled?: boolean;
  disabledFallback?: React.ReactNode;
  errorFallback?: React.ReactNode | ((detail: WebcamDetail) => React.ReactNode);
  onStateChange?: (state: WebcamDetail) => void;
  fitMode?: "unset" | "fill" | "cover" | "contain";
  flipped?: boolean;
  onFlippedChange?: (value: boolean) => void;
  defaultFlipped?: boolean;
  webcamOptions?: WebcamOptions;
  onWebcamOptionsChange?: (options: WebcamOptions) => void;
  defaultWebcamOptions?: WebcamOptions;
  visibleFlipButton?: boolean;
  visibleCameraDirectionButton?: boolean;
  visibleAspectRatioButton?: boolean;
  visibleSnapshotButton?: boolean;
  visibleVideoSizeDebug?: boolean;
  visibleConstraintsDebug?: boolean;
  labels?: WebcamLabels;
  children?: React.ReactNode;
}

type SnapshotOptions = {
  imageSmoothEnabled?: boolean;
  canvas?: HTMLCanvasElement;
  sizeConstraints?: { maxWidth: number } | { maxHeight: number };
};

type WebcamHandle = {
  snapshotToCanvas: (options?: SnapshotOptions) => HTMLCanvasElement | null;
  getPlayingVideoDeviceId: () => string | undefined;
  getPlayingAudioDeviceId: () => string | undefined;
  setFlipped: (value: boolean | ((prev: boolean) => boolean)) => void;
  setWebcamOptions: (
    updater: WebcamOptions | undefined | ((prev: WebcamOptions) => WebcamOptions),
  ) => void;
  pausePlayback: () => void;
  resumePlayback: () => void;
};

declare const Webcam: React.ForwardRefExoticComponent<WebcamProps & React.RefAttributes<WebcamHandle>>;

type WebcamPhase = "idle" | "requesting" | "live" | "playback-error" | "denied" | "unavailable" | "unsupported" | "insecure" | "error";
type WebcamErrorCode = "permission-denied" | "device-not-found" | "device-in-use" | "constraints-unsatisfied" | "unsupported-browser" | "insecure-context" | "aborted" | "track-ended" | "unknown";

export { Webcam, listMediaDevices, listVideoInputDevices, listAudioInputDevices };
export type { SnapshotOptions, WebcamDetail, WebcamErrorCode, WebcamHandle, WebcamOptions, WebcamPhase, WebcamProps };
`;

/** 패키지 메타데이터에서 llm.txt 생성 입력에 필요한 필드만 읽는다. */
function readPackageJson() {
  return JSON.parse(readFileSync(PACKAGE_JSON_PATH, "utf-8")) as {
    name: string;
    version: string;
    description?: string;
  };
}

/** 생성기 테스트에 공통으로 쓰는 입력 픽스처를 만든다. */
function createFixture() {
  const pkg = readPackageJson();

  return {
    packageJson: pkg,
    declarationText: DECLARATION_TEXT,
    keySymbols: [
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
    ],
    guidance: {
      disabled:
        "Use disabled as a stream-request gate: the webcam stays mounted, but it must not request camera access yet.",
      snapshotToCanvas:
        "snapshotToCanvas() may return null before the webcam is ready, so always null-check before using the canvas.",
      deviceSelection:
        'When you need a specific camera, pair deviceId with deviceSelectionStrategy="exact"; use "ideal" when you only want a preference.',
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
    },
  };
}

/** 생성 결과에서 Imports 섹션만 잘라 검증할 수 있게 분리한다. */
function readImportsSection(output: string) {
  const start = output.indexOf("## Imports");
  const end = output.indexOf("## Key APIs");

  if (start < 0 || end < 0 || end <= start) {
    return "";
  }

  return output.slice(start, end);
}

describe("llm.txt 생성 계약", () => {
  it("패키지 헤더와 핵심 API, 사용 가이드를 함께 렌더링한다", () => {
    const output = renderLlmTxt(createFixture());
    const { packageJson } = createFixture();

    expect(output).toContain(packageJson.name);
    expect(output).toContain(packageJson.version);
    expect(output).toContain("Key API");
    expect(output).toContain("Webcam");
    expect(output).toContain("WebcamHandle");
    expect(output).toContain("WebcamDetail");
    expect(output).toContain("WebcamOptions");
    expect(output).toContain("WebcamProps");
    expect(output).toContain("WebcamPhase");
    expect(output).toContain("WebcamErrorCode");
    expect(output).toContain("SnapshotOptions");
    expect(output).toContain("listMediaDevices");
    expect(output).toContain("listVideoInputDevices");
    expect(output).toContain("listAudioInputDevices");
    expect(output).toContain("disabled");
    expect(output).toContain("stream-request gate");
    expect(output).toContain("snapshotToCanvas() may return null");
    expect(output).toContain("deviceId");
    expect(output).toContain('deviceSelectionStrategy="exact"');
    expect(output).toContain("playback-error");
    expect(output).toContain("best-effort retry");
    expect(output).toContain("track-ended");
    expect(output).toContain("controlled");
    expect(output).toContain("onWebcamOptionsChange");
    expect(output).toContain("defaultWebcamOptions");
    expect(output).toContain("pausePlayback()");
    expect(output).toContain("does not stop the camera hardware");
    expect(output).toContain("does not emit onStateChange");
    expect(output).toMatch(/anti[- ]pattern/i);
  });

  it("import 가이드는 공개 export만 포함하고 내부 헬퍼 타입은 제외한다", () => {
    const output = renderLlmTxt(createFixture());
    const importsSection = readImportsSection(output);

    expect(importsSection).toContain("Webcam");
    expect(importsSection).toContain("WebcamDetail");
    expect(importsSection).toContain("WebcamProps");
    expect(importsSection).toContain("SnapshotOptions");
    expect(importsSection).toContain("listMediaDevices");
    expect(importsSection).toContain("Import from the package root only");
    expect(importsSection).not.toContain("WithVideoSize");
    expect(importsSection).not.toContain("WebcamDetailError");
  });

  it("내부 헬퍼 타입을 독립적인 Key API 헤딩으로 승격하지 않는다", () => {
    const output = renderLlmTxt(createFixture());

    expect(output).not.toContain("### `WithVideoSize`");
    expect(output).not.toContain("### `WebcamDetailError`");
    expect(output).not.toContain("### `WebcamLabels`");
  });

  it("ref 기반 스냅샷 예시는 캡처 결과를 null 체크하는 흐름을 포함한다", () => {
    const output = renderLlmTxt(createFixture());

    expect(output).toContain("useRef");
    expect(output).toContain("snapshotToCanvas()");
    expect(output).toContain("if (!canvas) return;");
    expect(output).toContain("Take snapshot");
  });

  it("선언을 미리 추출해도 declarationText에서 바로 읽어도 같은 결과를 만든다", () => {
    const fixture = createFixture();
    const preExtracted = extractDeclarationsFromDtsText(
      fixture.declarationText,
      fixture.keySymbols,
    );

    const fromText = renderLlmTxt(fixture);
    const fromDeclarations = renderLlmTxt({
      packageJson: fixture.packageJson,
      declarationText: fixture.declarationText,
      keySymbols: fixture.keySymbols,
      declarations: preExtracted,
      guidance: fixture.guidance,
    });

    expect(fromText).toBe(fromDeclarations);
  });

  it("동등한 입력에는 항상 같은 출력을 만들고 입력 픽스처는 변형하지 않는다", () => {
    const input = createFixture();
    const clone = JSON.parse(JSON.stringify(input)) as ReturnType<typeof createFixture>;
    const before = JSON.stringify(input);

    const first = renderLlmTxt(input);
    const second = renderLlmTxt(clone);

    expect(first).toBe(second);
    expect(JSON.stringify(input)).toBe(before);
  });
});
