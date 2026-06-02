import { useRef, useState, useEffect } from 'react';
import type { Publication } from '../api/types';
import PhotoCarousel from './PhotoCarousel';
import PrettifyCount, { FormatDateTime } from './Utils';
import { likePublication, unlikePublication } from '../api/publications';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { copyShareLink } from '../utils/copyShareLink';
import { useT } from '../hooks/useT';

interface Props {
  publication: Publication;
  onOpen: () => void;
  onTagClick?: (slug: string) => void;
}

export default function PublicationCard({ publication, onOpen, onTagClick }: Props) {
  const t = useT();
  const { user } = useAuth();
  const { toast, showToast } = useToast();
  const date = FormatDateTime(publication.created_at);

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/publications/${publication.id}`;
    const ok = await copyShareLink(url, t('share.prompt'));
    if (ok) showToast(t('publications.linkCopied'));
  };
  const contentRef = useRef<HTMLParagraphElement>(null);
  const [clamped, setClamped] = useState(false);
  const [isLiked, setIsLiked] = useState(publication.is_liked);
  const [likesCount, setLikesCount] = useState(publication.likes_count);
  const [likePending, setLikePending] = useState(false);

  useEffect(() => {
    setIsLiked(publication.is_liked);
    setLikesCount(publication.likes_count);
  }, [publication.is_liked, publication.likes_count]);

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || likePending) return;
    setLikePending(true);
    const prevLiked = isLiked;
    const prevCount = likesCount;
    setIsLiked(!prevLiked);
    setLikesCount(prevCount + (prevLiked ? -1 : 1));
    try {
      if (prevLiked) {
        await unlikePublication(publication.id);
      } else {
        await likePublication(publication.id);
      }
    } catch {
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
    } finally {
      setLikePending(false);
    }
  };

  useEffect(() => {
    const el = contentRef.current;
    if (el) {
      setClamped(el.scrollHeight > el.clientHeight);
    }
  }, [publication.content]);

  const hasImages = publication.images && publication.images.length > 0;

  return (
    <article className="publication-card">
      {hasImages && (
        <div className="publication-card-photo-container" onClick={onOpen} style={{ cursor: 'pointer' }}>
          <PhotoCarousel
            images={publication.images}
            className="publication-card-carousel"
            imageClassName="publication-card-photo"
          />
        </div>
      )}
      <div className={`publication-card-main-body${hasImages ? '' : ' publication-card-main-body-no-photo'}`}>
        <h2 onClick={onOpen} style={{ cursor: 'pointer' }}>{publication.title}</h2>
        <div className="publication-content-wrapper">
          <p
            ref={contentRef}
            className="publication-content publication-content-clamped"
          >
            {publication.content}
          </p>
          {clamped && (
            <button
              className="publication-show-more"
              onClick={onOpen}
            >
              {t('publications.showMore')}
            </button>
          )}
        </div>
        {publication.tags && publication.tags.length > 0 && (
          <div className="publication-tags">
            {publication.tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                className="tag-chip tag-chip-clickable"
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick?.(tag.slug);
                }}
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}
        <div className="publication-meta">
          <div className="publication-meta-actions">
            <button
              type="button"
              className={`publication-meta-item publication-like${isLiked ? ' publication-like-active' : ''}`}
              onClick={handleLikeClick}
              disabled={!user || likePending}
              aria-label={isLiked ? t('publications.unlike') : t('publications.like')}
            >
              <img
                src={isLiked ? '/heart-filled.svg' : '/heart.svg'}
                alt="like"
                className="publication-meta-item-icon publication-like-icon"
              />
              <span className="publication-meta-item-text">
                {PrettifyCount({ count: likesCount })}
              </span>
            </button>
            <div className="publication-meta-item" onClick={onOpen} style={{ cursor: 'pointer' }}>
              <img src="/comment-bubble.svg" alt="comment" className="publication-meta-item-icon"/>
              <span className="publication-meta-item-text">{
                PrettifyCount(
                  { count: publication.comments_count }
                )}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="publication-date publication-date-button"
            onClick={handleCopyLink}
            title={t('publications.copyLinkTitle')}
          >
            {date}
          </button>
        </div>
      </div>
      {toast}
    </article>
  );
}
