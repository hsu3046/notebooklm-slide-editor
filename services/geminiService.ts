
import { OCRResult } from "../types";

/**
 * Gemini API를 서버 프록시를 통해 호출합니다.
 * API 키는 서버 측(server/geminiProxy.ts)에서만 관리됩니다.
 */
export const analyzeTextInImage = async (base64Image: string): Promise<OCRResult> => {
  const response = await fetch('/api/gemini/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Image }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `AI 분석 실패 (HTTP ${response.status})`);
  }

  const data = await response.json();

  return {
    text: data.text || "",
    fontSize: data.fontSize || 16,
    fontWeight: data.fontWeight || "normal",
    fontColor: data.fontColor || "#000000",
    fontFamily: data.fontFamily || "sans-serif",
    backgroundColor: data.backgroundColor || "#ffffff",
    backgroundType: data.backgroundType || "solid",
    language: data.language || "ko"
  };
};

/**
 * Gemini Image Editing — 전체 슬라이드에서 텍스트를 제거하고 배경을 복원합니다.
 * 전체 이미지와 선택 영역 좌표를 전송하여 맥락을 유지합니다.
 * 실패하면 null을 반환합니다 (backgroundColor fallback 사용).
 */
export const inpaintBackground = async (
  fullSlideBase64: string,
  region: { x: number; y: number; width: number; height: number },
  slideSize: { width: number; height: number }
): Promise<string | null> => {
  try {
    const response = await fetch('/api/gemini/inpaint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Image: fullSlideBase64, region, slideSize }),
    });

    if (!response.ok) {
      console.warn('Inpaint API returned non-OK status:', response.status);
      return null;
    }

    const data = await response.json();
    return data.backgroundImage || null;
  } catch (error) {
    console.warn('Inpaint API call failed:', error);
    return null;
  }
};
