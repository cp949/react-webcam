'use client';

import { Webcam } from '@cp949/react-webcam';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { CODE_SNIPPETS } from '../../lib/code-snippets';
import { DEMO_SECTIONS } from '../../lib/demo-sections';
import { CodeBlockCard } from '../shared/CodeBlockCard';
import { ExampleCard } from '../shared/ExampleCard';
import { SectionIntroCard } from '../shared/SectionIntroCard';

// 'controlled' 섹션 메타데이터
const section = DEMO_SECTIONS.find((s) => s.id === 'controlled')!;

/** 부모가 상태를 소유하는 Controlled 패턴과 컴포넌트가 자체 관리하는 Uncontrolled 패턴을 비교하는 섹션 */
export default function ControlledStateSection() {
  const [flipped, setFlipped] = useState(false);
  const [readonlyFlipped, setReadonlyFlipped] = useState(true);

  return (
    <Box>
      <Stack spacing={3} direction="column">
        {/* 1. 섹션 소개 */}
        <SectionIntroCard
          title={section.title}
          description={section.description}
          keywords={section.keywords}
        />

        {/* 2. Controlled vs Uncontrolled 설명 카드 */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Controlled vs Uncontrolled
            </Typography>
            <Stack spacing={2}>
              <Alert severity="info" variant="outlined">
                <Typography variant="body2" gutterBottom sx={{ fontWeight: 600 }}>
                  Uncontrolled
                </Typography>
                <Typography variant="body2">
                  컴포넌트 내부가 상태를 소유합니다. <code>defaultFlipped</code>으로 초기값만
                  설정합니다. 버튼을 눌러도 부모 state에 영향이 없습니다.
                </Typography>
              </Alert>
              <Alert severity="success" variant="outlined">
                <Typography variant="body2" gutterBottom sx={{ fontWeight: 600 }}>
                  Controlled
                </Typography>
                <Typography variant="body2" gutterBottom>
                  일반적인 controlled 패턴은 <code>flipped</code>와 <code>onFlippedChange</code>를
                  함께 전달하는 방식입니다. 버튼 클릭 시 <code>onFlippedChange</code>가 호출되어 부모
                  state를 갱신합니다.
                </Typography>
                <Typography variant="body2">
                  콜백을 생략하면 읽기 전용 controlled로도 쓸 수 있지만, 내부 토글은 부모가 반영해줘야
                  바뀝니다.
                </Typography>
              </Alert>
            </Stack>
          </CardContent>
        </Card>

        {/* 3. Uncontrolled 예제 */}
        <ExampleCard title="Uncontrolled 예제">
          <Webcam
            defaultFlipped={false}
            visibleFlipButton
            style={{ maxWidth: '100%', borderRadius: 8 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            이 예제는 부모가 flipped 상태를 알 수 없습니다.
          </Typography>
        </ExampleCard>

        {/* 4. Controlled 예제 */}
        <ExampleCard title="Controlled 예제">
          <Webcam
            flipped={flipped}
            onFlippedChange={setFlipped}
            visibleFlipButton
            style={{ maxWidth: '100%', borderRadius: 8 }}
          />
          <Typography variant="body2" sx={{ mt: 1 }}>
            현재 flipped 상태: {String(flipped)}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            sx={{ mt: 1 }}
            onClick={() => setFlipped((v) => !v)}
          >
            flipped 토글 (부모에서)
          </Button>
        </ExampleCard>

        <ExampleCard title="읽기 전용 controlled 예제">
          <Webcam
            flipped={readonlyFlipped}
            visibleFlipButton
            style={{ maxWidth: '100%', borderRadius: 8 }}
          />
          <Typography variant="body2" sx={{ mt: 1 }}>
            현재 flipped 상태: {String(readonlyFlipped)}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            <code>flipped</code>만 전달하고 <code>onFlippedChange</code>를 생략하면 내부 토글은 반영되지
            않고, 부모가 바꿔줄 때만 화면이 갱신됩니다.
          </Typography>
          <Button
            variant="outlined"
            size="small"
            sx={{ mt: 1 }}
            onClick={() => setReadonlyFlipped((value) => !value)}
          >
            flipped 토글 (부모에서만)
          </Button>
        </ExampleCard>

        {/* 5. 예제 코드 */}
        <CodeBlockCard code={CODE_SNIPPETS['controlled']} />
      </Stack>
    </Box>
  );
}
