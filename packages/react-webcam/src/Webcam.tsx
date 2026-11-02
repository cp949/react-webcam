"use client";

import React, { useEffect, useImperativeHandle, useRef } from "react";
import { AspectRatioButton } from "./components/AspectRatioButton.js";
import { FacingModeButton } from "./components/FacingModeButton.js";
import { FlipButton } from "./components/FlipButton.js";
import { SnapshotButton } from "./components/SnapshotButton.js";
import { useControllableChange } from "./hooks/useControllableChange.js";
import { useDeepCompareEffect } from "./hooks/useDeepCompareEffect.js";
import { useResizeObserver } from "./hooks/useResizeObserver.js";
import { useTimeoutValue } from "./hooks/useTimeoutValue.js";
import { useWebcamController } from "./hooks/useWebcamController.js";
import { CameraIcon } from "./icons/CameraIcon.js";
import { classNames } from "./utils/class-names.js";
import { isErrorDetail } from "./utils/webcam-controller-state.js";
import type { SnapshotOptions } from "./types/webcam-controller.js";
import { DEFAULT_WEBCAM_LABELS, type WebcamLabels } from "./types/webcam-labels.js";
import type {
  WebcamDetail,
  WebcamErrorDetail,
  WebcamFitMode,
  WebcamOptions,
} from "./webcam-types.js";

/** `Webcam`이 내장하는 컨트롤 버튼의 표시 여부다. */
export type WebcamControls = {
  /** 좌우 반전 토글 버튼 표시 여부다. */
  flip?: boolean;

  /** 카메라 방향 버튼 표시 여부다. */
  cameraDirection?: boolean;

  /** 화면 비율 버튼 표시 여부다. */
  aspectRatio?: boolean;

  /** 스냅샷 버튼 표시 여부다. */
  snapshot?: boolean;
};

/**
 * `Webcam`이 내장하는 컨트롤 버튼의 아이콘 교체값이다.
 * 빠진 항목은 기본 아이콘을 쓴다. 아이콘은 버튼 안에 그대로 렌더링한다.
 * 색은 `currentColor`를 따르면 버튼 색과 맞는다. 기본 크기는 `flip`, `cameraDirection`,
 * `aspectRatio`가 `1.2rem`, `snapshot`이 `2rem`이다.
 */
export type WebcamIcons = {
  /** 좌우 반전 버튼 아이콘이다. */
  flip?: React.ReactNode;

  /** 카메라 방향 버튼 아이콘이다. */
  cameraDirection?: React.ReactNode;

  /** 화면 비율 버튼 아이콘이다. */
  aspectRatio?: React.ReactNode;

  /** 스냅샷 버튼 아이콘이다. */
  snapshot?: React.ReactNode;
};

/** `Webcam`이 내장하는 디버그 오버레이의 표시 여부다. */
export type WebcamDebug = {
  /** 비디오 크기 디버그 UI 표시 여부다. */
  videoSize?: boolean;

  /** 미디어 제약 조건 디버그 UI 표시 여부다. */
  constraints?: boolean;
};

