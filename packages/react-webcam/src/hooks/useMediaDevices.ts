import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ensureError } from "../utils/ensure-error.js";
import { listDevices } from "../utils/media-devices.js";

/** 미디어 입력 장치 목록과 label 사용 가능 여부. */
export type UseMediaDevicesResult = {
  /** 마지막으로 조회한 장치 목록. 조회 전이면 빈 배열이다. 조회에 실패하면 이전 목록을 유지한다. */
  readonly devices: readonly MediaDeviceInfo[];
  /** 장치가 있고 모든 장치에 label이 있으면 true다. 카메라·마이크 권한을 허용하기 전에는 false다. */
  readonly labelsAvailable: boolean;
  /** 마지막 조회 오류. 조회에 성공하면 undefined다. */
  readonly error: Error | undefined;
  /** 장치 목록을 다시 조회한다. 권한을 허용한 뒤 label을 얻을 때 호출한다. 오류는 던지지 않고 `error`로 전달한다. */
  refresh: () => Promise<void>;
};

/**
 * 미디어 입력 장치 목록을 조회하고 `devicechange`마다 자동으로 갱신한다.
 *
 * - `kind`를 생략하면 브라우저가 알려 주는 모든 장치를 반환한다.
 * - 권한 허용 전에는 `label`이 빈 문자열이다. `labelsAvailable`이 false이면 대체 이름을 쓴다.
 * - 서버 렌더링 중에는 조회하지 않는다. 마운트 뒤에 조회한다.
 */
export function useMediaDevices(kind?: "videoinput" | "audioinput"): UseMediaDevicesResult {
  const [devices, setDevices] = useState<readonly MediaDeviceInfo[]>([]);
  const [error, setError] = useState<Error | undefined>(undefined);
  const aliveRef = useRef(true);
  // 늦게 끝난 이전 조회가 최신 결과를 덮어쓰지 않도록 요청 번호로 구분한다.
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    try {
      const list = await listDevices(kind);
      if (!aliveRef.current || requestId !== requestIdRef.current) return;
      setDevices(list);
      setError(undefined);
    } catch (err) {
      if (!aliveRef.current || requestId !== requestIdRef.current) return;
      setError(ensureError(err));
    }
  }, [kind]);

  useEffect(() => {
    aliveRef.current = true;
    void refresh();

    const mediaDevices = typeof navigator === "undefined" ? undefined : navigator.mediaDevices;
    const handleDeviceChange = () => {
      void refresh();
    };
    mediaDevices?.addEventListener?.("devicechange", handleDeviceChange);
    return () => {
      aliveRef.current = false;
      mediaDevices?.removeEventListener?.("devicechange", handleDeviceChange);
    };
  }, [refresh]);

  const labelsAvailable = devices.length > 0 && devices.every((device) => device.label !== "");

  return useMemo(
    () => ({ devices, labelsAvailable, error, refresh }),
    [devices, labelsAvailable, error, refresh],
  );
}
