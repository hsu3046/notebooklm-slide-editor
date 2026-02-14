
import { GoogleGenAI, Type } from "@google/genai";

import type { Plugin } from 'vite';

// [FIX #5] GoogleGenAI 싱글톤 캐시 — 매 요청마다 인스턴스 재생성 방지
let cachedAiClient: GoogleGenAI | null = null;
let cachedApiKey: string | null = null;

function getAiClient(apiKey: string): GoogleGenAI {
    if (cachedAiClient && cachedApiKey === apiKey) {
        return cachedAiClient;
    }
    cachedAiClient = new GoogleGenAI({ apiKey });
    cachedApiKey = apiKey;
    return cachedAiClient;
}

const FALLBACK_RESULT = {
    error: 'AI 분석 중 오류가 발생했습니다.',
    text: "",
    fontSize: 16,
    fontWeight: "normal",
    fontColor: "#000000",
    fontFamily: "sans-serif",
    backgroundColor: "#ffffff",
    backgroundType: "solid"
};

/**
 * 안전하게 응답을 전송하는 헬퍼
 * res가 이미 전송 완료된 경우 중복 write를 방지하여 서버 크래시를 예방
 */
function safeEnd(res: any, statusCode: number, data: object) {
    if (res.writableEnded || res.headersSent) {
        console.warn("[gemini-proxy] Response already sent, skipping duplicate write");
        return;
    }
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
}

/**
 * Vite 개발 서버 미들웨어 플러그인.
 * - /api/gemini/analyze: OCR 텍스트 분석 + 배경 타입 감지
 * - /api/gemini/inpaint: Imagen 3 inpainting으로 텍스트 제거 + 배경 복원
 */
export function geminiProxyPlugin(): Plugin {
    return {
        name: 'gemini-proxy',
        configureServer(server) {

            // ──────────────────────────────────────────────
            // 1. OCR 텍스트 분석 + backgroundType 감지
            // ──────────────────────────────────────────────
            server.middlewares.use('/api/gemini/analyze', async (req, res) => {
                if (req.method !== 'POST') {
                    safeEnd(res, 405, { error: 'Method not allowed' });
                    return;
                }

                const apiKey = process.env.GEMINI_API_KEY;
                if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
                    safeEnd(res, 500, { error: 'GEMINI_API_KEY is not configured' });
                    return;
                }

                try {
                    const chunks: Buffer[] = [];
                    for await (const chunk of req) {
                        chunks.push(chunk);
                    }
                    const body = JSON.parse(Buffer.concat(chunks).toString());
                    const { base64Image } = body;

                    if (!base64Image) {
                        safeEnd(res, 400, { error: 'base64Image is required' });
                        return;
                    }

                    if (res.writableEnded) {
                        console.warn("[gemini-proxy] Client disconnected before API call");
                        return;
                    }

                    const ai = getAiClient(apiKey);
                    const response = await ai.models.generateContent({
                        model: 'gemini-3-flash-preview',
                        contents: {
                            parts: [
                                {
                                    inlineData: {
                                        mimeType: 'image/png',
                                        data: base64Image.includes(',') ? base64Image.split(',')[1] : base64Image,
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
                            responseMimeType: "application/json",
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
                    });

                    const rawText = response.text ?? "{}";
                    const data = JSON.parse(rawText);
                    const result = {
                        text: data.text || "",
                        fontSize: data.fontSize || 16,
                        fontWeight: data.fontWeight || "normal",
                        fontColor: data.fontColor || "#000000",
                        fontFamily: data.fontFamily || "sans-serif",
                        backgroundColor: data.backgroundColor || "#ffffff",
                        backgroundType: data.backgroundType || "solid",
                        language: data.language || "ko"
                    };

                    safeEnd(res, 200, result);
                } catch (error) {
                    const errMsg = error instanceof Error ? error.message : String(error);
                    console.error("[gemini-proxy] Analyze failed:", errMsg);

                    if (errMsg.includes('401') || errMsg.includes('403') || errMsg.includes('ECONNR')) {
                        cachedAiClient = null;
                        cachedApiKey = null;
                    }

                    safeEnd(res, 500, FALLBACK_RESULT);
                }
            });

            // ──────────────────────────────────────────────
            // 2. Gemini Image Editing — 텍스트 제거 + 배경 복원
            //    (generateContent + gemini-2.5-flash-image 사용)
            // ──────────────────────────────────────────────
            server.middlewares.use('/api/gemini/inpaint', async (req, res) => {
                if (req.method !== 'POST') {
                    safeEnd(res, 405, { error: 'Method not allowed' });
                    return;
                }

                const apiKey = process.env.GEMINI_API_KEY;
                if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
                    safeEnd(res, 500, { error: 'GEMINI_API_KEY is not configured' });
                    return;
                }

                try {
                    const chunks: Buffer[] = [];
                    for await (const chunk of req) {
                        chunks.push(chunk);
                    }
                    const body = JSON.parse(Buffer.concat(chunks).toString());
                    const { base64Image, region, slideSize } = body;

                    if (!base64Image) {
                        safeEnd(res, 400, { error: 'base64Image is required' });
                        return;
                    }

                    if (res.writableEnded) {
                        console.warn("[gemini-proxy] Client disconnected before inpaint call");
                        return;
                    }

                    const ai = getAiClient(apiKey);

                    // Base64 데이터 추출 (data:image/png;base64,... → 순수 Base64)
                    const rawBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

                    // 좌표 정보를 프롬프트에 포함
                    const regionInfo = region && slideSize
                        ? `The image is ${slideSize.width}x${slideSize.height} pixels. Focus on the rectangular region at coordinates (x:${region.x}, y:${region.y}) with size ${region.width}x${region.height} pixels. `
                        : '';

                    console.log('[gemini-proxy] Inpaint request received, image size:', rawBase64.length, 'chars, region:', JSON.stringify(region));

                    // gemini-2.5-flash-image 모델로 텍스트 제거
                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash-image',
                        contents: [
                            {
                                inlineData: {
                                    mimeType: 'image/png',
                                    data: rawBase64
                                }
                            },
                            {
                                text: `${regionInfo}Remove ALL text and letters from this image completely. Fill in the background naturally where the text was, matching the surrounding colors, patterns, and textures seamlessly. The output should look as if there was never any text. Keep the rest of the image completely unchanged. Return ONLY the edited image, no text response.`
                            }
                        ]
                    });

                    // 응답에서 이미지 파트 추출
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
                        console.log('[gemini-proxy] Inpaint success, result size:', resultBase64.length, 'chars');
                        safeEnd(res, 200, { backgroundImage: resultBase64 });
                    } else {
                        console.warn("[gemini-proxy] Inpaint returned no image. Response text:",
                            parts?.map(p => p.text).filter(Boolean).join(' '));
                        safeEnd(res, 200, { backgroundImage: null });
                    }
                } catch (error) {
                    const errMsg = error instanceof Error ? error.message : String(error);
                    console.error("[gemini-proxy] Inpaint failed:", errMsg);

                    if (errMsg.includes('401') || errMsg.includes('403') || errMsg.includes('ECONNR')) {
                        cachedAiClient = null;
                        cachedApiKey = null;
                    }

                    // Inpaint 실패는 치명적이지 않음 — backgroundColor fallback 사용
                    safeEnd(res, 200, { backgroundImage: null });
                }
            });
        }
    };
}
