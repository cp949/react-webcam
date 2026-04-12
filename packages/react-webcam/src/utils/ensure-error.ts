/** unknown 예외 값을 항상 Error 객체로 정규화한다. */
export function ensureError(err: unknown): Error {
  if (err instanceof Error) {
    return err;
  }

  if (typeof err === "string") {
    return new Error(err);
  }

  return new Error(String(err));
}
