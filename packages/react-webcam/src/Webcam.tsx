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
import type { SnapshotOptions } from "./types/webcam-controller.js";
import { DEFAULT_WEBCAM_LABELS, type WebcamLabels } from "./types/webcam-labels.js";
import type { WebcamDetail, WebcamOptions } from "./webcam-types.js";

/**
 * `Webcam` ref handle exposed through the React 19 `ref` prop.
 *
 * @example
 * ```tsx
 * const ref = useRef<WebcamHandle>(null);
 * <Webcam ref={ref} />
 * const canvas = ref.current?.snapshotToCanvas();
 * ```
 */
export type WebcamHandle = {
  /** Captures the current frame to a canvas, or returns `null` before ready. */
  snapshotToCanvas: (options?: SnapshotOptions) => HTMLCanvasElement | null;
  /** Device ID of the currently playing video track. */
  getPlayingVideoDeviceId: () => string | undefined;
  /** Device ID of the currently playing audio track. */
  getPlayingAudioDeviceId: () => string | undefined;
  /** Sets the mirror state or derives the next value from the previous one. */
  setFlipped: (value: boolean | ((prev: boolean) => boolean)) => void;
  /** Replaces the webcam options or derives them from the previous value. */
  setWebcamOptions: (
    updater: WebcamOptions | undefined | ((prev: WebcamOptions) => WebcamOptions),
  ) => void;
  /**
   * Pauses the current video element.
   *
   * - Calls `video.pause()` only; it does not stop any `MediaStreamTrack`.
   * - The camera stream stays alive, so `track-ended` detection still works.
   * - This is a no-op when no video element is attached.
   * - It does not change `WebcamPhase` or `WebcamDetail`, so
   *   `onStateChange` is not emitted.
   */
  pausePlayback: () => void;
  /**
   * Resumes playback on a paused video element.
   *
   * - Calls `video.play()`; it does not restart any `MediaStreamTrack`.
   * - This is a no-op when the video element or stream is missing.
   * - If `play()` fails, the existing `playback-error` flow is used.
   * - Browsers can still block it under autoplay policy without a user gesture.
   */
  resumePlayback: () => void;
};

export interface WebcamProps {
  style?: React.CSSProperties;

  className?: string;

  /**
   * Called whenever the published webcam detail changes.
   */
  onStateChange?: (state: WebcamDetail) => void;

  /**
   * Controls how the video is fitted when its natural size differs from the
   * parent box. Only used when `aspectRatio` is not set.
   */
  fitMode?: "unset" | "fill" | "cover" | "contain";

  /**
   * Controlled mirror state.
   * Without `onFlippedChange`, this becomes read-only controlled state.
   */
  flipped?: boolean;

  /**
   * Called when mirror changes are requested in controlled mode.
   */
  onFlippedChange?: (value: boolean) => void;

  /**
   * Initial mirror state for uncontrolled usage.
   * Applied once on mount and ignored when `flipped` is provided.
   */
  defaultFlipped?: boolean;

  /**
   * Controlled webcam options.
   * Without `onWebcamOptionsChange`, this becomes read-only controlled state.
   */
  webcamOptions?: WebcamOptions;

  /**
   * Called when webcam option changes are requested in controlled mode.
   */
  onWebcamOptionsChange?: (options: WebcamOptions) => void;

  /**
   * Initial webcam options for uncontrolled usage.
   * Applied once on mount and ignored when `webcamOptions` is provided.
   */
  defaultWebcamOptions?: WebcamOptions;

  /** Shows the mirror toggle button. Defaults to `false`. */
  visibleFlipButton?: boolean;

  /** Shows the camera direction button. Defaults to `false`. */
  visibleCameraDirectionButton?: boolean;

  /** Shows the aspect ratio button. Defaults to `false`. */
  visibleAspectRatioButton?: boolean;

  /** Shows the snapshot button. Defaults to `false`. */
  visibleSnapshotButton?: boolean;

  /** Shows the video-size debug UI. Defaults to `false`. */
  visibleVideoSizeDebug?: boolean;

  /** Shows the media-constraints debug UI. Defaults to `false`. */
  visibleConstraintsDebug?: boolean;

  /**
   * Optional built-in UI label overrides.
   * Any missing field falls back to the default Korean label set.
   */
  labels?: WebcamLabels;

  children?: React.ReactNode;
}

const SIZE_ZERO = {
  width: 0,
  height: 0,
};

/**
 * Main webcam component.
 * Layout changes depending on `aspectRatio`, and built-in control buttons can
 * be enabled as needed.
 *
 * Use the `ref` prop to access the imperative `WebcamHandle`.
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
    visibleFlipButton = false,
    visibleCameraDirectionButton = false,
    visibleAspectRatioButton = false,
    visibleVideoSizeDebug = false,
    visibleConstraintsDebug = false,
    visibleSnapshotButton = false,
  } = props;

  // 라벨을 기본값과 병합한다. 미설정 항목은 기본 한국어 값이 사용된다.
  const labels: Required<WebcamLabels> = { ...DEFAULT_WEBCAM_LABELS, ...props.labels };

  // ---- 컨트롤러 ----------------------------------------------------------
  const ctrl = useWebcamController();
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

  // ---- controlled / uncontrolled 모드 판별 --------------------------------
  const isFlipControlled = props.flipped !== undefined;
  const isWebcamOptionsControlled = props.webcamOptions !== undefined;

  // ---- imperative handle -------------------------------------------------
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
            // If newValue is undefined, ignore (same as no-op in controlled mode)
          }
          // else: no onWebcamOptionsChange, ignore
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

  // fitMode는 항상 동기화한다.
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

  // mount-time only: defaultFlipped 초기화 (uncontrolled 모드)
  useEffect(() => {
    if (!isFlipControlled && props.defaultFlipped !== undefined) {
      setFlipped(props.defaultFlipped);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — mount only

  // webcamOptions: controlled 모드에서는 prop 값을 deep compare로 동기화하고,
  // uncontrolled 모드에서는 마운트 시 defaultWebcamOptions로 초기화한다.
  useDeepCompareEffect(() => {
    if (isWebcamOptionsControlled) {
      setWebcamOptions(props.webcamOptions);
    }
  }, [setWebcamOptions, props.webcamOptions, isWebcamOptionsControlled]);

  // mount-time only: defaultWebcamOptions 초기화 (uncontrolled 모드)
  useEffect(() => {
    if (!isWebcamOptionsControlled && props.defaultWebcamOptions !== undefined) {
      setWebcamOptions(props.defaultWebcamOptions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — mount only

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
        backgroundColor: "#1e1e1e",
        ...style,
      }}
    >
      {/* ---- 비디오 -------------------------------------------------------- */}
      {rootWidth > 0 && (
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
          }}
        />
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
                  // else: ignored (read-only controlled)
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
                  // else: ignored (read-only controlled)
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

      {/* ---- children ------------------------------------------------------ */}
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
