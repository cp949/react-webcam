/**
 * 요소의 렌더링 크기를 관찰하고 변경될 때마다 콜백에 전달한다.
 *
 * 관찰을 시작할 때 현재 크기를 한 번 즉시 전달하며,
 * 반환값으로 관찰 해제 함수를 제공한다.
 *
 * ResizeObserver가 없는 환경에서는 window resize 이벤트를 폴백으로 사용하며,
 * 그마저도 없으면 초기 측정만 수행하고 no-op cleanup을 반환한다.
 */
export function observeElementSize(
  element: HTMLElement,
  callback: (size: { width: number; height: number }) => void,
): VoidFunction {
  const measure = () => {
    const { width, height } = element.getBoundingClientRect();
    callback({ width, height });
  };

  // 구독 직후 현재 크기를 즉시 전달해 초기 렌더링과 동기화한다.
  measure();

  // ResizeObserver가 사용 가능하면 지속적인 크기 변화를 관찰한다.
  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(measure);
    ro.observe(element);
    return () => {
      ro.unobserve(element);
      ro.disconnect();
    };
  }

  // 폴백: window resize 이벤트로 재측정한다 (제한적 환경에서의 최선 노력).
  if (typeof window !== "undefined") {
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      window.removeEventListener("resize", measure);
    };
  }

  // 관찰 수단이 없는 경우 — no-op cleanup을 반환한다.
  return () => {};
}
