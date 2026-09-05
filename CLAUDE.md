# CLAUDE.md

이 파일은 이 저장소에 처음 들어온 에이전트가 빠르게 구조와 작업 규칙을 파악하도록 돕는 안내서이다.

## 프로젝트 한줄 요약

이 저장소는 React 18/19를 지원하는 npm 패키지 `@cp949/react-webcam`과, 그 공개 API를 실제 브라우저 흐름에서 검증하는 Next.js 데모 앱을 함께 관리하는 pnpm 모노레포이다.

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
- `e2e/chrome83-floor`: Chrome 83 실브라우저 스모크용 harness와 Playwright 스펙
- `docker/chrome83`: Chrome 83 floor validation용 컨테이너 이미지
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
pnpm test:chrome83  # Chrome 83 컨테이너 필요, "Chrome 83 floor validation" 절 참고
pnpm release  # packages/react-webcam에서 release-it 실행(같은 경로의 커밋만 버전/changelog 대상): 버전 결정·changelog·커밋·태그·push·npm publish를 한 번에 처리

# 데모 앱
pnpm --filter demo dev
pnpm --filter demo build

# 패키지 디렉터리(packages/react-webcam)에서
pnpm build
pnpm test
pnpm test:watch
pnpm check-types
```

## Chrome 83 floor validation

`pnpm test:chrome83`는 host에서 바로 완결되지 않는다. `scripts/run-chrome83-floor.mjs`는
Chrome 83이 설치된 `docker/chrome83` 컨테이너 안에서 실행되는 것을 전제한다.

```bash
podman build -t react-webcam-chrome83 docker/chrome83
podman run --rm --network host --userns=keep-id \
  -v "$(pwd)":/repo \
  react-webcam-chrome83 \
  node scripts/run-chrome83-floor.mjs
