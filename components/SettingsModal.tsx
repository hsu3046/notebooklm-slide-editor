import React, { useState } from 'react';
import { useI18n } from '../hooks/useI18n';
import { Locale } from '../constants/i18n';
import { MODEL_PRESETS, ModelPreset } from '../hooks/useModelConfig';
import {
    X,
    Key,
    Eye,
    EyeOff,
    DollarSign,
    ExternalLink,
    Globe,
    Cpu,
    CheckCircle2,
    Settings,
} from 'lucide-react';

const LOCALE_LABELS: Record<Locale, string> = { ko: '한국어', ja: '日本語', en: 'English' };

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    apiKey: string;
    onSetApiKey: (key: string) => void;
    onClearApiKey: () => void;
    isKeySet: boolean;
    presetId: string;
    onSetPresetId: (id: string) => void;
    preset: ModelPreset;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    apiKey,
    onSetApiKey,
    onClearApiKey,
    isKeySet,
    presetId,
    onSetPresetId,
    preset,
}) => {
    const { t, locale, setLocale } = useI18n();
    const [keyInput, setKeyInput] = useState(apiKey);
    const [showKey, setShowKey] = useState(false);

    if (!isOpen) return null;

    const handleSaveKey = () => {
        if (keyInput.trim()) {
            onSetApiKey(keyInput.trim());
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                    <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                        <Settings size={20} className="text-blue-400" />
                        {t('settings.title')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* ── Language ── */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                            {t('settings.language')}
                        </label>
                        <div className="flex gap-2">
                            {(['ko', 'ja', 'en'] as Locale[]).map(l => (
                                <button
                                    key={l}
                                    onClick={() => setLocale(l)}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all border ${locale === l
                                        ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-bold'
                                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-700'
                                        }`}
                                >
                                    <Globe size={14} />
                                    {LOCALE_LABELS[l]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── API Key ── */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                            {t('apikey.title')}
                        </label>
                        <div className="relative">
                            <input
                                type={showKey ? 'text' : 'password'}
                                value={keyInput}
                                onChange={e => setKeyInput(e.target.value)}
                                placeholder={t('apikey.placeholder')}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 pr-12 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                            />
                            <button
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <button
                                onClick={handleSaveKey}
                                disabled={!keyInput.trim() || keyInput.trim() === apiKey}
                                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors"
                            >
                                <Key size={14} />
                                {isKeySet ? t('settings.save') : t('apikey.start')}
                            </button>
                            {isKeySet && (
                                <button
                                    onClick={() => { onClearApiKey(); setKeyInput(''); }}
                                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors"
                                >
                                    {t('settings.clearKey')}
                                </button>
                            )}
                            <a
                                href="https://aistudio.google.com/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-auto flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                {t('apikey.getKey')}
                                <ExternalLink size={12} />
                            </a>
                        </div>
                        {isKeySet && (
                            <div className="mt-2 flex items-center gap-1.5 text-xs text-green-400">
                                <CheckCircle2 size={14} />
                                {t('settings.keyActive')}
                            </div>
                        )}
                    </div>

                    {/* ── Model Selection ── */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                            <span className="flex items-center gap-1.5">
                                <Cpu size={14} />
                                {t('settings.model')}
                            </span>
                        </label>
                        {/* Fixed OCR model */}
                        <div className="mb-3 px-3 py-2 bg-slate-900/50 rounded-lg border border-slate-700/50">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">OCR</p>
                            <p className="text-xs text-slate-300 font-mono">gemini-3.1-flash-image-preview</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">~$0.0004/call</p>
                        </div>
                        {/* Inpaint model selection */}
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">INPAINT MODEL</p>
                        <div className="space-y-2">
                            {MODEL_PRESETS.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => onSetPresetId(p.id)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all ${presetId === p.id
                                        ? 'bg-blue-600/10 border-blue-500'
                                        : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-sm font-bold ${presetId === p.id ? 'text-blue-400' : 'text-slate-200'}`}>
                                            {p.label}
                                        </span>
                                        {presetId === p.id && <CheckCircle2 size={16} className="text-blue-400" />}
                                    </div>
                                    <p className="text-xs text-slate-500 mb-2">{p.description[locale]}</p>
                                    <span className="text-[10px] px-2 py-0.5 bg-slate-800 rounded text-slate-400">
                                        ~${p.costPerInpaint}/call
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Privacy Notice ── */}
                    <div className="space-y-2 text-xs text-slate-500 border-t border-slate-700 pt-4">
                        <p>{t('apikey.privacy1')}</p>
                        <p>{t('apikey.privacy2')}</p>
                        <p>{t('apikey.privacy3')}</p>
                    </div>

                    {/* ── Open Source ── */}
                    <div className="text-center">
                        <a
                            href="https://github.com/hsu3046/notebooklm-slide-editor"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-400 transition-colors"
                        >
                            {t('apikey.opensource')}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
