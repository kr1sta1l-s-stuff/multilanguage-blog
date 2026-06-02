import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import type { Tag } from '../api/types';
import { searchTags } from '../api/tags';
import { useT } from '../hooks/useT';

const PUBLICATIONS_PATH = '/publications';

function detectPlatform(): 'mac' | 'other' | 'mobile' {
  if (typeof window === 'undefined') return 'other';
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  const ua = navigator.userAgent;
  const isMobile = coarse || /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  if (isMobile) return 'mobile';
  const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform || '')
    || /Mac OS X/.test(ua);
  return isMac ? 'mac' : 'other';
}

export default function HeaderTags() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [results, setResults] = useState<Tag[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [platform] = useState(detectPlatform);
  const resultsRef = useRef<Tag[]>([]);
  const activeTagsRef = useRef<string[]>([]);

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
    const nextTags = currentTags.includes(slug)
      ? currentTags.filter((t) => t !== slug)
      : [...currentTags, slug];
    const next = new URLSearchParams();
    nextTags.forEach((t) => next.append('tags', t));
    const q = onPublications ? searchParams.get('q') : null;
    if (q) next.set('q', q);
    navigate(`${PUBLICATIONS_PATH}?${next.toString()}`);
    setOpen(false);
  };

  const activeTags = onPublications ? searchParams.getAll('tags') : [];

  resultsRef.current = results;
  activeTagsRef.current = activeTags;

  useEffect(() => {
    if (!open || platform === 'mobile') return;
    const onShortcut = (e: KeyboardEvent) => {
      const modifier = platform === 'mac' ? e.metaKey : e.ctrlKey;
      if (!modifier || e.altKey || e.shiftKey) return;
      if (e.key < '1' || e.key > '9') return;
      const index = Number(e.key) - 1;
      const tag = resultsRef.current[index];
      if (!tag) return;
      e.preventDefault();
      pickTag(tag.slug);
    };
    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, [open, platform]);

  const getItemButtons = () =>
    Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>('.header-tags-item') ?? [],
    );

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      getItemButtons()[0]?.focus();
    }
  };

  const onItemKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const buttons = getItemButtons();
    const current = buttons.indexOf(e.currentTarget);
    if (e.key === 'ArrowDown') {
      buttons[Math.min(current + 1, buttons.length - 1)]?.focus();
    } else if (current <= 0) {
      inputRef.current?.focus();
    } else {
      buttons[current - 1]?.focus();
    }
  };

  const shortcutLabel = (index: number) => {
    if (platform === 'mobile' || index >= 9) return '';
    return platform === 'mac' ? `⌘ + ${index + 1}` : `Ctrl + ${index + 1}`;
  };

  return (
    <div className="header-tags" ref={containerRef}>
      <button
        type="button"
        className={`header-tags-toggle${open ? ' header-tags-toggle-active' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? t('tagsHeader.close') : t('tagsHeader.open')}
        aria-expanded={open}
      >
        {open ? (
          <span className="header-tags-close" aria-hidden="true" />
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
              onKeyDown={onInputKeyDown}
              placeholder={t('tagsHeader.searchPlaceholder')}
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
                aria-label={t('tagsHeader.clear')}
              >
                &times;
              </button>
            )}
          </div>
          {results.length === 0 ? (
            <p className="header-tags-empty">{t('tagsHeader.nothingFound')}</p>
          ) : (
            <ul className="header-tags-list" ref={listRef}>
              {results.map((tag, index) => {
                const already = activeTags.includes(tag.slug);
                const shortcut = shortcutLabel(index);
                return (
                  <li key={tag.id}>
                    <button
                      type="button"
                      className={`header-tags-item${already ? ' header-tags-item-active' : ''}`}
                      onClick={() => pickTag(tag.slug)}
                      onKeyDown={onItemKeyDown}
                      aria-pressed={already}
                    >
                      <span className="header-tags-item-name">{tag.name}</span>
                      {shortcut && (
                        <span className="header-tags-item-shortcut">{shortcut}</span>
                      )}
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
