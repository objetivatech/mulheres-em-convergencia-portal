import { useEffect, useRef } from 'react';

interface LessonPlayerProps {
  contentType: 'youtube' | 'pdf' | 'image';
  contentUrl: string;
  title: string;
  onProgress?: (pct: number) => void;
}

/**
 * Extracts YouTube video ID from various URL formats or plain ID
 */
const extractYouTubeId = (url: string): string => {
  if (!url) return '';
  // Already a plain ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) return parsed.pathname.slice(1);
    return parsed.searchParams.get('v') || parsed.pathname.split('/').pop() || url;
  } catch {
    return url;
  }
};

export const LessonPlayer = ({ contentType, contentUrl, title, onProgress }: LessonPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Prevent right-click on the player wrapper
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: Event) => e.preventDefault();
    el.addEventListener('contextmenu', handler);
    return () => el.removeEventListener('contextmenu', handler);
  }, []);

  if (contentType === 'youtube') {
    const videoId = extractYouTubeId(contentUrl);
    return (
      <div ref={containerRef} className="relative w-full aspect-video bg-black rounded-lg overflow-hidden select-none">
        {/* Overlay to block YouTube logo click / link access */}
        <div className="absolute top-0 left-0 right-0 h-14 z-10" style={{ pointerEvents: 'auto' }} />
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?modestbranding=1&rel=0&showinfo=0&controls=1&fs=1&disablekb=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
          loading="lazy"
        />
      </div>
    );
  }

  if (contentType === 'pdf') {
    return (
      <div ref={containerRef} className="w-full rounded-lg overflow-hidden border bg-muted">
        <iframe
          src={`${contentUrl}#toolbar=0&navpanes=0`}
          title={title}
          className="w-full border-0"
          style={{ height: '80vh' }}
          loading="lazy"
        />
      </div>
    );
  }

  // Image
  return (
    <div ref={containerRef} className="w-full flex justify-center rounded-lg overflow-hidden bg-muted p-4">
      <img
        src={contentUrl}
        alt={title}
        className="max-w-full max-h-[80vh] object-contain rounded select-none"
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
};
