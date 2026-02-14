/**
 * Google Analytics 4 — 이벤트 트래킹 유틸
 */

declare global {
    interface Window {
        gtag: (...args: any[]) => void;
        dataLayer: any[];
    }
}

const GA_ID = 'G-CNPWFPFEBK';

/** GA4 커스텀 이벤트 발송 */
export function trackEvent(
    eventName: string,
    params?: Record<string, string | number | boolean>
) {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', eventName, params);
    }
}

// ── 사전 정의된 이벤트 ──

/** API Key 입력 완료 */
export const trackApiKeySet = () =>
    trackEvent('api_key_set');

/** 파일 업로드 성공 */
export const trackFileUpload = (fileType: string, pageCount: number) =>
    trackEvent('file_upload', { file_type: fileType, page_count: pageCount });

/** AI 텍스트 분석 (OCR) 실행 */
export const trackOcrAnalysis = () =>
    trackEvent('ocr_analysis');

/** 글자 지우기 (Inpainting) 실행 */
export const trackInpaint = () =>
    trackEvent('inpaint_background');

/** 텍스트 교체 적용 */
export const trackTextReplace = () =>
    trackEvent('text_replace');

/** 이미지 다운로드 */
export const trackDownloadImages = (slideCount: number) =>
    trackEvent('download_images', { slide_count: slideCount });

/** PDF 다운로드 */
export const trackDownloadPdf = (slideCount: number) =>
    trackEvent('download_pdf', { slide_count: slideCount });

/** 언어 변경 */
export const trackLocaleChange = (locale: string) =>
    trackEvent('locale_change', { locale });
