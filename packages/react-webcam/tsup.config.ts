import { defineConfig } from "tsup";

export default defineConfig((options) => {
  return {
    banner: {
      js: "'use client';",
    },
    dts: {
      compilerOptions: {
        // tsup 8.5.1 injects `baseUrl: "."` during DTS bundling under TS 6.
        ignoreDeprecations: "6.0",
      },
    },
    format: ["esm", "cjs"],
    minify: !options.watch,
    entry: {
      index: "src/index.ts",
    },
    target: "chrome75",
    esbuildOptions(options) {
      // Chrome 75가 public class field를 지원해도, package audit의 ES2019 parser
      // 계약을 지키도록 constructor assignment로 낮춘다.
      options.supported = { "class-field": false, "class-static-field": false };
    },
    splitting: true,
    sourcemap: true,
    clean: false,
    // external: ["react", "react/jsx-runtime"],
  };
});
