import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useT } from '../hooks/useT';

const PUBLICATIONS_PATH = '/publications';

export default function HeaderSearch() {
  const t = useT();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const onPublications = location.pathname === PUBLICATIONS_PATH
    || location.pathname.startsWith(`${PUBLICATIONS_PATH}/`);
  const urlQuery = onPublications ? (searchParams.get('q') ?? '') : '';

  const [open, setOpen] = useState(urlQuery.length > 0);
  const [value, setValue] = useState(urlQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (urlQuery && !open) setOpen(true);
    setValue(urlQuery);
  }, [urlQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open || value === urlQuery) return;
    const handle = window.setTimeout(() => {
      const next = new URLSearchParams(onPublications ? searchParams : undefined);
      if (value.trim()) next.set('q', value.trim());
      else next.delete('q');
      if (onPublications) next.delete('page');
      const qs = next.toString();
      navigate(`${PUBLICATIONS_PATH}${qs ? `?${qs}` : ''}`, { replace: onPublications });
    }, 350);
    return () => window.clearTimeout(handle);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggle = () => {
    if (open) {
      setValue('');
      const next = new URLSearchParams(onPublications ? searchParams : undefined);
      next.delete('q');
      next.delete('page');
      const qs = next.toString();
      navigate(`${PUBLICATIONS_PATH}${qs ? `?${qs}` : ''}`, { replace: onPublications });
    }
    setOpen((prev) => !prev);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setValue('');
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleBlur = () => {
    if (!value) setOpen(false);
  };

  return (
    <div className={`header-search${open ? ' header-search-open' : ''}`}>
      <input
        ref={inputRef}
        type="search"
        className="header-search-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKey}
        onBlur={handleBlur}
        placeholder={t('search.placeholder')}
        aria-hidden={!open}
        tabIndex={open ? 0 : -1}
      />
      <button
        type="button"
        className="header-search-toggle"
        onMouseDown={(e) => e.preventDefault()}
        onClick={handleToggle}
        aria-label={open ? t('search.close') : t('search.open')}
      >
        {open ? (
          <span className="header-search-close" aria-hidden="true" />
        ) : (
          <img src="/search.svg" alt="" className="header-search-icon" />
        )}
      </button>
    </div>
  );
}
