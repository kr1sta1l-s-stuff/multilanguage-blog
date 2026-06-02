import { useEffect, useRef, useState } from 'react';
import type { PublicationOrder, PublicationSort } from '../api/publications';
import { useT } from '../hooks/useT';
import type { TranslationKey } from '../i18n/keys';

type Props = {
  sort: PublicationSort;
  order: PublicationOrder;
  searchActive: boolean;
  onSortChange: (sort: PublicationSort) => void;
  onOrderChange: (order: PublicationOrder) => void;
};

const SORT_LABEL_KEYS: Record<PublicationSort, TranslationKey> = {
  date: 'sort.byDate',
  likes: 'sort.byLikes',
  relevance: 'sort.byRelevance',
};

export default function PublicationsSortControls({
  sort,
  order,
  searchActive,
  onSortChange,
  onOrderChange,
}: Props) {
  const t = useT();
  const sortLabel = (s: PublicationSort) => t(SORT_LABEL_KEYS[s]);
  const ascending = order === 'asc';
  const toggleOrder = () => onOrderChange(ascending ? 'desc' : 'asc');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [menuOpen]);

  const options: PublicationSort[] = searchActive
    ? ['date', 'likes', 'relevance']
    : ['date', 'likes'];

  const choose = (next: PublicationSort) => {
    setMenuOpen(false);
    if (next !== sort) onSortChange(next);
  };

  return (
    <div className="publications-sort">
      <button
        type="button"
        className="publications-sort-order"
        onClick={toggleOrder}
        aria-label={ascending ? t('sort.ascending') : t('sort.descending')}
        title={ascending ? t('sort.ascending') : t('sort.descending')}
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {ascending ? (
            <>
              <path d="M7 17V5" />
              <path d="M3 9l4-4 4 4" />
              <path d="M14 7h3" />
              <path d="M14 12h5" />
              <path d="M14 17h7" />
            </>
          ) : (
            <>
              <path d="M7 5v12" />
              <path d="M3 13l4 4 4-4" />
              <path d="M14 7h7" />
              <path d="M14 12h5" />
              <path d="M14 17h3" />
            </>
          )}
        </svg>
      </button>
      <div className="publications-sort-menu" ref={menuRef}>
        <button
          type="button"
          className="publications-sort-trigger"
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <span>{sortLabel(sort)}</span>
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {menuOpen && (
          <div className="publications-sort-dropdown" role="menu">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`publications-sort-dropdown-item${opt === sort ? ' publications-sort-dropdown-item-active' : ''}`}
                role="menuitem"
                onClick={() => choose(opt)}
              >
                {sortLabel(opt)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
