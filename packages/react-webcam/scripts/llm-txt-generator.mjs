/**
 * `dist/index.d.ts`와 보조 가이드를 바탕으로 에이전트 소비용 `llm.txt`를 조합하는 생성기다.
 */
import * as ts from "typescript";

/** 줄바꿈과 후행 공백을 정리해 출력 비교가 안정적으로 유지되게 한다. */
function normalizeText(value) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

/** 과도한 빈 줄을 눌러 섹션 사이 공백만 남긴다. */
function collapseBlankLines(value) {
  return value.replace(/\n{3,}/g, "\n\n");
}

/** 코드 예시와 선언 텍스트를 fenced code block으로 감싼다. */
function formatCodeBlock(value, language = "ts") {
  return [`\`\`\`${language}`, value.trimEnd(), "```"].join("\n");
}

/** declaration 노드에서 공개 심볼 이름을 읽는다. */
function declarationNameFromNode(node) {
  if (
    ts.isFunctionDeclaration(node) ||
    ts.isTypeAliasDeclaration(node) ||
    ts.isInterfaceDeclaration(node) ||
    ts.isEnumDeclaration(node) ||
    ts.isClassDeclaration(node)
  ) {
    return node.name?.text;
  }

  if (ts.isVariableStatement(node)) {
    const [declaration] = node.declarationList.declarations;
    if (declaration && ts.isIdentifier(declaration.name)) {
      return declaration.name.text;
    }
  }

  return undefined;
}

/** 노드 종류를 런타임 값과 타입 선언 관점에서 분류한다. */
function declarationKindFromNode(node) {
  if (ts.isFunctionDeclaration(node)) return "function";
  if (ts.isTypeAliasDeclaration(node)) return "type";
  if (ts.isInterfaceDeclaration(node)) return "interface";
  if (ts.isEnumDeclaration(node)) return "enum";
  if (ts.isClassDeclaration(node)) return "class";
  if (ts.isVariableStatement(node)) return "value";
  return "unknown";
}

/** import 예시를 만들 수 있게 선언이 런타임 값인지 타입 전용인지 판별한다. */
function declarationVisibilityFromKind(kind) {
  return kind === "function" || kind === "class" || kind === "enum" || kind === "value"
    ? "runtime"
    : "type";
}

/** AST 노드를 렌더링 가능한 선언 레코드로 정규화한다. */
function createDeclarationRecord(node, sourceFile, printer) {
  const name = declarationNameFromNode(node);
  if (!name) return undefined;

  return {
    name,
    kind: declarationKindFromNode(node),
    visibility: declarationVisibilityFromKind(declarationKindFromNode(node)),
    node,
    text: normalizeText(printer.printNode(ts.EmitHint.Unspecified, node, sourceFile)),
  };
}

/** declaration 파일의 최상위 선언을 이름 기준 맵으로 수집한다. */
function collectTopLevelDeclarations(sourceFile) {
  const printer = ts.createPrinter({ removeComments: true });
  const declarations = new Map();

  for (const statement of sourceFile.statements) {
    const record = createDeclarationRecord(statement, sourceFile, printer);
    if (record) {
      declarations.set(record.name, record);
    }
  }

  return declarations;
}

/** 실제 공개 export 이름만 따로 수집해 import 가이드가 내부 타입을 노출하지 않게 한다. */
function collectPublicExportNames(sourceFile) {
  const publicExportNames = new Set();

  for (const statement of sourceFile.statements) {
    if (ts.isExportDeclaration(statement)) {
      const clause = statement.exportClause;
      if (clause && ts.isNamedExports(clause)) {
        for (const element of clause.elements) {
          publicExportNames.add(element.name.text);
        }
      }
      continue;
    }

    const modifiers = ts.getModifiers(statement) ?? [];
    if (modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
      const name = declarationNameFromNode(statement);
      if (name) {
        publicExportNames.add(name);
      }
    }
  }

  return publicExportNames;
}

