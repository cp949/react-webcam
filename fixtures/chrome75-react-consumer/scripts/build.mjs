import { mkdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parse } from "acorn";
import { build } from "esbuild";

export async function buildChrome75Consumer({ entry, output }) {
  await mkdir(dirname(output), { recursive: true });
  await build({
    bundle: true,
    entryPoints: [entry],
    format: "esm",
    outfile: output,
    platform: "browser",
    target: "chrome75",
  });
  parse(await readFile(output, "utf8"), { ecmaVersion: 2019, sourceType: "module" });
}

if (process.env.CHROME75_PACKED_FIXTURE === "1") {
  await buildChrome75Consumer({
    entry: resolve("src/main.tsx"),
    output: resolve("dist/bundle.js"),
  });
}
