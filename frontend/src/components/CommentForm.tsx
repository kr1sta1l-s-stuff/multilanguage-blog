import { useEffect, useRef, useState } from 'react';
import type { Comment } from '../api/types';
import { createComment } from '../api/comments';
import { useT } from '../hooks/useT';

export interface ReplyTarget {
  commentId: string;
  username: string;
  content: string;
}

interface Props {
  publicationId: string;
  onCommentAdded: (comment: Comment) => void;
  replyTo?: ReplyTarget | null;
  onCancelReply?: () => void;
}

export default function CommentForm({
  publicationId,
  onCommentAdded,
  replyTo,
  onCancelReply,
}: Props) {
  const t = useT();
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const mention = replyTo ? `@${replyTo.username}, ` : '';
  const hasBody = content.slice(mention.length).trim().length > 0;

  const autoGrow = () => {
    const t = textareaRef.current;
    if (!t) return;
    t.style.height = 'auto';
    t.style.height = `${Math.min(t.scrollHeight, 200)}px`;
  };

  useEffect(autoGrow, [content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    // Не даём удалить сгенерированное обращение "@username, "
    if (mention && !next.startsWith(mention)) {
      const t = textareaRef.current;
      if (t) {
        requestAnimationFrame(() => t.setSelectionRange(mention.length, mention.length));
      }
      return;
    }
    setContent(next);
  };

  useEffect(() => {
    if (!replyTo) return;
    const mention = `@${replyTo.username}, `;
    setContent((prev) => (prev.startsWith(mention) ? prev : mention));
    const t = textareaRef.current;
    if (t) {
      t.focus();
      const len = t.value.length;
      requestAnimationFrame(() => t.setSelectionRange(len, len));
    }
  }, [replyTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || !hasBody) return;

    setSubmitting(true);
    setError('');
    try {
      const comment = await createComment(publicationId, trimmed, replyTo?.commentId);
      onCommentAdded(comment);
      setContent('');
      onCancelReply?.();
    } catch {
      setError(t('commentForm.postFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="comment-form">
      {replyTo && (
        <div className="comment-form-reply-banner">
          <div className="comment-form-reply-banner-text">
            <span>
              {t('commentForm.replyTo')} <strong>@{replyTo.username}</strong>
            </span>
            <span className="comment-form-reply-banner-quote">
              {replyTo.content}
            </span>
          </div>
          <button
            type="button"
            className="comment-form-reply-cancel"
            onClick={() => {
              setContent('');
              onCancelReply?.();
            }}
            aria-label={t('commentForm.cancelReply')}
          >
            ×
          </button>
        </div>
      )}
      <div className="comment-form-row">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder={replyTo ? t('commentForm.replyPlaceholder', { username: replyTo.username }) : t('commentForm.placeholder')}
          maxLength={2048}
          rows={1}
          required
        />
        <button
          type="submit"
          disabled={submitting || !hasBody}
          className="comment-send-btn"
          aria-label={t('commentForm.send')}
          title={t('commentForm.send')}
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