/** 특정 선언이 참조하는 다른 최상위 타입 이름을 찾아 dependency closure 계산에 쓴다. */
function findReferencedTopLevelNames(node, declarationNames) {
  const referenced = new Set();

  function visit(current) {
    if (ts.isTypeReferenceNode(current) && ts.isIdentifier(current.typeName)) {
      if (declarationNames.has(current.typeName.text)) {
        referenced.add(current.typeName.text);
      }
    }

    if (ts.isExpressionWithTypeArguments(current) && ts.isIdentifier(current.expression)) {
      if (declarationNames.has(current.expression.text)) {
        referenced.add(current.expression.text);
      }
    }

    ts.forEachChild(current, visit);
  }

  visit(node);
  return referenced;
}

/** 핵심 공개 심볼이 의존하는 선언을 순서 보존 형태로 닫아준다. */
function resolveDeclarationClosure(declarationMap, keySymbols) {
  const ordered = [];
  const visited = new Set();
  const visiting = new Set();
  const declarationNames = new Set(declarationMap.keys());

  function visit(name) {
    const declaration = declarationMap.get(name);
    if (!declaration) {
      throw new Error(
        `Missing required declaration "${name}" in bundled type text. ` +
          `Available declarations: ${Array.from(declarationNames).sort().join(", ")}`,
      );
    }

    if (visited.has(name)) return;
    if (visiting.has(name)) {
      throw new Error(`Cyclic declaration dependency detected while resolving "${name}".`);
    }

    visiting.add(name);
    for (const dependency of findReferencedTopLevelNames(declaration.node, declarationNames)) {
      if (dependency !== name) {
        visit(dependency);
      }
    }
    visiting.delete(name);
    visited.add(name);
    ordered.push(declaration);
  }

  for (const name of keySymbols) {
    visit(name);
  }

  return ordered;
}

/** 문자열 리터럴 union 타입에서 값 목록만 추출한다. */
function extractStringUnionValues(node) {
  if (!ts.isTypeAliasDeclaration(node)) return [];

  const typeNode = node.type;
  if (!ts.isUnionTypeNode(typeNode)) return [];

  const values = [];
  for (const part of typeNode.types) {
    if (ts.isLiteralTypeNode(part) && ts.isStringLiteral(part.literal)) {
      values.push(part.literal.text);
    }
  }

  return values;
}

const APPROVED_PUBLIC_API_NAMES = new Set([
  "Webcam",
  "WebcamHandle",
  "WebcamProps",
  "WebcamDetail",
  "WebcamOptions",
  "WebcamPhase",
  "WebcamErrorCode",
  "SnapshotOptions",
  "listMediaDevices",
  "listVideoInputDevices",
  "listAudioInputDevices",
]);

const WEB_CAM_LABELS_INLINE = [
  "{",
  "    snapshot?: string;",
  "    flip?: string;",
  "    cameraDirection?: string;",
  "    facingModeBack?: string;",
  "    facingModeFront?: string;",
  "    facingModeDefault?: string;",
  "    aspectRatio?: string;",
  "    aspectRatioAuto?: string;",
  "}",
].join("\n");

const _WEB_CAM_VIDEO_SIZE_INLINE = [
  "{",
  "    videoSize?: {",
  "        width: number;",
  "        height: number;",
  "    };",
  "}",
].join("\n");

/** 내부 보조 타입을 외부 helper heading 없이 읽을 수 있게 `WebcamDetail`을 펼쳐 쓴다. */
function renderExpandedWebcamDetail() {
  return [
    "type WebcamDetail =",
    "  | ({",
    "      videoSize?: {",
    "        width: number;",
    "        height: number;",
    "      };",
    '      phase: "idle";',
    "    })",
    "  | ({",
    "      videoSize?: {",
    "        width: number;",
    "        height: number;",
    "      };",
    '      phase: "requesting";',
    "      constraints: MediaStreamConstraints;",
    "    })",
    "  | ({",
    "      videoSize?: {",
    "        width: number;",
    "        height: number;",
    "      };",
    '      phase: "live";',
    "      mediaStream: MediaStream;",
    "      constraints: MediaStreamConstraints;",
    "    })",
    "  | ({",
    "      videoSize?: {",
    "        width: number;",
    "        height: number;",
    "      };",
    '      phase: "playback-error";',
    "      mediaStream: MediaStream;",
    "      constraints: MediaStreamConstraints;",
    "      error: Error;",
    "    })",
    "  | ({",
    "      videoSize?: {",
    "        width: number;",
    "        height: number;",
    "      };",
    '      phase: "denied" | "unavailable" | "unsupported" | "insecure" | "error";',
    "      errorCode: WebcamErrorCode;",
    "      error: Error;",
    "      constraints: MediaStreamConstraints;",
    "    });",
  ].join("\n");
}

