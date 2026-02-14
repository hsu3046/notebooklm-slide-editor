import { useState, useCallback, useRef } from 'react';

// Gemini API 대략적인 비용 (2026년 기준, 예상치)
// gemini-3-flash-preview: input ~$0.01/1M tokens, output ~$0.04/1M tokens
// 이미지 입력: ~258 tokens/image
// gemini-2.5-flash-image: 이미지 생성/편집 ~$0.003/image
const COST_PER_OCR = 0.0003;       // OCR 분석 1회 (~$0.0003)
const COST_PER_INPAINT = 0.003;    // 글자 지우기 1회 (~$0.003)

export type CostEntry = {
    type: 'ocr' | 'inpaint';
    cost: number;
    timestamp: number;
};

export function useApiCost() {
    const [entries, setEntries] = useState<CostEntry[]>([]);
    const totalRef = useRef(0);

    const addOcrCost = useCallback(() => {
        const entry: CostEntry = { type: 'ocr', cost: COST_PER_OCR, timestamp: Date.now() };
        totalRef.current += COST_PER_OCR;
        setEntries(prev => [...prev, entry]);
    }, []);

    const addInpaintCost = useCallback(() => {
        const entry: CostEntry = { type: 'inpaint', cost: COST_PER_INPAINT, timestamp: Date.now() };
        totalRef.current += COST_PER_INPAINT;
        setEntries(prev => [...prev, entry]);
    }, []);

    const totalCost = entries.reduce((sum, e) => sum + e.cost, 0);
    const ocrCount = entries.filter(e => e.type === 'ocr').length;
    const inpaintCount = entries.filter(e => e.type === 'inpaint').length;

    const resetCost = useCallback(() => {
        setEntries([]);
        totalRef.current = 0;
    }, []);

    return {
        addOcrCost,
        addInpaintCost,
        totalCost,
        ocrCount,
        inpaintCount,
        entries,
        resetCost,
        COST_PER_OCR,
        COST_PER_INPAINT,
    };
}
