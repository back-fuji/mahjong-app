import React, { useRef, useEffect } from 'react';

export const AgariVideoOverlay: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[200] w-full h-full overflow-hidden bg-black">
      <video
        ref={videoRef}
        src="/agari/mv1.mp4"
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
};
