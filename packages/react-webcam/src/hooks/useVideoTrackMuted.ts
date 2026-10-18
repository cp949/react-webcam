import { useEffect, useState } from "react";

/**
 * 스트림의 비디오 트랙이 `muted`인지 추적한다.
 *
 * - 다른 앱이 카메라를 가져가거나 앱이 백그라운드로 가면 `ended` 없이 `mute`만 온다.
 * - 이때 영상은 멈추지만 phase는 `live`로 남는다.
 * - 스트림이 바뀌면 새 트랙의 현재 `muted` 값으로 다시 시작한다.
 */
export function useVideoTrackMuted(mediaStream: MediaStream | undefined): boolean {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const track = mediaStream?.getVideoTracks?.()[0];
    if (!track) {
      setMuted(false);
      return;
    }

    const sync = () => setMuted(track.muted);
    sync();
    track.addEventListener("mute", sync);
    track.addEventListener("unmute", sync);
    return () => {
      track.removeEventListener("mute", sync);
      track.removeEventListener("unmute", sync);
    };
  }, [mediaStream]);

  return muted;
}
