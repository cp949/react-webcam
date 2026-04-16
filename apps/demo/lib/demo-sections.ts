// 각 섹션의 메타데이터 정의

import type { DemoSection, DemoSectionId } from './types';

export const DEMO_SECTIONS: DemoSection[] = [
  {
    id: 'basic',
    title: 'Basic Usage',
    description: '가장 단순한 Webcam 사용법',
    keywords: ['Webcam', 'visibleFlipButton', 'visibleCameraDirectionButton'],
  },
  {
    id: 'controls',
    title: 'Common Controls',
    description: '자주 쓰는 옵션 실시간 조작',
    keywords: ['facingMode', 'aspectRatio', 'fitMode'],
  },
  {
    id: 'labels',
    title: 'Labels / Localization',
    description: '내장 UI 문구 다국어 적용',
    keywords: ['labels', 'facingModeFront', 'facingModeBack', 'cameraDirection'],
  },
  {
    id: 'controlled',
    title: 'Controlled State',
    description: 'controlled vs uncontrolled 비교',
    keywords: ['defaultFlipped', 'flipped', 'onFlippedChange'],
  },
  {
    id: 'device-selection',
    title: 'Device Selection',
    description: '디바이스 목록 조회와 선택 적용',
    keywords: ['listVideoInputDevices', 'listAudioInputDevices', 'deviceId'],
  },
  {
    id: 'ref-handle',
    title: 'Ref Handle',
    description: '명령형 API 직접 호출',
    keywords: ['WebcamHandle', 'snapshotToCanvas', 'setFlipped', 'setWebcamOptions'],
  },
  {
    id: 'state',
    title: 'State Inspector',
    description: '상태 변화 실시간 관찰',
    keywords: ['onStateChange', 'WebcamSnapshot', 'status', 'errorCode'],
  },
  {
    id: 'disabled-state',
    title: 'Disabled State',
    description: 'disabled prop으로 카메라 요청을 지연',
    keywords: ['disabled', 'onStateChange', 'idle', 'requesting'],
  },
  {
    id: 'disabled-fallback',
    title: 'Disabled Fallback',
    description: 'custom disabledFallback으로 기본 placeholder 대체',
    keywords: ['disabledFallback', 'disabled', 'CTA', 'placeholder'],
  },
  {
    id: 'recipes',
    title: 'Recipes',
    description: '실전 활용 예제',
    keywords: ['프로필 촬영', '세로 비율', '상태 배지'],
  },
  {
    id: 'pause-resume',
    title: 'Pause / Resume',
    description: 'playback-only 명령형 API 시연',
    keywords: ['pausePlayback', 'resumePlayback', 'WebcamHandle', 'playback-error'],
  },
];

export const DEFAULT_SECTION_ID: DemoSectionId = 'basic';
