/**
 * React 19 StrictMode와 빠른 rerender 상황에서의 회귀를 검증하는 테스트 파일이다.
 */
import { act, renderHook } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useWebcamController } from "../src/hooks/useWebcamController.js";
import { createFakeMediaStream, mockGetUserMedia } from "./test-utils.js";

// ---------------------------------------------------------------------------
// React 19 StrictMode·rerender 프레임워크 회귀 테스트
// double-mount, debounce, cleanup 동작을 확인한다.
// ---------------------------------------------------------------------------

describe("React 19 StrictMode / rerender", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("StrictMode 더블 마운트에서 stream leak가 없다", async () => {
    // StrictMode에서 React는 컴포넌트를 두 번 마운트·언마운트한 후 실제 마운트를 수행한다.
    // 첫 번째(버려지는) 마운트에서 시작된 getUserMedia 요청이 live 상태로 이어지면 안 된다.
    const stream = createFakeMediaStream();
    const getUserMediaMock = mockGetUserMedia(stream);
    const statuses: string[] = [];
    const { result, unmount } = renderHook(
      () => {
        const controller = useWebcamController();
        React.useEffect(() => {
          statuses.push(controller.webcamDetail.phase);
        }, [controller.webcamDetail.phase]);
        return controller;
      },
      {
        wrapper: ({ children }) => <React.StrictMode>{children}</React.StrictMode>,
      },
    );

    const videoEl = document.createElement("video");
    act(() => {
      result.current.setVideoElement(videoEl);
      result.current.setWebcamOptions({ audioEnabled: false });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    // StrictMode 더블 마운트가 있더라도 최종 live publish는 한 번만 일어나야 한다.
    expect(statuses.filter((status) => status === "live")).toHaveLength(1);
    expect(statuses).toContain("requesting");
    // getUserMedia는 중복 호출될 수 있지만 최종적으로 정리되어야 한다.
    expect(getUserMediaMock).toHaveBeenCalled();

    // 언마운트 시 stream cleanup이 실행되는지 확인한다 (StrictMode 컨텍스트에서의 cleanup 검증).
    act(() => {
      unmount();
    });
    const tracks = stream.getTracks();
    expect(tracks[0].stop).toHaveBeenCalled(); // StrictMode cleanup이 stream을 정리했는지 확인
  });

  it("constraints 빠른 변경에서 중복 state publish가 없다", async () => {
    // webcamOptions를 빠르게 세 번 변경하면 각 변경마다 새 getUserMedia 요청이 시작된다.
    // debounce 덕분에 마지막 변경 하나만 실제 요청으로 이어져야 한다.
    const stream = createFakeMediaStream();
    const getUserMediaMock = mockGetUserMedia(stream);

    const { result } = renderHook(() => useWebcamController());

    const videoEl = document.createElement("video");
    act(() => {
      result.current.setVideoElement(videoEl);
    });

    // 세 번 빠르게 변경 (debounce 100ms 이내)
    act(() => {
      result.current.setWebcamOptions({ audioEnabled: false, frameRate: 15 });
    });
    act(() => {
      result.current.setWebcamOptions({ audioEnabled: false, frameRate: 24 });
    });
    act(() => {
      result.current.setWebcamOptions({ audioEnabled: false, frameRate: 30 });
    });

    // debounce 100ms + Promise 플러시
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    // 마지막 constraints 하나만 실제 getUserMedia 호출로 이어져야 한다.
    expect(getUserMediaMock).toHaveBeenCalledTimes(1);
    expect(result.current.webcamDetail.phase).toBe("live");
  });
});