```

컨테이너는 `HOME`을 격리해도 pnpm store 일부(`.pnpm-store/`)가 저장소 루트에 남는다
(`.gitignore` 처리, `clean.sh`가 정리한다). 컨테이너 실행 직후에는 host에서
`pnpm install`을 한 번 더 실행해 host의 pnpm store 상태를 복구한다.

결과는 항상 "Chrome 83 통과"로만 기록한다. "Chrome 75 실행"이라 표기하지 않는다
(`docs/adr/0001-chrome75-target-vs-chrome83-automation-floor.md`).

## 릴리스 절차

이 저장소는 `packages/react-webcam`에서 실행하는 release-it 기반으로 릴리스한다.
버전 증가폭과 `packages/react-webcam/CHANGELOG.md` 항목은 Conventional Commits
커밋 로그에서 자동으로 결정되지만, 실제로 버전을 올리고 changelog에 기록되는
타입은 `feat`(minor), `fix`/`perf`(patch), `BREAKING CHANGE` 푸터(major)뿐이다.
`refactor`/`docs`/`chore`/`style`/`test`/`build`/`ci`는 버전에 반영되지 않고
조용히 무시된다. 이 계산은 `packages/react-webcam` 경로의 커밋만 대상으로 하므로
(`.release-it.json`의 `commitsOpts`/`gitRawCommitsOpts`의 `path` 설정), 모노레포의
다른 위치(`apps/demo`, `e2e/`, `docker/` 등)에서 발생한 커밋은 이 패키지의 릴리스를
트리거하지 않는다.

release-it 설정은 `packages/react-webcam/.release-it.json`에 있다.
`requireBranch: "main"`이 설정되어 있어 main이 아닌 브랜치에서는 실행이 거부된다.

0. 작업 브랜치의 변경 사항을 먼저 `main`에 머지한다. release-it은 main 브랜치가
   아니면 실행을 거부한다.
1. main 브랜치에서 아래 검증을 모두 통과시킨다.
   - `pnpm test` (`readme:package:check`를 첫 단계로 이미 실행한다)
   - `pnpm check-types`
   - `pnpm lint`
   - 필요하면 `pnpm test:chrome83`으로 Chrome 83 컨테이너 실브라우저 스모크를
     실행한다(podman 필요, 결과는 "Chrome 83 통과"로만 기록하고 "Chrome 75
     실행"이라 표기하지 않는다).
2. 실제로 커밋·태그·push·npm publish가 일어나기 전에 dry-run으로 미리 확인한다.
   ```bash
   pnpm release --dry-run --ci
   ```
   `--ci`는 비TTY 셸에서 커밋 확인 Y/n 프롬프트가 멈추는 것을 막기 위해 필요하다.
   main이 아닌 브랜치에서 dry-run만 테스트할 때는 `--no-git.requireBranch`를 추가로
   붙인다(`pnpm release --dry-run --ci --no-git.requireBranch`). 실제 릴리스는
   항상 main에서 실행하므로 이 플래그는 필요 없다.
3. 문제가 없으면 루트에서 릴리스를 실행한다.
   ```bash
   pnpm release
   ```
   이 명령은 `packages/react-webcam`에서 `release-it`을 실행해 다음을 한 번에 처리한다.
   - Conventional Commits 기반 버전 결정과 `CHANGELOG.md` 갱신
   - `chore: release vX.Y.Z` 커밋 생성
   - `vX.Y.Z` annotated 태그 생성 (`@cp949/...` 형식의 package-scoped 태그는 사용하지 않는다)
   - `git push`로 커밋과 태그를 원격에 반영
   - `pnpm publish`로 npm 배포 (release-it 내장 npm 플러그인 대신 pnpm 사용)
4. npm에 실제로 반영됐는지 확인한다.
   ```bash
   npm view @cp949/react-webcam version
   ```
   `after:release` 훅(`pnpm publish --no-git-checks`)의 출력은 기본적으로 숨겨져
   있어(release-it이 verbose 채널로만 내보낸다), `pnpm release`가 겉보기에 성공한
   것처럼 끝나도 npm publish가 실패했거나 아직 끝나지 않았을 수 있다. 훅 출력을
   직접 보려면 `-V`(`--verbose`)를 추가한다: `pnpm release -V`.
   publish가 실패했다면(예: OTP를 비대화형으로 입력할 수 없는 경우) `pnpm release`를
   다시 실행하지 말고 `packages/react-webcam`에서 `pnpm publish --no-git-checks`만
   다시 실행한다. 새 커밋이 없는 상태에서 `pnpm release`를 재실행하면 release-it이
   올릴 새 버전이 없어 의도한 대로 동작하지 않는다.
5. GitHub에서 `vX.Y.Z` 태그가 올라왔는지, `release.yml` 워크플로우가 만든 GitHub
   Release가 올바른지 확인한다.

GitHub release 워크플로우는 `v*` 태그를 감지하고 `packages/react-webcam/CHANGELOG.md`에서
해당 버전 섹션을 읽어 릴리스 노트를 만든다.

## 공개 API와 변경 시 주의점

- 외부 소비자가 의존하는 공개 API는 `packages/react-webcam/src/index.ts`만 기준으로 본다.
- 새 기능을 추가하더라도 내부 훅이나 유틸을 무심코 export하지 않는다.
- `package.json`의 `peerDependencies`는 React 18/19 / React DOM 18/19를 모두 지원한다(`^18.0.0 || ^19.0.0`).
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
- 라이브러리 출력은 tsdown으로 빌드
- 주석과 UI 라벨은 한국어 유지가 기본 원칙이다
- 작은따옴표, 세미콜론, 2칸 들여쓰기를 따른다

## 작업할 때 추천 순서

1. 루트 `README.md`와 이 파일을 읽는다.
2. 패키지 사용 변경인지, 내부 구현 변경인지, 데모 변경인지 범위를 정한다.
3. 공개 API 변경이면 `src/index.ts`, README 원본, 관련 계약 테스트를 함께 확인한다.
4. UI나 사용성 변경이면 `apps/demo`에서 재현 가능한 예제를 같이 맞춘다.
5. 마지막에 `pnpm test`, `pnpm check-types`, 필요하면 `pnpm readme:package:check`로 확인한다.
