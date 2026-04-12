'use client';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { Webcam } from '@cp949/react-webcam';
import type { WebcamDetail, WebcamPhase } from '@cp949/react-webcam';
import { CODE_SNIPPETS } from '../../lib/code-snippets';
import { DEMO_SECTIONS } from '../../lib/demo-sections';
import { CodeBlockCard } from '../shared/CodeBlockCard';
import { ExampleCard } from '../shared/ExampleCard';
import { SectionIntroCard } from '../shared/SectionIntroCard';
import { StateLogCard } from '../shared/StateLogCard';

/** WebcamPhase 값에 따른 MUI Chip 색상을 반환 */
function getStatusColor(
  status: WebcamPhase,
): 'success' | 'info' | 'error' | 'default' {
  switch (status) {
    case 'live':
      return 'success';
    case 'requesting':
      return 'info';
    case 'denied':
    case 'unavailable':
    case 'unsupported':
    case 'insecure':
    case 'error':
    case 'playback-error':
      return 'error';
    default:
      return 'default';
  }
}

/** 모든 WebcamPhase 값과 설명 — 상태 코드 설명 카드에서 사용 */
const STATUS_DESCRIPTIONS: { status: WebcamPhase; description: string }[] = [
  { status: 'idle', description: '초기 상태, 아직 카메라 요청 없음' },
  { status: 'requesting', description: '카메라 권한 요청 중' },
  { status: 'live', description: '카메라 스트림 활성화됨' },
  { status: 'denied', description: '카메라 권한이 거부됨' },
  { status: 'unavailable', description: '카메라 장치를 찾을 수 없음' },
  { status: 'unsupported', description: '브라우저가 getUserMedia를 지원하지 않음' },
  { status: 'insecure', description: 'HTTPS 또는 localhost가 아닌 환경' },
  { status: 'playback-error', description: '스트림 재생 실패' },
  { status: 'error', description: '기타 예외' },
];

/** snapshot에 errorCode 필드가 포함되어 있는지 확인하는 타입 가드 */
function hasErrorCode(
  snapshot: WebcamDetail,
): snapshot is Extract<WebcamDetail, { errorCode: unknown }> {
  return 'errorCode' in snapshot;
}

/** WebcamDetail의 status 흐름과 전체 데이터 구조를 실시간으로 확인하는 상태 검사 섹션 */
export default function StateInspectorSection() {
  const [snapshot, setSnapshot] = useState<WebcamDetail | null>(null);

  // 'state' 섹션 메타데이터
  const section = DEMO_SECTIONS.find((s) => s.id === 'state')!;

  return (
    <Stack direction="column" spacing={3}>
      {/* 1. 섹션 소개 */}
      <SectionIntroCard
        title={section.title}
        description={section.description}
        keywords={section.keywords}
      />

      {/* 2. 웹캠 예제 */}
      <ExampleCard title="웹캠 (상태 감지 중)">
        <Webcam
          onStateChange={setSnapshot}
          visibleFlipButton
          visibleCameraDirectionButton
        />
      </ExampleCard>

      {/* 3. 현재 상태 카드 */}
      <Card variant="outlined">
        <CardHeader title="현재 상태" />
        <CardContent>
          {snapshot === null ? (
            <Typography color="text.secondary">
              웹캠을 시작하면 상태가 여기에 표시됩니다
            </Typography>
          ) : (
            <Stack direction="column" spacing={1.5}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  phase:
                </Typography>
                <Chip
                  label={snapshot.phase}
                  color={getStatusColor(snapshot.phase)}
                  size="small"
                />
              </Stack>
              {hasErrorCode(snapshot) && (
                <Typography variant="body2" color="error">
                  errorCode: {snapshot.errorCode}
                </Typography>
              )}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* 4. 상태 코드 설명 카드 */}
      <Card variant="outlined">
        <CardHeader title="상태 코드 설명" />
        <CardContent sx={{ p: 0 }}>
          <Table size="small">
            <TableBody>
              {STATUS_DESCRIPTIONS.map(({ status, description }) => (
                <TableRow key={status}>
                  <TableCell sx={{ width: 160, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {status}
                  </TableCell>
                  <TableCell>{description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 5. 전체 스냅샷 데이터 */}
      <StateLogCard title="전체 스냅샷 데이터" data={snapshot} />

      {/* 6. 코드 예시 */}
      <CodeBlockCard code={CODE_SNIPPETS['state']} />
    </Stack>
  );
}
