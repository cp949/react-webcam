/**
 * HTTP와 iframe 정책 차단을 구분하고 확인되지 않은 권한 거부 원인을 보존한다.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  listDevices,
  mapDomExceptionToErrorCode,
  requestUserMedia,
} from "../src/utils/media-devices.js";
import { errorCodeToPhase } from "../src/utils/webcam-controller-state.js";

const originalMediaDevices = navigator.mediaDevices;

afterEach(() => {
  Object.defineProperty(navigator, "mediaDevices", {
    value: originalMediaDevices,
    configurable: true,
  });
  vi.unstubAllGlobals();
});

describe("미디어 환경 에러 분류", () => {
  it.each(["requestUserMedia", "listDevices"] as const)(
    "%s는 HTTP에서 API가 없어도 insecure-context로 분류한다",
    async (method) => {
      vi.stubGlobal("isSecureContext", false);
      Object.defineProperty(navigator, "mediaDevices", {
        value: undefined,
        configurable: true,
      });

      const request =
        method === "requestUserMedia" ? requestUserMedia({ video: true }) : listDevices();

      await expect(request).rejects.toMatchObject({ errorCode: "insecure-context" });
    },
  );

  it("SecurityError를 HTTP 문제로 단정하지 않는다", () => {
    const code = mapDomExceptionToErrorCode(new DOMException("disabled", "SecurityError"));
    expect(code).toBe("security-error");
    expect(errorCodeToPhase(code)).toBe("error");
  });

  it.each(["permissionsPolicy", "featurePolicy"])(
    "%s로 카메라 차단을 확인하면 권한 요청 전에 policy-blocked로 알린다",
    async (property) => {
      const getUserMedia = vi.fn();
      Object.defineProperty(navigator, "mediaDevices", {
        value: { getUserMedia },
        configurable: true,
      });
      Object.defineProperty(document, property, {
        value: { allowsFeature: () => false },
        configurable: true,
      });
      try {
        await expect(requestUserMedia({ video: true })).rejects.toMatchObject({
          errorCode: "policy-blocked",
        });
        expect(getUserMedia).not.toHaveBeenCalled();
      } finally {
        Reflect.deleteProperty(document, property);
      }
    },
  );

  it("요청하지 않은 마이크의 정책 차단은 카메라 요청을 막지 않는다", async () => {
    const stream = {};
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia },
      configurable: true,
    });
    Object.defineProperty(document, "permissionsPolicy", {
      value: { allowsFeature: (feature: string) => feature === "camera" },
      configurable: true,
    });
    try {
      await expect(requestUserMedia({ video: true, audio: false })).resolves.toBe(stream);
      await expect(requestUserMedia({ video: true, audio: true })).rejects.toMatchObject({
        errorCode: "policy-blocked",
      });
      expect(getUserMedia).toHaveBeenCalledTimes(1);
    } finally {
      Reflect.deleteProperty(document, "permissionsPolicy");
    }
  });

  it("정책 차단이 확인되지 않은 NotAllowedError는 원본을 보존한다", async () => {
    const error = new DOMException("denied", "NotAllowedError");
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: vi.fn().mockRejectedValue(error) },
      configurable: true,
    });
    await expect(requestUserMedia({ video: true })).rejects.toBe(error);
    expect(mapDomExceptionToErrorCode(error)).toBe("permission-denied");
  });
});
