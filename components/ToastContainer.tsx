import React, { useEffect, useState } from 'react';
import { Toast, ToastType } from '../hooks/useToast';
import { X, AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

const ICONS: Record<ToastType, React.ReactNode> = {
    error: <AlertCircle size={18} />,
    success: <CheckCircle2 size={18} />,
    warning: <AlertTriangle size={18} />,
    info: <Info size={18} />,
};

const STYLES: Record<ToastType, string> = {
    error: 'bg-red-900/90 border-red-500/50 text-red-100',
    success: 'bg-emerald-900/90 border-emerald-500/50 text-emerald-100',
    warning: 'bg-amber-900/90 border-amber-500/50 text-amber-100',
    info: 'bg-blue-900/90 border-blue-500/50 text-blue-100',
};

const ICON_STYLES: Record<ToastType, string> = {
    error: 'text-red-400',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    info: 'text-blue-400',
};

const PROGRESS_STYLES: Record<ToastType, string> = {
    error: 'bg-red-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    info: 'bg-blue-400',
};

interface ToastItemProps {
    toast: Toast;
    onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        // slide-in 애니메이션
        requestAnimationFrame(() => setIsVisible(true));

        // 프로그레스 바 애니메이션
        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 100 - (elapsed / toast.duration) * 100);
            setProgress(remaining);
            if (remaining <= 0) clearInterval(interval);
        }, 50);

        return () => clearInterval(interval);
    }, [toast.duration]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => onRemove(toast.id), 300);
    };

    return (
        <div
            className={`
        relative overflow-hidden
        w-80 border rounded-lg shadow-2xl backdrop-blur-sm
        transition-all duration-300 ease-out
        ${STYLES[toast.type]}
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
        >
            <div className="flex items-start gap-3 p-4 pr-10">
                <span className={`mt-0.5 flex-shrink-0 ${ICON_STYLES[toast.type]}`}>
                    {ICONS[toast.type]}
                </span>
                <p className="text-sm font-medium leading-snug break-words">{toast.message}</p>
            </div>

            <button
                onClick={handleClose}
                className="absolute top-3 right-3 p-1 rounded-md hover:bg-white/10 transition-colors"
            >
                <X size={14} className="opacity-60" />
            </button>

            {/* 프로그레스 바 */}
            <div className="h-0.5 w-full bg-black/20">
                <div
                    className={`h-full transition-none ${PROGRESS_STYLES[toast.type]}`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};

interface ToastContainerProps {
    toasts: Toast[];
    onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-auto">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    );
};
