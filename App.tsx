
import React, { useState, useRef, useEffect } from 'react';
import { SlideData, Rect, TextOverlay } from './types';
import { convertPdfToImages, generatePdfBlob } from './services/pdfService';
import { renderOverlayToCanvas, preloadBackgroundImages } from './utils/renderOverlay';
import EditorCanvas from './components/EditorCanvas';
import Sidebar from './components/Sidebar';
import { ToastContainer } from './components/ToastContainer';
import { useI18n } from './hooks/useI18n';
import { useUndoHistory } from './hooks/useUndoHistory';
import { useApiKey } from './hooks/useApiKey';
import { useApiCost } from './hooks/useApiCost';
import { useToast } from './hooks/useToast';
import { trackApiKeySet, trackFileUpload, trackDownloadImages, trackDownloadPdf, trackLocaleChange } from './utils/analytics';
import { Locale } from './constants/i18n';
import {
  FileUp,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  Trash2,
  History,
  Image as ImageIcon,
  Globe,
  AlertTriangle,
  WandSparkles,
  Redo2,
  Key,
  Eye,
  EyeOff,
  DollarSign,
  ExternalLink
} from 'lucide-react';

const LOCALE_LABELS: Record<Locale, string> = { ko: '한국어', ja: '日本語', en: 'English' };

