import { useEffect, useState } from "react";
import { buildMediaStreamConstraints } from "../utils/build-media-stream-constraints.js";
import { deepEq } from "../utils/deep-equal.js";
import { observeElementSize } from "../utils/observe-element-size.js";
import type { WebcamOptions } from "../webcam-types.js";

/**
 * 비디오 요소의 렌더링 크기를 관찰하고,
 * debounce(100ms) 후 `getUserMedia`에 전달할 제약 조건을 계산해 반환한다.
 *
 * - ResizeObserver로 크기 변화를 구독하고, 요소가 없으면 즉시 해제한다.
 * - 100ms debounce로 resize 폭주를 흡수한다.
 * - deepEq로 동일 내용의 constraints 참조 교체를 막아 불필요한 스트림 재요청을 방지한다.
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

  // Step 1: 비디오 요소 크기 관찰 — videoElement 교체 시 이전 observer를 해제하고 새로 구독한다.
  useEffect(() => {
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
      const next = buildMediaStreamConstraints(webcamOptions, size);
      setConstraints((prev) => (deepEq(prev, next) ? prev : next));
    }, 100);
    return () => clearTimeout(timer);
  }, [webcamOptions, elementSize, videoElement]);

  return constraints;
}
