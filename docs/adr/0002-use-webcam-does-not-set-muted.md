# useWebcam은 호출자 video의 muted와 playsInline을 바꾸지 않는다

`useWebcam`은 스트림을 연결한 직후 `play()`를 호출한다. `muted`와 `playsInline`은
호출자가 설정하며 훅은 두 속성을 건드리지 않는다. 호출자가 빠뜨려 autoplay 정책이
`play()`를 거부하면 `detail.phase`는 `playback-error`가 되고 `isFrameReady`는
`false`로 남는다. 이 동작과 문서화 방식을 2.x에서 유지한다.

## 검토한 대안

`audioEnabled`가 `false`일 때 훅이 `videoElement.muted = true`를 설정하는 안을 검토했다.

- 이점: 영상만 받는 스트림은 소리가 없다. `muted`가 소리에 영향을 주지 않는다.
- 이점: 호출자가 `muted`를 빠뜨려도 autoplay 거부를 줄일 수 있다.
- 비용: 훅이 앱 소유 요소의 속성을 바꾼다. 기존 `transform`, `objectFit`, `srcObject` 보존 원칙과 어긋난다.
- 비용: 정리 시 원래 값으로 되돌리는 코드가 필요하다. 호출자가 도중에 값을 바꾸면 되돌림이 충돌한다.
- 비용: `playsInline`은 같은 방식으로 해결되지 않는다. 호출자 책임이 반쪽만 사라진다.
- 비용: 효과를 검증하지 못했다. 아래 실측 한계를 본다.

## 결정 근거

- 요소는 앱 소유다. 훅은 연결한 `srcObject`만 분리한다.
- 문서화(README, `llm.txt`)로 호출자가 원인을 찾을 수 있다. 실패는 `playback-error`로 드러난다.
- 동작을 바꾸는 안은 검증 가능한 이득이 없다.

## 실측 (2026-10-18, Chrome 83.0.4103.116 컨테이너)

`e2e/chrome83-floor/use-webcam.spec.ts`:

- `muted` 없는 `display: none` video가 `audioEnabled` true·false 모두에서 `live`와 `isFrameReady: true`가 됐다.
- 카메라를 쓰지 않는 빈 페이지에서 소리 있는 비스트림 `video.play()`도 성공했다.
  `--autoplay-policy=user-gesture-required`와 `document-user-activation-required` 양쪽에서 같았다.

해석:

- 이 자동화 환경은 autoplay 차단을 재현하지 못한다.
- 위 결과는 "`muted`가 불필요하다"는 증거가 아니다.
- Safari, iOS Safari, Firefox, 일반 Chrome 데스크톱 UI 세션은 검증하지 않았다.

## 재검토 조건

- 실제 브라우저에서 `muted` 누락이 `playback-error`를 일으킨다고 확인한다.
- 소비자가 같은 문제를 반복 보고한다.

위 조건이 성립하면 `audioEnabled === false`일 때만 `muted`를 설정하고 정리 시 복원하는 안을 다시 검토한다.
호환성 영향은 다음과 같다.

- 호출자가 의도적으로 `muted=false`를 쓰던 코드의 값이 바뀐다.
- 영상만 받는 스트림이라 청각 영향은 없다.
- 호출자가 같은 요소를 다른 소스로 재사용하면 `muted`가 남아 소리가 안 날 수 있다.
