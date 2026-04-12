/**
 * webcam-controller-state 순수 헬퍼를 검증하는 단위 테스트 파일이다.
 */

import { describe, expect, it } from "vitest";
import {
  errorCodeToPhase,
  mediaStreamResultFromDetail,
  patchDetailVideoSize,
} from "../src/utils/webcam-controller-state.js";
import type { WebcamDetail, WebcamErrorCode } from "../src/webcam-types.js";

// ---------------------------------------------------------------------------
// errorCodeToPhase
// ---------------------------------------------------------------------------

describe("errorCodeToPhase", () => {
  it.each<[WebcamErrorCode, string]>([
    ["permission-denied", "denied"],
    ["device-not-found", "unavailable"],
    ["device-in-use", "unavailable"],
    ["unsupported-browser", "unsupported"],
    ["insecure-context", "insecure"],
    ["aborted", "error"],
    ["constraints-unsatisfied", "error"],
    ["unknown", "error"],
  ])("errorCode %s → status %s", (code, expected) => {
    expect(errorCodeToPhase(code)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// patchDetailVideoSize
// ---------------------------------------------------------------------------

describe("patchDetailVideoSize", () => {
  it("returns the same reference when videoSize is unchanged", () => {
    const detail: WebcamDetail = { phase: "idle", videoSize: { width: 640, height: 480 } };
    const result = patchDetailVideoSize(detail, { width: 640, height: 480 });
    expect(result).toBe(detail);
  });

  it("returns a new detail with updated videoSize when size changes", () => {
    const detail: WebcamDetail = { phase: "idle", videoSize: { width: 640, height: 480 } };
    const result = patchDetailVideoSize(detail, { width: 1280, height: 720 });
    expect(result).not.toBe(detail);
    expect(result.videoSize).toEqual({ width: 1280, height: 720 });
  });

  it("returns same reference when both prev and next videoSize are undefined", () => {
    const detail: WebcamDetail = { phase: "idle" };
    const result = patchDetailVideoSize(detail, undefined);
    expect(result).toBe(detail);
  });

  it("preserves detail phase and other fields when patching videoSize", () => {
    const fakeStream = {} as MediaStream;
    const detail: WebcamDetail = {
      phase: "live",
      mediaStream: fakeStream,
      constraints: { video: true },
      videoSize: undefined,
    };
    const result = patchDetailVideoSize(detail, { width: 320, height: 240 });
    expect(result.phase).toBe("live");
    expect(result.videoSize).toEqual({ width: 320, height: 240 });
    if (result.phase === "live") {
      expect(result.mediaStream).toBe(fakeStream);
    }
  });

  it("clears videoSize when undefined is passed and prev had a value", () => {
    const detail: WebcamDetail = { phase: "idle", videoSize: { width: 640, height: 480 } };
    const result = patchDetailVideoSize(detail, undefined);
    expect(result).not.toBe(detail);
    expect(result.videoSize).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// mediaStreamResultFromDetail
// ---------------------------------------------------------------------------

describe("mediaStreamResultFromDetail", () => {
  it("returns { mediaStream } when detail is live", () => {
    const fakeStream = {} as MediaStream;
    const detail: WebcamDetail = {
      phase: "live",
      mediaStream: fakeStream,
      constraints: { video: true },
    };
    const result = mediaStreamResultFromDetail(detail);
    expect(result).toEqual({ mediaStream: fakeStream });
  });

  it("returns { error } when detail is an error phase", () => {
    const err = new Error("denied");
    const detail: WebcamDetail = {
      phase: "denied",
      errorCode: "permission-denied",
      error: err,
      constraints: { video: true },
    };
    const result = mediaStreamResultFromDetail(detail);
    expect(result).toEqual({ error: err });
  });

  it("returns {} when detail is idle", () => {
    const detail: WebcamDetail = { phase: "idle" };
    const result = mediaStreamResultFromDetail(detail);
    expect(result).toEqual({});
  });

  it("returns {} when detail is requesting", () => {
    const detail: WebcamDetail = { phase: "requesting", constraints: { video: true } };
    const result = mediaStreamResultFromDetail(detail);
    expect(result).toEqual({});
  });
});
