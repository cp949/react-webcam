/** 깊은 비교 기반의 effect 훅을 제공한다. */

import type { DependencyList, EffectCallback } from "react";
import { useEffect, useRef } from "react";
import { deepEq } from "../utils/deep-equal.js";

/**
 * 중첩 객체나 배열이 포함된 의존성 배열을 깊게 비교해 `effect`를 실행한다.
 *
 * @param effect 실행할 부수 효과
 * @param deps 깊은 비교 대상으로 사용할 의존성 배열
 */
export const useDeepCompareEffect = (effect: EffectCallback, deps: DependencyList) => {
  const depsRef = useRef(deps);
  const changeCountRef = useRef(0);
  const effectRef = useRef(effect);

  // 깊게 달라진 렌더에서만 카운터를 올려 effect 실행 신호로 쓴다.
  if (!deepEq(depsRef.current, deps)) {
    depsRef.current = deps;
    changeCountRef.current += 1;
  }
  effectRef.current = effect;

  const changeCount = changeCountRef.current;
  useEffect(() => effectRef.current(), [changeCount]);
};