/**
 * `ref`로 노출하는 `Webcam` 제어 핸들이다.
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

  /**
   * 지금 프레임을 캡처할 수 있는지 반환한다. `onFrameReadyChange`가 다루는 현재 값이다.
   *
   * - `true`: phase가 `live`이고 `readyState >= 2`이며 영상 크기가 양수이고 비디오 트랙이 `muted`가 아니다.
   * - `pausePlayback()`은 이 값을 바꾸지 않는다. 일시 정지한 프레임도 캡처할 수 있다.
   * - `true`여도 `snapshotToCanvas`가 `null`을 돌려줄 수 있다(예: 2D context 생성 실패).
   * - 언마운트 뒤에는 캐시한 핸들도 `false`를 반환한다.
   * - 호출 시점의 값이며 구독하지 않는다. 변경을 따라가려면 `onFrameReadyChange`를 쓴다.
   */
  isFrameReady: () => boolean;

  /**
   * 현재 webcam detail을 반환한다.
   *
   * - `onStateChange`로 받는 값과 같다.
   * - 이벤트 핸들러 안에서 "지금 live인가"를 확인할 때 쓴다.
   * - 호출 시점의 값이며 구독하지 않는다. 변경을 따라가려면 `onStateChange`를 쓴다.
   */
  getDetail: () => WebcamDetail;

  /**
   * `Webcam`이 렌더링한 `<video>` 요소를 반환한다. 없으면 `null`이다.
   *
   * - `null`인 경우: 마운트 직후 첫 크기 측정 전, `disabled`, 언마운트 후.
   * - `onStateChange`에서 phase가 `idle`이 아니면 `null`이 아니다.
   * - 스트림 교체(`retry`, 옵션 변경) 중에는 같은 요소를 유지하고 `srcObject`만 바뀐다.
   * - `disabled` 해제 등으로 요소가 다시 만들어질 수 있으므로 저장해 두지 말고 필요할 때 다시 호출한다.
   * - 읽기 용도로 쓴다(`drawImage`, `videoWidth`, 이벤트 구독).
   *   `srcObject`, `style.transform`, `style.objectFit`을 바꾸거나 `play()`/`pause()`를 직접 호출하지 않는다.
   *   재생 제어는 `pausePlayback`/`resumePlayback`을 쓴다.
   */
  getVideoElement: () => HTMLVideoElement | null;

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
   * 같은 옵션으로 카메라 스트림을 다시 요청한다.
   *
   * - 권한 거부, 장치 없음, 트랙 종료 같은 오류 뒤에 다시 시도할 때 쓴다.
   * - `Webcam`을 `key`로 리마운트하지 않아도 된다.
   * - 브라우저가 권한 프롬프트를 다시 띄우지 않을 수 있다. 거부된 권한은 브라우저 설정에서 풀어야 한다.
   * - `disabled`이거나 비디오 요소가 없으면 요청하지 않는다.
   */
  retry: () => void;

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

/** `Webcam` 컴포넌트가 노출하는 공개 props다. */
export interface WebcamProps {
  style?: React.CSSProperties;

  className?: string;

  /** true이면 카메라 요청을 시작하지 않고 비활성 상태로 유지한다. */
  disabled?: boolean;

  /**
   * true이면 `track-ended` 오류 뒤 탭이 다시 보일 때 스트림을 한 번 다시 요청한다.
   *
   * - 일부 모바일 브라우저는 백그라운드 탭의 카메라 트랙을 종료한다.
   * - `visibilitychange`가 `visible`일 때마다 최대 한 번 `retry`와 같은 요청을 한다.
   * - 다른 오류(권한 거부 등)에서는 요청하지 않는다.
   * - 기본값은 `false`다.
   */
  autoRecover?: boolean;

  /** disabled일 때 기본 UI 대신 렌더링할 커스텀 fallback이다. */
  disabledFallback?: React.ReactNode;

  /** 카메라 요청 또는 스트림 오류 상태에서 렌더링할 커스텀 fallback이다. */
  errorFallback?:
    | React.ReactNode
    | ((detail: WebcamErrorDetail, helpers: { retry: () => void }) => React.ReactNode);

  /** 외부에 공개된 webcam detail이 바뀔 때마다 호출한다. */
  onStateChange?: (state: WebcamDetail) => void;

  /**
   * 현재 스트림의 디코딩된 프레임을 쓸 수 있는지가 바뀔 때 호출한다.
   *
   * - `true`: phase가 `live`이고 `readyState >= 2`이며 영상 크기가 양수이고 비디오 트랙이 `muted`가 아니다.
   * - 처음 값은 `false`이며, 처음 `false`로는 호출하지 않는다.
   * - 스트림 교체, `disabled`, 트랙 `mute`, 오류 phase로 바뀌어 직전 값이 `true`였다면 `false`로 호출한다.
   * - `phase`가 `live`여도 프레임 도착은 보장되지 않는다. 촬영 UI는 이 값으로 연다.
   * - 언마운트 시에는 호출하지 않는다.
   */
  onFrameReadyChange?: (ready: boolean) => void;

