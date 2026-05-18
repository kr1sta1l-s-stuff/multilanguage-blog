import { useEffect, useState, useCallback } from 'react';
import type { Comment, Publication } from '../api/types';
import { getPublication, likePublication, unlikePublication } from '../api/publications';
import { deleteComment, getComments, updateComment } from '../api/comments';
import CommentList from './CommentList';
import CommentForm, { type ReplyTarget } from './CommentForm';
import Pagination from './Pagination';
import PhotoCarousel from './PhotoCarousel';
import PublicationActionsMenu from './PublicationActionsMenu';
import EditPublicationModal from './EditPublicationModal';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { copyShareLink } from '../utils/copyShareLink';
import PrettifyCount, { FormatDateTime } from './Utils';

interface Props {
  publicationId: string;
  onClose: () => void;
}

export default function PublicationModal({ publicationId, onClose }: Props) {
  const { user } = useAuth();
  const [publication, setPublication] = useState<Publication | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentPage, setCommentPage] = useState(1);
  const [commentPages, setCommentPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [likePending, setLikePending] = useState(false);
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const [editing, setEditing] = useState(false);
  const { toast, showToast } = useToast();

  const isAuthor = !!user && !!publication && publication.author_id === user.id;
  const shareUrl = publication
    ? `${window.location.origin}/publications/${publication.id}`
    : '';

  const handleCopyLink = async () => {
    if (!publication) return;
    const ok = await copyShareLink(shareUrl);
    if (ok) showToast('Ссылка скопирована');
  };

  const handleLikeClick = async () => {
    if (!user || !publication || likePending) return;
    setLikePending(true);
    const prevLiked = publication.is_liked;
    const prevCount = publication.likes_count;
    setPublication({
      ...publication,
      is_liked: !prevLiked,
      likes_count: prevCount + (prevLiked ? -1 : 1),
    });
    try {
      if (prevLiked) {
        await unlikePublication(publication.id);
      } else {
        await likePublication(publication.id);
      }
    } catch {
      setPublication((prev) =>
        prev ? { ...prev, is_liked: prevLiked, likes_count: prevCount } : prev,
      );
    } finally {
      setLikePending(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      setLoading(true);
      setError('');
    });
    Promise.all([getPublication(publicationId), getComments(publicationId, 1)])
      .then(([pub, commentsData]) => {
        setPublication(pub);
        setComments(commentsData.items);
        setCommentPages(commentsData.pages);
        setCommentPage(commentsData.page);
      })
      .catch(() => setError('Failed to load publication.'))
      .finally(() => setLoading(false));
  }, [publicationId]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const loadComments = (page: number) => {
    getComments(publicationId, page).then((data) => {
      setComments(data.items);
      setCommentPage(data.page);
      setCommentPages(data.pages);
    });
  };

  const handleCommentAdded = (comment: Comment) => {
    setComments((prev) => [comment, ...prev]);
  };

  const handleCommentDeleted = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      setComments((prev) => {
        const target = prev.find((c) => c.id === commentId);
        const isRootWithReplies =
          target != null &&
          !target.thread_id &&
          prev.some((c) => c.thread_id === commentId);
        if (isRootWithReplies) {
          return prev.map((c) =>
            c.id === commentId ? { ...c, is_deleted: true, content: '' } : c,
          );
        }
        return prev.filter((c) => c.id !== commentId);
      });
      setPublication((prev) =>
        prev ? { ...prev, comments_count: Math.max(0, prev.comments_count - 1) } : prev
      );
    } catch {
      alert('Не удалось удалить комментарий.');
    }
  };

  const handleCommentEdited = async (commentId: string, content: string) => {
    try {
      const updated = await updateComment(commentId, content);
      setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
    } catch {
      alert('Не удалось обновить комментарий.');
    }
  };

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-frame">
        <button
          className="modal-close modal-close-outside"
          onClick={onClose}
          aria-label="Закрыть"
        >
          &times;
        </button>
        <div className="modal-content">
        <div className="modal-header">
          {publication && (
            <PublicationActionsMenu
              canEdit={isAuthor}
              onEdit={() => setEditing(true)}
              shareUrl={shareUrl}
              onCopied={() => showToast('Ссылка скопирована')}
            />
          )}
        </div>
        <div className="modal-scroll">
        {loading && <p>Loading...</p>}
        {error && <p className="error">{error}</p>}
        {publication && (
          <>
            <article>
              <h1>{publication.title}</h1>
              <button
                type="button"
                className="publication-date publication-date-button"
                onClick={handleCopyLink}
                title="Скопировать ссылку на публикацию"
              >
                {FormatDateTime(publication.created_at)}
              </button>
              <PhotoCarousel
                images={publication.images}
                className="publication-modal-carousel"
                imageClassName="publication-modal-carousel-image"
                enableKeyboard
                enableFullscreen
              />
              <div className="publication-body">{publication.content}</div>
              {publication.tags && publication.tags.length > 0 && (
                <div className="publication-tags">
                  {publication.tags.map((tag) => (
                    <span key={tag.id} className="tag-chip tag-chip-clickable">
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
              <div className="publication-meta">
                <div className="publication-meta-actions">
                  <button
                    type="button"
                    className={`publication-meta-item publication-like${publication.is_liked ? ' publication-like-active' : ''}`}
                    onClick={handleLikeClick}
                    disabled={!user || likePending}
                    aria-label={publication.is_liked ? 'Убрать лайк' : 'Поставить лайк'}
                  >
                    <img
                      src={publication.is_liked ? '/heart-filled.svg' : '/heart.svg'}
                      alt="like"
                      className="publication-meta-item-icon publication-like-icon"
                    />
                    <span className="publication-meta-item-text">
                      {PrettifyCount({ count: publication.likes_count })}
                    </span>
                  </button>
                  <div className="publication-meta-item">
                    <img src="/comment-bubble.svg" alt="comment" className="publication-meta-item-icon"/>
                    <span className="publication-meta-item-text">
                      {PrettifyCount({ count: publication.comments_count })}
                    </span>
                  </div>
                </div>
              </div>
            </article>

            <section className="comments-section">
              <h2>Комментарии ({publication.comments_count})</h2>
              <CommentList
                comments={comments}
                currentUser={user}
                onDelete={handleCommentDeleted}
                onEdit={handleCommentEdited}
                onReply={setReplyTo}
              />
              <Pagination
                page={commentPage}
                pages={commentPages}
                onPageChange={loadComments}
              />
              {user && (
                <CommentForm
                  publicationId={publication.id}
                  onCommentAdded={handleCommentAdded}
                  replyTo={replyTo}
                  onCancelReply={() => setReplyTo(null)}
                />
              )}
            </section>
          </>
        )}
        </div>
        </div>
      </div>
      {editing && publication && (
        <EditPublicationModal
          publication={publication}
          onClose={() => setEditing(false)}
          onUpdated={(updated) => {
            setPublication((prev) =>
              prev
                ? {
                    ...updated,
                    comments_count: prev.comments_count,
                    likes_count: prev.likes_count,
                    is_liked: prev.is_liked,
                  }
                : updated,
            );
            setEditing(false);
          }}
          onDeleted={() => {
            setEditing(false);
            onClose();
          }}
        />
      )}
      {toast}
    </div>
  );
}
