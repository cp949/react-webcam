import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  Chrome75PackageAuditError,
  auditChrome75Package,
} from "./chrome75-package-audit.mjs";

async function withPackage(files, callback) {
  const directory = await mkdtemp(join(tmpdir(), "react-webcam-chrome75-audit-"));
  try {
    await Promise.all(
      Object.entries(files).map(async ([path, source]) => {
        const target = join(directory, path);
        await mkdir(join(target, ".."), { recursive: true });
        await writeFile(target, source);
      }),
    );
    await callback(directory);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
}

const COMPATIBLE_FILES = {
  "src/index.ts": "export const compatibilityTarget = 'chrome75';\n",
  "dist/index.js": "export const compatibilityTarget = 'chrome75';\n",
  "dist/index.cjs": "exports.compatibilityTarget = 'chrome75';\n",
};

test("accepts ES2019 ESM/CJS artifacts without unsupported runtime APIs", async () => {
  await withPackage(COMPATIBLE_FILES, async (directory) => {
    const result = await auditChrome75Package(directory);

    assert.deepEqual(result.artifacts, ["dist/index.cjs", "dist/index.js"]);
    assert.deepEqual(result.sources, ["src/index.ts"]);
  });
});

test("rejects optional chaining and nullish coalescing left in artifacts", async () => {
  await withPackage(
    {
      ...COMPATIBLE_FILES,
      "dist/index.js": "export const value = globalThis?.value ?? 'fallback';\n",
    },
    async (directory) => {
      await assert.rejects(
        auditChrome75Package(directory),
        (error) =>
          error instanceof Chrome75PackageAuditError &&
          error.diagnostics.some((diagnostic) => diagnostic.code === "ES2019_SYNTAX"),
      );
    },
  );
});

test("rejects the explicit Chrome 75 runtime API denylist in source and artifacts", async () => {
  await withPackage(
    {
      ...COMPATIBLE_FILES,
      "src/index.ts": [
        "items.at(0);",
        "items.findLast(Boolean);",
        "Object.hasOwn(items, 'value');",
        "structuredClone(items);",
        "crypto.randomUUID();",
        "window.addEventListener('scrollend', () => {});",
        "window.onscrollend = () => {};",
      ].join("\n"),
    },
    async (directory) => {
      await assert.rejects(
        auditChrome75Package(directory),
        (error) => {
          assert.ok(error instanceof Chrome75PackageAuditError);
          assert.deepEqual(
            error.diagnostics.map((diagnostic) => diagnostic.code),
            [
              "ARRAY_AT",
              "ARRAY_FIND_LAST",
              "CRYPTO_RANDOM_UUID",
              "OBJECT_HAS_OWN",
              "SCROLLEND",
              "STRUCTURED_CLONE",
            ],
          );
          return true;
        },
      );
    },
  );
});