  /**
   * 비디오의 원본 크기와 부모 박스 크기가 다를 때 맞춤 방식을 제어한다.
   * `aspectRatio`가 없을 때만 사용한다.
   */
  fitMode?: WebcamFitMode;

  /**
   * 제어형 좌우 반전 값이다.
   * `onFlippedChange`와 함께 사용해 부모가 상태를 갱신한다.
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
   * 제어형 웹캠 옵션 값이다.
   * `onWebcamOptionsChange`와 함께 사용해 부모가 상태를 갱신한다.
   */
  webcamOptions?: WebcamOptions;

  /** 제어 모드에서 웹캠 옵션 변경이 요청될 때 호출한다. */
  onWebcamOptionsChange?: (options: WebcamOptions) => void;

  /**
   * 비제어 모드에서 쓸 초기 웹캠 옵션이다.
   * 마운트 시 한 번만 적용되며 `webcamOptions`가 있으면 무시한다.
   */
  defaultWebcamOptions?: WebcamOptions;

  /**
   * 표시할 내장 컨트롤 버튼을 고른다.
   * 켠 항목만 렌더링한다. 기본값은 모두 `false`다.
   */
  controls?: WebcamControls;

  /**
   * 내장 스냅샷 버튼을 눌렀을 때 캡처한 프레임을 받는다.
   * 캔버스는 원본 해상도다. 프레임을 캡처하지 못하면 호출하지 않는다.
   * `controls.snapshot`이 켜져 있어야 호출된다.
   */
  onSnapshot?: (canvas: HTMLCanvasElement) => void;

  /**
   * 표시할 디버그 오버레이를 고른다.
   * 켠 항목만 렌더링한다. 기본값은 모두 `false`다.
   */
  debug?: WebcamDebug;