/** `WebcamLabels` 의존성을 별도 공개 API처럼 노출하지 않도록 `WebcamProps` 안에 인라인한다. */
function renderExpandedWebcamProps() {
  return [
    "interface WebcamProps {",
    "    style?: React.CSSProperties;",
    "    className?: string;",
    "    disabled?: boolean;",
    "    disabledFallback?: React.ReactNode;",
    '    errorFallback?: React.ReactNode | ((detail: Extract<WebcamDetail, { phase: "denied" | "unavailable" | "unsupported" | "insecure" | "error" }>) => React.ReactNode);',
    "    onStateChange?: (state: WebcamDetail) => void;",
    '    fitMode?: "unset" | "fill" | "cover" | "contain";',
    "    flipped?: boolean;",
    "    onFlippedChange?: (value: boolean) => void;",
    "    defaultFlipped?: boolean;",
    "    webcamOptions?: WebcamOptions;",
    "    onWebcamOptionsChange?: (options: WebcamOptions) => void;",
    "    defaultWebcamOptions?: WebcamOptions;",
    "    visibleFlipButton?: boolean;",
    "    visibleCameraDirectionButton?: boolean;",
    "    visibleAspectRatioButton?: boolean;",
    "    visibleSnapshotButton?: boolean;",
    "    visibleVideoSizeDebug?: boolean;",
    "    visibleConstraintsDebug?: boolean;",
    `    labels?: ${WEB_CAM_LABELS_INLINE.replace(/\n/g, "\n    ")};`,
    "    children?: React.ReactNode;",
    "}",
  ].join("\n");
}

/** 공개 export만 기준으로 import 예시를 렌더링한다. */
function renderImports(declarations, publicExportNames) {
  const runtimeSymbols = declarations
    .filter((declaration) => declaration.visibility === "runtime")
    .map((declaration) => declaration.name);
  const typeSymbols = declarations
    .filter((declaration) => declaration.visibility !== "runtime")
    .map((declaration) => declaration.name);
  const exportFilter = publicExportNames ?? new Set();
  const runtimePublicSymbols = runtimeSymbols.filter((name) => exportFilter.has(name));
  const typePublicSymbols = typeSymbols.filter((name) => exportFilter.has(name));

  const lines = [];
  lines.push(
    "Import from the package root only. Avoid deep imports into `dist/` or internal scripts.",
  );

  if (runtimePublicSymbols.length > 0) {
    lines.push(
      formatCodeBlock(
        `import { ${runtimePublicSymbols.join(", ")} } from "@cp949/react-webcam";`,
        "ts",
      ),
    );
  }

  if (typePublicSymbols.length > 0) {
    lines.push(
      formatCodeBlock(
        `import type { ${typePublicSymbols.join(", ")} } from "@cp949/react-webcam";`,
        "ts",
      ),
    );
  }

  return lines.join("\n\n");
}

/** 하나의 공개 API 섹션을 heading + code block 형태로 렌더링한다. */
function renderDeclarationSection(declaration, isPrimary) {
  const suffix = isPrimary ? "" : " (supporting type)";
  return [
    `### \`${declaration.name}\`${suffix}`,
    declaration.text
      ? formatCodeBlock(declaration.text, "ts")
      : "_Declaration text was not provided to the renderer._",
  ].join("\n");
}

/** 승인된 공개 심볼만 `Key APIs` 섹션에 포함한다. */
function renderDeclarations(declarations, keySymbols) {
  return declarations
    .filter((declaration) => keySymbols.includes(declaration.name))
    .map((declaration) => renderDeclarationSection(declaration, true))
    .join("\n\n");
}

