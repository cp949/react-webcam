'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';

/** 코드 블록을 카드 형식으로 표시하는 컴포넌트 props */
interface CodeBlockCardProps {
  /** 카드 헤더 제목 */
  title?: string;

  /** 표시할 코드 문자열 */
  code: string;

  /** 언어 레이블 Chip에 표시할 값 */
  language?: string;
}

/** 코드 스니펫을 모노스페이스 폰트와 카드 레이아웃으로 표시 */
export function CodeBlockCard({ title, code, language }: CodeBlockCardProps) {
  return (
    <Card variant="outlined">
      <CardHeader
        title={title ?? '예제 코드'}
        action={<Chip label={language ?? 'tsx'} size="small" />}
      />
      <CardContent sx={{ p: 0 }}>
        <Box
          component="pre"
          sx={{
            overflow: 'auto',
            m: 0,
            p: 2,
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            lineHeight: 1.6,
            backgroundColor: 'grey.50',
            whiteSpace: 'pre',
          }}
        >
          <Box component="code">{code}</Box>
        </Box>
      </CardContent>
    </Card>
  );
}
