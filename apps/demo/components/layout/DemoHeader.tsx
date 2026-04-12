'use client';

import AppBar from '@mui/material/AppBar';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';

/** 데모 앱 상단 헤더 props */
interface DemoHeaderProps {
  /** 모바일 햄버거 메뉴 클릭 핸들러 */
  onMenuOpen: () => void;

  /** 사이드바 너비(px) — 데스크톱에서 제목 margin 계산에 사용 */
  drawerWidth: number;
}

/** 패키지 이름, 설치 명령어, 모바일 메뉴 버튼을 포함한 고정 앱바 */
export default function DemoHeader({ onMenuOpen, drawerWidth }: DemoHeaderProps) {
  return (
    <AppBar position="fixed" elevation={1} color="default">
      <Toolbar>
        {/* 모바일에서만 보이는 햄버거 메뉴 */}
        <IconButton
          color="inherit"
          aria-label="메뉴 열기"
          edge="start"
          onClick={onMenuOpen}
          sx={{ mr: 2, display: { xs: 'flex', md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        {/* 패키지 이름 — 데스크톱에서 사이드바 너비만큼 margin */}
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{
            flexGrow: 1,
            ml: { md: `${drawerWidth}px` },
            fontFamily: 'monospace',
            fontWeight: 700,
          }}
        >
          @cp949/react-webcam
        </Typography>

        {/* 설치 명령어 칩 */}
        <Chip
          label="npm install @cp949/react-webcam"
          variant="outlined"
          size="small"
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            display: { xs: 'none', sm: 'flex' },
          }}
        />
      </Toolbar>
    </AppBar>
  );
}