/** 소비자가 바로 복사해 쓸 수 있는 기본/상태/ref 예시를 렌더링한다. */
function renderUsageExamples(packageName) {
  const basicExample = formatCodeBlock(
    [
      `import { Webcam } from "${packageName}";`,
      "",
      "export function CameraView() {",
      "  return <Webcam visibleSnapshotButton webcamOptions={{ aspectRatio: 16 / 9 }} />;",
      "}",
    ].join("\n"),
    "tsx",
  );

  const stateExample = formatCodeBlock(
    [
      `import { Webcam, type WebcamDetail } from "${packageName}";`,
      "",
      "function handleStateChange(detail: WebcamDetail) {",
      '  if (detail.phase === "playback-error") {',
      "    console.warn(detail.error);",
      "  }",
      "}",
      "",
      "export function CameraStatus() {",
      "  return <Webcam disabled={false} onStateChange={handleStateChange} />;",
      "}",
    ].join("\n"),
    "tsx",
  );

  const refSnapshotExample = formatCodeBlock(
    [
      `import { useRef } from "react";`,
      `import { Webcam, type WebcamHandle } from "${packageName}";`,
      "",
      "export function SnapshotViaRef() {",
      "  const webcamRef = useRef<WebcamHandle>(null);",
      "",
      "  function handleSnapshot() {",
      "    const canvas = webcamRef.current?.snapshotToCanvas();",
      "    if (!canvas) return;",
      "",
      "    console.log(canvas.toDataURL());",
      "  }",
      "",
      "  return (",
      "    <>",
      "      <Webcam ref={webcamRef} />",
      '      <button type="button" onClick={handleSnapshot}>Take snapshot</button>',
      "    </>",
      "  );",
      "}",
    ].join("\n"),
    "tsx",
  );

  return [basicExample, stateExample, refSnapshotExample].join("\n\n");
}

/** 사용 규칙 섹션을 고정 템플릿으로 조립한다. */
function renderGuidanceSection(guidance) {
  return [
    `## Usage Rules`,
    `- ${guidance.disabled}`,
    `- ${guidance.snapshotToCanvas}`,
    `- ${guidance.deviceSelection}`,
    `- ${guidance.playbackError}`,
    `- ${guidance.trackEnded}`,
    `- ${guidance.controlledMode}`,
    `- ${guidance.pausePlayback}`,
  ].join("\n");
}

/** 브라우저 제약과 금지 패턴을 별도 섹션으로 정리한다. */
function renderConstraintSection(guidance, packageDescription) {
  return [
    "## Constraints",
    `- ${packageDescription}`,
    "- This package is browser-only and depends on WebRTC and media-device APIs.",
    "- Camera access requires a secure context such as HTTPS or localhost.",
    "- Playback can fail under autoplay policy, surfacing `playback-error` even when the stream is still alive.",
    "- `pausePlayback()` pauses only the video element; it does not stop the camera hardware or any `MediaStreamTrack`.",
    `- ${guidance.antiPattern}`,
  ].join("\n");
}