const App: React.FC = () => {
  const { t, locale, setLocale } = useI18n();
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [selection, setSelection] = useState<Rect | null>(null);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'drop'; file: File } | { type: 'upload' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { pushState, undo, redo, resetAll, canUndo, canRedo } = useUndoHistory();
  const { apiKey, setApiKey, clearApiKey, isKeySet } = useApiKey();
  const apiCost = useApiCost();
  const [showKey, setShowKey] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [, forceRender] = useState(0);
  const { toasts, removeToast, showError, showWarning } = useToast();

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif'];



  /**
   * 파일 처리 공통 로직 (업로드 + 드롭 공용)
   */
  const processFile = async (file: File) => {
    // S3: 파일 크기 제한
    if (file.size > MAX_FILE_SIZE) {
      showWarning(t('alert.fileTooLarge'));
      return;
    }

    // S3: MIME 타입 화이트리스트
    if (!ALLOWED_TYPES.includes(file.type)) {
      showWarning(t('alert.unsupportedType'));
      return;
    }

    // 기존 파일이 있으면 커스텀 모달로 확인
    if (slides.length > 0) {
      setPendingAction({ type: 'drop', file });
      return;
    }

    await loadFile(file);
  };

  /** 실제 파일 로딩 (검증 후 호출) */
  const loadFile = async (file: File) => {
    setIsProcessing(true);

    try {
      if (file.type === 'application/pdf') {
        const converted = await convertPdfToImages(file);
        setSlides(converted);
      } else if (file.type.startsWith('image/')) {
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        const img = new Image();
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.src = dataUrl;
        });
        setSlides([{
          index: 0,
          dataUrl,
          width: img.width,
          height: img.height,
          overlays: []
        }]);
      }
      setActiveSlideIdx(0);
      setSelectedOverlayId(null);
      resetAll();
      // GA4: 파일 업로드 이벤트
      const pageCount = file.type === 'application/pdf' ? slides.length : 1;
      trackFileUpload(file.type, pageCount);
    } catch (err) {
      console.error('File upload failed');
      showError(t('alert.uploadError'));
    } finally {
      setIsProcessing(false);
    }
  };

  /** 덮어쓰기 확인 */
  const confirmOverwrite = async () => {
    const action = pendingAction;
    setPendingAction(null);
    if (!action) return;
    if (action.type === 'drop') {
      await loadFile(action.file);
    } else {
      // upload 모드: 파일 선택 다이얼로그 열기
      fileInputRef.current?.click();
    }
  };

  /** 덮어쓰기 취소 */
  const cancelOverwrite = () => {
    setPendingAction(null);
  };

  /** 업로드 버튼 클릭 핸들러 */
  const handleUploadClick = () => {
    if (slides.length > 0) {
      setPendingAction({ type: 'upload' });
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
    // input 초기화 (같은 파일 재선택 가능)
    e.target.value = '';
  };

  // ── 드래그 앤 드롭 핸들러 ──
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // relatedTarget이 main 영역 밖일 때만 off
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleApplyOverlay = (overlay: TextOverlay) => {
    const currentSlide = slides[activeSlideIdx];
    if (currentSlide) pushState(activeSlideIdx, currentSlide.overlays);
    setSlides(prev => prev.map((s, idx) => idx === activeSlideIdx ? { ...s, overlays: [...s.overlays, overlay] } : s));
    setSelection(null);
    setSelectedOverlayId(overlay.id);
    forceRender(n => n + 1);
  };

  const handleUpdateOverlays = (overlays: TextOverlay[]) => {
    const currentSlide = slides[activeSlideIdx];
    if (currentSlide) pushState(activeSlideIdx, currentSlide.overlays);
    setSlides(prev => prev.map((s, idx) => idx === activeSlideIdx ? { ...s, overlays } : s));
    forceRender(n => n + 1);
  };

  const handleUndo = () => {
    const currentSlide = slides[activeSlideIdx];
    if (!currentSlide) return;
    const restored = undo(activeSlideIdx, currentSlide.overlays);
    if (restored === null) return;
    setSlides(prev => prev.map((s, idx) => idx === activeSlideIdx ? { ...s, overlays: restored } : s));
    setSelectedOverlayId(null);
    forceRender(n => n + 1);
  };

  const handleRedo = () => {
    const currentSlide = slides[activeSlideIdx];
    if (!currentSlide) return;
    const restored = redo(activeSlideIdx, currentSlide.overlays);
    if (restored === null) return;
    setSlides(prev => prev.map((s, idx) => idx === activeSlideIdx ? { ...s, overlays: restored } : s));
    setSelectedOverlayId(null);
    forceRender(n => n + 1);
  };

  const handleClearAll = () => {
    const currentSlide = slides[activeSlideIdx];
    if (!currentSlide || currentSlide.overlays.length === 0) return;
    pushState(activeSlideIdx, currentSlide.overlays);
    setSlides(prev => prev.map((s, idx) => idx === activeSlideIdx ? { ...s, overlays: [] } : s));
    setSelectedOverlayId(null);
    forceRender(n => n + 1);
  };

  // ── 키보드 단축키: Cmd+Z / Cmd+Shift+Z ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return;
      // 입력 중이면 무시
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      e.preventDefault();
      if (e.shiftKey) {
        handleRedo();
      } else {
        handleUndo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [slides, activeSlideIdx]);

  /**
   * 이미지 다운로드 — 모든 슬라이드를 ZIP으로 묶어 다운로드
   * Chrome blob URL download 버그 대응: showSaveFilePicker를 유저 클릭 즉시 호출
   */
  const handleDownloadImages = async () => {
    try {
      // 1. 유저 클릭 즉시 파일 핸들 확보 (user activation 유지)
      let fileHandle: any = null;
      if ('showSaveFilePicker' in window) {
        fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: 'edited_slides.zip',
          types: [{ description: 'ZIP Archive', accept: { 'application/zip': ['.zip'] } }],
        });
      }

      // 2. 비동기 처리: 슬라이드 → ZIP
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const canvas = document.createElement('canvas');
        canvas.width = slide.width;
        canvas.height = slide.height;
        const ctx = canvas.getContext('2d')!;

        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`Failed to load slide ${i + 1} `));
          img.src = slide.dataUrl;
        });

        ctx.drawImage(img, 0, 0);
        const bgImageMap = await preloadBackgroundImages(slide.overlays);
        slide.overlays.forEach(ov => renderOverlayToCanvas(ctx, ov, bgImageMap));

        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b!), 'image/png');
        });
        zip.file(`slide_${String(i + 1).padStart(2, '0')}.png`, blob);

        img.onload = null;
        canvas.width = 0;
        canvas.height = 0;
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // 3. 파일 저장
      if (fileHandle) {
        const writable = await fileHandle.createWritable();
        await writable.write(zipBlob);
        await writable.close();
      } else {
        // 폴백: 레거시 방식
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'edited_slides.zip';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(url); }, 60000);
      }
      trackDownloadImages(slides.length);
    } catch (err: any) {
      if (err.name === 'AbortError') return; // 유저가 저장 다이얼로그 취소
      console.error('Image download failed:', err);
      showError(t('alert.imageDownloadError') + ' ' + err.message);
    }
  };

  /**
   * PDF 다운로드 — showSaveFilePicker 우선 사용
   */
  const handleDownloadPdf = async () => {
    if (slides.length === 0) return;
    try {
      // 1. 유저 클릭 즉시 파일 핸들 확보
      let fileHandle: any = null;
      if ('showSaveFilePicker' in window) {
        fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: 'edited_slides.pdf',
          types: [{ description: 'PDF Document', accept: { 'application/pdf': ['.pdf'] } }],
        });
      }

      // 2. PDF 생성 (blob으로 받기)
      const pdfBlob = await generatePdfBlob(slides);

      // 3. 파일 저장
      if (fileHandle) {
        const writable = await fileHandle.createWritable();
        await writable.write(pdfBlob);
        await writable.close();
      } else {
        // 폴백: 레거시 방식
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'edited_slides.pdf';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(url); }, 60000);
      }
      trackDownloadPdf(slides.length);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('PDF download failed:', err);
      showError(t('alert.pdfDownloadError') + ' ' + err.message);
    }
  };

  // ── API Key 미설정 시 입력 화면 ──
  if (!isKeySet) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0f172a] text-slate-100 font-sans items-center py-16 overflow-y-auto relative">
        {/* Language switcher */}
        <div className="absolute top-6 right-6">
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 border border-slate-700 transition-all">
              <Globe size={16} />
              <span>{LOCALE_LABELS[locale]}</span>
            </button>
            <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[120px]">
              {(['ko', 'ja', 'en'] as Locale[]).map(l => (
                <button
                  key={l}
                  onClick={() => setLocale(l)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700 first:rounded-t-lg last:rounded-b-lg transition-colors ${locale === l ? 'text-blue-400 font-bold' : 'text-slate-300'
                    }`}
                >
                  {LOCALE_LABELS[l]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-md w-full mx-4">
          <div className="text-center mb-10">
            <div className="inline-flex p-4 bg-blue-600/20 rounded-2xl mb-6">
              <WandSparkles size={48} className="text-blue-400" />
            </div>
            <h1 className="text-3xl font-black tracking-tight mb-2">{t('header.title')}</h1>
            <p className="text-slate-400 text-sm">{t('apikey.description')}</p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t('apikey.title')}</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={keyInput}
                  onChange={e => setKeyInput(e.target.value)}
                  placeholder={t('apikey.placeholder')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 pr-12 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              onClick={() => { if (keyInput.trim()) { setApiKey(keyInput.trim()); trackApiKeySet(); } }}
              disabled={!keyInput.trim()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Key size={18} />
              {t('apikey.start')}
            </button>

            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              {t('apikey.getKey')}
              <ExternalLink size={14} />
            </a>
          </div>

          {/* 개인정보 보호 안내 */}
          <div className="mt-8 space-y-3 text-xs text-slate-500">
            <p>{t('apikey.privacy1')}</p>
            <p>{t('apikey.privacy2')}</p>
            <p>{t('apikey.privacy3')}</p>
          </div>

          {/* 오픈소스 배지 */}
          <div className="mt-6 text-center">
            <a
              href="https://github.com/hsu3046/notebooklm-slide-editor"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-400 transition-colors"
            >
              {t('apikey.opensource')}
            </a>
          </div>

          {/* API 비용 안내 */}
          <div className="mt-8 mb-4 bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <DollarSign size={14} />
              {t('cost.estimated')}
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/50 rounded-lg p-3">
                <p className="text-slate-300 font-medium mb-1">{t('cost.ocr')}</p>
                <p className="text-slate-500">{t('cost.perOcr')}</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3">
                <p className="text-slate-300 font-medium mb-1">{t('cost.inpaint')}</p>
                <p className="text-slate-500">{t('cost.perInpaint')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0f172a] text-slate-100 font-sans">
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-[#1e293b] shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2 rounded-lg"><WandSparkles size={20} /></div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{t('header.title')}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input ref={fileInputRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleFileUpload} />
          <button onClick={handleUploadClick} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg cursor-pointer transition-colors text-sm font-medium border border-slate-600">
            <FileUp size={18} /><span>{t('header.upload')}</span>
          </button>
          <div className="w-px h-6 bg-slate-700 mx-2"></div>
          <button onClick={handleDownloadImages} disabled={slides.length === 0} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg text-sm border border-slate-700 transition-all">
            <Download size={18} /><span>{t('header.saveImages')}</span>
          </button>
          <button onClick={handleDownloadPdf} disabled={slides.length === 0} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold shadow-lg border border-blue-500/50">
            <FileText size={18} /><span>{t('header.downloadPdf')}</span>
          </button>
          <div className="w-px h-6 bg-slate-700 mx-2"></div>
          {/* 세션 비용 표시 */}
          {apiCost.totalCost > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 rounded-lg text-xs text-slate-400 border border-slate-700">
              <DollarSign size={14} className="text-green-400" />
              <span>~${apiCost.totalCost.toFixed(4)}</span>
              <span className="text-slate-600">({apiCost.ocrCount + apiCost.inpaintCount})</span>
            </div>
          )}
          {/* API Key 변경 */}
          <button
            onClick={clearApiKey}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-slate-400 border border-slate-700 transition-all"
            title={t('apikey.change')}
          >
            <Key size={14} />
          </button>
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 border border-slate-700 transition-all">
              <Globe size={16} />
              <span>{LOCALE_LABELS[locale]}</span>
            </button>
            <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[120px]">
              {(['ko', 'ja', 'en'] as Locale[]).map(l => (
                <button
                  key={l}
                  onClick={() => setLocale(l)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700 first:rounded-t-lg last:rounded-b-lg transition-colors ${locale === l ? 'text-blue-400 font-bold' : 'text-slate-300'
                    }`}
                >
                  {LOCALE_LABELS[l]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>
      <main
        className="flex flex-1 overflow-hidden relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* 드래그 오버레이 */}
        {isDragging && (
          <div className="absolute inset-0 z-50 bg-blue-600/20 backdrop-blur-sm border-4 border-dashed border-blue-400 rounded-2xl flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <FileUp size={64} className="mx-auto mb-4 text-blue-400 animate-bounce" />
              <p className="text-2xl font-black text-blue-300">{t('empty.dropzone')}</p>
            </div>
          </div>
        )}
        <aside className="w-20 border-r border-slate-800 bg-[#1e293b] flex flex-col items-center py-6 gap-4 shrink-0">
          <button onClick={handleUndo} disabled={!canUndo(activeSlideIdx)} className="p-3 rounded-xl hover:bg-slate-700 text-slate-400 disabled:opacity-20 disabled:hover:bg-transparent transition-opacity" title={t('toolbar.undo')}><History size={24} /></button>
          <button onClick={handleRedo} disabled={!canRedo(activeSlideIdx)} className="p-3 rounded-xl hover:bg-slate-700 text-slate-400 disabled:opacity-20 disabled:hover:bg-transparent transition-opacity" title={t('toolbar.redo')}><Redo2 size={24} /></button>
          <div className="w-8 h-px bg-slate-700 my-1"></div>
          <button onClick={handleClearAll} disabled={!slides[activeSlideIdx]?.overlays?.length} className="p-3 rounded-xl hover:bg-red-900/20 hover:text-red-400 text-slate-400 disabled:opacity-20 disabled:hover:bg-transparent transition-opacity" title={t('toolbar.clearAll')}><Trash2 size={24} /></button>
        </aside>
        <div className="flex-1 flex flex-col bg-slate-950 relative">
          {isProcessing ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 font-medium">{t('processing')}</p>
            </div>
          ) : slides.length > 0 ? (
            <>
              <EditorCanvas
                slide={slides[activeSlideIdx]}
                selectedOverlayId={selectedOverlayId}
                onSelectionChange={(rect) => { setSelection(rect); if (rect) setSelectedOverlayId(null); }}
                onOverlaySelect={setSelectedOverlayId}
                onUpdateOverlays={handleUpdateOverlays}
              />
              <div className="h-12 bg-[#1e293b] border-t border-slate-800 flex items-center justify-center gap-8 shrink-0">
                <button disabled={activeSlideIdx === 0} onClick={() => setActiveSlideIdx(prev => prev - 1)} className="p-1 hover:bg-slate-700 rounded-full disabled:opacity-20"><ChevronLeft /></button>
                <span className="text-sm font-black text-white">{activeSlideIdx + 1} / {slides.length}</span>
                <button disabled={activeSlideIdx === slides.length - 1} onClick={() => setActiveSlideIdx(prev => prev + 1)} className="p-1 hover:bg-slate-700 rounded-full disabled:opacity-20"><ChevronRight /></button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
              <div className="w-40 h-40 mb-10 bg-slate-900 rounded-[2.5rem] flex items-center justify-center border-2 border-dashed border-slate-800"><ImageIcon size={64} className="opacity-10" /></div>
              <h3 className="text-2xl font-black text-slate-200 mb-3 tracking-tight">{t('empty.title')}</h3>
              <p className="text-slate-500 max-w-xs mx-auto text-sm leading-relaxed mb-10">{t('empty.description')}</p>
              <label className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black cursor-pointer shadow-2xl">
                {t('empty.selectFile')}
                <input type="file" accept=".pdf,image/*" className="hidden" onChange={handleFileUpload} />
              </label>
              <p className="text-slate-600 text-xs mt-6">{t('empty.dropHint')}</p>
            </div>
          )}
        </div>
        <Sidebar
          activeSlide={slides[activeSlideIdx]}
          selection={selection}
          selectedOverlayId={selectedOverlayId}
          onApplyOverlay={handleApplyOverlay}
          onUpdateOverlays={handleUpdateOverlays}
          apiKey={apiKey}
          onOcrCost={apiCost.addOcrCost}
          onInpaintCost={apiCost.addInpaintCost}
          showError={showError}
        />
      </main>

      {/* 덮어쓰기 확인 모달 */}
      {pendingAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl animate-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <AlertTriangle size={24} className="text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">{t('alert.confirmOverwrite').split('\n')[0]}</h3>
            </div>
            <p className="text-sm text-slate-400 mb-6">{t('alert.confirmOverwrite').split('\n')[1]?.replace(/[()（）]/g, '') || ''}</p>
            <div className="flex gap-3">
              <button
                onClick={cancelOverwrite}
                className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-colors"
              >
                {locale === 'ko' ? '취소' : locale === 'ja' ? 'キャンセル' : 'Cancel'}
              </button>
              <button
                onClick={confirmOverwrite}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-colors"
              >
                {locale === 'ko' ? '교체하기' : locale === 'ja' ? '置き換える' : 'Replace'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default App;
