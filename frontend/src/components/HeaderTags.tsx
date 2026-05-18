import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import type { Tag } from '../api/types';
import { searchTags } from '../api/tags';

const PUBLICATIONS_PATH = '/publications';

export default function HeaderTags() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [results, setResults] = useState<Tag[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
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

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setInput('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const handle = window.setTimeout(() => {
      searchTags(input.trim(), 30)
        .then((items) => {
          if (!cancelled) setResults(items);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        });
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [input, open]);

  const onPublications =
    location.pathname === PUBLICATIONS_PATH
    || location.pathname.startsWith(`${PUBLICATIONS_PATH}/`);

  const pickTag = (slug: string) => {
    const currentTags = onPublications ? searchParams.getAll('tags') : [];
    if (currentTags.includes(slug)) {
      setOpen(false);
      return;
    }
    const next = new URLSearchParams();
    [...currentTags, slug].forEach((t) => next.append('tags', t));
    const q = onPublications ? searchParams.get('q') : null;
    if (q) next.set('q', q);
    navigate(`${PUBLICATIONS_PATH}?${next.toString()}`);
    setOpen(false);
  };

  const activeTags = onPublications ? searchParams.getAll('tags') : [];

  return (
    <div className="header-tags" ref={containerRef}>
      <button
        type="button"
        className={`header-tags-toggle${open ? ' header-tags-toggle-active' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Закрыть теги' : 'Теги'}
        aria-expanded={open}
      >
        {open ? (
          <span className="header-tags-close" aria-hidden="true">&times;</span>
        ) : (
          <img src="/tag.svg" alt="" className="header-tags-icon" />
        )}
      </button>
      {open && (
        <div className="header-tags-popup" role="dialog">
          <div className="header-tags-input-wrap">
            <input
              ref={inputRef}
              type="search"
              className="header-tags-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Поиск тегов..."
            />
            {input && (
              <button
                type="button"
                className="header-tags-input-clear"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setInput('');
                  inputRef.current?.focus();
                }}
                aria-label="Очистить"
              >
                &times;
              </button>
            )}
          </div>
          {results.length === 0 ? (
            <p className="header-tags-empty">Ничего не найдено</p>
          ) : (
            <ul className="header-tags-list">
              {results.map((tag) => {
                const already = activeTags.includes(tag.slug);
                return (
                  <li key={tag.id}>
                    <button
                      type="button"
                      className={`header-tags-item${already ? ' header-tags-item-active' : ''}`}
                      onClick={() => pickTag(tag.slug)}
                      disabled={already}
                    >
                      <span className="header-tags-item-name">{tag.name}</span>
                      <span className="header-tags-item-slug">{tag.slug}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