/** declaration에서 상태/에러 코드 literal 목록을 읽어 상태 모델 설명을 만든다. */
function renderStateModel(declarations) {
  const phase = declarations.find((declaration) => declaration.name === "WebcamPhase");
  const errorCode = declarations.find((declaration) => declaration.name === "WebcamErrorCode");

  const phaseValues = phase?.node ? extractStringUnionValues(phase.node) : [];
  const errorValues = errorCode?.node ? extractStringUnionValues(errorCode.node) : [];

  return [
    "## State Model",
    phaseValues.length > 0
      ? `- \`WebcamPhase\` values come from the bundled declaration: ${phaseValues
          .map((value) => `\`${value}\``)
          .join(", ")}.`
      : "- `WebcamPhase` values are declared in the bundled type surface.",
    errorValues.length > 0
      ? `- \`WebcamErrorCode\` values come from the bundled declaration: ${errorValues
          .map((value) => `\`${value}\``)
          .join(", ")}.`
      : "- `WebcamErrorCode` values are declared in the bundled type surface.",
    "- `track-ended` means the media track stopped and the consumer should restart the stream instead of treating it like a permission failure.",
  ].join("\n");
}

/** helper 타입 의존성을 숨기기 위해 일부 공개 타입 선언을 인라인 버전으로 치환한다. */
function normalizeRenderedDeclaration(declaration) {
  if (declaration.name === "WebcamDetail") {
    return {
      ...declaration,
      text: renderExpandedWebcamDetail(),
    };
  }

  if (declaration.name === "WebcamProps") {
    return {
      ...declaration,
      text: renderExpandedWebcamProps(),
    };
  }

  return declaration;
}

/** null과 원시값 입력을 안전한 객체 형태로 정규화한다. */
function toPlainObject(value) {
  return value && typeof value === "object" ? value : {};
}

/** declaration 입력이 없을 때도 출력 구조를 유지할 수 있도록 자리표시 선언을 만든다. */
function buildFallbackDeclarations(keySymbols) {
  return keySymbols.map((name) => ({
    name,
    kind: "placeholder",
    visibility: "type",
    node: undefined,
    text: "",
  }));
}

/**
 * `.d.ts` 텍스트에서 핵심 공개 심볼과 그 의존 선언을 추출한다.
 */
export function extractDeclarationsFromDtsText(declarationText, keySymbols) {
  const sourceFile = ts.createSourceFile(
    "index.d.ts",
    declarationText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const declarationMap = collectTopLevelDeclarations(sourceFile);
  return resolveDeclarationClosure(declarationMap, keySymbols);
}

/**
 * 패키지 메타데이터, declaration 텍스트, 고정 가이드를 합쳐 최종 `llm.txt` 문자열을 만든다.
 */
export function renderLlmTxt(input) {
  const packageJson = toPlainObject(input.packageJson);
  const keySymbols = Array.isArray(input.keySymbols) ? [...input.keySymbols] : [];
  const declarationText = String(input.declarationText ?? "");
  const declarations = Array.isArray(input.declarations)
    ? [...input.declarations]
    : declarationText.trim()
      ? extractDeclarationsFromDtsText(declarationText, keySymbols)
      : buildFallbackDeclarations(keySymbols);
  const publicExportNames = declarationText.trim()
    ? collectPublicExportNames(
        ts.createSourceFile(
          "index.d.ts",
          declarationText,
          ts.ScriptTarget.Latest,
          true,
          ts.ScriptKind.TS,
        ),
      )
    : new Set(keySymbols);

  // 출력 섹션에는 승인된 공개 API만 남기고, helper 의존성은 인라인 치환으로 흡수한다.
  const packageName = String(packageJson.name ?? "");
  const description = String(packageJson.description ?? "");
  const renderedDeclarations = declarations
    .filter((declaration) => APPROVED_PUBLIC_API_NAMES.has(declaration.name))
    .map((declaration) => normalizeRenderedDeclaration(declaration));
  const imports = renderImports(renderedDeclarations, publicExportNames);
  const declarationSections = renderDeclarations(renderedDeclarations, keySymbols);
  const usageExamples = renderUsageExamples(packageName);

  const overview = [
    "## Overview",
    `- Package: ${packageName}`,
    `- Version: ${String(packageJson.version ?? "")}`,
    `- Description: ${description}`,
    "- Public surface: a React webcam component, ref handle, device helpers, and webcam state types.",
    `- Key API symbols: ${keySymbols.join(", ")}.`,
  ].join("\n");

  const sections = [
    `# ${packageName} llm.txt`,
    overview,
    "## Imports",
    imports,
    "## Key APIs",
    declarationSections,
    renderStateModel(declarations),
    renderGuidanceSection(toPlainObject(input.guidance)),
    renderConstraintSection(toPlainObject(input.guidance), description),
    [
      "## Anti-Patterns",
      "- Do not assume `playback-error` means permission denial.",
      "- Do not call `pausePlayback()` to stop the camera hardware.",
      "- Do not treat `webcamOptions` as controlled without `onWebcamOptionsChange`.",
      "- Do not rely on `snapshotToCanvas()` before the webcam is ready.",
      "- Do not expect `pausePlayback()` to emit `onStateChange`.",
    ].join("\n"),
    "## Examples",
    usageExamples,
  ];

  return `${collapseBlankLines(normalizeText(sections.filter(Boolean).join("\n\n"))).trim()}\n`;
}
