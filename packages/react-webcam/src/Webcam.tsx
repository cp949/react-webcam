"use client";

import clsx from "clsx";
import React, { useEffect, useImperativeHandle, useRef } from "react";
import { AspectRatioButton } from "./components/AspectRatioButton.js";
import { FacingModeButton } from "./components/FacingModeButton.js";
import { FlipButton } from "./components/FlipButton.js";
import { SnapshotButton } from "./components/SnapshotButton.js";
import { useDeepCompareEffect } from "./hooks/useDeepCompareEffect.js";
import { useResizeObserver } from "./hooks/useResizeObserver.js";
import { useTimeoutValue } from "./hooks/useTimeoutValue.js";
import { useWebcamController } from "./hooks/useWebcamController.js";
import { CameraIcon } from "./icons/CameraIcon.js";
import type { SnapshotOptions } from "./types/webcam-controller.js";
import { DEFAULT_WEBCAM_LABELS, type WebcamLabels } from "./types/webcam-labels.js";
import type { WebcamDetail, WebcamOptions } from "./webcam-types.js";

/**
 * React 19 `ref` prop으로 노출하는 `Webcam` 제어 핸들이다.
 *
 * @example
 * ```tsx
 * const ref = useRef<WebcamHandle>(null);
 * <Webcam ref={ref} />
 * const canvas = ref.current?.snapshotToCanvas();
 * ```
 */
export type WebcamHandle = {
  /** 현재 프레임을 캔버스로 캡처한다. 아직 준비 전이면 `null`을 반환한다. */
  snapshotToCanvas: (options?: SnapshotOptions) => HTMLCanvasElement | null;

  /** 현재 재생 중인 비디오 트랙의 장치 ID다. */
  getPlayingVideoDeviceId: () => string | undefined;

  /** 현재 재생 중인 오디오 트랙의 장치 ID다. */
  getPlayingAudioDeviceId: () => string | undefined;

  /** 좌우 반전 상태를 설정하거나 이전 값에서 다음 값을 계산한다. */
  setFlipped: (value: boolean | ((prev: boolean) => boolean)) => void;

  /** 웹캠 옵션을 교체하거나 이전 값에서 다음 값을 계산한다. */
  setWebcamOptions: (
    updater: WebcamOptions | undefined | ((prev: WebcamOptions) => WebcamOptions),
  ) => void;

  /**
   * 현재 비디오 요소의 재생을 일시 정지한다.
   *
   * - `video.pause()`만 호출하고 `MediaStreamTrack`은 중지하지 않는다.
   * - 카메라 스트림은 살아 있으므로 `track-ended` 감지는 계속 동작한다.
   * - 비디오 요소가 없으면 아무 동작도 하지 않는다.
   * - `WebcamPhase`나 `WebcamDetail`을 바꾸지 않으므로
   *   `onStateChange`도 발생시키지 않는다.
   */
  pausePlayback: () => void;

  /**
   * 일시 정지된 비디오 요소의 재생을 다시 시작한다.
   *
   * - `video.play()`를 호출하며 `MediaStreamTrack`을 다시 시작하지는 않는다.
   * - 비디오 요소나 스트림이 없으면 아무 동작도 하지 않는다.
   * - `play()`가 실패하면 기존 `playback-error` 흐름을 사용한다.
   * - 사용자 제스처가 없으면 브라우저 autoplay 정책에 막힐 수 있다.
   */
  resumePlayback: () => void;
};

type WebcamErrorDetail = Extract<
  WebcamDetail,
  { phase: "denied" | "unavailable" | "unsupported" | "insecure" | "error" }
>;

/** `Webcam` 컴포넌트가 노출하는 공개 props다. */
export interface WebcamProps {
  style?: React.CSSProperties;

  className?: string;

  /** true이면 카메라 요청을 시작하지 않고 비활성 상태로 유지한다. */
  disabled?: boolean;

  /** disabled일 때 기본 UI 대신 렌더링할 커스텀 fallback이다. */
  disabledFallback?: React.ReactNode;

