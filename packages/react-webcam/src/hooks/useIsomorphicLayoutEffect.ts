/** 렌더링 환경에 따라 안전한 effect 훅을 선택한다. */
import { useEffect, useLayoutEffect } from "react";

/** 브라우저에서는 `useLayoutEffect`, 그 외 환경에서는 `useEffect`를 사용한다. */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
