import React, { useRef, useEffect } from 'react';

export const AgariVideoOverlay: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
    >
      <video
        ref={videoRef}
        src="/agari/mv1.mp4"
        autoPlay
        muted
        playsInline
        style={{
          width: 'min(80vw, 640px)',
          height: 'auto',
        }}
      />
    </div>
  );
};
