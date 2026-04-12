/**
 * media-devices 유틸의 에러 매핑과 환경 가드를 검증하는 테스트 파일이다.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BrowserMediaDevices,
  mapDomExceptionToErrorCode,
  WebcamRequestError,
} from "../src/utils/media-devices.js";

// ---------------------------------------------------------------------------
// 지정한 .name 값을 가진 Error를 만든다.
// ---------------------------------------------------------------------------
/** 테스트용으로 name 값을 고정한 Error 인스턴스를 만든다. */
function makeError(name: string, message = "test error"): Error {
  const err = new Error(message);
  Object.defineProperty(err, "name", { value: name, configurable: true });
  return err;
}

// ---------------------------------------------------------------------------
// mapDomExceptionToErrorCode
// ---------------------------------------------------------------------------
describe("mapDomExceptionToErrorCode", () => {
  it.each([
    ["NotAllowedError", "permission-denied"],
    ["PermissionDeniedError", "permission-denied"],
    ["NotFoundError", "device-not-found"],
    ["DevicesNotFoundError", "device-not-found"],
    ["NotReadableError", "device-in-use"],
    ["TrackStartError", "device-in-use"],
    ["OverconstrainedError", "constraints-unsatisfied"],
    ["ConstraintNotSatisfiedError", "constraints-unsatisfied"],
    ["SecurityError", "insecure-context"],
    ["AbortError", "aborted"],
    ["SomeOtherError", "unknown"],
  ] as const)("maps %s → %s", (name, expected) => {
    expect(mapDomExceptionToErrorCode(makeError(name))).toBe(expected);
  });

  it("maps non-Error value → unknown", () => {
    expect(mapDomExceptionToErrorCode("string error")).toBe("unknown");
    expect(mapDomExceptionToErrorCode(42)).toBe("unknown");
    expect(mapDomExceptionToErrorCode(null)).toBe("unknown");
    expect(mapDomExceptionToErrorCode(undefined)).toBe("unknown");
    expect(mapDomExceptionToErrorCode({ name: "NotAllowedError" })).toBe("unknown");
  });

  it("returns the errorCode from a WebcamRequestError unchanged (passthrough contract)", () => {
    expect(mapDomExceptionToErrorCode(new WebcamRequestError("device-not-found", ""))).toBe(
      "device-not-found",
    );
    expect(mapDomExceptionToErrorCode(new WebcamRequestError("track-ended", ""))).toBe(
      "track-ended",
    );
  });
});

// ---------------------------------------------------------------------------
// BrowserMediaDevices.requestUserMedia – environment guards
// ---------------------------------------------------------------------------
describe("BrowserMediaDevices.requestUserMedia", () => {
  describe("environment guards", () => {
    describe("when navigator.mediaDevices is absent", () => {
      let originalMediaDevices: MediaDevices;

      beforeEach(() => {
        originalMediaDevices = navigator.mediaDevices;
        Object.defineProperty(navigator, "mediaDevices", {
          value: undefined,
          configurable: true,
          writable: true,
        });
      });

      afterEach(() => {
        Object.defineProperty(navigator, "mediaDevices", {
          value: originalMediaDevices,
          configurable: true,
          writable: true,
        });
      });

      it("throws WebcamRequestError with errorCode unsupported-browser", async () => {
        await expect(BrowserMediaDevices.requestUserMedia({ video: true })).rejects.toSatisfy(
          (err: unknown) =>
            err instanceof WebcamRequestError && err.errorCode === "unsupported-browser",
        );
      });
    });

    describe("when window.isSecureContext is false", () => {
      let originalMediaDevices: MediaDevices;

      beforeEach(() => {
        originalMediaDevices = navigator.mediaDevices;
        // secure-context 검사까지 도달하도록 mediaDevices.getUserMedia를 미리 채워 둔다.
        Object.defineProperty(navigator, "mediaDevices", {
          value: { getUserMedia: () => Promise.resolve() },
          configurable: true,
          writable: true,
        });
        Object.defineProperty(globalThis, "isSecureContext", {
          value: false,
          configurable: true,
          writable: true,
        });
      });

      afterEach(() => {
        Object.defineProperty(navigator, "mediaDevices", {
          value: originalMediaDevices,
          configurable: true,
          writable: true,
        });
        // test-utils 기본값과 맞추기 위해 isSecureContext를 다시 true로 돌린다.
        Object.defineProperty(globalThis, "isSecureContext", {
          value: true,
          configurable: true,
          writable: false,
        });
      });

      it("throws WebcamRequestError with errorCode insecure-context", async () => {
        await expect(BrowserMediaDevices.requestUserMedia({ video: true })).rejects.toSatisfy(
          (err: unknown) =>
            err instanceof WebcamRequestError && err.errorCode === "insecure-context",
        );
      });
    });
  });
});

