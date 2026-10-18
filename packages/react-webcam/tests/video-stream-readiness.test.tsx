/**
 * 스트림 교체 시 이전 해상도를 버리고 새 메타데이터를 기다리는지 검증한다.
 */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useWebcamController } from "../src/hooks/useWebcamController.js";
import { createFakeMediaStream, mockGetUserMedia } from "./test-utils.js";
import { advanceToStreamLoad, markVideoReady } from "./webcam-test-helpers.js";

describe("스트림 교체 후 영상 준비 상태", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it.each(["재시도", "카메라 옵션 변경"])(
    "%s 뒤 새 메타데이터가 오기 전에는 이전 해상도와 isLoaded를 사용하지 않는다",
    async (action) => {
      const firstStream = createFakeMediaStream();
      const nextStream = createFakeMediaStream();
      let resolveNext!: (stream: MediaStream) => void;
      const nextRequest = new Promise<MediaStream>((resolve) => {
        resolveNext = resolve;
      });
      mockGetUserMedia(firstStream)
        .mockReturnValueOnce(Promise.resolve(firstStream))
        .mockReturnValueOnce(nextRequest);
      const { result } = renderHook(() => useWebcamController());
      const video = document.createElement("video");
      act(() => {
        result.current.setVideoElement(video);
      });
      await advanceToStreamLoad();
      await markVideoReady(video, { width: 640, height: 480 });
      expect(result.current.videoSize).toEqual({ width: 640, height: 480 });
      expect(result.current.isLoaded).toBe(true);

      // 실제 video처럼 소스 교체 시 메타데이터가 사라지되 아직 이벤트는 오지 않은 상태다.
      Object.defineProperties(video, {
        videoWidth: { value: 0, configurable: true },
        videoHeight: { value: 0, configurable: true },
      });
      act(() => {
        if (action === "재시도") result.current.retry();
        else result.current.setWebcamOptions({ facingMode: "environment" });
      });
      await advanceToStreamLoad();
      expect(result.current.webcamDetail.phase).toBe("requesting");
      expect(result.current.videoSize).toBeUndefined();
      expect(result.current.webcamDetail.videoSize).toBeUndefined();
      expect(result.current.isLoaded).toBe(false);

      await act(async () => {
        resolveNext(nextStream);
      });
      expect(video.srcObject).toBe(nextStream);
      expect(result.current.webcamDetail.phase).toBe("live");
      expect(result.current.videoSize).toBeUndefined();
      expect(result.current.isLoaded).toBe(false);

      await markVideoReady(video, { width: 1920, height: 1080 });
      expect(result.current.videoSize).toEqual({ width: 1920, height: 1080 });
      expect(result.current.webcamDetail.videoSize).toEqual({ width: 1920, height: 1080 });
      expect(result.current.isLoaded).toBe(true);
    },
  );
});
