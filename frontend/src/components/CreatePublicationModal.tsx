import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import type { Publication } from '../api/types';
import { createPublication } from '../api/publications';
import ImagePicker, { type PickerItem } from './ImagePicker';
import TagInput from './TagInput';
import { useT } from '../hooks/useT';

interface Props {
  onClose: () => void;
  onCreated: (publication: Publication) => void;
}

export default function CreatePublicationModal({ onClose, onCreated }: Props) {
  const t = useT();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<PickerItem[]>([]);
  const [tags, setTags] = useState<string[]>([]);
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
      const files = images.flatMap((item) => (item.kind === 'new' ? [item.file] : []));
      const publication = await createPublication(
        title.trim(),
        content.trim(),
        files,
        publishImmediately,
        tags,
      );
      onCreated(publication);
    } catch (err) {
      let message = t('publicationForm.createFailed');
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        if (typeof detail === 'string') message = detail;
        else if (Array.isArray(detail) && detail[0]?.msg) message = detail[0].msg;
      }
      setError(message);
    } finally {
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
        <h1>{t('publicationForm.newTitle')}</h1>
        <form onSubmit={handleSubmit} className="create-publication-form">
          <label className="create-publication-field">
            <span>{t('publicationForm.title')}</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              required
            />
          </label>
          <label className="create-publication-field">
            <span>{t('publicationForm.text')}</span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              required
            />
          </label>
          <div className="create-publication-field">
            <span>{t('publicationForm.images')}</span>
            <ImagePicker items={images} onChange={setImages} />
          </div>
          <div className="create-publication-field">
            <span>{t('publicationForm.tags')}</span>
            <TagInput tags={tags} onChange={setTags} />
          </div>
          <label className="create-publication-checkbox">
            <input
              type="checkbox"
              checked={publishImmediately}
              onChange={(e) => setPublishImmediately(e.target.checked)}
            />
            <span>{t('publicationForm.publishImmediately')}</span>
          </label>
          {error && <p className="error">{error}</p>}
          <div className="create-publication-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? t('publicationForm.publishing') : t('publicationForm.publish')}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
