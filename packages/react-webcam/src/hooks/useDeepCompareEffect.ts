/** 깊은 비교 기반의 effect 훅을 제공한다. */
// react-use 구현을 바탕으로 현재 프로젝트에 맞게 조정했다.

import type { DependencyList, EffectCallback } from "react";
import { deepEq } from "../utils/deep-equal.js";
import { useCustomCompareEffect } from "./useCustomCompareEffect.js";

const isPrimitive = (val: unknown) => val !== Object(val);
const getNodeEnv = () => (process.env as { NODE_ENV?: string }).NODE_ENV;

/**
 * 중첩 객체나 배열이 포함된 의존성 배열을 깊게 비교해 `effect`를 실행한다.
 *
 * @param effect 실행할 부수 효과
 * @param deps 깊은 비교 대상으로 사용할 의존성 배열
 */
export const useDeepCompareEffect = (effect: EffectCallback, deps: DependencyList) => {
  if (typeof process === "undefined" || getNodeEnv() !== "production") {
    if (!Array.isArray(deps) || !deps.length) {
      console.warn(
        "`useDeepCompareEffect` should not be used with no dependencies. Use React.useEffect instead.",
      );
    }

    if (deps.every(isPrimitive)) {
      console.warn(
        "`useDeepCompareEffect` should not be used with dependencies that are all primitive values. Use React.useEffect instead.",
      );
    }
  }

  useCustomCompareEffect(effect, deps, deepEq);
};
