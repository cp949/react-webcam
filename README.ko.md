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

- Node.js 24.18.0 이상
- pnpm 12.4.1 (`packageManager`로 고정, Corepack 사용)

## 배포 패키지 설치

```bash
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
pnpm release-it
pnpm lint
pnpm lint:fix
pnpm format
pnpm check-types
pnpm test
pnpm test:chrome83
pnpm readme:package
pnpm readme:package:check
```

`pnpm release-it`은 저장소 루트에서 패키지 릴리스 절차를 실행한다.
변경사항이 없는 `main` 또는 `dev` 브랜치가 필요하며 버전 증가, 태그 생성, push와 npm 배포를 수행한다.
자세한 순서와 복구 방법은 [릴리스 절차](./CLAUDE.md#릴리스-절차)를 참고한다.

`pnpm lint`와 `pnpm lint:fix`는 루트 `.oxlintrc.json`으로 oxlint를 실행한다.
`pnpm format`은 `prettier.config.mjs`로 Prettier를 실행해 파일을 덮어쓴다.
이 명령들은 해당 작업을 package script에 정의한 `apps/demo`와
`packages/react-webcam`에 적용되며, 저장소의 모든 파일을 처리하지는 않는다.

`pnpm test:chrome83`은 `docker/chrome83` 컨테이너 안에서 실행해야 합니다.
전체 절차는 `CLAUDE.md`를 참고하세요.

## 워크스페이스 구조

```text
.
├── apps/
│   └── demo/                  Next.js demo 앱
├── docker/
│   └── chrome83/              Chrome 83 floor 검증 컨테이너
├── docs/
│   └── adr/                   아키텍처 결정 기록
├── e2e/
│   └── chrome83-floor/        Chrome 83 Playwright 스모크 테스트
├── fixtures/
│   └── chrome75-react-consumer/  Chrome 75 소비자 fixture
├── packages/
│   ├── react-webcam/          npm 배포 패키지
│   └── typescript-config/     공유 tsconfig 패키지
├── scripts/                   저장소 스크립트
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
