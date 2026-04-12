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
    target: "es2022",
    splitting: true,
    sourcemap: true,
    clean: false,
    // external: ["react", "react/jsx-runtime"],
  };
});
