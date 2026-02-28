
import React, { useState, useEffect } from 'react';
import { Rect, SlideData, TextOverlay, OCRResult, VerticalAlign, HorizontalAlign } from '../types';
import { analyzeTextInImage, inpaintBackground } from '../services/geminiService';
import { useI18n } from '../hooks/useI18n';
import { trackOcrAnalysis, trackInpaint, trackTextReplace } from '../utils/analytics';
import {
  Loader2,
  Type as TypeIcon,
  Info,
  CheckCircle2,
  Sliders,
  Palette,
  Bold,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd
} from 'lucide-react';

interface SidebarProps {
  activeSlide: SlideData | undefined;
  selection: Rect | null;
  selectedOverlayId: string | null;
  onApplyOverlay: (overlay: TextOverlay) => void;
  onUpdateOverlays: (overlays: TextOverlay[]) => void;
  apiKey: string;
  ocrModels: readonly string[];
  inpaintModels: readonly string[];
  onOcrCost: () => void;
  onInpaintCost: () => void;
  showError: (msg: string) => void;
}

const FONT_GROUPS = [
  {
    label: '한국어 / Korean',
    fonts: [
      { name: 'Noto Sans KR', value: 'Noto Sans KR' },
      { name: 'Noto Serif KR', value: 'Noto Serif KR' },
      { name: 'Pretendard', value: 'Pretendard Variable' },
      { name: 'Gothic A1', value: 'Gothic A1' },
      { name: 'IBM Plex Sans KR', value: 'IBM Plex Sans KR' },
      { name: 'Gaegu (손글씨)', value: 'Gaegu' },
      { name: 'Do Hyeon (타이틀)', value: 'Do Hyeon' },
    ],
  },
  {
    label: '日本語 / Japanese',
    fonts: [
      { name: 'Noto Sans JP', value: 'Noto Sans JP' },
      { name: 'Noto Serif JP', value: 'Noto Serif JP' },
      { name: 'M PLUS Rounded 1c', value: 'M PLUS Rounded 1c' },
    ],
  },
  {
    label: 'Sans-serif',
    fonts: [
      { name: 'Inter', value: 'Inter' },
      { name: 'Roboto', value: 'Roboto' },
      { name: 'Open Sans', value: 'Open Sans' },
      { name: 'Lato', value: 'Lato' },
      { name: 'Poppins', value: 'Poppins' },
      { name: 'Montserrat', value: 'Montserrat' },
      { name: 'Arial', value: 'Arial' },
    ],
  },
  {
    label: 'Serif',
    fonts: [
      { name: 'Playfair Display', value: 'Playfair Display' },
      { name: 'Merriweather', value: 'Merriweather' },
      { name: 'Times New Roman', value: 'serif' },
    ],
  },
  {
    label: 'Monospace',
    fonts: [
      { name: 'Source Code Pro', value: 'Source Code Pro' },
      { name: 'JetBrains Mono', value: 'JetBrains Mono' },
      { name: 'Courier New', value: 'monospace' },
    ],
  },
];

