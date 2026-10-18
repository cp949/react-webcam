/** clsx의 일반적인 입력 형식을 지원하는 내부 클래스 이름 결합 유틸리티다. */

type ClassNameDictionary = Record<string, unknown>;

/** 중첩 배열과 조건부 클래스 이름 객체를 포함한 클래스 이름 입력값 */
export type ClassNameValue =
  ClassNameDictionary | ClassNameValue[] | boolean | null | number | string | undefined;

function appendClassName(className: string, value: string): string {
  return className ? `${className} ${value}` : value;
}

/** 중첩 배열을 펼치고 객체에서 참인 값에 대응하는 키를 클래스 이름으로 수집한다. */
function classNameFrom(value: ClassNameValue): string {
  if (typeof value === "string" || typeof value === "number") {
    return `${value}`;
  }

  if (typeof value !== "object" || value === null) {
    return "";
  }

  let className = "";

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const item = value[index];
      if (item) {
        const itemClassName = classNameFrom(item);
        if (itemClassName) {
          className = appendClassName(className, itemClassName);
        }
      }
    }
    return className;
  }

  for (const key in value) {
    if (value[key]) {
      className = appendClassName(className, key);
    }
  }

  return className;
}

/** 거짓으로 평가되는 입력을 제외하고 클래스 이름을 입력 순서대로 공백으로 연결한다. */
export function classNames(...values: ClassNameValue[]): string {
  let className = "";

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value) {
      const valueClassName = classNameFrom(value);
      if (valueClassName) {
        className = appendClassName(className, valueClassName);
      }
    }
  }

  return className;
}
