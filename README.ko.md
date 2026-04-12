# react-webcam

[English](./README.md)

`@cp949/react-webcam` 패키지와 Next.js demo 앱을 함께 관리하는 monorepo입니다.

## 개요

이 저장소는 두 부분으로 구성됩니다.

- `packages/react-webcam`: 배포되는 패키지입니다. `Webcam` 컴포넌트,
  `WebcamHandle` ref 계약, media device 유틸리티, 공개 TypeScript 타입을
  제공합니다.
- `apps/demo`: controlled state, device selection, pause/resume 같은 실제 UI
  흐름에서 패키지를 확인하는 Next.js demo 앱입니다.

## 권장 환경

- Node.js 18 이상
- pnpm 10 이상

## 배포 패키지 설치

```bash
pnpm add @cp949/react-webcam
# 또는
npm install @cp949/react-webcam
```

패키지 사용 문서는
[`packages/react-webcam/README.ko.md`](./packages/react-webcam/README.ko.md)에
있습니다.

## Demo 안내

`apps/demo`는 패키지 동작을 가장 빨리 확인할 수 있는 참고 앱입니다. 실행:

```bash
pnpm --filter demo dev
```

현재 demo 섹션:

- `Basic Usage`
- `Common Controls`
- `Labels / Localization`
- `Controlled State`
- `Device Selection`
- `Pause / Resume`
- `Ref Handle`
- `State Inspector`
- `Recipes`

참고할 만한 소스:

- [`apps/demo/components/sections/BasicUsageSection.tsx`](./apps/demo/components/sections/BasicUsageSection.tsx)
- [`apps/demo/components/sections/ControlledStateSection.tsx`](./apps/demo/components/sections/ControlledStateSection.tsx)
- [`apps/demo/components/sections/DeviceSelectionSection.tsx`](./apps/demo/components/sections/DeviceSelectionSection.tsx)
- [`apps/demo/components/sections/PauseResumeSection.tsx`](./apps/demo/components/sections/PauseResumeSection.tsx)
- [`apps/demo/components/sections/RefHandleSection.tsx`](./apps/demo/components/sections/RefHandleSection.tsx)

## 빠른 시작

의존성 설치:

```bash
pnpm install
```

자주 쓰는 명령:

```bash
pnpm dev
pnpm build
pnpm lint
pnpm check-types
pnpm test
pnpm readme:package
pnpm readme:package:check
```

## 워크스페이스 구조

```text
.
├── apps/
│   └── demo/                  Next.js demo 앱
├── packages/
│   ├── react-webcam/          npm 배포 패키지
│   └── typescript-config/     공유 tsconfig 패키지
├── README.md
├── README.ko.md
└── package.json
```

이 워크스페이스는 `pnpm-workspace.yaml`, `turbo.json`으로 연결되어 있습니다.

## 관련 문서

- 영어 패키지 문서:
  [`packages/react-webcam/README.md`](./packages/react-webcam/README.md)
- 한국어 패키지 문서:
  [`packages/react-webcam/README.ko.md`](./packages/react-webcam/README.ko.md)
- 영어 저장소 문서:
  [`README.md`](./README.md)

## 메모

- 저장소 운영 문서와 배포 패키지 문서를 분리해서 유지합니다.
- `packages/react-webcam`의 README 파일은
  `packages/react-webcam/pkg-docs/README.en.md`,
  `packages/react-webcam/pkg-docs/README.ko.md`에서 생성됩니다.