// ---------------------------------------------------------------------------
// buildMediaStreamConstraints — device selection strategy
// ---------------------------------------------------------------------------
import { buildMediaStreamConstraints } from "../src/utils/build-media-stream-constraints.js";

describe("buildMediaStreamConstraints – device selection", () => {
  it("default strategy (no deviceSelectionStrategy): deviceId uses ideal", () => {
    const c = buildMediaStreamConstraints(
      { audioEnabled: false, deviceId: "dev-1" },
      { width: 0, height: 0 },
    );
    expect((c.video as MediaTrackConstraints).deviceId).toEqual({ ideal: "dev-1" });
  });

  it("strategy exact: deviceId uses exact", () => {
    const c = buildMediaStreamConstraints(
      { audioEnabled: false, deviceId: "dev-1", deviceSelectionStrategy: "exact" } as any,
      { width: 0, height: 0 },
    );
    expect((c.video as MediaTrackConstraints).deviceId).toEqual({ exact: "dev-1" });
  });

  it("deviceId present: facingMode is removed from constraints", () => {
    const c = buildMediaStreamConstraints(
      { audioEnabled: false, deviceId: "dev-1", facingMode: "environment" },
      { width: 0, height: 0 },
    );
    expect((c.video as MediaTrackConstraints).facingMode).toBeUndefined();
  });

  it("no deviceId: facingMode is included in constraints", () => {
    const c = buildMediaStreamConstraints(
      { audioEnabled: false, facingMode: "environment" },
      { width: 0, height: 0 },
    );
    expect((c.video as MediaTrackConstraints).facingMode).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// BrowserMediaDevices enumerateDevices 계열 환경 가드
// ---------------------------------------------------------------------------
describe("BrowserMediaDevices enumerateDevices helpers", () => {
  let originalMediaDevices: MediaDevices;

  beforeEach(() => {
    originalMediaDevices = navigator.mediaDevices;
  });

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

  it("listDevices throws unsupported-browser when navigator.mediaDevices is absent", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      value: undefined,
      configurable: true,
      writable: true,
    });
    await expect(BrowserMediaDevices.listDevices()).rejects.toSatisfy(
      (err: unknown) =>
        err instanceof WebcamRequestError && err.errorCode === "unsupported-browser",
    );
  });

  it("findVideoInputById throws unsupported-browser when enumerateDevices is absent", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      value: {},
      configurable: true,
      writable: true,
    });
    await expect(BrowserMediaDevices.findVideoInputById("device-1")).rejects.toSatisfy(
      (err: unknown) =>
        err instanceof WebcamRequestError && err.errorCode === "unsupported-browser",
    );
  });

  it("listVideoDevices throws insecure-context when isSecureContext is false", async () => {
    Object.defineProperty(globalThis, "isSecureContext", {
      value: false,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(navigator, "mediaDevices", {
      value: { enumerateDevices: vi.fn() },
      configurable: true,
      writable: true,
    });
    await expect(BrowserMediaDevices.listVideoDevices()).rejects.toSatisfy(
      (err: unknown) => err instanceof WebcamRequestError && err.errorCode === "insecure-context",
    );
  });
});
