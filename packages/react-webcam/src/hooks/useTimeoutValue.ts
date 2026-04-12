"use client";

/** 일정 시간이 지나면 값을 자동으로 비우는 훅이다. */
import { useCallback, useRef, useState } from "react";
import { useUnmount } from "./useUnmount.js";

/**
 * 값을 설정하면 지정한 시간 동안만 유지하고 이후 `null`로 되돌린다.
 *
 * @param timeoutMs 값이 유지될 시간
 * @returns 현재 값과 값을 갱신하는 setter
 */
export function useTimeoutValue<T>(timeoutMs: number): [T | null, (t: T | null) => void] {
  const [value, setValue] = useState<T | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useUnmount(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  });

  const set = useCallback(
    (t: T | null) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setValue(t);
      if (t !== null) {
        timerRef.current = setTimeout(() => {
          setValue(null);
          timerRef.current = null;
        }, timeoutMs);
      }
    },
    [timeoutMs],
  );

  return [value, set];
}
