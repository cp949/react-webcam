/** An internal class name combiner compatible with clsx's common inputs. */

type ClassNameDictionary = Record<string, unknown>;

export type ClassNameValue =
  | ClassNameDictionary
  | ClassNameValue[]
  | boolean
  | null
  | number
  | string
  | undefined;

function appendClassName(className: string, value: string): string {
  return className ? `${className} ${value}` : value;
}

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

/** Joins truthy class values with spaces in their original order. */
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
