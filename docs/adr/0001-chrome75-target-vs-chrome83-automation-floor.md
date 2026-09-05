# Chrome 75 호환성 목표와 Chrome 83 자동화 하한 분리

Chrome Desktop 75를 `@cp949/react-webcam`의 공식 호환성 목표(패키지 산출물 target,
정적 문법/런타임 API 감사)로 유지하되, Playwright 기반 브라우저 자동화 검증의 실제
하한은 Chrome 83으로 둔다. Playwright는 page/context 생성 시 CDP
`Browser.setDownloadBehavior`를 항상 호출하는데 이 메서드는 Chrome 82부터 존재하며
75/76에는 없어 자동화 자체가 구조적으로 불가능하다. Debian 패키지 스냅샷에도 82.x가
없어 83.x가 최소 후보다. 이 제약은 sibling 프로젝트 `scrolla`
(`docker/chrome83/Dockerfile`, `playwright.config.ts`)와 `inspecta`
(`docs/decisions/ADR-001-legacy-browser-screen-reader-reactive-policy.md`)에서
동일하게 확인했다.

## 라벨링 규칙

자동화 결과는 항상 "Chrome 83 통과"로만 기록하고 "Chrome 75 실행"이라 표기하지
않는다. Chrome 75 직접 실행 증거는 고정 Chrome 75 바이너리를 이용한 별도의 수동
스모크(후속 milestone)로만 확보한다.

## Considered Options

- Playwright 대신 raw CDP 스크립트로 Chrome 75를 직접 구동 — 유지보수 비용이 커서
  보류. Chrome 75 직접 실행 증명이 실제로 필요해지는 시점에 별도 milestone으로
  재검토한다.
- Chrome 75/76 바이너리를 별도 확보해 Playwright 없이 스모크 — 현재 범위 밖.

## Consequences

- Chrome 83 컨테이너 + Playwright 자동화 게이트를 `docker/chrome83/Dockerfile`,
  `playwright.config.ts`, `pnpm test:chrome83`으로 구현했다. CI가 아니라 릴리스
  전 로컬 수동 스크립트로 실행한다. `scrolla`와 `inspecta` 모두 이 게이트를
  CI에 연결하지 않는다.
- README/pkg-docs의 "브라우저 호환성 목표" 절에 이 자동화 하한과 실행 방식을 함께
  명시한다.
