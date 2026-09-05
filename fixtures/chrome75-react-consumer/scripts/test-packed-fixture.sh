#!/usr/bin/env bash
set -euo pipefail

fixture_dir=$(cd "$(dirname "$0")/.." && pwd -P)
repository_dir=$(cd "$fixture_dir/../.." && pwd -P)
package_dir="$repository_dir/packages/react-webcam"
temp_dir=$(mktemp -d "${TMPDIR:-/tmp}/react-webcam-chrome75-packed-XXXXXX")

cleanup() {
  rm -rf "$temp_dir"
}
trap cleanup EXIT

cp -R "$fixture_dir/." "$temp_dir"
rm -rf "$temp_dir/node_modules" "$temp_dir/.artifacts"
mkdir "$temp_dir/.artifacts"

pnpm --dir "$package_dir" pack --pack-destination "$temp_dir/.artifacts"
tarball=$(find "$temp_dir/.artifacts" -maxdepth 1 -name '*.tgz' -print -quit)
test -n "$tarball"
mv "$tarball" "$temp_dir/.artifacts/react-webcam.tgz"

node --input-type=module - "$temp_dir/package.json" <<'NODE'
import { readFile, writeFile } from "node:fs/promises";

const manifestPath = process.argv[2];
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
manifest.devDependencies["@cp949/react-webcam"] = "file:.artifacts/react-webcam.tgz";
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
NODE

pnpm --dir "$temp_dir" install --offline --ignore-scripts
CHROME75_PACKED_FIXTURE=1 pnpm --dir "$temp_dir" build
pnpm --dir "$temp_dir" test:contract
