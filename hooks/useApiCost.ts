import { useState, useCallback, useRef } from 'react';

export type CostEntry = {
    type: 'ocr' | 'inpaint';
    cost: number;
    timestamp: number;
};

export function useApiCost(costPerOcr: number, costPerInpaint: number) {
    const [entries, setEntries] = useState<CostEntry[]>([]);
    const totalRef = useRef(0);

    const addOcrCost = useCallback(() => {
        const entry: CostEntry = { type: 'ocr', cost: costPerOcr, timestamp: Date.now() };
        totalRef.current += costPerOcr;
        setEntries(prev => [...prev, entry]);
    }, [costPerOcr]);

    const addInpaintCost = useCallback(() => {
        const entry: CostEntry = { type: 'inpaint', cost: costPerInpaint, timestamp: Date.now() };
        totalRef.current += costPerInpaint;
        setEntries(prev => [...prev, entry]);
    }, [costPerInpaint]);

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
        costPerOcr,
        costPerInpaint,
    };
}
