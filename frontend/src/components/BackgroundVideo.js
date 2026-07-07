import { useEffect, useRef } from 'react';

export default function BackgroundVideo() {
  const videoRef = useRef(null);
  const targetTimeRef = useRef(0);
  const isSeekingRef = useRef(false);
  const prevXRef = useRef(null);

  // Helper to trigger video seek safely without flooding
  const triggerSeek = () => {
    const video = videoRef.current;
    if (!video || isSeekingRef.current) return;

    // Check if video duration is loaded
    if (isNaN(video.duration) || video.duration === 0) return;

    const diff = Math.abs(video.currentTime - targetTimeRef.current);
    if (diff > 0.02) {
      isSeekingRef.current = true;
      video.currentTime = targetTimeRef.current;
    }
  };

  const handleSeeked = () => {
    isSeekingRef.current = false;
    triggerSeek(); // Process next target if targetTime was updated during seeking
  };

  useEffect(() => {
    // Sync initial targetTime when metadata is loaded
    const video = videoRef.current;
    if (video) {
      const handleLoadedMetadata = () => {
        targetTimeRef.current = video.currentTime;
      };
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, []);

  useEffect(() => {
    const handleMove = (currentX) => {
      if (prevXRef.current === null) {
        prevXRef.current = currentX;
        return;
      }

      const delta = currentX - prevXRef.current;
      prevXRef.current = currentX;

      const video = videoRef.current;
      if (!video || isNaN(video.duration) || video.duration === 0) return;

      const SENSITIVITY = 0.8;
      const timeOffset = (delta / window.innerWidth) * SENSITIVITY * video.duration;
      let newTargetTime = targetTimeRef.current + timeOffset;

      // Clamp between 0 and video duration
      newTargetTime = Math.max(0, Math.min(video.duration, newTargetTime));
      targetTimeRef.current = newTargetTime;

      triggerSeek();
    };

    const handleMouseMove = (event) => {
      handleMove(event.clientX);
    };

    const handleTouchMove = (event) => {
      if (event.touches.length > 0) {
        handleMove(event.touches[0].clientX);
      }
    };

    const resetCoordinates = () => {
      prevXRef.current = null;
    };

    const handleMouseEnter = (event) => {
      prevXRef.current = event.clientX;
    };

    const handleTouchStart = (event) => {
      if (event.touches.length > 0) {
        prevXRef.current = event.touches[0].clientX;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('mouseleave', resetCoordinates);
    window.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', resetCoordinates);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseleave', resetCoordinates);
      window.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', resetCoordinates);
    };
  }, []);

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        userSelect: 'none',
        pointerEvents: 'none',
        backgroundColor: 'transparent',
        zIndex: -1 
      }}
    >
      {/* Background Video */}
      <video
        ref={videoRef}
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260530_042513_df96a13b-6155-4f6e-8b93-c9dee66fba08.mp4"
        muted
        playsInline
        preload="auto"
        crossOrigin="anonymous"
        onSeeked={handleSeeked}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: '70% center',
        }}
      />
      {/* Tint overlay */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          pointerEvents: 'none'
        }}
      />
    </div>
  );
}