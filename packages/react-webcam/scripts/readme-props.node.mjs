/** README 원본의 Props 표 이름 집합 추출과 언어 간 비교를 검증한다. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { extractPropNames, findPropNameMismatch } from "./readme-props.mjs";

/** Props 절 하나를 가진 최소 README 문서를 만든다. */
function createReadme(rows, heading = "## Props") {
  return [
    "# Title",
    "",
    heading,
    "",
    "| Prop | Type |",
    "| --- | --- |",
    ...rows,
    "",
    "## Other",
    "",
    "| `ignored` | `string` |",
  ].join("\n");
}

test("Props 절 표의 첫 번째 열 이름을 순서대로 추출한다", () => {
  const markdown = createReadme(["| `style` | `CSSProperties` |", "| `className` | `string` |"]);

  assert.deepEqual(extractPropNames(markdown), ["style", "className"]);
});

test("다음 ## 절의 표는 포함하지 않는다", () => {
  const markdown = createReadme(["| `style` | `CSSProperties` |"]);

  assert.ok(!extractPropNames(markdown).includes("ignored"));
});

test("Props 절이 없으면 오류를 던진다", () => {
  assert.throws(() => extractPropNames("# Title\n\n## Other\n"), /Props/);
});

test("Props 절에 표 행이 없으면 오류를 던진다", () => {
  assert.throws(() => extractPropNames(createReadme([])), /Props/);
});

test("이름 집합이 같으면 불일치가 없다", () => {
  const en = createReadme(["| `style` | `a` |", "| `className` | `b` |"]);
  const ko = createReadme(["| `className` | `b` |", "| `style` | `a` |"]);

  assert.deepEqual(findPropNameMismatch(en, ko), { onlyInEn: [], onlyInKo: [] });
});

test("한쪽에만 있는 이름을 언어별로 알려 준다", () => {
  const en = createReadme(["| `style` | `a` |", "| `debug` | `b` |"]);
  const ko = createReadme(["| `style` | `a` |", "| `labels` | `c` |"]);

  assert.deepEqual(findPropNameMismatch(en, ko), { onlyInEn: ["debug"], onlyInKo: ["labels"] });
});

test("현재 README 원본의 영어·한국어 Props 이름 집합이 같다", () => {
  const read = (name) => readFileSync(new URL(`../pkg-docs/${name}`, import.meta.url), "utf8");

  assert.deepEqual(findPropNameMismatch(read("README.en.md"), read("README.ko.md")), {
    onlyInEn: [],
    onlyInKo: [],
  });
});
