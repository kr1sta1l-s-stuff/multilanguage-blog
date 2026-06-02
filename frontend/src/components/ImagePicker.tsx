import { useEffect, useRef, useState } from 'react';
import { useT } from '../hooks/useT';

export type PickerItem =
  | { kind: 'existing'; id: string; url: string }
  | { kind: 'new'; file: File };

interface Props {
  items: PickerItem[];
  onChange: (items: PickerItem[]) => void;
  max?: number;
}

interface PreviewItem {
  key: string;
  url: string;
}

export default function ImagePicker({ items, onChange, max }: Props) {
  const t = useT();
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const created: string[] = [];
    const next = items.map((item, idx): PreviewItem => {
      if (item.kind === 'existing') {
        return { key: `existing-${item.id}`, url: item.url };
      }
      const url = URL.createObjectURL(item.file);
      created.push(url);
      return { key: `new-${idx}-${item.file.name}`, url };
    });
    setPreviews(next);
    return () => {
      created.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [items]);

  const addFiles = (files: File[]) => {
    const onlyImages = files.filter((f) => f.type.startsWith('image/'));
    if (onlyImages.length === 0) return;
    const next: PickerItem[] = [...items, ...onlyImages.map((file) => ({ kind: 'new' as const, file }))];
    onChange(max ? next.slice(0, max) : next);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []));
    e.target.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const files: File[] = [];
    for (const item of Array.from(e.clipboardData.items)) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      addFiles(files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (e.dataTransfer.files.length > 0) {
      e.preventDefault();
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
    }
  };

  const removeAt = (idx: number) => {
    const next = items.slice();
    next.splice(idx, 1);
    onChange(next);
  };

  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const next = items.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <div
      ref={containerRef}
      className="image-picker"
      onPaste={handlePaste}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      tabIndex={0}
    >
      <div className="image-picker-list">
        {previews.map((item, idx) => (
          <div
            key={item.key}
            className={`image-picker-item${dragIndex === idx ? ' image-picker-item-dragging' : ''}${overIndex === idx && dragIndex !== null && dragIndex !== idx ? ' image-picker-item-over' : ''}`}
            draggable
            onDragStart={(e) => {
              setDragIndex(idx);
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/plain', String(idx));
            }}
            onDragOver={(e) => {
              if (dragIndex === null) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              setOverIndex(idx);
            }}
            onDragLeave={() => {
              setOverIndex((cur) => (cur === idx ? null : cur));
            }}
            onDrop={(e) => {
              if (dragIndex === null) return;
              e.preventDefault();
              e.stopPropagation();
              reorder(dragIndex, idx);
              setDragIndex(null);
              setOverIndex(null);
            }}
            onDragEnd={() => {
              setDragIndex(null);
              setOverIndex(null);
            }}
          >
            <img src={item.url} alt={`preview-${idx}`} className="image-picker-thumb" />
            <span className="image-picker-index">{idx + 1}</span>
            <button
              type="button"
              className="image-picker-remove"
              onClick={() => removeAt(idx)}
              aria-label={t('imagePicker.remove')}
            >
              &times;
            </button>
          </div>
        ))}
        <button
          type="button"
          className="image-picker-add"
          onClick={() => fileInputRef.current?.click()}
          disabled={!!max && items.length >= max}
        >
          +
        </button>
      </div>
      <p className="image-picker-hint">
        {t('imagePicker.hint')}
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleFileInput}
      />
    </div>
  );
}
