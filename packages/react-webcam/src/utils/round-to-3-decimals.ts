/** 숫자를 소수점 셋째 자리까지 반올림한다. */
export function roundTo3Decimals(value: number): number {
  return Math.round(value * 1000) / 1000;
}
