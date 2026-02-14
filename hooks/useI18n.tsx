import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Locale, translations, TranslationKey } from '../constants/i18n';

interface I18nContextValue {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = 'notebooklm-editor-locale';
const SUPPORTED_LOCALES: Locale[] = ['ko', 'ja', 'en'];

/**
 * 브라우저 언어 설정에서 지원하는 locale을 감지.
 * navigator.languages → navigator.language 순서로 확인.
 * 매칭 안 되면 'en' 기본값.
 */
function detectBrowserLocale(): Locale {
    const langs = navigator.languages?.length
        ? navigator.languages
        : [navigator.language];

    for (const lang of langs) {
        const code = lang.toLowerCase().split('-')[0]; // 'ko-KR' → 'ko'
        if (SUPPORTED_LOCALES.includes(code as Locale)) {
            return code as Locale;
        }
    }
    return 'en';
}

/**
 * 초기 locale 결정: localStorage > 브라우저 감지 > 'en'
 */
function getInitialLocale(): Locale {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
            return stored as Locale;
        }
    } catch {
        // localStorage 접근 불가 (private mode 등)
    }
    return detectBrowserLocale();
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

    const setLocale = useCallback((newLocale: Locale) => {
        setLocaleState(newLocale);
        try {
            localStorage.setItem(STORAGE_KEY, newLocale);
        } catch {
            // ignore
        }
    }, []);

    const t = useCallback(
        (key: TranslationKey): string => {
            const entry = translations[key];
            if (!entry) return key;
            return entry[locale] || entry['en'] || key;
        },
        [locale]
    );

    // HTML lang 속성 동기화
    useEffect(() => {
        document.documentElement.lang = locale;
    }, [locale]);

    return (
        <I18nContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </I18nContext.Provider>
    );
};

/**
 * i18n hook — 컴포넌트에서 `const { t, locale, setLocale } = useI18n()` 으로 사용.
 */
export function useI18n(): I18nContextValue {
    const ctx = useContext(I18nContext);
    if (!ctx) throw new Error('useI18n must be used within I18nProvider');
    return ctx;
}
