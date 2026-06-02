import type { ReactNode } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useT } from '../hooks/useT';
import type { ThemeMode } from '../context/ThemeContext';
import type { TranslationKey } from '../i18n/keys';

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

const OPTIONS: { value: ThemeMode; labelKey: TranslationKey; icon: () => ReactNode }[] = [
  { value: 'light', labelKey: 'theme.light', icon: SunIcon },
  { value: 'system', labelKey: 'theme.system', icon: MonitorIcon },
  { value: 'dark', labelKey: 'theme.dark', icon: MoonIcon },
];

export default function ThemeSwitcher() {
  const { mode, setMode } = useTheme();
  const t = useT();
  const activeOption = OPTIONS.find((o) => o.value === mode);
  const activeLabel = activeOption ? t(activeOption.labelKey) : '';
  return (
    <div className="theme-switcher" role="group" aria-label={t('theme.label')}>
      <div className="theme-switcher-row">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = mode === opt.value;
          const label = t(opt.labelKey);
          return (
            <button
              key={opt.value}
              type="button"
              role="menuitemradio"
              aria-checked={active}
              aria-label={label}
              title={label}
              className={`theme-switcher-btn${active ? ' theme-switcher-btn-active' : ''}`}
              onClick={() => setMode(opt.value)}
            >
              <Icon />
            </button>
          );
        })}
      </div>
      <div className="theme-switcher-label" aria-live="polite">{activeLabel}</div>
    </div>
  );
}
