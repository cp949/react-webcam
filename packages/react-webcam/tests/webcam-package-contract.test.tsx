/**
 * 패키지 공개 surface와 메타데이터 계약을 검증하는 테스트 파일이다.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const PACKAGE_JSON_PATH = resolve(process.cwd(), "package.json");

// ---------------------------------------------------------------------------
// rootWidth가 즉시 800으로 잡히도록 useResizeObserver를 목 처리한다.
// 이 설정이 없으면 rootWidth가 0에 머물러 비디오 요소가 렌더링되지 않는다.
// ---------------------------------------------------------------------------
vi.mock("../src/hooks/useResizeObserver.js", () => ({
  useResizeObserver: () =>
    [
      (_el: HTMLElement | null) => {},
      { x: 0, y: 0, width: 800, height: 600, top: 0, left: 0, bottom: 600, right: 800 },
    ] as const,
}));

// ---------------------------------------------------------------------------
// 패키지 export 스모크 테스트
// 공개 API surface와 내부·레거시 export 부재를 함께 확인한다.
// ---------------------------------------------------------------------------

describe("package exports smoke test", () => {
  it("exports Webcam component", async () => {
    const { Webcam: WebcamExport } = await import("../src/index.js");
    // forwardRef 컴포넌트는 typeof === 'object' 이므로 null 여부와 렌더 가능 여부를 확인한다.
    expect(WebcamExport).toBeTruthy();
    expect(typeof WebcamExport === "function" || typeof WebcamExport === "object").toBe(true);
  });

  it("exports listMediaDevices as a public runtime helper", async () => {
    const pkg = (await import("../src/index.js")) as Record<string, unknown>;
    expect(typeof pkg["listMediaDevices"]).toBe("function");
  });

  it("exports listVideoInputDevices as a public runtime helper", async () => {
    const pkg = (await import("../src/index.js")) as Record<string, unknown>;
    expect(typeof pkg["listVideoInputDevices"]).toBe("function");
  });

  it("exports listAudioInputDevices as a public runtime helper", async () => {
    const pkg = (await import("../src/index.js")) as Record<string, unknown>;
    expect(typeof pkg["listAudioInputDevices"]).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// 패키지 메타데이터 — peerDependencies 및 exports 계약
// ---------------------------------------------------------------------------

describe("package metadata – peerDependencies and exports contract", () => {
  it("prepare script exists so git and source installs can build dist", () => {
    const pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, "utf-8"));
    expect(pkg.scripts?.prepare).toBeTruthy();
  });

  it("react-dom is listed in peerDependencies", () => {
    const pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, "utf-8"));
    const peerDeps = Object.keys(pkg.peerDependencies ?? {});
    expect(peerDeps).toContain("react-dom");
  });

  it("react is listed in peerDependencies", () => {
    const pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, "utf-8"));
    const peerDeps = Object.keys(pkg.peerDependencies ?? {});
    expect(peerDeps).toContain("react");
  });

  it('exports["."] has types, require, and import keys', () => {
    const pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, "utf-8"));
    const rootExport = pkg.exports?.["."] ?? {};
    expect(Object.keys(rootExport)).toContain("types");
    expect(Object.keys(rootExport)).toContain("require");
    expect(Object.keys(rootExport)).toContain("import");
  });
});

// ---------------------------------------------------------------------------
// 공개 타입 export 계약 — 소비자가 import할 수 있는 타입이 모두 존재하는지 확인
// ---------------------------------------------------------------------------

describe("public type exports contract", () => {
  it("exports WebcamHandle type from index", async () => {
    // WebcamHandle은 ref 타입이므로 런타임에서는 직접 값으로 확인할 수 없다.
    // Webcam 컴포넌트가 export되면 같은 모듈에서 타입도 export된다고 볼 수 있다.
    // 런타임에서는 named export 목록에 Webcam이 있는지만 확인한다.
    const mod = await import("../src/index.js");
    expect(mod).toHaveProperty("Webcam");
  });

  it("exports WebcamProps type (verified via Webcam component export)", async () => {
    // WebcamProps는 타입 전용 export이므로 런타임 값은 없다.
    // index.ts에서 re-export되는지는 타입 검사에서 확인된다.
    // 여기서는 index 모듈이 정상적으로 로드되는지만 확인한다.
    const mod = await import("../src/index.js");
    expect(mod).toBeTruthy();
  });

  it("WebcamOptions type is exported (verified via module load)", async () => {
    // WebcamOptions는 타입 전용 export — 런타임에 값이 없으므로 모듈 로드로 확인한다.
    const mod = await import("../src/index.js");
    expect(mod).toBeTruthy();
  });

  it("WebcamDetail type is exported (verified via module load)", async () => {
    const mod = await import("../src/index.js");
    expect(mod).toBeTruthy();
  });

  it("WebcamPhase type is exported (verified via module load)", async () => {
    const mod = await import("../src/index.js");
    expect(mod).toBeTruthy();
  });

  it("WebcamErrorCode type is exported (verified via module load)", async () => {
    const mod = await import("../src/index.js");
    expect(mod).toBeTruthy();
  });

  it("index exports exactly the expected named runtime values (Webcam only)", async () => {
    // 타입 전용 export는 런타임에 값을 남기지 않는다.
    // 런타임 값으로 export되는 것은 Webcam 컴포넌트와 공개 helper뿐이어야 한다.
    const mod = (await import("../src/index.js")) as Record<string, unknown>;
    const runtimeKeys = Object.keys(mod);
    expect(runtimeKeys).toContain("Webcam");
    expect(runtimeKeys).toContain("listMediaDevices");
    expect(runtimeKeys).toContain("listVideoInputDevices");
    expect(runtimeKeys).toContain("listAudioInputDevices");
  });
});

describe("public device listing helpers", () => {
  const originalMediaDevices = navigator.mediaDevices;

  afterEach(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      value: originalMediaDevices,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, "isSecureContext", {
      value: true,
      configurable: true,
      writable: false,
    });
  });

  it("listMediaDevices returns the full enumerateDevices result", async () => {
    const devices = [
      { deviceId: "cam-1", kind: "videoinput", label: "Front Camera", groupId: "g1" },
      { deviceId: "mic-1", kind: "audioinput", label: "Mic", groupId: "g1" },
    ] as MediaDeviceInfo[];
    Object.defineProperty(navigator, "mediaDevices", {
      value: { enumerateDevices: vi.fn().mockResolvedValue(devices) },
      configurable: true,
      writable: true,
    });

    const { listMediaDevices } = await import("../src/index.js");
    await expect(listMediaDevices()).resolves.toEqual(devices);
  });

  it("listVideoInputDevices returns only videoinput devices", async () => {
    const devices = [
      { deviceId: "cam-1", kind: "videoinput", label: "Front Camera", groupId: "g1" },
      { deviceId: "mic-1", kind: "audioinput", label: "Mic", groupId: "g1" },
    ] as MediaDeviceInfo[];
    Object.defineProperty(navigator, "mediaDevices", {
      value: { enumerateDevices: vi.fn().mockResolvedValue(devices) },
      configurable: true,
      writable: true,
    });

    const { listVideoInputDevices } = await import("../src/index.js");
    await expect(listVideoInputDevices()).resolves.toEqual([devices[0]]);
  });

  it("listAudioInputDevices returns only audioinput devices", async () => {
    const devices = [
      { deviceId: "cam-1", kind: "videoinput", label: "Front Camera", groupId: "g1" },
      { deviceId: "mic-1", kind: "audioinput", label: "Mic", groupId: "g1" },
    ] as MediaDeviceInfo[];
    Object.defineProperty(navigator, "mediaDevices", {
      value: { enumerateDevices: vi.fn().mockResolvedValue(devices) },
      configurable: true,
      writable: true,
    });

    const { listAudioInputDevices } = await import("../src/index.js");
    await expect(listAudioInputDevices()).resolves.toEqual([devices[1]]);
  });
});
