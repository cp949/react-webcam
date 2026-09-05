import { cp, mkdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parse } from "acorn";
import { build } from "esbuild";

export async function bundleChrome83FloorHarness({ entry, output }) {
  await mkdir(dirname(output), { recursive: true });
  await build({
    bundle: true,
    entryPoints: [entry],
    format: "esm",
    outfile: output,
    platform: "browser",
    target: "chrome75",
  });
  // 다운레벨 문법 계약을 fixtures/chrome75-react-consumer와 동일하게 재확인한다.
  parse(await readFile(output, "utf8"), { ecmaVersion: 2019, sourceType: "module" });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const here = dirname(new URL(import.meta.url).pathname);
  const harnessDir = resolve(here, "..", "harness");
  const outDir = resolve(here, "..", "dist");
  await bundleChrome83FloorHarness({
    entry: resolve(harnessDir, "main.tsx"),
    output: resolve(outDir, "bundle.js"),
  });
  await cp(resolve(harnessDir, "index.html"), resolve(outDir, "index.html"));
}
