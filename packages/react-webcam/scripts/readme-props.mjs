/** README 원본의 `## Props` 표에서 prop 이름을 뽑아 언어 간 어긋남을 찾는다. */

const PROPS_HEADING = "## Props";

/** `## Props` 절의 표에서 첫 번째 열의 백틱 이름을 문서 순서대로 반환한다. */
export function extractPropNames(markdown) {
  const lines = markdown.split("\n");
  const start = lines.findIndex((line) => line.trim() === PROPS_HEADING);
  if (start === -1) {
    throw new Error(`"${PROPS_HEADING}" 절을 찾지 못했다.`);
  }

  const names = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith("## ")) break;
    const match = /^\|\s*`([^`]+)`\s*\|/.exec(line);
    if (match) names.push(match[1]);
  }

  if (names.length === 0) {
    throw new Error(`"${PROPS_HEADING}" 절에서 표 행을 찾지 못했다.`);
  }
  return names;
}

/** 영어에만 있는 이름과 한국어에만 있는 이름을 반환한다. 순서는 비교하지 않는다. */
export function findPropNameMismatch(enMarkdown, koMarkdown) {
  const en = extractPropNames(enMarkdown);
  const ko = extractPropNames(koMarkdown);
  return {
    onlyInEn: en.filter((name) => !ko.includes(name)),
    onlyInKo: ko.filter((name) => !en.includes(name)),
  };
}
