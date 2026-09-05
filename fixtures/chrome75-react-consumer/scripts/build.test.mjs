import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { buildChrome75Consumer } from "./build.mjs";

test("buildChrome75Consumer bundles a React consumer into ES2019 syntax", async () => {
  const directory = await mkdtemp(join(tmpdir(), "react-webcam-chrome75-fixture-"));
  try {
    const entry = join(directory, "main.tsx");
    const output = join(directory, "bundle.js");
    await writeFile(entry, "export const target = globalThis?.target ?? 'chrome75';\n");

    await buildChrome75Consumer({ entry, output });

    const bundle = await readFile(output, "utf8");
    assert.doesNotMatch(bundle, /\?\.|\?\?/u);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});
