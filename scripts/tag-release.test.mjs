import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createReleaseTag, getReleaseTagName } from "./tag-release.mjs";

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

function makeRepo(version) {
  const cwd = mkdtempSync(join(tmpdir(), "release-tag-"));
  git(cwd, ["init"]);
  git(cwd, ["config", "user.name", "Test User"]);
  git(cwd, ["config", "user.email", "test@example.com"]);

  const packageDir = join(cwd, "packages", "react-webcam");
  mkdirSync(packageDir, { recursive: true });
  writeFileSync(
    join(packageDir, "package.json"),
    JSON.stringify({ name: "@cp949/react-webcam", version }, null, 2),
  );

  git(cwd, ["add", "."]);
  git(cwd, ["commit", "-m", "release"]);

  return cwd;
}

describe("tag-release", () => {
  it("uses the root release tag format", () => {
    assert.equal(getReleaseTagName("1.2.0"), "v1.2.0");
  });

  it("creates a v-prefixed annotated tag for the package version", () => {
    const cwd = makeRepo("1.2.3");

    const result = createReleaseTag({ cwd });

    assert.deepEqual(result, { tagName: "v1.2.3", created: true });
    assert.equal(git(cwd, ["tag", "--list"]).trim(), "v1.2.3");
    assert.equal(git(cwd, ["cat-file", "-t", "v1.2.3"]), "tag");
    assert.equal(git(cwd, ["tag", "--list", "@cp949/react-webcam@1.2.3"]), "");
  });
});
