import { useMemo } from "react";
import type { WebcamDetail, WebcamOptions } from "../webcam-types.js";
import { useWebcamController } from "./useWebcamController.js";

/** 호출자가 소유한 video와 카메라 요청 조건. */
export type UseWebcamOptions = {
  /** 요소가 없으면 요청하지 않는다. muted와 playsInline은 호출자가 설정한다. */
  videoElement: HTMLVideoElement | null | undefined;
  webcamOptions?: WebcamOptions;
  disabled?: boolean;
};

/** 표시 UI에 의존하지 않는 카메라 상태와 제어 함수. */
export type UseWebcamResult = {
  readonly detail: WebcamDetail;
  /** live 상태에서 현재 스트림의 readyState가 2 이상이고 영상 크기가 양수일 때 true다. */
  readonly isFrameReady: boolean;
  /** 현재 스트림을 정리하고 같은 옵션으로 다시 요청한다. disabled 중에는 요청하지 않는다. */
  retry: () => void;
  /** 영상 재생만 멈춘다. 카메라 트랙은 유지한다. */
  pausePlayback: () => void;
  /** 사용자 조작 후 호출한다. 재생 실패는 detail의 playback-error로 전달한다. */
  resumePlayback: () => void;
};

/** 외부 video에 스트림을 연결하고 요청·재생 에러와 프레임 준비 상태를 관리한다. */
export function useWebcam(options: UseWebcamOptions): UseWebcamResult {
  const { webcamDetail, isFrameReady, retry, pausePlayback, resumePlayback } = useWebcamController({
    ...options,
    manageVideoStyle: false,
  });
  return useMemo(
    () => ({
      detail: webcamDetail,
      isFrameReady,
      retry,
      pausePlayback,
      resumePlayback,
    }),
    [webcamDetail, isFrameReady, retry, pausePlayback, resumePlayback],
  );
}
