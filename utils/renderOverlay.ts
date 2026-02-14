
import { TextOverlay } from '../types';

/**
 * backgroundImage용 Image 객체를 미리 로드합니다.
 * overlay 렌더링 전에 호출하여 캐시된 Image Map을 전달합니다.
 */
export const preloadBackgroundImages = async (
  overlays: TextOverlay[]
): Promise<Map<string, HTMLImageElement>> => {
  const imageMap = new Map<string, HTMLImageElement>();

  for (const overlay of overlays) {
    if (overlay.backgroundImage && !imageMap.has(overlay.id)) {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => {
          console.warn(`Failed to load background image for overlay ${overlay.id}`);
          resolve(); // 실패해도 진행 (fallback으로 처리)
        };
        img.src = overlay.backgroundImage!;
      });
      imageMap.set(overlay.id, img);
    }
  }

  return imageMap;
};

/**
 * Canvas 2D 컨텍스트에 TextOverlay를 렌더링하는 공용 유틸 함수.
 * App.tsx (이미지 다운로드), EditorCanvas.tsx (실시간 프리뷰), pdfService.ts (PDF 내보내기)
 * 3곳에서 동일한 로직을 사용합니다.
 * 
 * @param bgImageMap - preloadBackgroundImages()로 미리 로드한 이미지 맵 (optional)
 */
export const renderOverlayToCanvas = (
  ctx: CanvasRenderingContext2D,
  overlay: TextOverlay,
  bgImageMap?: Map<string, HTMLImageElement>
): void => {
  const { rect } = overlay;

  // 1. 배경 렌더링: backgroundImage가 있으면 이미지, 없으면 단색
  const bgImg = bgImageMap?.get(overlay.id);
  if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
    ctx.drawImage(bgImg, rect.x, rect.y, rect.width, rect.height);
  } else {
    ctx.fillStyle = overlay.backgroundColor;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  }

  // 2. 폰트 설정
  ctx.fillStyle = overlay.fontColor;
  ctx.font = `${overlay.fontWeight} ${overlay.fontSize}px ${overlay.fontFamily}, sans-serif`;

  // 3. 줄바꿈 처리
  const lines = overlay.newText.split('\n');
  const lineHeight = overlay.fontSize * 1.2;
  const totalTextHeight = lines.length * lineHeight;

  // 4. 수평 정렬
  ctx.textAlign = (overlay.hAlign || 'left') as CanvasTextAlign;
  ctx.textBaseline = 'top';

  let tx = rect.x;
  if (overlay.hAlign === 'center') tx = rect.x + rect.width / 2;
  else if (overlay.hAlign === 'right') tx = rect.x + rect.width;

  // 5. 수직 정렬
  let ty = rect.y;
  if (overlay.vAlign === 'middle') ty = rect.y + (rect.height - totalTextHeight) / 2;
  else if (overlay.vAlign === 'bottom') ty = rect.y + rect.height - totalTextHeight;

  // 6. 텍스트 그리기
  lines.forEach((line, index) => {
    ctx.fillText(line, tx, ty + index * lineHeight);
  });
};
