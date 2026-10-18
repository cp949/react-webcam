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
  // 페이지별로 번들을 따로 만든다: index.html(Webcam 컴포넌트), hook.html(useWebcam).
  const bundles = [
    { entry: "main.tsx", output: "bundle.js" },
    { entry: "hook.tsx", output: "hook.js" },
  ];
  for (const { entry, output } of bundles) {
    await bundleChrome83FloorHarness({
      entry: resolve(harnessDir, entry),
      output: resolve(outDir, output),
    });
  }
  for (const page of ["index.html", "hook.html", "iframe-host.html"]) {
    await cp(resolve(harnessDir, page), resolve(outDir, page));
  }
}
