export interface LlmTxtGeneratorPackageJson {
  name: string;
  version: string;
  description?: string;
}

export interface LlmTxtGeneratorGuidance {
  disabled: string;
  snapshotToCanvas: string;
  deviceSelection: string;
  playbackError: string;
  trackEnded: string;
  controlledMode: string;
  pausePlayback: string;
  antiPattern: string;
}

export type LlmTxtGeneratorDeclaration = {
  name: string;
  kind: string;
  visibility: "runtime" | "type";
  node?: unknown;
  text: string;
};

export interface LlmTxtGeneratorInput {
  packageJson: LlmTxtGeneratorPackageJson;
  declarationText?: string;
  declarations?: readonly LlmTxtGeneratorDeclaration[];
  keySymbols: readonly string[];
  guidance: LlmTxtGeneratorGuidance;
}

export function extractDeclarationsFromDtsText(
  declarationText: string,
  keySymbols: readonly string[],
): readonly LlmTxtGeneratorDeclaration[];

export function renderLlmTxt(input: LlmTxtGeneratorInput): string;
