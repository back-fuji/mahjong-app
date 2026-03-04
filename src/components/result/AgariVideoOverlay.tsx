import React, { useRef, useEffect } from 'react';

const AGARI_VIDEO_SRC = '/agari/mv1.mp4';

/** 和了動画を事前に読み込む（ゲーム画面マウント時に呼ぶとロン時にすぐ再生できる） */
let preloadedVideo: HTMLVideoElement | null = null;
export function preloadAgariVideo(): void {
  if (typeof document === 'undefined') return;
  if (preloadedVideo != null) return;
  const video = document.createElement('video');
  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;
  video.src = AGARI_VIDEO_SRC;
  video.load();
  preloadedVideo = video;
}

export const AgariVideoOverlay: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (el) el.play().catch(() => {});
  }, []);

  return (
    <div className="fixed inset-0 z-[200] w-full h-full overflow-hidden bg-black">
      <video
        ref={videoRef}
        src={AGARI_VIDEO_SRC}
        autoPlay
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
};
