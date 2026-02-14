import { useState, useCallback, useRef } from 'react';

export type ToastType = 'error' | 'success' | 'info' | 'warning';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration: number;
}

const DEFAULT_DURATION: Record<ToastType, number> = {
    error: 6000,
    warning: 5000,
    info: 4000,
    success: 3000,
};

export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    const removeToast = useCallback((id: string) => {
        const timer = timersRef.current.get(id);
        if (timer) {
            clearTimeout(timer);
            timersRef.current.delete(id);
        }
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((message: string, type: ToastType = 'info', duration?: number) => {
        const id = crypto.randomUUID();
        const dur = duration ?? DEFAULT_DURATION[type];

        setToasts(prev => [...prev, { id, message, type, duration: dur }]);

        const timer = setTimeout(() => {
            removeToast(id);
        }, dur);
        timersRef.current.set(id, timer);

        return id;
    }, [removeToast]);

    const showError = useCallback((msg: string) => addToast(msg, 'error'), [addToast]);
    const showSuccess = useCallback((msg: string) => addToast(msg, 'success'), [addToast]);
    const showWarning = useCallback((msg: string) => addToast(msg, 'warning'), [addToast]);
    const showInfo = useCallback((msg: string) => addToast(msg, 'info'), [addToast]);

    return { toasts, removeToast, addToast, showError, showSuccess, showWarning, showInfo };
}