  /**
   * 내장 컨트롤 버튼의 아이콘을 교체한다.
   * 빠진 항목은 기본 아이콘을 사용한다.
   */
  icons?: WebcamIcons;

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
 *     controls={{ flip: true }}
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
    controls,
    debug,
    onSnapshot,
    flipped: flippedProp,
    defaultFlipped,
    onFlippedChange,
    webcamOptions: webcamOptionsProp,
    defaultWebcamOptions,
    onWebcamOptionsChange,
  } = props;

  const { icons } = props;

  // 라벨을 기본값과 병합한다. 미설정 항목은 기본 한국어 값이 사용된다.
  const labels: Required<WebcamLabels> = {
    ...DEFAULT_WEBCAM_LABELS,
    ...props.labels,
  };

  // ---- 컨트롤러 ----------------------------------------------------------
  const ctrl = useWebcamController({ disabled, autoRecover: props.autoRecover });
  const {
    flipped,
    webcamOptions,
    webcamDetail,
    videoSize,
    constraints,
    isLoaded,
    isFrameReady,
    setVideoElement,
    setFitMode,
    setFlipped,
    setWebcamOptions,
  } = ctrl;

  // ---- 제어 및 비제어 모드 판별 -------------------------------------------
  const isFlipControlled = flippedProp !== undefined;
  const isWebcamOptionsControlled = webcamOptionsProp !== undefined;

  // 변경 요청은 모드에 따라 컨트롤러 setter 또는 onXxxChange 콜백으로 보낸다.
  const requestFlipped = useControllableChange<boolean>({
    isControlled: isFlipControlled,
    current: flipped,
    onChange: onFlippedChange,
    setInternal: setFlipped,
    propName: "flipped",
    callbackName: "onFlippedChange",
  });
  const requestWebcamOptions = useControllableChange<WebcamOptions, WebcamOptions | undefined>({
    isControlled: isWebcamOptionsControlled,
    current: webcamOptions,
    onChange: onWebcamOptionsChange,
    setInternal: setWebcamOptions,
    propName: "webcamOptions",
    callbackName: "onWebcamOptionsChange",
  });

  // ---- 명령형 핸들 구성 ---------------------------------------------------
  // 외부에 공개하는 메서드만 명시적으로 조립한다.
  // controlled 모드에서 setFlipped/setWebcamOptions는 onXxxChange 콜백만 호출한다.
  // 핸들 객체는 한 번만 만든다. 소비자가 캐시한 핸들도 최신 상태를 보도록
  // 메서드는 호출 시점에 latestRef에서 최신 값을 읽는다.
  const latestRef = useRef({ ctrl, requestFlipped, requestWebcamOptions });
  latestRef.current = { ctrl, requestFlipped, requestWebcamOptions };
  // effect 본문에서 true로 두어 StrictMode의 cleanup 이중 실행 뒤에도 true로 남게 한다.
  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  useImperativeHandle(
    ref,
    () => ({
      snapshotToCanvas: (options) => latestRef.current.ctrl.snapshotToCanvas(options),
      // 언마운트 뒤에는 re-render가 없어 마지막 값이 남으므로 마운트 여부를 함께 본다.
      isFrameReady: () => mountedRef.current && latestRef.current.ctrl.isFrameReady,
      getDetail: () => latestRef.current.ctrl.webcamDetail,
      // 언마운트 때 ref 콜백이 null을 넘겨도 re-render가 없어 ctrl에는 이전 요소가 남는다.
      // 캐시된 핸들이 분리된 요소를 돌려주지 않도록 마운트 여부를 함께 본다.
      getVideoElement: () =>
        mountedRef.current ? (latestRef.current.ctrl.videoElement ?? null) : null,
      getPlayingVideoDeviceId: () => latestRef.current.ctrl.getPlayingVideoDeviceId(),
      getPlayingAudioDeviceId: () => latestRef.current.ctrl.getPlayingAudioDeviceId(),
      setFlipped: (value) => latestRef.current.requestFlipped(value),
      setWebcamOptions: (updater) => latestRef.current.requestWebcamOptions(updater),
      pausePlayback: () => latestRef.current.ctrl.pausePlayback(),
      resumePlayback: () => latestRef.current.ctrl.resumePlayback(),
      retry: () => latestRef.current.ctrl.retry(),
    }),
    [],
  );

  // ---- prop → 컨트롤러 동기화 -------------------------------------------
  // onStateChange는 최신 참조를 유지해 effect 재실행 없이 호출한다.
  const onStateChangeRef = useRef(props.onStateChange);
  onStateChangeRef.current = props.onStateChange;
  useEffect(() => {
    onStateChangeRef.current?.(webcamDetail);
  }, [webcamDetail]);

  // 프레임 준비 여부가 바뀔 때만 통지한다. 처음 값은 false이므로 첫 false는 통지하지 않는다.
  // onStateChange effect 뒤에 두어 같은 commit에서는 live 통지가 먼저 나가게 한다.
  const onFrameReadyChangeRef = useRef(props.onFrameReadyChange);
  onFrameReadyChangeRef.current = props.onFrameReadyChange;
  const notifiedFrameReadyRef = useRef(false);
  useEffect(() => {
    if (notifiedFrameReadyRef.current === isFrameReady) return;
    notifiedFrameReadyRef.current = isFrameReady;
    onFrameReadyChangeRef.current?.(isFrameReady);
  }, [isFrameReady]);

  // fitMode는 제어 및 비제어 여부와 관계없이 항상 동기화한다.
  useEffect(() => {
    setFitMode(props.fitMode);
  }, [setFitMode, props.fitMode]);

  // flipped: controlled 모드에서는 prop 값을 컨트롤러에 동기화하고,
  // uncontrolled 모드에서는 마운트 시 defaultFlipped로 초기화한다.
  useEffect(() => {
    if (flippedProp !== undefined) {
      setFlipped(flippedProp);
    }
  }, [setFlipped, flippedProp]);

  // 비제어 모드의 defaultFlipped는 마운트 시 한 번만 초기화한다.
  useEffect(() => {
    if (!isFlipControlled && defaultFlipped !== undefined) {
      setFlipped(defaultFlipped);
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 의도적으로 비워 두고 마운트 시 한 번만 실행한다.

  // webcamOptions: controlled 모드에서는 prop 값을 deep compare로 동기화하고,
  // uncontrolled 모드에서는 마운트 시 defaultWebcamOptions로 초기화한다.
  useDeepCompareEffect(() => {
    if (isWebcamOptionsControlled) {
      setWebcamOptions(webcamOptionsProp);
    }
  }, [setWebcamOptions, webcamOptionsProp, isWebcamOptionsControlled]);

  // 비제어 모드의 defaultWebcamOptions는 마운트 시 한 번만 초기화한다.
  useEffect(() => {
    if (!isWebcamOptionsControlled && defaultWebcamOptions !== undefined) {
      setWebcamOptions(defaultWebcamOptions);
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
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
  const showFlipButton = controls?.flip === true;
  const showCameraDirectionButton = controls?.cameraDirection === true;
  const showAspectRatioButton = controls?.aspectRatio === true;
  const showSnapshotButton = controls?.snapshot === true;
  const showVideoSizeDebug = debug?.videoSize === true;
  const showConstraintsDebug = debug?.constraints === true;
  const hasOptionButtons = showFlipButton || showCameraDirectionButton || showAspectRatioButton;
  const hasDisabledFallbackProp = Object.prototype.hasOwnProperty.call(props, "disabledFallback");
  const hasErrorFallbackProp = Object.prototype.hasOwnProperty.call(props, "errorFallback");
  const showDefaultDisabledPlaceholder = disabled && !hasDisabledFallbackProp;
  const rootBackgroundColor = disabled
    ? "var(--webcam-disabled-bg, #f7f8fa)"
    : "var(--webcam-bg, #1e1e1e)";
  const errorDetail = isErrorDetail(webcamDetail) ? webcamDetail : undefined;
  const errorFallbackNode: React.ReactNode = errorDetail
    ? typeof errorFallback === "function"
      ? errorFallback(errorDetail, { retry: ctrl.retry })
      : errorFallback
    : undefined;

  return (
    <div
      ref={rootRef}
      className={classNames("Webcam-root", className, {
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
            backgroundColor: "var(--webcam-bg, #1e1e1e)",
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
            backgroundColor: "var(--webcam-disabled-bg, #f7f8fa)",
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
          {showFlipButton && (
            <FlipButton
              flipped={flipped}
              className='Webcam-optionBtn'
              onChange={requestFlipped}
              label={labels.flip}
              icon={icons?.flip}
            />
          )}

          {showCameraDirectionButton && (
            <FacingModeButton
              className='Webcam-optionBtn'
              label={labels.cameraDirection}
              stateLabels={{ back: labels.facingModeBack, front: labels.facingModeFront }}
              facingMode={webcamOptions.facingMode}
              icon={icons?.cameraDirection}
              onChange={(facingMode) => {
                requestWebcamOptions((prev) => ({
                  ...prev,
                  facingMode,
                  deviceId: undefined,
                }));
              }}
            />
          )}

          {showAspectRatioButton && (
            <AspectRatioButton
              className='Webcam-optionBtn'
              label={labels.aspectRatio}
              autoLabel={labels.aspectRatioAuto}
              icon={icons?.aspectRatio}
              onChange={(aspectRatio) => {
                requestWebcamOptions((prev) => ({
                  ...prev,
                  aspectRatio: aspectRatio?.value,
                }));
              }}
            />
          )}
        </div>
      )}

      {/* ---- 스냅샷 버튼 --------------------------------------------------- */}
      {showSnapshotButton && isLoaded && (
        <SnapshotButton
          label={labels.snapshot}
          icon={icons?.snapshot}
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
              onSnapshot?.(canvas);
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
      {showVideoSizeDebug && (
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

      {showConstraintsDebug && (
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
