#!/usr/bin/env bash

set -e

SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
cd "${SCRIPT_DIR}"


for f in apps/*; do
    echo "rm -rf $f/node_modules $f/.turbo $f/dist"
    rm -rf $f/node_modules $f/.turbo $f/dist
done

for f in packages/*; do
    echo "rm -rf $f/node_modules $f/.turbo $f/dist"
    rm -rf $f/node_modules $f/.turbo $f/dist
done

echo "`pwd` : rm -rf node_modules .turbo"
rm -rf node_modules .turbo
