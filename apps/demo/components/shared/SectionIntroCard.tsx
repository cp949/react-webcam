"use client";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

/** 섹션 소개 카드 props */
interface SectionIntroCardProps {
  /** 섹션 제목 */
  title: string;

  /** 섹션 설명 문장 */
  description: string;

  /** 핵심 API 키워드 목록 — Chip으로 렌더링 */
  keywords: string[];
}

/** 섹션 상단에 제목, 설명, 핵심 API 키워드 Chip을 표시하는 카드 */
export function SectionIntroCard({
  title,
  description,
  keywords,
}: SectionIntroCardProps) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h5" gutterBottom>
          {title}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Typography variant="body2" sx={{ mr: 0.5 }}>
            핵심 API:
          </Typography>
          {keywords.map((keyword) => (
            <Chip
              key={keyword}
              label={keyword}
              size="small"
              variant="outlined"
              color="primary"
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
