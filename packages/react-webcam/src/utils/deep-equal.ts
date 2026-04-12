/** 배열과 객체를 재귀적으로 비교해 깊은 동등성을 확인한다. */
export function deepEq<T>(a: T, b: T): boolean {
  if (a === b) {
    return true;
  }

  const t1 = typeof a;
  const t2 = typeof b;
  if (t1 !== t2) {
    return false;
  }

  if (t1 !== "object" || a === null || b === null) {
    return false;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    return a.every((item, index) => deepEq(item, b[index]));
  }

  const aKeys = Object.keys(a as Record<string, unknown>) as Array<keyof T>;
  const bKeys = Object.keys(b as Record<string, unknown>) as Array<keyof T>;

  if (aKeys.length !== bKeys.length) {
    return false;
  }

  return aKeys.every((key) =>
    deepEq(
      (a as Record<string, unknown>)[key as string],
      (b as Record<string, unknown>)[key as string],
    ),
  );
}
