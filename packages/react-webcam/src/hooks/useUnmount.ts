/** 언마운트 시점 정리 로직을 실행하는 훅이다. */
import { useEffect, useRef } from "react";

/**
 * 컴포넌트가 언마운트될 때 최신 정리 함수를 호출한다.
 *
 * @param func 언마운트 시 실행할 정리 함수
 */
export function useUnmount(func: () => void) {
  const funcRef = useRef(func);

  funcRef.current = func;

  useEffect(
    () => () => {
      funcRef.current();
    },
    [],
  );
}
