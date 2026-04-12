/** DOM 요소의 크기 변화를 관찰하는 훅을 제공한다. */
// Mantine 구현을 바탕으로 현재 프로젝트에 맞게 조정했다.

import { useEffect, useMemo, useRef, useState } from "react";

type ObserverRect = Omit<DOMRectReadOnly, "toJSON">;

const defaultState: ObserverRect = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
};

/**
 * 지정한 요소를 `ResizeObserver`로 감시하고 최신 크기 정보를 반환한다.
 *
 * @param options 관찰 동작을 조정할 옵션
 * @returns 요소 ref와 마지막으로 측정한 DOMRect 정보
 */
export function useResizeObserver<T extends HTMLElement = HTMLElement>(
  options?: ResizeObserverOptions,
) {
  const frameID = useRef(0);
  const ref = useRef<T>(null);
  const [rect, setRect] = useState<ObserverRect>(defaultState);

  // options는 ref로 최신 값을 유지하며, 마운트 후 변경이 발생해도 재연결하지 않는다.
  // (옵저버를 재연결하면 렌더 루프가 생길 수 있다.)
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const observer = useMemo(
    () =>
      typeof window !== "undefined" && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver((entries: ResizeObserverEntry[]) => {
            const entry = entries[0];

            if (entry) {
              // 연속 resize 이벤트는 다음 프레임으로 모아 반영한다.
              cancelAnimationFrame(frameID.current);

              frameID.current = requestAnimationFrame(() => {
                if (ref.current) {
                  setRect(entry.contentRect);
                }
              });
            }
          })
        : null,
    [],
  );

  const measure = () => {
    if (!ref.current) return;
    setRect(ref.current.getBoundingClientRect());
  };

  useEffect(() => {
    if (ref.current) {
      if (observer) {
        observer.observe(ref.current, optionsRef.current);
      } else {
        measure();
        if (typeof window !== "undefined") {
          window.addEventListener("resize", measure, { passive: true });
        }
      }
    }

    return () => {
      observer?.disconnect();
      if (!observer && typeof window !== "undefined") {
        window.removeEventListener("resize", measure);
      }

      if (frameID.current) {
        cancelAnimationFrame(frameID.current);
      }
    };
    // ref.current의 변경은 effect를 재실행시키지 않는다. 마운트 시 한 번 연결하고
    // 언마운트 시 해제하는 것이 올바른 동작이므로 의존성 배열을 비워 둔다.
  }, [observer]);

  return [ref, rect] as const;
}
