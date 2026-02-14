
import { SlideData } from '../types';
import { renderOverlayToCanvas, preloadBackgroundImages } from '../utils/renderOverlay';

declare const pdfjsLib: any;
declare const jspdf: any;

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

/**
 * PDF → SlideData[] 변환.
 * JPEG DataURL 사용 (품질 0.85) — PNG 대비 약 70~80% 메모리 절감.
 * PDF.js page.cleanup() / pdf.destroy()로 내부 캐시 해제.
 */
export const convertPdfToImages = async (file: File): Promise<SlideData[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const slides: SlideData[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.0 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport }).promise;

    // JPEG DataURL — PNG 대비 메모리 약 70~80% 절감
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    slides.push({
      index: i - 1,
      dataUrl,
      width: viewport.width,
      height: viewport.height,
      overlays: []
    });

    // PDF.js 페이지 내부 캐시 해제
    page.cleanup();

    // 렌더링 완료 후 canvas 리소스 해제
    canvas.width = 0;
    canvas.height = 0;
  }

  // PDF 문서 전체 리소스 해제
  pdf.destroy();

  return slides;
};

/**
 * 슬라이드를 PDF로 내보내기.
/**
 * 슬라이드를 PDF Blob으로 생성.
 * showSaveFilePicker와 함께 사용하기 위해 Blob을 반환.
 */
export const generatePdfBlob = async (slides: SlideData[]): Promise<Blob> => {
  const { jsPDF } = jspdf;
  const doc = new jsPDF({
    orientation: slides[0].width > slides[0].height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [slides[0].width, slides[0].height]
  });

  for (let idx = 0; idx < slides.length; idx++) {
    const slide = slides[idx];
    if (idx > 0) doc.addPage([slide.width, slide.height]);

    const canvas = document.createElement('canvas');
    canvas.width = slide.width;
    canvas.height = slide.height;
    const ctx = canvas.getContext('2d')!;

    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load slide ${idx + 1}`));
      img.src = slide.dataUrl;
    });

    ctx.drawImage(img, 0, 0);
    const bgImageMap = await preloadBackgroundImages(slide.overlays);
    slide.overlays.forEach(overlay => renderOverlayToCanvas(ctx, overlay, bgImageMap));

    const finalDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    doc.addImage(finalDataUrl, 'JPEG', 0, 0, slide.width, slide.height);

    // 리소스 해제
    img.onload = null;
    canvas.width = 0;
    canvas.height = 0;
  }

  return doc.output('blob') as Blob;
};

