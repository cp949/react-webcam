/** 사용자 정의 비교 함수 기반의 effect 훅을 제공한다. */
// react-use 구현을 바탕으로 현재 프로젝트에 맞게 조정했다.

import type { DependencyList, EffectCallback } from "react";
import { useEffect, useRef } from "react";

const isPrimitive = (val: unknown) => val !== Object(val);
const getNodeEnv = () => (process.env as { NODE_ENV?: string }).NODE_ENV;

type DepsEqualFnType<TDeps extends DependencyList> = (prevDeps: TDeps, nextDeps: TDeps) => boolean;

/**
 * 사용자 정의 비교 함수로 의존성 변경 여부를 판별해 `effect`를 실행한다.
 *
 * @param effect 실행할 부수 효과
 * @param deps 비교 대상 의존성 배열
 * @param depsEqual 이전 값과 다음 값을 비교하는 함수
 */
export const useCustomCompareEffect = <TDeps extends DependencyList>(
  effect: EffectCallback,
  deps: TDeps,
  depsEqual: DepsEqualFnType<TDeps>,
) => {
  if (typeof process === "undefined" || getNodeEnv() !== "production") {
    if (!Array.isArray(deps) || !deps.length) {
      console.warn(
        "`useCustomCompareEffect` should not be used with no dependencies. Use React.useEffect instead.",
      );
    }

    if (deps.every(isPrimitive)) {
      console.warn(
        "`useCustomCompareEffect` should not be used with dependencies that are all primitive values. Use React.useEffect instead.",
      );
    }

    if (typeof depsEqual !== "function") {
      console.warn(
        "`useCustomCompareEffect` should be used with depsEqual callback for comparing deps list",
      );
    }
  }

  const ref = useRef<TDeps | undefined>(undefined);

  // 비교 결과가 달라질 때만 useEffect가 참조할 의존성 배열을 갱신한다.
  if (!ref.current || !depsEqual(deps, ref.current)) {
    ref.current = deps;
  }

  // ref.current는 이 훅 내부에서 조건부로 갱신되므로 exhaustive-deps 분석이 불가능하다.
  useEffect(effect, ref.current);
};
