'use client';

import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { DEMO_SECTIONS } from '../../lib/demo-sections';
import type { DemoSectionId } from '../../lib/types';

/** 데모 앱 사이드바 props */
interface DemoSidebarProps {
  /** 현재 선택된 섹션 ID */
  selectedSection: DemoSectionId;

  /** 섹션 선택 변경 핸들러 */
  onSectionChange: (id: DemoSectionId) => void;

  /** 모바일 임시 드로어 열림 여부 */
  open: boolean;

  /** 모바일 드로어 닫기 핸들러 */
  onClose: () => void;

  /** 드로어 너비(px) */
  drawerWidth: number;
}

/** 섹션 목록을 렌더링하는 사이드바 내부 컨텐츠 */
function SidebarContent({
  selectedSection,
  onSectionChange,
  drawerWidth,
}: Pick<DemoSidebarProps, 'selectedSection' | 'onSectionChange' | 'drawerWidth'>) {
  return (
    <Box sx={{ width: drawerWidth, overflow: 'auto' }}>
      {/* 사이드바 제목 */}
      <Toolbar>
        <Typography
          variant="subtitle1"
          noWrap
          sx={{ color: 'primary.main', fontWeight: 700, fontFamily: 'monospace' }}
        >
          Demo
        </Typography>
      </Toolbar>

      {/* 섹션 목록 */}
      <List disablePadding>
        {DEMO_SECTIONS.map((section) => (
          <ListItemButton
            key={section.id}
            selected={selectedSection === section.id}
            onClick={() => onSectionChange(section.id)}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'primary.50',
                borderLeft: '3px solid',
                borderLeftColor: 'primary.main',
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'primary.100',
              },
            }}
          >
            <ListItemText
              primary={
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {section.title}
                </Typography>
              }
              secondary={
                <Typography variant="caption" color="text.secondary">
                  {section.description}
                </Typography>
              }
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}

/** 모바일(temporary)과 데스크톱(permanent) 드로어를 모두 렌더링하는 반응형 사이드바 */
export default function DemoSidebar({
  selectedSection,
  onSectionChange,
  open,
  onClose,
  drawerWidth,
}: DemoSidebarProps) {
  const contentProps = { selectedSection, onSectionChange, drawerWidth };

  return (
    <>
      {/* 모바일: temporary drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        disableScrollLock
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        <SidebarContent {...contentProps} />
      </Drawer>

      {/* 데스크톱: permanent drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        <SidebarContent {...contentProps} />
      </Drawer>
    </>
  );
}
