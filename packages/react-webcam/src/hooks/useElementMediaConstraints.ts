import { useEffect, useRef, useState } from "react";
import { buildMediaStreamConstraints } from "../utils/build-media-stream-constraints.js";
import { deepEq } from "../utils/deep-equal.js";
import { observeElementSize } from "../utils/observe-element-size.js";
import type { WebcamOptions } from "../webcam-types.js";

type ElementSize = { width: number; height: number };

/** 마지막으로 적용한 크기와 이 비율 미만으로 다르면 같은 크기로 본다. */
const SIZE_CHANGE_THRESHOLD = 0.1;

/** 너비와 높이가 모두 기준 크기의 `SIZE_CHANGE_THRESHOLD` 미만으로 다른지 확인한다. */
function isSimilarSize(applied: ElementSize, next: ElementSize): boolean {
  const isClose = (a: number, b: number) => Math.abs(a - b) < a * SIZE_CHANGE_THRESHOLD || a === b;
  return isClose(applied.width, next.width) && isClose(applied.height, next.height);
}

/**
 * 비디오 요소의 렌더링 크기를 관찰하고,
 * debounce(100ms) 후 `getUserMedia`에 전달할 제약 조건을 계산해 반환한다.
 *
 * - ResizeObserver로 크기 변화를 구독하고, 요소가 없으면 즉시 해제한다.
 * - 100ms debounce로 resize 폭주를 흡수한다.
 * - deepEq로 동일 내용의 constraints 참조 교체를 막아 불필요한 스트림 재요청을 방지한다.
 * - 마지막으로 적용한 크기와 10% 미만으로 다른 크기 변화는 무시한다.
 *   창을 끌어 크기를 바꿀 때 스트림이 반복해서 재요청되는 것을 막는다.
 * - videoElement가 없으면 undefined를 반환한다.
 */
export function useElementMediaConstraints(
  videoElement: HTMLVideoElement | undefined,
  webcamOptions: WebcamOptions,
): MediaStreamConstraints | undefined {
  const [elementSize, setElementSize] = useState<{ width: number; height: number } | undefined>(
    undefined,
  );
  const [constraints, setConstraints] = useState<MediaStreamConstraints | undefined>(undefined);
  // 마지막으로 constraints 계산에 쓴 크기다. 마지막으로 관찰한 크기와 비교하면 오차가 쌓여 갱신이 영영 안 된다.
  const appliedSizeRef = useRef<ElementSize | undefined>(undefined);

  // Step 1: 비디오 요소 크기 관찰 — videoElement 교체 시 이전 observer를 해제하고 새로 구독한다.
  useEffect(() => {
    appliedSizeRef.current = undefined;
    if (!videoElement) {
      setElementSize(undefined);
      setConstraints(undefined);
      return;
    }
    return observeElementSize(videoElement, (size) => {
      setElementSize(size);
    });
  }, [videoElement]);

  // Step 2: debounce 후 constraints 계산
  // buildMediaStreamConstraints는 webcamOptions와 요소 크기를 받아 MediaStreamConstraints를 반환한다.
  // deepEq로 내용이 동일한 constraints 객체의 참조 교체를 막아 stream lifecycle effect의 불필요한 재실행을 차단한다.
  useEffect(() => {
    if (!elementSize || !videoElement) return;
    const size = {
      width: Math.round(elementSize.width),
      height: Math.round(elementSize.height),
    };
    const timer = setTimeout(() => {
      const applied = appliedSizeRef.current;
      const effectiveSize = applied && isSimilarSize(applied, size) ? applied : size;
      appliedSizeRef.current = effectiveSize;
      const next = buildMediaStreamConstraints(webcamOptions, effectiveSize);
      setConstraints((prev) => (deepEq(prev, next) ? prev : next));
    }, 100);
    return () => clearTimeout(timer);
  }, [webcamOptions, elementSize, videoElement]);

  return constraints;
}
