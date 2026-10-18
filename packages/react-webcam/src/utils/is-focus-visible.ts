/**
 * 요소의 포커스를 키보드 유래로 볼지 판단한다.
 *
 * - 마우스 클릭으로 생긴 포커스는 `false`다. 클릭 뒤에 강조가 남지 않게 한다.
 * - `:focus-visible`을 모르는 브라우저(Chrome 86 미만)는 선택자 오류가 나므로 `true`로 본다.
 */
export function isFocusVisible(element: Element): boolean {
  try {
    return element.matches(":focus-visible");
  } catch {
    return true;
  }
}
