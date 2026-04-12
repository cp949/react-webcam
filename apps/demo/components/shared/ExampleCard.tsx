'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';

/** 라이브 예제를 감싸는 카드 컴포넌트 props */
interface ExampleCardProps {
  /** 카드 헤더 제목 */
  title?: string;

  /** 카드 내부에 렌더링할 컨텐츠 */
  children: React.ReactNode;
}

/** 라이브 예제 컨텐츠를 일관된 카드 레이아웃으로 감싸는 래퍼 */
export function ExampleCard({ title, children }: ExampleCardProps) {
  return (
    <Card variant="outlined">
      <CardHeader
        title={title ?? '라이브 예제'}
        slotProps={{ title: { variant: 'subtitle1', sx: { fontWeight: 600 } } }}
      />
      <CardContent>
        <Box sx={{ minHeight: 100 }}>{children}</Box>
      </CardContent>
    </Card>
  );
}
