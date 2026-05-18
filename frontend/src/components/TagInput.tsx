import { useEffect, useRef, useState } from 'react';
import type { Tag } from '../api/types';
import { searchTags } from '../api/tags';

interface Props {
  tags: string[];
  onChange: (tags: string[]) => void;
  max?: number;
  placeholder?: string;
}

const DEFAULT_MAX = 10;

export default function TagInput({ tags, onChange, max = DEFAULT_MAX, placeholder }: Props) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const q = input.trim();
    if (!q) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = window.setTimeout(() => {
      searchTags(q)
        .then((found) => setSuggestions(found))
        .catch(() => setSuggestions([]));
    }, 200);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [input]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const commit = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    if (tags.length >= max) return;
    const lowered = trimmed.toLowerCase();
    if (tags.some((t) => t.toLowerCase() === lowered)) {
      setInput('');
      return;
    }
    onChange([...tags, trimmed]);
    setInput('');
    setActiveIndex(-1);
  };

  const remove = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const visible = suggestions.filter(
      (s) => !tags.some((t) => t.toLowerCase() === s.slug),
    );
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (activeIndex >= 0 && visible[activeIndex]) {
        commit(visible[activeIndex].slug);
      } else if (input.trim()) {
        commit(input);
      }
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      remove(tags.length - 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(visible.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(-1, i - 1));
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const visibleSuggestions = suggestions.filter(
    (s) => !tags.some((t) => t.toLowerCase() === s.slug),
  );

  return (
    <div className="tag-input" ref={containerRef}>
      <div className="tag-input-box">
        {tags.map((tag, i) => (
          <span key={`${tag}-${i}`} className="tag-chip tag-chip-editable">
            {tag}
            <button
              type="button"
              className="tag-chip-remove"
              onClick={() => remove(i)}
              aria-label={`Удалить тег ${tag}`}
            >
              &times;
            </button>
          </span>
        ))}
        <input
          type="text"
          className="tag-input-field"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder ?? 'Добавьте тег...' : ''}
          disabled={tags.length >= max}
        />
      </div>
      {open && visibleSuggestions.length > 0 && (
        <ul className="tag-suggestions">
          {visibleSuggestions.map((s, i) => (
            <li
              key={s.id}
              className={`tag-suggestion${i === activeIndex ? ' tag-suggestion-active' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                commit(s.slug);
              }}
              onMouseEnter={() => setActiveIndex(i)}
            >
              {s.name}
              <span className="tag-suggestion-slug">{s.slug}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="tag-input-hint">
        {tags.length}/{max} · Enter или запятая, чтобы добавить
      </div>
    </div>
  );
}
