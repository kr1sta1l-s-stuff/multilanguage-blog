import { useCallback, useEffect, useState } from 'react';
import type { Publication } from '../api/types';
import { createPublication } from '../api/publications';
import ImagePicker from './ImagePicker';

interface Props {
  onClose: () => void;
  onCreated: (publication: Publication) => void;
}

export default function CreatePublicationModal({ onClose, onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [publishImmediately, setPublishImmediately] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const publication = await createPublication(
        title.trim(),
        content.trim(),
        images,
        publishImmediately,
      );
      onCreated(publication);
    } catch {
      setError('Не удалось создать публикацию.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h1>Новая публикация</h1>
        <form onSubmit={handleSubmit} className="create-publication-form">
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
            <span>Изображения</span>
            <ImagePicker images={images} onChange={setImages} />
          </div>
          <label className="create-publication-checkbox">
            <input
              type="checkbox"
              checked={publishImmediately}
              onChange={(e) => setPublishImmediately(e.target.checked)}
            />
            <span>Опубликовать сразу</span>
          </label>
          {error && <p className="error">{error}</p>}
          <div className="create-publication-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Публикация...' : 'Опубликовать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
