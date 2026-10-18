# 기여 가이드 / Contributing

저장소 구조와 에이전트용 상세 규칙은 [`CLAUDE.md`](./CLAUDE.md)에 있다.
English summary: install with `pnpm install`, run `pnpm test`, `pnpm check-types`, and `pnpm lint` before a PR, and use Conventional Commits.

## 개발 환경

- Node: `>=24.18.0`. 빌드 도구 요구 버전이다. 패키지 소비자 제약이 아니다.
- 패키지 관리자: pnpm.
- 설치: `pnpm install`.

## 명령

| 명령                        | 용도                                                            |
| --------------------------- | --------------------------------------------------------------- |
| `pnpm dev`                  | 데모 앱 실행                                                    |
| `pnpm build`                | 패키지와 데모 빌드                                              |
| `pnpm test`                 | 패키지·데모 테스트                                              |
| `pnpm test:demo-smoke`      | 데모 각 섹션의 실브라우저 진입 스모크. 빌드 포함, 로컬 전용     |
| `pnpm check-types`          | 타입 검사                                                       |
| `pnpm lint`                 | oxlint                                                          |
| `pnpm format`               | Prettier. 무관한 파일을 바꿀 수 있어 변경한 파일만 지정해 쓴다. |
| `pnpm readme:package`       | 패키지 README 생성                                              |
| `pnpm readme:package:check` | 생성 README가 최신인지 확인                                     |

데모는 패키지의 `dist` 타입을 읽는다. 공개 API를 바꾼 뒤에는 `packages/react-webcam`에서 `pnpm build`를 먼저 실행한다.

## 커밋 규칙

Conventional Commits를 쓴다. 릴리스 도구는 아래 타입만 버전에 반영한다.

| 타입                   | 버전  |
| ---------------------- | ----- |
| `feat`                 | minor |
| `fix`, `perf`          | patch |
| `BREAKING CHANGE` 푸터 | major |

`refactor`, `docs`, `chore`, `style`, `test`, `build`, `ci`는 버전과 changelog에 반영되지 않는다.
계산 대상은 `packages/react-webcam` 경로의 커밋뿐이다.
커밋 메시지는 한글로 쓴다.

## 문서 수정

- `packages/react-webcam/README.md`와 `README.ko.md`는 생성 파일이다. 직접 고치지 않는다.
- 원본은 `packages/react-webcam/pkg-docs/README.en.md`와 `README.ko.md`다.
- 원본을 고친 뒤 루트에서 `pnpm readme:package`를 실행한다.
- `pnpm test`는 `readme:package:check`를 먼저 실행한다.

## 코드 변경

- 공개 API는 `packages/react-webcam/src/index.ts`가 기준이다. 내부 훅과 유틸을 무심코 export하지 않는다.
- 동작이 바뀌면 테스트를 먼저 추가한다.
- 새 공개 동작은 `apps/demo`에도 반영한다.
- 빌드는 Chrome 75 정적 검사를 포함한다. ES2020 이상 구문을 쓰면 실패한다.
- 주석과 UI 라벨은 한국어가 기본이다.

## PR 전 확인

```bash
pnpm test
pnpm check-types
pnpm lint
```

## 보안 문제

취약점은 이슈로 올리지 않는다. [`SECURITY.md`](./SECURITY.md)를 따른다.
