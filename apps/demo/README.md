# @cp949/react-webcam — 학습형 데모 앱

`@cp949/react-webcam` 패키지의 사용법을 직접 실험하며 배울 수 있는 Next.js 기반 학습 앱입니다.

## 실행 방법

```bash
# 저장소 루트에서
pnpm --filter demo dev          # 개발 서버 (http://localhost:3000)
pnpm --filter demo build        # 프로덕션 빌드
pnpm --filter demo start        # 빌드 후 서버 실행
pnpm --filter demo check-types  # 타입 체크
```

## 데모 목적

이 앱은 README 보조 문서가 아니라 **학습·검증용 앱**입니다. 각 섹션에서 실제로 동작하는 예제 + 핵심 설명 + 복붙 가능한 코드 + 상태 로그를 함께 제공합니다.

## 섹션 목록

- **Basic Usage** — 가장 단순한 Webcam 컴포넌트 사용법
- **Common Controls** — facingMode, aspectRatio 등 자주 쓰는 옵션 실시간 조작
- **Controlled State** — controlled vs uncontrolled 상태 소유권 비교
- **Ref Handle** — WebcamHandle을 통한 명령형 API (snapshotToCanvas 등)
- **State Inspector** — onStateChange로 WebcamSnapshot 실시간 관찰
- **Recipes** — 프로필 촬영, 세로 비율, 상태 배지 등 실전 패턴
- **Pause / Resume** — pausePlayback / resumePlayback playback-only 명령형 API 시연

## 환경 제약

- **카메라 접근 권한 필요** — 브라우저에서 카메라 허용이 필요합니다.
- **HTTPS 또는 localhost** — 보안 컨텍스트가 아닌 환경에서는 `getUserMedia`가 차단됩니다. 로컬 개발(`localhost`)이면 자동으로 허용됩니다.
- 실제 카메라 장치가 없는 환경(CI, 가상 환경)에서는 `insecure` 또는 `unavailable` 상태가 표시됩니다.
