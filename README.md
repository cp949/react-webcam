# react-webcam

[한국어](./README.ko.md)

Monorepo for `@cp949/react-webcam`, a React 19 webcam component package, plus a
Next.js demo app used to exercise the public API in real browser flows.

## Overview

This repository has two main parts.

- `packages/react-webcam`: the published package. It exports the `Webcam`
  component, the `WebcamHandle` ref contract, media-device utilities, and
  public TypeScript types.
- `apps/demo`: a Next.js demo app that shows the package in realistic UI
  examples such as controlled state, device selection, and pause/resume.

## Recommended Environment

- Node.js 18+
- pnpm 10+

## Install The Published Package

```bash
pnpm add @cp949/react-webcam
# or
npm install @cp949/react-webcam
```

The package usage guide lives in
[`packages/react-webcam/README.md`](./packages/react-webcam/README.md).

## Demo Guide

`apps/demo` is the fastest way to see how the package behaves in a real app.
Run:

```bash
pnpm --filter demo dev
```

The demo currently includes these sections:

- `Basic Usage`
- `Common Controls`
- `Labels / Localization`
- `Controlled State`
- `Device Selection`
- `Pause / Resume`
- `Ref Handle`
- `State Inspector`
- `Recipes`

Useful source entry points:

- [`apps/demo/components/sections/BasicUsageSection.tsx`](./apps/demo/components/sections/BasicUsageSection.tsx)
- [`apps/demo/components/sections/ControlledStateSection.tsx`](./apps/demo/components/sections/ControlledStateSection.tsx)
- [`apps/demo/components/sections/DeviceSelectionSection.tsx`](./apps/demo/components/sections/DeviceSelectionSection.tsx)
- [`apps/demo/components/sections/PauseResumeSection.tsx`](./apps/demo/components/sections/PauseResumeSection.tsx)
- [`apps/demo/components/sections/RefHandleSection.tsx`](./apps/demo/components/sections/RefHandleSection.tsx)

## Quick Start

Install dependencies:

```bash
pnpm install
```

Common commands:

```bash
pnpm dev
pnpm build
pnpm lint
pnpm check-types
pnpm test
pnpm readme:package
pnpm readme:package:check
```

## Workspace Layout

```text
.
├── apps/
│   └── demo/                  Next.js demo app
├── packages/
│   ├── react-webcam/          Published npm package
│   └── typescript-config/     Shared tsconfig package
├── README.md
├── README.ko.md
└── package.json
```

The workspace is wired with `pnpm-workspace.yaml` and `turbo.json`.

## Related Docs

- English package guide:
  [`packages/react-webcam/README.md`](./packages/react-webcam/README.md)
- Korean package guide:
  [`packages/react-webcam/README.ko.md`](./packages/react-webcam/README.ko.md)
- Korean repository guide:
  [`README.ko.md`](./README.ko.md)

## Notes

- This repository keeps repository-level docs and published package docs
  separate.
- Package README files in `packages/react-webcam` are generated from
  `packages/react-webcam/pkg-docs/README.en.md` and
  `packages/react-webcam/pkg-docs/README.ko.md`.