const Sidebar: React.FC<SidebarProps> = ({
  activeSlide,
  selection,
  selectedOverlayId,
  onApplyOverlay,
  onUpdateOverlays,
  apiKey,
  ocrModels,
  inpaintModels,
  onOcrCost,
  onInpaintCost,
  showError
}) => {
  const { t } = useI18n();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeStatus, setAnalyzeStatus] = useState<string>('');
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);

  const [replacementText, setReplacementText] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [fontWeight, setFontWeight] = useState('normal');
  const [fontColor, setFontColor] = useState('#000000');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [vAlign, setVAlign] = useState<VerticalAlign>('top');
  const [hAlign, setHAlign] = useState<HorizontalAlign>('left');
  const [backgroundImage, setBackgroundImage] = useState<string | undefined>(undefined);
  const [isInpainting, setIsInpainting] = useState(false);

  const selectedOverlay = activeSlide?.overlays.find(o => o.id === selectedOverlayId);

  useEffect(() => {
    if (!selection && !selectedOverlayId) {
      setOcrResult(null);
      setReplacementText('');
      setBackgroundImage(undefined);
    }
  }, [selection, selectedOverlayId]);

  useEffect(() => {
    if (selectedOverlay) {
      setReplacementText(selectedOverlay.newText);
      setFontSize(selectedOverlay.fontSize);
      setFontWeight(selectedOverlay.fontWeight);
      setFontColor(selectedOverlay.fontColor);
      setFontFamily(selectedOverlay.fontFamily);
      setVAlign(selectedOverlay.vAlign || 'top');
      setHAlign(selectedOverlay.hAlign || 'left');
    }
  }, [selectedOverlayId]);

  const handleAnalyze = async () => {
    if (!selection || !activeSlide) return;
    setIsAnalyzing(true);
    setAnalyzeStatus(t('sidebar.extracting'));
    try {
      const canvas = document.createElement('canvas');
      canvas.width = selection.width;
      canvas.height = selection.height;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = activeSlide.dataUrl;
      await new Promise(resolve => img.onload = resolve);
      ctx?.drawImage(img, selection.x, selection.y, selection.width, selection.height, 0, 0, selection.width, selection.height);
      const cropDataUrl = canvas.toDataURL('image/png');

      // 리소스 해제
      img.onload = null;
      canvas.width = 0;
      canvas.height = 0;

      const result = await analyzeTextInImage(apiKey, cropDataUrl, ocrModels);
      onOcrCost();
      trackOcrAnalysis();

      setOcrResult(result);
      setReplacementText(result.text);
      setFontSize(result.fontSize);
      setFontWeight(result.fontWeight);
      setFontColor(result.fontColor);
      setFontFamily(result.fontFamily);
      setVAlign('middle');
      setHAlign('center');
      setBackgroundImage(undefined);

      // 배경이 복잡한 경우 자동으로 inpainting 실행 (전체 슬라이드 전송)
      console.log('[Sidebar] backgroundType:', result.backgroundType);
      if (result.backgroundType === 'complex' || result.backgroundType === 'gradient') {
        console.log('[Sidebar] Starting inpainting with full slide...');
        setAnalyzeStatus(t('sidebar.restoringBg'));
        setIsInpainting(true);

        // 전체 슬라이드 이미지의 실제 크기 측정
        const slideImg = new Image();
        slideImg.src = activeSlide.dataUrl;
        await new Promise(resolve => slideImg.onload = resolve);
        const slideSize = { width: slideImg.naturalWidth, height: slideImg.naturalHeight };

        const fullResult = await inpaintBackground(
          apiKey,
          activeSlide.dataUrl,
          { x: selection.x, y: selection.y, width: selection.width, height: selection.height },
          slideSize,
          inpaintModels
        );
        onInpaintCost();
        trackInpaint();

        if (fullResult) {
          setAnalyzeStatus(t('sidebar.postProcessing'));

          // 반환된 전체 이미지에서 선택 영역만 crop
          const resultImg = new Image();
          resultImg.src = fullResult;
          await new Promise(resolve => resultImg.onload = resolve);

          const cropCanvas = document.createElement('canvas');
          cropCanvas.width = selection.width;
          cropCanvas.height = selection.height;
          const cropCtx = cropCanvas.getContext('2d')!;

          // 반환 이미지 크기 → 원본 슬라이드 크기 비율 계산
          const scaleX = resultImg.naturalWidth / slideSize.width;
          const scaleY = resultImg.naturalHeight / slideSize.height;

          cropCtx.drawImage(
            resultImg,
            selection.x * scaleX, selection.y * scaleY,
            selection.width * scaleX, selection.height * scaleY,
            0, 0, selection.width, selection.height
          );

          // ── 경계 feathering (8px 알파 그라데이션) ──
          const FEATHER = 8;
          const w = selection.width;
          const h = selection.height;
          cropCtx.globalCompositeOperation = 'destination-in';

          // 가로(좌→우) 페이드
          const hGrad = cropCtx.createLinearGradient(0, 0, w, 0);
          hGrad.addColorStop(0, 'rgba(0,0,0,0)');
          hGrad.addColorStop(FEATHER / w, 'rgba(0,0,0,1)');
          hGrad.addColorStop(1 - FEATHER / w, 'rgba(0,0,0,1)');
          hGrad.addColorStop(1, 'rgba(0,0,0,0)');
          cropCtx.fillStyle = hGrad;
          cropCtx.fillRect(0, 0, w, h);

          // 세로(위→아래) 페이드
          const vGrad = cropCtx.createLinearGradient(0, 0, 0, h);
          vGrad.addColorStop(0, 'rgba(0,0,0,0)');
          vGrad.addColorStop(FEATHER / h, 'rgba(0,0,0,1)');
          vGrad.addColorStop(1 - FEATHER / h, 'rgba(0,0,0,1)');
          vGrad.addColorStop(1, 'rgba(0,0,0,0)');
          cropCtx.fillStyle = vGrad;
          cropCtx.fillRect(0, 0, w, h);

          cropCtx.globalCompositeOperation = 'source-over';
          // ── feathering 끝 ──

          const croppedBg = cropCanvas.toDataURL('image/png');
          console.log('[Sidebar] Inpaint result: success, cropped + feathered');
          setBackgroundImage(croppedBg);

          // 리소스 해제
          cropCanvas.width = 0;
          cropCanvas.height = 0;
        } else {
          console.log('[Sidebar] Inpaint result: null/failed');
        }
        setIsInpainting(false);
      } else {
        console.log('[Sidebar] Solid background, skipping inpainting');
      }
    } catch (err) {
      console.error('OCR analysis failed');
      showError(t('alert.analysisError'));
    } finally {
      setIsAnalyzing(false);
      setIsInpainting(false);
      setAnalyzeStatus('');
    }
  };

  const updateSelectedOverlay = (updates: Partial<TextOverlay>) => {
    if (!selectedOverlayId || !activeSlide) return;
    const newOverlays = activeSlide.overlays.map(ov =>
      ov.id === selectedOverlayId ? { ...ov, ...updates } : ov
    );
    onUpdateOverlays(newOverlays);
  };

  const handleApply = () => {
    if (!selection || !ocrResult) return;
    onApplyOverlay({
      id: crypto.randomUUID(),
      rect: { ...selection },
      originalText: ocrResult.text,
      newText: replacementText,
      fontSize,
      fontWeight,
      fontColor,
      fontFamily,
      backgroundColor: ocrResult.backgroundColor,
      backgroundImage,
      vAlign,
      hAlign
    });
    trackTextReplace();
  };

  const isEditing = !!selectedOverlayId;

  return (
    <div className="w-80 h-full bg-[#1e293b] border-l border-slate-700 flex flex-col p-6 overflow-y-auto">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <TypeIcon size={16} className="text-blue-400" />
          {isEditing ? t('sidebar.editText') : t('sidebar.replaceText')}
        </h2>
      </div>

      {!selection && !isEditing ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400">
          <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center mb-4 border border-slate-700">
            <Info size={32} className="opacity-50" />
          </div>
          <p className="text-sm">{t('sidebar.placeholder').split('\n').map((line, i, arr) => (
            <React.Fragment key={i}>{line}{i < arr.length - 1 && <br />}</React.Fragment>
          ))}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {!isEditing && (
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">{t('sidebar.aiAnalysis')}</h3>
              {isAnalyzing ? (
                <div className="flex items-center gap-3 py-4 text-blue-400">
                  <Loader2 className="animate-spin" size={18} />
                  <span className="text-sm">{analyzeStatus || t('sidebar.analyzing')}</span>
                </div>
              ) : ocrResult ? (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-900 rounded text-sm text-slate-300 italic border border-slate-800">"{ocrResult.text}"</div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">{t('sidebar.background')}</span>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${ocrResult.backgroundType === 'complex' ? 'bg-orange-500/20 text-orange-300' :
                      ocrResult.backgroundType === 'gradient' ? 'bg-purple-500/20 text-purple-300' :
                        'bg-green-500/20 text-green-300'
                      }`}>
                      {ocrResult.backgroundType === 'complex' ? t('sidebar.bgComplex') :
                        ocrResult.backgroundType === 'gradient' ? t('sidebar.bgGradient') :
                          t('sidebar.bgSolid')}
                    </span>
                    {isInpainting && (
                      <span className="flex items-center gap-1 text-blue-400">
                        <Loader2 className="animate-spin" size={12} />
                        {t('sidebar.bgRestoring')}
                      </span>
                    )}
                    {backgroundImage && (
                      <span className="text-green-400">{t('sidebar.bgRestored')}</span>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleAnalyze}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles size={14} className="text-blue-400" /> {t('sidebar.runOcr')}
                </button>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('sidebar.content')}</label>
              <textarea
                value={replacementText}
                onChange={(e) => {
                  setReplacementText(e.target.value);
                  if (isEditing) updateSelectedOverlay({ newText: e.target.value });
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm h-24 resize-none focus:outline-none focus:border-blue-500 text-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('sidebar.hAlign')}</label>
                <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                  <button onClick={() => { setHAlign('left'); if (isEditing) updateSelectedOverlay({ hAlign: 'left' }); }} className={`flex-1 p-1.5 rounded flex justify-center ${hAlign === 'left' ? 'bg-slate-700 text-blue-400' : 'text-slate-500'}`}><AlignLeft size={16} /></button>
                  <button onClick={() => { setHAlign('center'); if (isEditing) updateSelectedOverlay({ hAlign: 'center' }); }} className={`flex-1 p-1.5 rounded flex justify-center ${hAlign === 'center' ? 'bg-slate-700 text-blue-400' : 'text-slate-500'}`}><AlignCenter size={16} /></button>
                  <button onClick={() => { setHAlign('right'); if (isEditing) updateSelectedOverlay({ hAlign: 'right' }); }} className={`flex-1 p-1.5 rounded flex justify-center ${hAlign === 'right' ? 'bg-slate-700 text-blue-400' : 'text-slate-500'}`}><AlignRight size={16} /></button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('sidebar.vAlign')}</label>
                <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                  <button onClick={() => { setVAlign('top'); if (isEditing) updateSelectedOverlay({ vAlign: 'top' }); }} className={`flex-1 p-1.5 rounded flex justify-center ${vAlign === 'top' ? 'bg-slate-700 text-blue-400' : 'text-slate-500'}`} title={t('sidebar.vAlignTop')}><AlignVerticalJustifyStart size={16} /></button>
                  <button onClick={() => { setVAlign('middle'); if (isEditing) updateSelectedOverlay({ vAlign: 'middle' }); }} className={`flex-1 p-1.5 rounded flex justify-center ${vAlign === 'middle' ? 'bg-slate-700 text-blue-400' : 'text-slate-500'}`} title={t('sidebar.vAlignMiddle')}><AlignVerticalJustifyCenter size={16} /></button>
                  <button onClick={() => { setVAlign('bottom'); if (isEditing) updateSelectedOverlay({ vAlign: 'bottom' }); }} className={`flex-1 p-1.5 rounded flex justify-center ${vAlign === 'bottom' ? 'bg-slate-700 text-blue-400' : 'text-slate-500'}`} title={t('sidebar.vAlignBottom')}><AlignVerticalJustifyEnd size={16} /></button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('sidebar.font')}</label>
              <select
                value={fontFamily}
                onChange={(e) => {
                  setFontFamily(e.target.value);
                  if (isEditing) updateSelectedOverlay({ fontFamily: e.target.value });
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {FONT_GROUPS.map(group => (
                  <optgroup key={group.label} label={group.label}>
                    {group.fonts.map(f => <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.name}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('sidebar.size')}</label>
                <input
                  type="number"
                  value={fontSize}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (isNaN(val) || val <= 0) return;
                    setFontSize(val);
                    if (isEditing) updateSelectedOverlay({ fontSize: val });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('sidebar.color')}</label>
                <div className="flex gap-2 items-center bg-slate-900 border border-slate-700 rounded-lg px-2 py-1">
                  <input
                    type="color"
                    value={fontColor}
                    onChange={(e) => {
                      setFontColor(e.target.value);
                      if (isEditing) updateSelectedOverlay({ fontColor: e.target.value });
                    }}
                    className="w-8 h-8 bg-transparent cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-slate-400 uppercase">{fontColor}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('sidebar.weight')}</label>
              <div className="flex p-1 bg-slate-900 rounded-lg border border-slate-800">
                <button
                  onClick={() => { setFontWeight('normal'); if (isEditing) updateSelectedOverlay({ fontWeight: 'normal' }); }}
                  className={`flex-1 py-1.5 text-xs rounded transition-all ${fontWeight === 'normal' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}
                >
                  Normal
                </button>
                <button
                  onClick={() => { setFontWeight('bold'); if (isEditing) updateSelectedOverlay({ fontWeight: 'bold' }); }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${fontWeight === 'bold' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}
                >
                  Bold
                </button>
              </div>
            </div>

            {!isEditing && (
              <button
                onClick={handleApply}
                disabled={!ocrResult}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 mt-2 shadow-lg active:scale-95 transition-all"
              >
                <CheckCircle2 size={18} /> {t('sidebar.apply')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
