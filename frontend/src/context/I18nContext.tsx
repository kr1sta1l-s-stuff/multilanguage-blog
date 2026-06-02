import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { updateMyLanguage } from '../api/users';
import type { TranslationKey } from '../i18n/keys';

export interface LanguageOption {
  code: string;
  name: string;
}

type Dict = Record<string, string>;

interface I18nContextType {
  lang: string;
  availableLangs: LanguageOption[];
  ready: boolean;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  setLang: (code: string) => Promise<void>;
}

export const I18nContext = createContext<I18nContextType>(null!);

const STORAGE_KEY = 'lang';
const FALLBACK_LANG = 'ru';
const base = import.meta.env.BASE_URL;

function readStoredLang(): string {
  return localStorage.getItem(STORAGE_KEY) || FALLBACK_LANG;
}

async function fetchDict(code: string): Promise<Dict> {
  const res = await fetch(`${base}locales/${code}.json`);
  if (!res.ok) throw new Error(`Failed to load locale "${code}"`);
  return res.json();
}

function interpolate(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    name in params ? String(params[name]) : match,
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [lang, setLangState] = useState<string>(readStoredLang);
  const [availableLangs, setAvailableLangs] = useState<LanguageOption[]>([]);
  const [ready, setReady] = useState(false);
  // Force re-render when dictionaries finish loading.
  const [, bump] = useState(0);
  const dicts = useRef<Map<string, Dict>>(new Map());

  const ensureLoaded = useCallback(async (code: string) => {
    if (dicts.current.has(code)) return;
    try {
      const dict = await fetchDict(code);
      dicts.current.set(code, dict);
      bump((n) => n + 1);
    } catch {
      // Missing dictionary: fall back silently to the fallback language.
    }
  }, []);

  // Load the manifest + fallback + initial active dictionary once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${base}locales/index.json`);
        if (res.ok && !cancelled) {
          setAvailableLangs(await res.json());
        }
      } catch {
        if (!cancelled) {
          setAvailableLangs([{ code: FALLBACK_LANG, name: 'Русский' }]);
        }
      }
      await Promise.all([ensureLoaded(FALLBACK_LANG), ensureLoaded(lang)]);
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The authenticated user's stored language is authoritative.
  useEffect(() => {
    if (user?.language && user.language !== lang) {
      ensureLoaded(user.language).then(() => {
        localStorage.setItem(STORAGE_KEY, user.language);
        setLangState(user.language);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.language]);

  const setLang = useCallback(
    async (code: string) => {
      await ensureLoaded(code);
      localStorage.setItem(STORAGE_KEY, code);
      setLangState(code);
      if (user) {
        try {
          await updateMyLanguage(code);
        } catch {
          // Keep the local choice even if the server update fails.
        }
      }
    },
    [ensureLoaded, user],
  );

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => {
      const active = dicts.current.get(lang);
      const fallback = dicts.current.get(FALLBACK_LANG);
      const template = active?.[key] ?? fallback?.[key] ?? key;
      return interpolate(template, params);
    },
    [lang],
  );

  return (
    <I18nContext.Provider value={{ lang, availableLangs, ready, t, setLang }}>
      {children}
    </I18nContext.Provider>
  );
}
