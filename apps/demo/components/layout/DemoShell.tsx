'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { DEFAULT_SECTION_ID } from '../../lib/demo-sections';
import type { DemoSectionId } from '../../lib/types';
import BasicUsageSection from '../sections/BasicUsageSection';
import CommonControlsSection from '../sections/CommonControlsSection';
import LabelsLocalizationSection from '../sections/LabelsLocalizationSection';
import ControlledStateSection from '../sections/ControlledStateSection';
import DeviceSelectionSection from '../sections/DeviceSelectionSection';
import RefHandleSection from '../sections/RefHandleSection';
import StateInspectorSection from '../sections/StateInspectorSection';
import RecipesSection from '../sections/RecipesSection';
import PauseResumeSection from '../sections/PauseResumeSection';
import DemoHeader from './DemoHeader';
import DemoSidebar from './DemoSidebar';

// 사이드바 너비 상수
const DRAWER_WIDTH = 260;

/** 선택된 섹션 ID에 해당하는 섹션 컴포넌트를 반환 */
function renderSection(section: DemoSectionId) {
  switch (section) {
    case 'basic':
      return <BasicUsageSection />;
    case 'controls':
      return <CommonControlsSection />;
    case 'labels':
      return <LabelsLocalizationSection />;
    case 'controlled':
      return <ControlledStateSection />;
    case 'device-selection':
      return <DeviceSelectionSection />;
    case 'ref-handle':
      return <RefHandleSection />;
    case 'state':
      return <StateInspectorSection />;
    case 'recipes':
      return <RecipesSection />;
    case 'pause-resume':
      return <PauseResumeSection />;
    default:
      return (
        <Box sx={{ p: 4 }}>
          <Typography color="text.secondary">준비 중인 섹션입니다.</Typography>
        </Box>
      );
  }
}

/** 헤더, 사이드바, 메인 콘텐츠 영역을 조합한 데모 앱 최상위 레이아웃 */
export default function DemoShell() {
  const [selectedSection, setSelectedSection] = useState<DemoSectionId>(DEFAULT_SECTION_ID);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex' }}>
      {/* 헤더 */}
      <DemoHeader onMenuOpen={() => setMobileOpen(true)} drawerWidth={DRAWER_WIDTH} />

      {/* 사이드바 */}
      <DemoSidebar
        selectedSection={selectedSection}
        onSectionChange={(id) => {
          setSelectedSection(id);
          setMobileOpen(false);
        }}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        drawerWidth={DRAWER_WIDTH}
      />

      {/* 메인 콘텐츠 영역 */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          mt: { xs: '56px', sm: '64px' }, // AppBar 높이만큼 (모바일 56px, 데스크톱 64px)
          ml: { md: `${DRAWER_WIDTH}px` }, // 데스크톱에서 사이드바 너비만큼
          minHeight: '100vh',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 1000, mx: 'auto' }}>
          {renderSection(selectedSection)}
        </Box>
      </Box>
    </Box>
  );
}
