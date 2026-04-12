/**
 * 브라우저 MediaDevices API 어댑터 모듈이다.
 *
 * 이 모듈은 브라우저 API 의존을 한 곳에 모으는 경계 역할을 한다.
 * 외부 코드는 `navigator.mediaDevices`를 직접 호출하는 대신 이 모듈을 통해 접근한다.
 *
 * 책임:
 * - 브라우저 지원 여부 검사 (`requestUserMedia` 내부)
 * - 보안 컨텍스트(HTTPS) 검사 (`requestUserMedia` 내부)
 * - 스트림 중지 (`stopStream`)
 * - 디바이스 목록 조회 (`listDevices`, `listVideoDevices`, `listAudioDevices`)
 *
 * 에러 계약:
 * - 지원/보안 문제는 `WebcamRequestError`로 throw한다.
 * - getUserMedia 실패는 DOMException을 그대로 전파하며, 호출측에서 `mapDomExceptionToErrorCode`로 변환한다.
 */
import type { WebcamErrorCode } from "../webcam-types.js";

/**
 * `BrowserMediaDevices.requestUserMedia`가 던지는 typed 에러다.
 * 브라우저 예외를 그대로 노출하는 대신 라이브러리 내부 에러 코드를 함께 담는다.
 */
export class WebcamRequestError extends Error {
  constructor(
    public readonly errorCode: WebcamErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "WebcamRequestError";
  }
}

/**
 * DOMException(또는 임의의 unknown 값)을 `WebcamErrorCode`로 변환한다.
 * `WebcamRequestError`는 이미 errorCode를 가지고 있으므로 그대로 반환한다.
 */
export function mapDomExceptionToErrorCode(err: unknown): WebcamErrorCode {
  if (err instanceof WebcamRequestError) {
    return err.errorCode;
  }

  const name = err instanceof Error ? err.name : "";

  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return "permission-denied";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "device-not-found";
    case "NotReadableError":
    case "TrackStartError":
      return "device-in-use";
    case "OverconstrainedError":
    case "ConstraintNotSatisfiedError":
      return "constraints-unsatisfied";
    case "SecurityError":
      return "insecure-context";
    case "AbortError":
      return "aborted";
    default:
      return "unknown";
  }
}

function getBrowserMediaDevices(): MediaDevices {
  if (typeof navigator === "undefined" || !navigator.mediaDevices) {
    throw new WebcamRequestError(
      "unsupported-browser",
      "navigator.mediaDevices is not supported in this browser",
    );
  }
  return navigator.mediaDevices;
}

function assertSecureContext() {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    throw new WebcamRequestError(
      "insecure-context",
      "getUserMedia requires a secure context (HTTPS or localhost)",
    );
  }
}

export class BrowserMediaDevices {
  /**
   * 지정한 제약 조건으로 사용자 미디어 스트림을 요청한다.
   *
   * 브라우저 지원 여부와 보안 컨텍스트를 먼저 확인하고,
   * 조건을 충족하지 못하면 `WebcamRequestError`를 던진다.
   * getUserMedia 자체가 실패하면 DOMException을 그대로 전파한다
   * (호출측에서 `mapDomExceptionToErrorCode`로 변환한다).
   */
  static requestUserMedia = async (constraints: MediaStreamConstraints): Promise<MediaStream> => {
    const mediaDevices = getBrowserMediaDevices();
    if (!mediaDevices.getUserMedia) {
      throw new WebcamRequestError(
        "unsupported-browser",
        "navigator.mediaDevices.getUserMedia is not supported in this browser",
      );
    }
    assertSecureContext();
    return await mediaDevices.getUserMedia(constraints);
  };

  /** 전달된 스트림의 모든 트랙을 중지한다. */
  static stopStream = (stream: MediaStream | undefined | null) => {
    if (!stream) return;
    if (stream.getTracks) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
    }
  };

  /** 전체 디바이스 또는 지정한 종류의 입력 디바이스 목록을 조회한다. */
  static listDevices = async (kind?: "videoinput" | "audioinput"): Promise<MediaDeviceInfo[]> => {
    const mediaDevices = getBrowserMediaDevices();
    if (!mediaDevices.enumerateDevices) {
      throw new WebcamRequestError(
        "unsupported-browser",
        "navigator.mediaDevices.enumerateDevices is not supported in this browser",
      );
    }
    assertSecureContext();
    const devices = await mediaDevices.enumerateDevices();
    if (!kind) {
      return devices;
    }
    return devices.filter((it) => it.kind === kind);
  };

  /** 사용 가능한 비디오 입력 디바이스 목록을 조회한다. */
  static listVideoDevices = async (): Promise<MediaDeviceInfo[]> => {
    return this.listDevices("videoinput");
  };

  /** 사용 가능한 오디오 입력 디바이스 목록을 조회한다. */
  static listAudioDevices = async (): Promise<MediaDeviceInfo[]> => {
    return this.listDevices("audioinput");
  };

  /** 디바이스 ID로 비디오 입력 디바이스를 찾는다. */
  static findVideoInputById = async (deviceId: string): Promise<MediaDeviceInfo | undefined> => {
    const devices = await this.listDevices("videoinput");
    return devices.find((it) => it.kind === "videoinput" && it.deviceId === deviceId);
  };
}
