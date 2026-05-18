import { useEffect, useRef, useState } from 'react';
import type { Comment } from '../api/types';
import { createComment } from '../api/comments';

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
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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
    if (!trimmed) return;

    setSubmitting(true);
    setError('');
    try {
      const comment = await createComment(publicationId, trimmed, replyTo?.commentId);
      onCommentAdded(comment);
      setContent('');
      onCancelReply?.();
    } catch {
      setError('Failed to post comment.');
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
              Ответ <strong>@{replyTo.username}</strong>
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
            aria-label="Отменить ответ"
          >
            ×
          </button>
        </div>
      )}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
        placeholder={replyTo ? `Ответить @${replyTo.username}...` : 'Напишите комментарий...'}
        maxLength={2048}
        rows={3}
        required
      />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={submitting} className="btn btn-primary">
        {submitting ? 'Отправка...' : 'Отправить'}
      </button>
    </form>
  );
}