  /** 카메라 요청 또는 스트림 오류 상태에서 렌더링할 커스텀 fallback이다. */
  errorFallback?: React.ReactNode | ((detail: WebcamErrorDetail) => React.ReactNode);

  /** 외부에 공개된 webcam detail이 바뀔 때마다 호출한다. */
  onStateChange?: (state: WebcamDetail) => void;

  /**
   * 비디오의 원본 크기와 부모 박스 크기가 다를 때 맞춤 방식을 제어한다.
   * `aspectRatio`가 없을 때만 사용한다.
   */
  fitMode?: "unset" | "fill" | "cover" | "contain";

  /**
   * 제어형 좌우 반전 상태다.
   * `onFlippedChange`가 없으면 읽기 전용 제어 상태가 된다.
   */
  flipped?: boolean;

  /** 제어 모드에서 좌우 반전 변경이 요청될 때 호출한다. */
  onFlippedChange?: (value: boolean) => void;

  /**
   * 비제어 모드에서 쓸 초기 좌우 반전 상태다.
   * 마운트 시 한 번만 적용되며 `flipped`가 있으면 무시한다.
   */
  defaultFlipped?: boolean;

  /**
   * 제어형 웹캠 옵션이다.
   * `onWebcamOptionsChange`가 없으면 읽기 전용 제어 상태가 된다.
   */
  webcamOptions?: WebcamOptions;

  /** 제어 모드에서 웹캠 옵션 변경이 요청될 때 호출한다. */
  onWebcamOptionsChange?: (options: WebcamOptions) => void;

  /**
   * 비제어 모드에서 쓸 초기 웹캠 옵션이다.
   * 마운트 시 한 번만 적용되며 `webcamOptions`가 있으면 무시한다.
   */
  defaultWebcamOptions?: WebcamOptions;

  /** 좌우 반전 토글 버튼 표시 여부다. 기본값은 `false`다. */
  visibleFlipButton?: boolean;

  /** 카메라 방향 버튼 표시 여부다. 기본값은 `false`다. */
  visibleCameraDirectionButton?: boolean;

  /** 화면 비율 버튼 표시 여부다. 기본값은 `false`다. */
  visibleAspectRatioButton?: boolean;

  /** 스냅샷 버튼 표시 여부다. 기본값은 `false`다. */
  visibleSnapshotButton?: boolean;

  /** 비디오 크기 디버그 UI 표시 여부다. 기본값은 `false`다. */
  visibleVideoSizeDebug?: boolean;

  /** 미디어 제약 조건 디버그 UI 표시 여부다. 기본값은 `false`다. */
  visibleConstraintsDebug?: boolean;

  /**
   * 내장 UI 라벨을 부분적으로 덮어쓸 때 사용한다.
   * 빠진 필드는 기본 한국어 라벨을 사용한다.
   */
  labels?: WebcamLabels;

  children?: React.ReactNode;
}

const SIZE_ZERO = {
  width: 0,
  height: 0,
};

/**
 * 웹캠 화면과 내장 제어 UI를 함께 제공하는 메인 컴포넌트다.
 * `aspectRatio`에 따라 레이아웃이 달라지며 필요한 버튼만 선택적으로 켤 수 있다.
 *
 * 명령형 제어가 필요하면 `ref` prop으로 `WebcamHandle`에 접근한다.
 *
 * @example
 * ```tsx
 * // 기본 사용
 * <div style={{ width: 800, height: 'auto' }}>
 *   <Webcam
 *     flipped
 *     visibleFlipButton
 *     webcamOptions={{ audioEnabled: true, aspectRatio: 4/3, facingMode: 'user' }}
 *     onStateChange={(state) => console.log(state.phase)}
 *   />
 * </div>
 *
 * // ref handle 사용
 * const ref = useRef<WebcamHandle>(null);
 * <Webcam ref={ref} />
 * const canvas = ref.current?.snapshotToCanvas();
 * ```
 */
