'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';

/** 상태 데이터를 JSON 형식으로 표시하는 카드 props */
interface StateLogCardProps {
  /** 카드 헤더 제목 */
  title?: string;

  /** JSON으로 직렬화하여 표시할 데이터 */
  data: unknown;

  /** 데이터가 null일 때 표시할 대체 메시지 */
  emptyMessage?: string;
}

/** 임의의 데이터를 JSON 포맷으로 출력하는 로그 카드 */
export function StateLogCard({ title, data, emptyMessage }: StateLogCardProps) {
  const isEmpty = data == null;

  return (
    <Card variant="outlined">
      <CardHeader title={title ?? '상태'} />
      <CardContent sx={{ p: 0 }}>
        {isEmpty ? (
          <Typography color="text.disabled" sx={{ p: 2 }}>
            {emptyMessage ?? '상태 없음'}
          </Typography>
        ) : (
          <Box
            component="pre"
            sx={{
              overflow: 'auto',
              m: 0,
              p: 2,
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              maxHeight: 300,
              backgroundColor: 'grey.50',
            }}
          >
            {JSON.stringify(data, null, 2)}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
