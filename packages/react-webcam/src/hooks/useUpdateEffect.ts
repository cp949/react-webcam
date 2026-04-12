/** 최초 마운트 이후의 의존성 변경에만 반응하는 훅이다. */
import type { DependencyList, EffectCallback } from "react";
import { useEffect, useRef } from "react";

/** 첫 렌더링은 건너뛰고 업데이트 시점에만 `effect`를 실행한다. */
export const useUpdateEffect = (effect: EffectCallback, deps?: DependencyList) => {
  const isMounted = useRef(false);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    // 최초 마운트에서는 effect를 실행하지 않는다.
    if (!isMounted.current) {
      isMounted.current = true;
    } else {
      return effect();
    }
    // deps는 호출부에서 전달받으며 이 훅 안에서 exhaustive 분석이 불가능하다.
  }, deps);
};
