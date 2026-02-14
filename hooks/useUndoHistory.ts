import { useState, useCallback, useEffect, useRef } from 'react';
import { TextOverlay } from '../types';

const MAX_HISTORY = 50;

interface HistoryEntry {
    overlays: TextOverlay[];
}

interface SlideHistory {
    past: HistoryEntry[];
    future: HistoryEntry[];
}

export function useUndoHistory() {
    // 슬라이드 인덱스별 히스토리
    const historyRef = useRef<Map<number, SlideHistory>>(new Map());

    const getHistory = (slideIdx: number): SlideHistory => {
        if (!historyRef.current.has(slideIdx)) {
            historyRef.current.set(slideIdx, { past: [], future: [] });
        }
        return historyRef.current.get(slideIdx)!;
    };

    /**
     * 현재 상태를 히스토리에 push (변경 전 호출)
     */
    const pushState = useCallback((slideIdx: number, currentOverlays: TextOverlay[]) => {
        const h = getHistory(slideIdx);
        h.past.push({ overlays: structuredClone(currentOverlays) });
        // 새 변경이 생기면 redo 스택 초기화
        h.future = [];
        // 최대 히스토리 제한
        if (h.past.length > MAX_HISTORY) {
            h.past.shift();
        }
    }, []);

    /**
     * Undo: 이전 상태로 복원
     * @returns 복원된 overlays 또는 null (히스토리 없으면)
     */
    const undo = useCallback((slideIdx: number, currentOverlays: TextOverlay[]): TextOverlay[] | null => {
        const h = getHistory(slideIdx);
        if (h.past.length === 0) return null;

        // 현재 상태를 future에 저장
        h.future.push({ overlays: structuredClone(currentOverlays) });
        // 이전 상태 복원
        const prev = h.past.pop()!;
        return prev.overlays;
    }, []);

    /**
     * Redo: 다음 상태로 복원
     * @returns 복원된 overlays 또는 null (future 없으면)
     */
    const redo = useCallback((slideIdx: number, currentOverlays: TextOverlay[]): TextOverlay[] | null => {
        const h = getHistory(slideIdx);
        if (h.future.length === 0) return null;

        // 현재 상태를 past에 저장
        h.past.push({ overlays: structuredClone(currentOverlays) });
        // 다음 상태 복원
        const next = h.future.pop()!;
        return next.overlays;
    }, []);

    /**
     * 슬라이드 로드 시 히스토리 초기화
     */
    const resetAll = useCallback(() => {
        historyRef.current.clear();
    }, []);

    /**
     * 특정 슬라이드의 undo/redo 가능 여부
     */
    const canUndo = useCallback((slideIdx: number): boolean => {
        return (historyRef.current.get(slideIdx)?.past.length ?? 0) > 0;
    }, []);

    const canRedo = useCallback((slideIdx: number): boolean => {
        return (historyRef.current.get(slideIdx)?.future.length ?? 0) > 0;
    }, []);

    return { pushState, undo, redo, resetAll, canUndo, canRedo };
}
