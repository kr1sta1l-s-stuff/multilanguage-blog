import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Comment } from '../api/types';
import type { User } from '../api/types';
import { FormatDateTime } from './Utils';

interface Props {
  comments: Comment[];
  currentUser: User | null;
  onDelete: (commentId: string) => void;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onReply: (target: { commentId: string; username: string; content: string }) => void;
}

const CAN_MODERATE_COMMENTS = 1 << 2;

export default function CommentList({
  comments,
  currentUser,
  onDelete,
  onEdit,
  onReply,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [menuDirection, setMenuDirection] = useState<'down' | 'up'>('down');
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuPopupRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpenId) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpenId]);

  useLayoutEffect(() => {
    if (!menuOpenId || !menuRef.current || !menuPopupRef.current) return;
    const toggleRect = menuRef.current.getBoundingClientRect();
    const menuHeight = menuPopupRef.current.offsetHeight;
    let bottomLimit = window.innerHeight;
    let el: HTMLElement | null = menuRef.current.parentElement;
    while (el) {
      const overflowY = getComputedStyle(el).overflowY;
      if (overflowY === 'auto' || overflowY === 'scroll') {
        bottomLimit = el.getBoundingClientRect().bottom;
        break;
      }
      el = el.parentElement;
    }
    setMenuDirection(
      toggleRect.bottom + menuHeight + 8 > bottomLimit ? 'up' : 'down',
    );
  }, [menuOpenId]);

  if (comments.length === 0) {
    return (
      <div className="comment-list">
        <p className="no-comments">Здесь пока нет комментариев. Будьте первыми!</p>
      </div>
    );
  }

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
    setMenuOpenId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const submitEdit = async (commentId: string) => {
    const trimmed = editContent.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await onEdit(commentId, trimmed);
      setEditingId(null);
      setEditContent('');
    } finally {
      setSaving(false);
    }
  };

  const roots = comments.filter((c) => !c.thread_id);
  const repliesByThread = new Map<string, Comment[]>();
  for (const c of comments) {
    if (!c.thread_id) continue;
    const list = repliesByThread.get(c.thread_id) ?? [];
    list.push(c);
    repliesByThread.set(c.thread_id, list);
  }
  for (const list of repliesByThread.values()) {
    list.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  }

  const renderComment = (comment: Comment) => {
    const isAuthor = currentUser?.id === comment.author.id;
    const canModerate =
      currentUser && (currentUser.rights & CAN_MODERATE_COMMENTS) !== 0;
    const canEdit = !comment.is_deleted && isAuthor;
    const canDelete = !comment.is_deleted && (isAuthor || canModerate);
    const canReply = !comment.is_deleted && !!currentUser;
    const isEditing = editingId === comment.id;
    const isMenuOpen = menuOpenId === comment.id;
    const wasEdited =
      !comment.is_deleted &&
      comment.updated_at &&
      comment.updated_at !== comment.created_at;

    return (
      <div
        key={comment.id}
        className={`comment${comment.is_deleted ? ' comment-deleted' : ''}`}
      >
        <div className="comment-header">
          <strong>{comment.is_deleted ? '—' : comment.author.username}</strong>
          {!comment.is_deleted && (
            <span className="comment-date">
              {FormatDateTime(comment.created_at)}
              {wasEdited && ' (изменено)'}
            </span>
          )}
          {!isEditing && (canEdit || canDelete || canReply) && (
            <div
              className="comment-actions"
              ref={isMenuOpen ? menuRef : null}
            >
              <button
                type="button"
                className="comment-menu-toggle"
                onClick={() => setMenuOpenId(isMenuOpen ? null : comment.id)}
                aria-label="Comment actions"
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
              >
                <span aria-hidden="true">⋮</span>
              </button>
              {isMenuOpen && (
                <div
                  ref={menuPopupRef}
                  className={`comment-menu comment-menu-${menuDirection}`}
                  role="menu"
                >
                  {canReply && (
                    <button
                      type="button"
                      role="menuitem"
                      className="comment-menu-item"
                      onClick={() => {
                        setMenuOpenId(null);
                        onReply({
                          commentId: comment.id,
                          username: comment.author.username,
                          content: comment.content,
                        });
                      }}
                    >
                      Ответить
                    </button>
                  )}
                  {canEdit && (
                    <button
                      type="button"
                      role="menuitem"
                      className="comment-menu-item"
                      onClick={() => startEdit(comment)}
                    >
                      Изменить
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      role="menuitem"
                      className="comment-menu-item comment-menu-item-danger"
                      onClick={() => {
                        setMenuOpenId(null);
                        onDelete(comment.id);
                      }}
                    >
                      Удалить
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        {isEditing ? (
          <div className="comment-edit-form">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submitEdit(comment.id);
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  cancelEdit();
                }
              }}
              maxLength={2048}
              rows={3}
              autoFocus
            />
            <div className="comment-edit-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => submitEdit(comment.id)}
                disabled={saving || !editContent.trim()}
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                type="button"
                className="btn"
                onClick={cancelEdit}
                disabled={saving}
              >
                Отмена
              </button>
            </div>
          </div>
        ) : comment.is_deleted ? (
          <p className="comment-tombstone">[комментарий удалён]</p>
        ) : (
          <p>{comment.content}</p>
        )}
      </div>
    );
  };

  return (
    <div className="comment-list">
      {roots.map((root) => {
        const replies = repliesByThread.get(root.id) ?? [];
        return (
          <div key={root.id} className="comment-thread">
            {renderComment(root)}
            {replies.length > 0 && (
              <div className="comment-replies">
                {replies.map(renderComment)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
