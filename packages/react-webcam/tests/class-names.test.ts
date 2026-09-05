/** Tests the internal class name combiner. */

import { describe, expect, it } from "vitest";
import { classNames } from "../src/utils/class-names.js";

describe("classNames", () => {
  it("joins strings and truthy numbers with spaces", () => {
    expect(classNames("Webcam-root", "custom", 1, 0)).toBe("Webcam-root custom 1");
  });

  it("joins nested arrays and truthy object keys in clsx order", () => {
    expect(
      classNames(["outer", ["inner", { selected: true, hidden: false }]], {
        active: true,
        disabled: false,
      }),
    ).toBe("outer inner selected active");
  });

  it("skips falsy and empty values", () => {
    expect(classNames(undefined, null, false, "", 0, [], {})).toBe("");
  });
});
