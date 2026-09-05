import { defineConfig } from "tsdown";

export default defineConfig({
  banner: {
    js: "'use client';",
  },
  format: ["esm", "cjs"],
  entry: {
    index: "src/index.ts",
  },
  target: "chrome75",
  // 기본값(fixedExtension: true)은 esm 출력도 .mjs로 고정한다.
  // tsup과 동일하게 package.json "type": "module" 기준 esm=.js, cjs=.cjs 네이밍을 유지한다.
  fixedExtension: false,
  sourcemap: true,
  clean: false,
});
