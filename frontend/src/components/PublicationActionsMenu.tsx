import { useEffect, useRef, useState } from 'react';
import { copyShareLink } from '../utils/copyShareLink';
import { useT } from '../hooks/useT';

interface Props {
  canEdit: boolean;
  onEdit: () => void;
  shareUrl: string;
  onCopied: () => void;
}

export default function PublicationActionsMenu({ canEdit, onEdit, shareUrl, onCopied }: Props) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const handleCopy = async () => {
    setOpen(false);
    const ok = await copyShareLink(shareUrl, t('share.prompt'));
    if (ok) onCopied();
  };

  return (
    <div className="publication-actions-menu" ref={ref}>
      <button
        type="button"
        className="publication-actions-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('actions.label')}
      >
        <span aria-hidden="true">⋮</span>
      </button>
      {open && (
        <div className="publication-actions-dropdown" role="menu">
          {canEdit && (
            <button
              type="button"
              className="publication-actions-item"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
            >
              <span className="publication-actions-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
                </svg>
              </span>
              {t('actions.edit')}
            </button>
          )}
          <button
            type="button"
            className="publication-actions-item"
            role="menuitem"
            onClick={handleCopy}
          >
            <span className="publication-actions-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </span>
            {t('actions.copyLink')}
          </button>
        </div>
      )}
    </div>
  );
}
