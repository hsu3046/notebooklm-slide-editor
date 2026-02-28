import { useState, useCallback } from 'react';

export type ModelPreset = {
    id: string;
    label: string;
    description: { ko: string; ja: string; en: string };
    ocrModels: readonly string[];
    inpaintModels: readonly string[];
    costPerOcr: number;
    costPerInpaint: number;
};

// OCR은 모든 프리셋에서 gemini-3.1-flash-image-preview 사용
// Inpaint만 프리셋으로 선택 (v2.5 vs v3.1)
export const MODEL_PRESETS: ModelPreset[] = [
    {
        id: 'inpaint-v2.5',
        label: 'Inpaint: v2.5 (低コスト)',
        description: {
            ko: 'Inpaint에 gemini-2.5-flash-image 사용 (저렴)',
            ja: 'InpaintにGemini 2.5 Flash Imageを使用（低コスト）',
            en: 'Uses Gemini 2.5 Flash Image for Inpaint (lower cost)',
        },
        ocrModels: ['gemini-3.1-flash-image-preview', 'gemini-2.5-flash'],
        inpaintModels: ['gemini-2.5-flash-image', 'gemini-2.5-flash'],
        costPerOcr: 0.0004,
        costPerInpaint: 0.003,
    },
    {
        id: 'inpaint-v3.1',
        label: 'Inpaint: v3.1 (高品質)',
        description: {
            ko: 'Inpaint에 gemini-3.1-flash-image-preview 사용 (고품질)',
            ja: 'InpaintにGemini 3.1 Flash Imageを使用（高品質）',
            en: 'Uses Gemini 3.1 Flash Image for Inpaint (higher quality)',
        },
        ocrModels: ['gemini-3.1-flash-image-preview', 'gemini-2.5-flash'],
        inpaintModels: ['gemini-3.1-flash-image-preview', 'gemini-2.5-flash'],
        costPerOcr: 0.0004,
        costPerInpaint: 0.05,
    },
];

const STORAGE_KEY = 'notebooklm-editor-model-preset';

export function useModelConfig() {
    const [presetId, setPresetIdState] = useState<string>(() => {
        try {
            return sessionStorage.getItem(STORAGE_KEY) || MODEL_PRESETS[0].id;
        } catch {
            return MODEL_PRESETS[0].id;
        }
    });

    const preset = MODEL_PRESETS.find(p => p.id === presetId) || MODEL_PRESETS[0];

    const setPresetId = useCallback((id: string) => {
        setPresetIdState(id);
        try {
            sessionStorage.setItem(STORAGE_KEY, id);
        } catch {
            // sessionStorage unavailable
        }
    }, []);

    return {
        presetId,
        setPresetId,
        preset,
        presets: MODEL_PRESETS,
    };
}
