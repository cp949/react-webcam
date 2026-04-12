'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Webcam,
  listMediaDevices,
  listAudioInputDevices,
  listVideoInputDevices,
} from '@cp949/react-webcam';
import type { WebcamHandle, WebcamDetail } from '@cp949/react-webcam';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { CODE_SNIPPETS } from '../../lib/code-snippets';
import { DEMO_SECTIONS } from '../../lib/demo-sections';
import { CodeBlockCard } from '../shared/CodeBlockCard';
import { ExampleCard } from '../shared/ExampleCard';
import { SectionIntroCard } from '../shared/SectionIntroCard';
import { StateLogCard } from '../shared/StateLogCard';

const section = DEMO_SECTIONS.find((item) => item.id === 'device-selection')!;

/** 미디어 디바이스 목록 조회와 특정 비디오 디바이스 선택 방법을 시연하는 섹션 */
export default function DeviceSelectionSection() {
  const webcamRef = useRef<WebcamHandle>(null);
  const [allDevices, setAllDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState('');
  const [snapshot, setSnapshot] = useState<WebcamDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function loadDevices() {
    setLoading(true);
    setLoadError(null);

    try {
      const [all, videos, audios] = await Promise.all([
        listMediaDevices(),
        listVideoInputDevices(),
        listAudioInputDevices(),
      ]);

      setAllDevices(all);
      setVideoDevices(videos);
      setAudioDevices(audios);
      setSelectedVideoDeviceId((current) => {
        if (current && videos.some((device) => device.deviceId === current)) {
          return current;
        }
        return videos[0]?.deviceId ?? '';
      });
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDevices();
  }, []);

  // 선택된 비디오 디바이스 ID로 webcamOptions를 메모이제이션
  const webcamOptions = useMemo(
    () => ({
      audioEnabled: false,
      deviceId: selectedVideoDeviceId || undefined,
    }),
    [selectedVideoDeviceId],
  );

  return (
    <Stack direction='column' spacing={3}>
      <SectionIntroCard
        title={section.title}
        description={section.description}
        keywords={section.keywords}
      />

      <Alert severity='info' variant='outlined'>
        디바이스 label은 브라우저 권한 상태에 따라 비어 있을 수 있습니다. 새로고침 후에도
        비어 있으면 카메라 권한을 먼저 허용해 보세요.
      </Alert>

      <Card variant='outlined'>
        <CardHeader
          title='디바이스 목록 조회'
          action={
            <Button size='small' onClick={() => void loadDevices()} disabled={loading}>
              {loading ? '불러오는 중...' : '디바이스 새로고침'}
            </Button>
          }
        />
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel id='video-device-select-label'>비디오 입력</InputLabel>
              <Select
                labelId='video-device-select-label'
                label='비디오 입력'
                value={selectedVideoDeviceId}
                onChange={(event) => setSelectedVideoDeviceId(event.target.value)}
                displayEmpty
              >
                {videoDevices.length === 0 ? (
                  <MenuItem value=''>
                    <em>사용 가능한 카메라 없음</em>
                  </MenuItem>
                ) : (
                  videoDevices.map((device, index) => (
                    <MenuItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `비디오 입력 ${index + 1}`}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            <Card variant='outlined' sx={{ flex: 1 }}>
              <CardHeader title='오디오 입력 목록' />
              <CardContent sx={{ pt: 0 }}>
                {audioDevices.length === 0 ? (
                  <Typography color='text.secondary'>오디오 입력 장치를 찾지 못했습니다.</Typography>
                ) : (
                  <List dense disablePadding>
                    {audioDevices.map((device, index) => (
                      <ListItem key={device.deviceId} disableGutters>
                        <ListItemText
                          primary={device.label || `오디오 입력 ${index + 1}`}
                          secondary={device.deviceId}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Stack>

          {loadError && (
            <Alert severity='error' sx={{ mt: 2 }}>
              {loadError}
            </Alert>
          )}
        </CardContent>
      </Card>

      <ExampleCard title='선택된 비디오 입력으로 Webcam 렌더링'>
        <Box sx={{ maxWidth: 720 }}>
          <Webcam
            ref={webcamRef}
            webcamOptions={webcamOptions}
            onStateChange={setSnapshot}
            visibleFlipButton
            visibleCameraDirectionButton
            style={{ maxWidth: '100%', borderRadius: 8 }}
          />
        </Box>
        <Typography variant='body2' color='text.secondary' sx={{ mt: 1.5 }}>
          현재 재생 중인 비디오 deviceId: {webcamRef.current?.getPlayingVideoDeviceId() ?? '(없음)'}
        </Typography>
      </ExampleCard>

      <StateLogCard
        title='선택 상태'
        data={{
          selectedVideoDeviceId,
          playingVideoDeviceId: webcamRef.current?.getPlayingVideoDeviceId(),
          playingAudioDeviceId: webcamRef.current?.getPlayingAudioDeviceId(),
          snapshot,
        }}
      />

      <StateLogCard
        title='enumerateDevices 결과'
        data={{
          allDevices: allDevices.map((device) => ({
            deviceId: device.deviceId,
            kind: device.kind,
            label: device.label,
            groupId: device.groupId,
          })),
          videoDevices: videoDevices.map((device) => ({
            deviceId: device.deviceId,
            kind: device.kind,
            label: device.label,
          })),
          audioDevices: audioDevices.map((device) => ({
            deviceId: device.deviceId,
            kind: device.kind,
            label: device.label,
          })),
        }}
      />

      <CodeBlockCard code={CODE_SNIPPETS['device-selection']} />
    </Stack>
  );
}
