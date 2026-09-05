---
"@cp949/react-webcam": minor
---

Widen `peerDependencies` to accept React 18 and 19 (`^18.0.0 || ^19.0.0`). No source changes were required — `Webcam` already used `forwardRef`/`useImperativeHandle`, which works identically on both major versions. Verified with a one-off local run of the test suite and type-check against React 18.3.1 / `@types/react` 18.3.31 before reverting dev dependencies back to React 19.
