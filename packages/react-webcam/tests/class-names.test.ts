/** clsx 호환 내부 클래스 이름 조합기를 검증한다. */

import { describe, expect, it } from "vitest";
import { classNames } from "../src/utils/class-names.js";

describe("classNames", () => {
  it("문자열과 truthy 숫자를 공백으로 결합한다", () => {
    expect(classNames("Webcam-root", "custom", 1, 0)).toBe("Webcam-root custom 1");
  });

  it("중첩 배열과 truthy 객체 키를 clsx와 같은 순서로 결합한다", () => {
    expect(
      classNames(["outer", ["inner", { selected: true, hidden: false }]], {
        active: true,
        disabled: false,
      }),
    ).toBe("outer inner selected active");
  });

  it("falsy 입력과 빈 값을 건너뛴다", () => {
    expect(classNames(undefined, null, false, "", 0, [], {})).toBe("");
  });
});
