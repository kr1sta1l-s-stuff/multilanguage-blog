import { useCallback, useEffect, useRef, useState } from 'react';
import type { PublicationImage } from '../api/types';
import { useT } from '../hooks/useT';

interface Props {
  images: PublicationImage[];
  className?: string;
  imageClassName?: string;
  enableKeyboard?: boolean;
  enableFullscreen?: boolean;
}

export default function PhotoCarousel({
  images,
  className,
  imageClassName,
  enableKeyboard,
  enableFullscreen,
}: Props) {
  const t = useT();
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const count = images.length;

  useEffect(() => {
    setIndex(0);
  }, [images]);

  const showPrev = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (count === 0) return;
      setIndex((i) => (i - 1 + count) % count);
    },
    [count],
  );

  const showNext = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (count === 0) return;
      setIndex((i) => (i + 1) % count);
    },
    [count],
  );

  useEffect(() => {
    if (!enableKeyboard || count <= 1) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') showPrev();
      else if (e.key === 'ArrowRight') showNext();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [enableKeyboard, count, showPrev, showNext]);

  useEffect(() => {
    if (!fullscreen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        setFullscreen(false);
      } else if (e.key === 'ArrowLeft') {
        e.stopImmediatePropagation();
        showPrev();
      } else if (e.key === 'ArrowRight') {
        e.stopImmediatePropagation();
        showNext();
      }
    };
    document.addEventListener('keydown', handleKey, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey, true);
      document.body.style.overflow = prevOverflow;
    };
  }, [fullscreen, showPrev, showNext]);

  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (count <= 1) return;
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (count <= 1 || !touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    const SWIPE_THRESHOLD = 40;
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) showNext();
      else showPrev();
    }
  };

  if (count === 0) return null;
  const current = images[index];

  return (
    <div
      className={`photo-carousel${className ? ` ${className}` : ''}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <img
        src={current.image_url}
        alt=""
        className={`photo-carousel-image${imageClassName ? ` ${imageClassName}` : ''}${enableFullscreen ? ' photo-carousel-image-zoomable' : ''}`}
        onClick={enableFullscreen ? (e) => { e.stopPropagation(); setFullscreen(true); } : undefined}
      />
      {count > 1 && (
        <>
          <button
            type="button"
            className="photo-carousel-btn photo-carousel-btn-prev"
            onClick={showPrev}
            aria-label={t('photo.prev')}
          >
            &#10094;
          </button>
          <button
            type="button"
            className="photo-carousel-btn photo-carousel-btn-next"
            onClick={showNext}
            aria-label={t('photo.next')}
          >
            &#10095;
          </button>
          <span className="photo-carousel-counter">
            {t('photo.counter', { current: index + 1, count })}
          </span>
        </>
      )}
      {fullscreen && (
        <div
          className="photo-carousel-fullscreen"
          onClick={(e) => {
            if (e.target === e.currentTarget) setFullscreen(false);
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            type="button"
            className="photo-carousel-fullscreen-close"
            onClick={() => setFullscreen(false)}
            aria-label={t('common.close')}
          >
            &times;
          </button>
          <img
            src={current.image_url}
            alt=""
            className="photo-carousel-fullscreen-image"
          />
          {count > 1 && (
            <>
              <button
                type="button"
                className="photo-carousel-btn photo-carousel-btn-prev"
                onClick={showPrev}
                aria-label={t('photo.prev')}
              >
                &#10094;
              </button>
              <button
                type="button"
                className="photo-carousel-btn photo-carousel-btn-next"
                onClick={showNext}
                aria-label={t('photo.next')}
              >
                &#10095;
              </button>
              <span className="photo-carousel-counter">
                {t('photo.counter', { current: index + 1, count })}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
