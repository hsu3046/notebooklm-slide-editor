import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'notebooklm-editor-api-key';

export function useApiKey() {
    const [apiKey, setApiKeyState] = useState<string>(() => {
        try {
            return sessionStorage.getItem(STORAGE_KEY) || '';
        } catch {
            return '';
        }
    });

    useEffect(() => {
        try {
            if (apiKey) {
                sessionStorage.setItem(STORAGE_KEY, apiKey);
            } else {
                sessionStorage.removeItem(STORAGE_KEY);
            }
        } catch {
            // sessionStorage 사용 불가 환경 무시
        }
    }, [apiKey]);

    const setApiKey = useCallback((key: string) => {
        setApiKeyState(key.trim());
    }, []);

    const clearApiKey = useCallback(() => {
        setApiKeyState('');
        try {
            sessionStorage.removeItem(STORAGE_KEY);
        } catch {
            // ignore
        }
    }, []);

    return {
        apiKey,
        setApiKey,
        clearApiKey,
        isKeySet: apiKey.length > 0,
    };
}
