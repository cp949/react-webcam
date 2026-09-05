import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";
import { parse } from "acorn";
import ts from "typescript";

const ARTIFACTS = ["dist/index.cjs", "dist/index.js"];
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);

export class Chrome75PackageAuditError extends Error {
  constructor(diagnostics) {
    super(`Chrome 75 package audit failed with ${diagnostics.length} diagnostic(s).`);
    this.name = "Chrome75PackageAuditError";
    this.diagnostics = diagnostics;
  }
}

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(path)));
    } else if (entry.isFile() && SOURCE_EXTENSIONS.has(extname(entry.name))) {
      files.push(path);
    }
  }
  return files;
}

function memberName(node) {
  if (node?.type !== "MemberExpression") return undefined;
  if (!node.computed && node.property.type === "Identifier") return node.property.name;
  if (node.computed && typeof node.property.value === "string") return node.property.value;
  return undefined;
}

function findJavaScriptRuntimeApis(node, found) {
  if (!node || typeof node.type !== "string") return;

  if (node.type === "CallExpression") {
    const calledMember = memberName(node.callee);
    if (calledMember === "at") found.add("ARRAY_AT");
    if (calledMember === "findLast") found.add("ARRAY_FIND_LAST");
    if (node.callee.type === "Identifier" && node.callee.name === "structuredClone") {
      found.add("STRUCTURED_CLONE");
    }
    if (
      calledMember === "randomUUID" &&
      node.callee.object?.type === "Identifier" &&
      node.callee.object.name === "crypto"
    ) {
      found.add("CRYPTO_RANDOM_UUID");
    }
    if (
      calledMember === "hasOwn" &&
      node.callee.object?.type === "Identifier" &&
      node.callee.object.name === "Object"
    ) {
      found.add("OBJECT_HAS_OWN");
    }
    if (
      calledMember === "addEventListener" &&
      node.arguments[0]?.type === "Literal" &&
      node.arguments[0].value === "scrollend"
    ) {
      found.add("SCROLLEND");
    }
  }
  if (memberName(node) === "onscrollend") found.add("SCROLLEND");

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const child of value) findJavaScriptRuntimeApis(child, found);
    } else {
      findJavaScriptRuntimeApis(value, found);
    }
  }
}

function findTypeScriptRuntimeApis(node, found) {
  if (ts.isCallExpression(node)) {
    if (ts.isIdentifier(node.expression) && node.expression.text === "structuredClone") {
      found.add("STRUCTURED_CLONE");
    }
    if (ts.isPropertyAccessExpression(node.expression)) {
      const property = node.expression.name.text;
      if (property === "at") found.add("ARRAY_AT");
      if (property === "findLast") found.add("ARRAY_FIND_LAST");
      if (
        property === "randomUUID" &&
        ts.isIdentifier(node.expression.expression) &&
        node.expression.expression.text === "crypto"
      ) {
        found.add("CRYPTO_RANDOM_UUID");
      }
      if (
        property === "hasOwn" &&
        ts.isIdentifier(node.expression.expression) &&
        node.expression.expression.text === "Object"
      ) {
        found.add("OBJECT_HAS_OWN");
      }
      if (
        property === "addEventListener" &&
        ts.isStringLiteralLike(node.arguments[0]) &&
        node.arguments[0].text === "scrollend"
      ) {
        found.add("SCROLLEND");
      }
    }
  }
  if (ts.isPropertyAccessExpression(node) && node.name.text === "onscrollend") {
    found.add("SCROLLEND");
  }
  ts.forEachChild(node, (child) => findTypeScriptRuntimeApis(child, found));
}

function addRuntimeDiagnostics(diagnostics, path, found) {
  for (const code of [...found].sort()) {
    diagnostics.push({ code, path });
  }
}

async function auditSource(path, diagnostics) {
  const source = await readFile(path, "utf8");
  const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
  const found = new Set();
  findTypeScriptRuntimeApis(sourceFile, found);
  addRuntimeDiagnostics(diagnostics, path, found);
}

async function auditArtifact(path, sourceType, diagnostics) {
  const source = await readFile(path, "utf8");
  let program;
  try {
    program = parse(source, { ecmaVersion: 2019, sourceType });
  } catch (error) {
    diagnostics.push({ code: "ES2019_SYNTAX", path, message: error.message });
    return;
  }
  const found = new Set();
  findJavaScriptRuntimeApis(program, found);
  addRuntimeDiagnostics(diagnostics, path, found);
}

export async function auditChrome75Package(rootPath) {
  const packageDirectory = resolve(rootPath);
  const sourcePaths = await collectSourceFiles(join(packageDirectory, "src"));
  const artifactPaths = ARTIFACTS.map((path) => join(packageDirectory, path));
  const diagnostics = [];

  await Promise.all(sourcePaths.map((path) => auditSource(path, diagnostics)));
  await Promise.all(
    artifactPaths.map((path) =>
      auditArtifact(path, path.endsWith(".cjs") ? "script" : "module", diagnostics),
    ),
  );

  diagnostics.sort((left, right) =>
    left.path === right.path ? left.code.localeCompare(right.code) : left.path.localeCompare(right.path),
  );
  if (diagnostics.length > 0) throw new Chrome75PackageAuditError(diagnostics);

  return {
    artifacts: artifactPaths.map((path) => relative(packageDirectory, path)),
    sources: sourcePaths.map((path) => relative(packageDirectory, path)),
  };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const result = await auditChrome75Package(process.cwd());
  console.log(`[chrome75-audit] ${result.sources.length} source file(s), ${result.artifacts.length} artifact(s)`);
}
