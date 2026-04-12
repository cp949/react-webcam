// 데모 앱의 핵심 타입 정의

export type DemoSectionId =
  | 'basic'
  | 'controls'
  | 'controlled'
  | 'device-selection'
  | 'ref-handle'
  | 'state'
  | 'recipes'
  | 'pause-resume';

export interface DemoSection {
  id: DemoSectionId;
  title: string;
  description: string; // 한 줄 설명
  keywords: string[]; // 대표 API/prop 키워드
}
