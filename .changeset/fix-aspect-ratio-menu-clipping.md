---
"@cp949/react-webcam": patch
---

Fix the built-in aspect ratio / camera direction dropdown menu getting clipped by the webcam frame's `overflow: hidden` root. The menu now opens right-aligned to its trigger button (`top: 100%`, `right: 0`) instead of relying on the browser's default static position, which used to grow past the right edge when the trigger sits in the top-right toolbar.