export const Webcam = React.forwardRef<WebcamHandle, WebcamProps>(function Webcam(props, ref) {
  const {
    style,
    className,
    children,
    disabled = false,
    disabledFallback,
    errorFallback,
    visibleFlipButton = false,
    visibleCameraDirectionButton = false,
    visibleAspectRatioButton = false,
    visibleVideoSizeDebug = false,
    visibleConstraintsDebug = false,
    visibleSnapshotButton = false,
  } = props;

  // 라벨을 기본값과 병합한다. 미설정 항목은 기본 한국어 값이 사용된다.
  const labels: Required<WebcamLabels> = {
    ...DEFAULT_WEBCAM_LABELS,
    ...props.labels,
  };

  // ---- 컨트롤러 ----------------------------------------------------------
  const ctrl = useWebcamController({ disabled });
  const {
    flipped,
    webcamOptions,
    webcamDetail,
    videoSize,
    constraints,
    isLoaded,
    setVideoElement,
    setFitMode,
    setFlipped,
    setWebcamOptions,
  } = ctrl;

  // ---- 제어 및 비제어 모드 판별 -------------------------------------------
  const isFlipControlled = props.flipped !== undefined;
  const isWebcamOptionsControlled = props.webcamOptions !== undefined;

  // ---- 명령형 핸들 구성 ---------------------------------------------------
  // 외부에 공개하는 메서드만 명시적으로 조립한다.
  // controlled 모드에서 setFlipped/setWebcamOptions는 onXxxChange 콜백만 호출한다.
  useImperativeHandle(
    ref,
    () => ({
      snapshotToCanvas: ctrl.snapshotToCanvas,
      getPlayingVideoDeviceId: ctrl.getPlayingVideoDeviceId,
      getPlayingAudioDeviceId: ctrl.getPlayingAudioDeviceId,
      setFlipped: (value) => {
        const newValue = typeof value === "function" ? value(ctrl.flipped) : value;
        if (isFlipControlled) {
          props.onFlippedChange?.(newValue);
        } else {
          ctrl.setFlipped(newValue);
        }
      },
      setWebcamOptions: (updater) => {
        if (isWebcamOptionsControlled) {
          if (props.onWebcamOptionsChange) {
            const current = ctrl.webcamOptions;
            const newValue = typeof updater === "function" ? updater(current) : updater;
            if (newValue !== undefined) {
              props.onWebcamOptionsChange(newValue);
            }
            // 제어 모드에서는 undefined 업데이트를 무시한다.
          }
          // onWebcamOptionsChange가 없으면 읽기 전용 제어 상태로 취급한다.
        } else {
          ctrl.setWebcamOptions(updater);
        }
      },
      pausePlayback: ctrl.pausePlayback,
      resumePlayback: ctrl.resumePlayback,
    }),
    [
      ctrl,
      isFlipControlled,
      isWebcamOptionsControlled,
      props.onFlippedChange,
      props.onWebcamOptionsChange,
    ],
  );

  // ---- prop → 컨트롤러 동기화 -------------------------------------------
  // onStateChange는 최신 참조를 유지해 effect 재실행 없이 호출한다.
  const onStateChangeRef = useRef(props.onStateChange);
  onStateChangeRef.current = props.onStateChange;
  useEffect(() => {
    onStateChangeRef.current?.(webcamDetail);
  }, [webcamDetail]);

  // fitMode는 제어 및 비제어 여부와 관계없이 항상 동기화한다.
  useEffect(() => {
    setFitMode(props.fitMode);
  }, [setFitMode, props.fitMode]);

  // flipped: controlled 모드에서는 prop 값을 컨트롤러에 동기화하고,
  // uncontrolled 모드에서는 마운트 시 defaultFlipped로 초기화한다.
  useEffect(() => {
    if (isFlipControlled) {
      setFlipped(props.flipped!);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setFlipped, props.flipped, isFlipControlled]);

  // 비제어 모드의 defaultFlipped는 마운트 시 한 번만 초기화한다.
  useEffect(() => {
    if (!isFlipControlled && props.defaultFlipped !== undefined) {
      setFlipped(props.defaultFlipped);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 의도적으로 비워 두고 마운트 시 한 번만 실행한다.

  // webcamOptions: controlled 모드에서는 prop 값을 deep compare로 동기화하고,
  // uncontrolled 모드에서는 마운트 시 defaultWebcamOptions로 초기화한다.
  useDeepCompareEffect(() => {
    if (isWebcamOptionsControlled) {
      setWebcamOptions(props.webcamOptions);
    }
  }, [setWebcamOptions, props.webcamOptions, isWebcamOptionsControlled]);

  // 비제어 모드의 defaultWebcamOptions는 마운트 시 한 번만 초기화한다.
  useEffect(() => {
    if (!isWebcamOptionsControlled && props.defaultWebcamOptions !== undefined) {
      setWebcamOptions(props.defaultWebcamOptions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 의도적으로 비워 두고 마운트 시 한 번만 실행한다.

  // ---- 루트 요소 크기 (aspect-ratio 레이아웃 기준) ----------------------
  // ResizeObserver가 초기화되기 전 rootWidth는 0이므로, 0인 동안 video 요소를 숨긴다.
  const [rootRef, { width: rootWidth }] = useResizeObserver<HTMLDivElement>();

  // ---- 레이아웃 계산 -----------------------------------------------------
  // aspectRatio가 설정된 경우 rootWidth 기준으로 video 높이를 고정한다.
  // 미설정 시 부모 높이를 100% 채우는 자유 높이 모드로 동작한다.
  const { aspectRatio } = webcamOptions;
  const videoWidth = rootWidth;
  const videoHeight =
    rootWidth > 0 && typeof aspectRatio === "number" && aspectRatio > 0
      ? Math.round(rootWidth / aspectRatio)
      : undefined;
  const isFixedHeight = videoHeight !== undefined;

  // ---- 스냅샷 미리보기 ---------------------------------------------------
  const [snapshotImageUrl, setSnapshotImageUrl] = useTimeoutValue<string>(700);

  // ---- 버튼 UI 가시성 ---------------------------------------------------
  const hasOptionButtons =
    visibleFlipButton || visibleCameraDirectionButton || visibleAspectRatioButton;
  const hasDisabledFallbackProp = Object.hasOwn(props, "disabledFallback");
  const hasErrorFallbackProp = Object.hasOwn(props, "errorFallback");
  const showDefaultDisabledPlaceholder = disabled && !hasDisabledFallbackProp;
  const rootBackgroundColor = disabled ? "#f7f8fa" : "#1e1e1e";
  const errorDetail =
    webcamDetail.phase === "denied" ||
    webcamDetail.phase === "unavailable" ||
    webcamDetail.phase === "unsupported" ||
    webcamDetail.phase === "insecure" ||
    webcamDetail.phase === "error"
      ? webcamDetail
      : undefined;
  const errorFallbackNode: React.ReactNode = errorDetail
    ? typeof errorFallback === "function"
      ? errorFallback(errorDetail)
      : errorFallback
    : undefined;

  return (
    <div
      ref={rootRef}
      className={clsx("Webcam-root", className, {
        x_fullHeight: !isFixedHeight,
        x_fixedHeight: isFixedHeight,
      })}
      style={{
        boxSizing: "content-box",
        position: "relative",
        top: 0,
        left: 0,
        right: 0,
        bottom: isFixedHeight ? undefined : 0,
        height: isFixedHeight ? "auto" : "100%",
        maxWidth: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        backgroundColor: rootBackgroundColor,
        ...style,
      }}
    >
      {/* ---- 비디오 -------------------------------------------------------- */}
      {!disabled && rootWidth > 0 && (
        <video
          ref={setVideoElement}
          className='Webcam-video'
          autoPlay
          muted
          playsInline
          style={{
            display: "inline-block",
            width: videoWidth ?? "100%",
            height: videoHeight ?? "100%",
            backgroundColor: "#1e1e1e",
            borderRadius: "inherit",
          }}
        />
      )}

      {disabled && hasDisabledFallbackProp ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            borderRadius: "inherit",
            overflow: "hidden",
          }}
        >
          {disabledFallback}
        </div>
      ) : null}

      {!disabled && errorDetail && hasErrorFallbackProp ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            borderRadius: "inherit",
            overflow: "hidden",
          }}
        >
          {errorFallbackNode}
        </div>
      ) : null}

      {showDefaultDisabledPlaceholder && (
        <div
          data-testid='webcam-disabled-placeholder'
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            backgroundColor: "#f7f8fa",
            border: "2px dashed #d7dee8",
            boxSizing: "border-box",
            borderRadius: "inherit",
          }}
        >
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: "999px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#eef2f6",
              boxShadow: "0 8px 20px rgba(118, 132, 150, 0.14)",
              color: "#7f8b99",
            }}
          >
            <CameraIcon size={34} />
          </div>
        </div>
      )}

      {/* ---- 버튼 UI ------------------------------------------------------- */}
      {isLoaded && hasOptionButtons && (
        <div
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-end",
            gap: 4,
          }}
        >
          {visibleFlipButton && (
            <FlipButton
              flipped={flipped}
              className='Webcam-optionBtn'
              onChange={(newValue) => {
                if (isFlipControlled) {
                  props.onFlippedChange?.(newValue);
                } else {
                  setFlipped(newValue);
                }
              }}
              label={labels.flip}
            />
          )}

          {visibleCameraDirectionButton && (
            <FacingModeButton
              className='Webcam-optionBtn'
              label={labels.cameraDirection}
              menuLabels={{
                back: labels.facingModeBack,
                front: labels.facingModeFront,
                default: labels.facingModeDefault,
              }}
              onChange={(facingMode) => {
                const updater = (prev: WebcamOptions) => ({
                  ...prev,
                  facingMode,
                  deviceId: undefined,
                });
                if (isWebcamOptionsControlled) {
                  if (props.onWebcamOptionsChange) {
                    props.onWebcamOptionsChange(updater(ctrl.webcamOptions));
                  }
                  // 읽기 전용 제어 상태에서는 내부 변경을 무시한다.
                } else {
                  setWebcamOptions(updater);
                }
              }}
            />
          )}

          {visibleAspectRatioButton && (
            <AspectRatioButton
              className='Webcam-optionBtn'
              label={labels.aspectRatio}
              autoLabel={labels.aspectRatioAuto}
              onChange={(aspectRatio) => {
                const updater = (prev: WebcamOptions) => ({
                  ...prev,
                  aspectRatio: aspectRatio?.value,
                });
                if (isWebcamOptionsControlled) {
                  if (props.onWebcamOptionsChange) {
                    props.onWebcamOptionsChange(updater(ctrl.webcamOptions));
                  }
                  // 읽기 전용 제어 상태에서는 내부 변경을 무시한다.
                } else {
                  setWebcamOptions(updater);
                }
              }}
            />
          )}
        </div>
      )}

      {/* ---- 스냅샷 버튼 --------------------------------------------------- */}
      {visibleSnapshotButton && isLoaded && (
        <SnapshotButton
          label={labels.snapshot}
          style={{
            position: "absolute",
            bottom: 8,
            left: "50%",
            transform: "translateX(-50%)",
          }}
          onClick={() => {
            const canvas = ctrl.snapshotToCanvas();
            if (canvas) {
              setSnapshotImageUrl(canvas.toDataURL("image/png"));
            }
          }}
        />
      )}

      {/* ---- 사용자 자식 요소 ---------------------------------------------- */}
      {children}

      {/* ---- 스냅샷 미리보기 ----------------------------------------------- */}
      {snapshotImageUrl && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <img src={snapshotImageUrl} alt='snapshot preview' width={60} />
        </div>
      )}

      {/* ---- 디버그 UI ----------------------------------------------------- */}
      {visibleVideoSizeDebug && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            display: "flex",
            flexDirection: "column",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            color: "#fff",
            padding: "0 8px",
            fontSize: "0.7rem",
          }}
        >
          {(videoSize ?? SIZE_ZERO).width}x{(videoSize ?? SIZE_ZERO).height}
        </div>
      )}

      {visibleConstraintsDebug && (
        <pre
          style={{
            position: "absolute",
            left: 0,
            top: 40,
            backgroundColor: "rgba(0,0,0,0.7)",
            color: "#fff",
          }}
        >
          {JSON.stringify(constraints, null, 2)}
        </pre>
      )}
    </div>
  );
});
