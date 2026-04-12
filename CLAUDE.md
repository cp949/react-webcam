# CLAUDE.md

이 파일은 이 저장소에 처음 들어온 에이전트가 빠르게 구조와 작업 규칙을 파악하도록 돕는 안내서이다.

## 프로젝트 한줄 요약

이 저장소는 React 19 전용 npm 패키지 `@cp949/react-webcam`과, 그 공개 API를 실제 브라우저 흐름에서 검증하는 Next.js 데모 앱을 함께 관리하는 pnpm 모노레포이다.

## 먼저 읽을 것

1. 루트 개요와 공용 명령은 `README.md`
2. 패키지 사용법은 `packages/react-webcam/README.md`
3. 패키지 문서 원본은 `packages/react-webcam/pkg-docs/README.en.md`, `packages/react-webcam/pkg-docs/README.ko.md`
4. 공개 API 표면은 `packages/react-webcam/src/index.ts`
5. 핵심 컴포넌트 구현은 `packages/react-webcam/src/Webcam.tsx`
6. 실제 사용 예시는 `apps/demo/components/sections/*`

## 저장소 구조

- `packages/react-webcam`: 배포 대상 라이브러리 패키지
- `apps/demo`: 라이브러리 사용 예제와 브라우저 동작 검증용 Next.js 앱
- `packages/typescript-config`: 워크스페이스 공용 tsconfig
- `scripts/generate-package-readme.mjs`: 패키지 README 생성 스크립트

## 문서 원본과 수정 규칙

- `packages/react-webcam/README.md`와 `packages/react-webcam/README.ko.md`는 생성 결과물이다.
- 패키지 문서를 수정할 때는 생성 파일이 아니라 아래 원본을 먼저 고친다.
  - `packages/react-webcam/pkg-docs/README.en.md`
  - `packages/react-webcam/pkg-docs/README.ko.md`
- 문서 수정 후에는 루트에서 `pnpm readme:package`를 실행해 생성 파일을 갱신한다.
- 생성 결과가 최신인지 확인만 하려면 `pnpm readme:package:check`를 사용한다.

## 주요 명령어

```bash
# 루트
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm lint:fix
pnpm format
pnpm check-types
pnpm test
pnpm readme:package
pnpm readme:package:check
pnpm changeset
pnpm version-packages
git tag vX.Y.Z
git push --follow-tags

# 데모 앱
pnpm --filter demo dev
pnpm --filter demo build

# 패키지 디렉터리(packages/react-webcam)에서
pnpm build
pnpm test
pnpm test:watch
pnpm check-types
```

## 릴리스 절차

이 저장소는 패키지 단위 changeset 흐름을 기준으로 릴리스한다.

1. 루트에서 `pnpm changeset`으로 변경 요약을 만든다.
2. 릴리스 시점에 `pnpm version-packages`를 실행해 패키지 버전과 `packages/react-webcam/CHANGELOG.md`를 갱신한다.
3. 결과를 커밋한다.
4. `git tag vX.Y.Z`로 패키지 버전과 같은 태그를 만든다.
5. `git push --follow-tags`로 커밋과 태그를 함께 올린다.

GitHub release 워크플로우는 `v*` 태그를 감지하고 `packages/react-webcam/CHANGELOG.md`에서 해당 버전 섹션을 읽어 릴리스 노트를 만든다.

## 공개 API와 변경 시 주의점

- 외부 소비자가 의존하는 공개 API는 `packages/react-webcam/src/index.ts`만 기준으로 본다.
- 새 기능을 추가하더라도 내부 훅이나 유틸을 무심코 export하지 않는다.
- `package.json`의 `peerDependencies`는 React 19 / React DOM 19 기준이다.
- 기본 라벨은 한국어이며, 영어나 서비스별 문자열은 `labels` prop으로 덮어쓴다.

## 핵심 아키텍처

### `packages/react-webcam`

라이브러리의 중심은 `Webcam` 컴포넌트와 `WebcamHandle` ref API이다.

주요 데이터 흐름은 대략 다음 순서다.

1. `useElementMediaConstraints`가 요소 크기를 읽어 제약 조건 계산에 필요한 입력을 만든다.
2. `useWebcamStreamLifecycle`가 `getUserMedia` 요청, 성공, 실패, 정리와 `WebcamDetail` 상태를 관리한다.
3. `useVideoElementBindings`가 `MediaStream`을 `<video>`에 연결하고 playback 오류와 비디오 표시 상태를 다룬다.
4. `useWebcamController`가 위 훅들을 조합해 스냅샷, 디바이스 조회, 상태 변경 API를 제공한다.
5. `Webcam.tsx`가 controlled / uncontrolled 패턴과 내장 버튼 UI를 포함한 최종 컴포넌트를 구성한다.

### 상태 모델

`WebcamDetail`은 `phase` 기반 discriminated union이다.

- `idle`
- `requesting`
- `live`
- `playback-error`
- `denied`
- `unavailable`
- `unsupported`
- `insecure`
- `error`

오류 계열 상태는 `WebcamErrorCode`를 함께 사용한다.

### 데모 앱

`apps/demo`는 README 보조 문서가 아니라 학습과 수동 검증을 위한 실행 가능한 앱이다.
새로운 공개 동작이나 회귀 위험이 있는 변경은 가능하면 데모 섹션에도 반영해 사람이 바로 확인할 수 있게 한다.

## 테스트

- 테스트 러너는 Vitest, DOM 환경은 happy-dom을 사용한다.
- 공용 테스트 셋업은 `packages/react-webcam/tests/test-utils.ts`에 있다.
- 이 저장소에는 이미 여러 계약 테스트와 회귀 테스트가 존재한다.
- 특히 공개 surface와 메타데이터 계약은 `packages/react-webcam/tests/webcam-package-contract.test.tsx`를 먼저 참고한다.

## 코드 스타일과 구현 규칙

- TypeScript strict 모드
- Biome으로 린트와 포매팅 수행
- import 경로에 `.js` 확장자 사용
- 라이브러리 출력은 tsup으로 빌드
- 주석과 UI 라벨은 한국어 유지가 기본 원칙이다
- 작은따옴표, 세미콜론, 2칸 들여쓰기를 따른다

## 작업할 때 추천 순서

1. 루트 `README.md`와 이 파일을 읽는다.
2. 패키지 사용 변경인지, 내부 구현 변경인지, 데모 변경인지 범위를 정한다.
3. 공개 API 변경이면 `src/index.ts`, README 원본, 관련 계약 테스트를 함께 확인한다.
4. UI나 사용성 변경이면 `apps/demo`에서 재현 가능한 예제를 같이 맞춘다.
5. 마지막에 `pnpm test`, `pnpm check-types`, 필요하면 `pnpm readme:package:check`로 확인한다.
