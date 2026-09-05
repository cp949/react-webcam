import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { bundleChrome83FloorHarness } from "./build.mjs";

test("bundleChrome83FloorHarness bundles into ES2019 syntax", async () => {
  const directory = await mkdtemp(join(tmpdir(), "chrome83-floor-harness-"));
  try {
    const entry = join(directory, "main.tsx");
    const output = join(directory, "bundle.js");
    await writeFile(entry, "export const target = globalThis?.target ?? 'chrome75';\n");

    await bundleChrome83FloorHarness({ entry, output });

    const bundle = await readFile(output, "utf8");
    assert.doesNotMatch(bundle, /\?\.|\?\?/u);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});
