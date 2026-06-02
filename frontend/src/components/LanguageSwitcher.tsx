import { useI18n } from '../hooks/useT';
import { useT } from '../hooks/useT';

export default function LanguageSwitcher() {
  const { lang, availableLangs, setLang } = useI18n();
  const t = useT();

  if (availableLangs.length < 2) return null;

  return (
    <div
      className="theme-switcher language-switcher"
      role="group"
      aria-label={t('language.label')}
    >
      <div className="theme-switcher-row">
        {availableLangs.map((opt) => {
          const active = lang === opt.code;
          return (
            <button
              key={opt.code}
              type="button"
              role="menuitemradio"
              aria-checked={active}
              title={opt.name}
              className={`theme-switcher-btn language-switcher-btn${active ? ' theme-switcher-btn-active' : ''}`}
              onClick={() => setLang(opt.code)}
            >
              {opt.code.toUpperCase()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
