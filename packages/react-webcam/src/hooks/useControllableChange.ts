/** 제어형/비제어형 값의 변경 요청을 한 곳에서 분기하는 내부 훅. */

import { useCallback, useRef } from "react";

/** 변경 요청 값. `I`는 요청이 받을 수 있는 값 타입으로, `undefined`를 허용하려면 `T | undefined`를 쓴다. */
type Updater<T, I = T> = I | ((prev: T) => T);

interface UseControllableChangeOptions<T, I> {
  /** 제어형 prop이 지정됐는지 여부. */
  isControlled: boolean;
  /** 컨트롤러가 가진 현재 값. 제어형에서 함수형 업데이터의 입력으로 쓴다. */
  current: T;
  /** 제어형에서 새 값을 알리는 콜백. */
  onChange: ((value: T) => void) | undefined;
  /** 비제어형에서 값을 직접 바꾸는 컨트롤러 setter. */
  setInternal: (updater: Updater<T, I>) => void;
  /** 경고 메시지에 쓰는 제어형 prop 이름. 예: `flipped`. */
  propName: string;
  /** 경고 메시지에 쓰는 콜백 prop 이름. 예: `onFlippedChange`. */
  callbackName: string;
}

/**
 * 변경 요청을 받아 모드에 맞게 전달하는 함수를 돌려준다.
 *
 * - 비제어형: `setInternal`로 값을 바꾼다.
 * - 제어형: `onChange`만 호출한다. 값은 부모가 prop으로 내려 줘야 바뀐다.
 * - 제어형에서 `onChange`가 없으면 요청을 무시하고 `console.warn`을 한 번 출력한다.
 * - 제어형에서 업데이터 결과가 `undefined`이면 요청을 무시한다.
 */
export function useControllableChange<T, I = T>({
  isControlled,
  current,
  onChange,
  setInternal,
  propName,
  callbackName,
}: UseControllableChangeOptions<T, I>): (updater: Updater<T, I>) => void {
  const warnedRef = useRef(false);
  return useCallback(
    (updater: Updater<T, I>) => {
      if (!isControlled) {
        setInternal(updater);
        return;
      }
      if (!onChange) {
        // 사용자에게는 "동작 없음"으로 보이므로 원인을 한 번만 알린다.
        if (!warnedRef.current) {
          warnedRef.current = true;
          console.warn(
            `[react-webcam] ${propName}가 제어형인데 ${callbackName}가 없어 변경 요청을 무시한다.`,
          );
        }
        return;
      }
      const next = typeof updater === "function" ? (updater as (prev: T) => T)(current) : updater;
      if (next !== undefined) onChange(next as T);
    },
    [isControlled, current, onChange, setInternal, propName, callbackName],
  );
}
