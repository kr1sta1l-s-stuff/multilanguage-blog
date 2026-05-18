import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import type { Publication } from '../api/types';
import { deletePublication, updatePublication } from '../api/publications';
import TagInput from './TagInput';

interface Props {
  publication: Publication;
  onClose: () => void;
  onUpdated: (publication: Publication) => void;
  onDeleted: (id: string) => void;
}

export default function EditPublicationModal({ publication, onClose, onUpdated, onDeleted }: Props) {
  const [title, setTitle] = useState(publication.title);
  const [content, setContent] = useState(publication.content);
  const [tags, setTags] = useState<string[]>(publication.tags.map((t) => t.name));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isDraft = publication.published_at === null;

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

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  const handleError = (err: unknown, fallback: string) => {
    let message = fallback;
    if (axios.isAxiosError(err)) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') message = detail;
      else if (Array.isArray(detail) && detail[0]?.msg) message = detail[0].msg;
    }
    setError(message);
  };

  const submit = async (opts: { publish?: boolean } = {}) => {
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const updated = await updatePublication(publication.id, {
        title: title.trim(),
        content: content.trim(),
        tags,
        publish: opts.publish,
      });
      onUpdated(updated);
    } catch (err) {
      handleError(err, 'Не удалось сохранить публикацию.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (submitting) return;
    if (!window.confirm('Удалить публикацию безвозвратно?')) return;
    setSubmitting(true);
    setError('');
    try {
      await deletePublication(publication.id);
      onDeleted(publication.id);
    } catch (err) {
      handleError(err, 'Не удалось удалить публикацию.');
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-scroll">
          <h1>{isDraft ? 'Черновик' : 'Редактирование'}</h1>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="create-publication-form"
          >
            <label className="create-publication-field">
              <span>Заголовок</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={255}
                required
              />
            </label>
            <label className="create-publication-field">
              <span>Текст</span>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                required
              />
            </label>
            <div className="create-publication-field">
              <span>Теги</span>
              <TagInput tags={tags} onChange={setTags} />
            </div>
            {error && <p className="error">{error}</p>}
            <div className="create-publication-actions">
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={submitting}
              >
                Удалить
              </button>
              <div className="create-publication-actions-right">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Отмена
                </button>
                <button type="submit" className="btn btn-secondary" disabled={submitting}>
                  Сохранить
                </button>
                {isDraft && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => submit({ publish: true })}
                    disabled={submitting}
                  >
                    Опубликовать
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
