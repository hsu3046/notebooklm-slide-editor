
import { GoogleGenAI, Type } from "@google/genai";
import { OCRResult } from "../types";

// 싱글톤 캐시 — API 키가 바뀔 때만 재생성
let cachedClient: GoogleGenAI | null = null;
let cachedApiKey: string | null = null;

function getClient(apiKey: string): GoogleGenAI {
  if (cachedClient && cachedApiKey === apiKey) return cachedClient;
  cachedClient = new GoogleGenAI({ apiKey });
  cachedApiKey = apiKey;
  return cachedClient;
}

/**
 * OCR 텍스트 분석 — 모델 폴백 지원
 * 모델 배열을 외부에서 주입받아 순서대로 시도
 */
export const analyzeTextInImage = async (
  apiKey: string,
  base64Image: string,
  models: readonly string[] = ['gemini-3-flash-preview', 'gemini-2.5-flash']
): Promise<OCRResult> => {
  const ai = getClient(apiKey);
  const rawBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  const contentConfig = {
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/png' as const,
            data: rawBase64,
          },
        },
        {
          text: `Identify the text in this image snippet. The text may be in Korean, Japanese, or English.
                  Estimate the following typography properties:
                  1. The exact text content.
                  2. Approximate font size in pixels.
                  3. Font weight (e.g., normal, bold).
                  4. Dominant text color in hex.
                  5. Closest font family (sans-serif, serif, monospace).
                  6. Dominant background color in hex behind the text.
                  7. Background type: "solid" if the background is a single flat color, "gradient" if it has a smooth color transition, "complex" if it has a photo, pattern, texture, or illustration behind the text.
                  8. Detected language code (ko, ja, or en).
                  Return ONLY a JSON object with keys: text, fontSize, fontWeight, fontColor, fontFamily, backgroundColor, backgroundType, language.`
        }
      ]
    },
    config: {
      responseMimeType: "application/json" as const,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          fontSize: { type: Type.NUMBER },
          fontWeight: { type: Type.STRING },
          fontColor: { type: Type.STRING },
          fontFamily: { type: Type.STRING },
          backgroundColor: { type: Type.STRING },
          backgroundType: { type: Type.STRING },
          language: { type: Type.STRING },
        },
        required: ["text", "fontSize", "fontWeight", "fontColor", "fontFamily", "backgroundColor", "backgroundType", "language"]
      }
    }
  };

  let lastError: unknown = null;

  for (const model of models) {
    try {
      console.log(`[gemini] OCR trying model: ${model}`);
      const response = await ai.models.generateContent({
        model,
        ...contentConfig
      });

      const rawText = response.text ?? "{}";
      const data = JSON.parse(rawText);

      console.log(`[gemini] OCR success with model: ${model}`);
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
    } catch (error) {
      lastError = error;
      const errMsg = error instanceof Error ? error.message : String(error);
      console.warn(`[gemini] OCR failed with ${model}:`, errMsg);

      // 인증 오류 시 캐시 초기화 + 즉시 중단 (폴백 무의미)
      if (errMsg.includes('401') || errMsg.includes('403') || errMsg.includes('API_KEY_INVALID')) {
        cachedClient = null;
        cachedApiKey = null;
        throw error;
      }
      // 그 외 에러: 다음 모델로 폴백
    }
  }

  throw lastError || new Error('All OCR models failed');
};

/**
 * Gemini Image Editing — 글자 지우기 + 배경 복원
 * 모델 배열을 외부에서 주입받아 순서대로 시도
 */
export const inpaintBackground = async (
  apiKey: string,
  fullSlideBase64: string,
  region: { x: number; y: number; width: number; height: number },
  slideSize: { width: number; height: number },
  models: readonly string[] = ['gemini-2.5-flash-image', 'gemini-2.5-flash']
): Promise<string | null> => {
  const ai = getClient(apiKey);
  const rawBase64 = fullSlideBase64.includes(',') ? fullSlideBase64.split(',')[1] : fullSlideBase64;

  const regionInfo = region && slideSize
    ? `The image is ${slideSize.width}x${slideSize.height} pixels. Focus on the rectangular region at coordinates (x:${region.x}, y:${region.y}) with size ${region.width}x${region.height} pixels. `
    : '';

  const prompt = `${regionInfo}Remove ALL text and letters from this image completely. Fill in the background naturally where the text was, matching the surrounding colors, patterns, and textures seamlessly. The output should look as if there was never any text. Keep the rest of the image completely unchanged. Return ONLY the edited image, no text response.`;

  for (const model of models) {
    try {
      console.log(`[gemini] Inpaint trying model: ${model}, image size: ${rawBase64.length} chars`);

      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: rawBase64
            }
          },
          { text: prompt }
        ]
      });

      const parts = response?.candidates?.[0]?.content?.parts;
      let imageData: string | null = null;

      if (parts) {
        for (const part of parts) {
          if (part.inlineData?.data) {
            imageData = part.inlineData.data;
            break;
          }
        }
      }

      if (imageData) {
        const resultBase64 = `data:image/png;base64,${imageData}`;
        console.log(`[gemini] Inpaint success with model: ${model}, result: ${resultBase64.length} chars`);
        return resultBase64;
      }

      // 이미지 없음 — 다음 모델 시도
      console.warn(`[gemini] Inpaint ${model} returned no image, trying fallback...`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.warn(`[gemini] Inpaint failed with ${model}:`, errMsg);

      // 인증 오류 시 캐시 초기화 + 즉시 중단
      if (errMsg.includes('401') || errMsg.includes('403') || errMsg.includes('API_KEY_INVALID')) {
        cachedClient = null;
        cachedApiKey = null;
        return null;
      }
      // 그 외: 다음 모델로 폴백
    }
  }

  console.warn('[gemini] All inpaint models failed');
  return null;
};
