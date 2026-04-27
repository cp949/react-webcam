#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_PACKAGE_JSON = "packages/react-webcam/package.json";

function runGit(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
    .trim();
}

export function getReleaseTagName(version) {
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error(`Invalid package version for release tag: ${version}`);
  }

  return `v${version}`;
}

export function readPackageVersion(packageJsonPath) {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

  if (typeof packageJson.version !== "string") {
    throw new Error(`Missing version in ${packageJsonPath}`);
  }

  return packageJson.version;
}

function resolveTagCommit(cwd, tagName) {
  try {
    return runGit(cwd, ["rev-parse", `${tagName}^{commit}`]);
  } catch {
    return undefined;
  }
}

export function createReleaseTag({
  cwd = process.cwd(),
  packageJsonPath = DEFAULT_PACKAGE_JSON,
} = {}) {
  const absolutePackageJsonPath = resolve(cwd, packageJsonPath);
  const version = readPackageVersion(absolutePackageJsonPath);
  const tagName = getReleaseTagName(version);
  const headCommit = runGit(cwd, ["rev-parse", "HEAD"]);
  const existingTagCommit = resolveTagCommit(cwd, tagName);

  if (existingTagCommit) {
    if (existingTagCommit !== headCommit) {
      throw new Error(`${tagName} already exists on ${existingTagCommit}, not HEAD ${headCommit}`);
    }

    return { tagName, created: false };
  }

  runGit(cwd, ["tag", "-a", tagName, "-m", tagName]);
  return { tagName, created: true };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = createReleaseTag();
  const action = result.created ? "Created" : "Reused";

  console.log(`${action} release tag ${result.tagName}`);
}
