
import React, { useState, useEffect } from 'react';
import { SlideData, Rect, TextOverlay } from './types';
import { convertPdfToImages, generatePdfBlob } from './services/pdfService';
import { renderOverlayToCanvas, preloadBackgroundImages } from './utils/renderOverlay';
import EditorCanvas from './components/EditorCanvas';
import Sidebar from './components/Sidebar';
import {
  FileUp,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  Trash2,
  History,
  Image as ImageIcon
} from 'lucide-react';

const App: React.FC = () => {
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [selection, setSelection] = useState<Rect | null>(null);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif'];



  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // S3: 파일 크기 제한
    if (file.size > MAX_FILE_SIZE) {
      alert(`파일 크기가 너무 큽니다 (${(file.size / 1024 / 1024).toFixed(1)}MB). 최대 50MB까지 지원됩니다.`);
      return;
    }

    // S3: MIME 타입 화이트리스트
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('지원하지 않는 파일 형식입니다. PDF 또는 이미지 파일(PNG, JPEG, WebP)을 업로드해주세요.');
      return;
    }

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
    } catch (err) {
      // S5: 사용자 친화적 에러 메시지 (스택 트레이스 비노출)
      console.error('File upload failed');
      alert('파일 변환 중 오류가 발생했습니다. 다른 파일로 다시 시도해주세요.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyOverlay = (overlay: TextOverlay) => {
    setSlides(prev => prev.map((s, idx) => idx === activeSlideIdx ? { ...s, overlays: [...s.overlays, overlay] } : s));
    setSelection(null);
    setSelectedOverlayId(overlay.id);
  };

  const handleUpdateOverlays = (overlays: TextOverlay[]) => {
    setSlides(prev => prev.map((s, idx) => idx === activeSlideIdx ? { ...s, overlays } : s));
  };

  const handleUndo = () => {
    setSlides(prev => prev.map((s, idx) => {
      if (idx === activeSlideIdx && s.overlays.length > 0) {
        const newOverlays = [...s.overlays];
        newOverlays.pop();
        return { ...s, overlays: newOverlays };
      }
      return s;
    }));
    setSelectedOverlayId(null);
  };

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
          img.onerror = () => reject(new Error(`Failed to load slide ${i + 1}`));
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
    } catch (err: any) {
      if (err.name === 'AbortError') return; // 유저가 저장 다이얼로그 취소
      console.error('Image download failed:', err);
      alert('이미지 다운로드 중 오류가 발생했습니다: ' + err.message);
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
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('PDF download failed:', err);
      alert('PDF 다운로드 중 오류가 발생했습니다: ' + err.message);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0f172a] text-slate-100 font-sans">
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-[#1e293b] shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2 rounded-lg"><FileText size={20} /></div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Slide Editor</h1>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black">AI Power</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg cursor-pointer transition-colors text-sm font-medium border border-slate-600">
            <FileUp size={18} /><span>파일 업로드</span>
            <input type="file" accept=".pdf,image/*" className="hidden" onChange={handleFileUpload} />
          </label>
          <div className="w-px h-6 bg-slate-700 mx-2"></div>
          <button onClick={handleDownloadImages} disabled={slides.length === 0} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg text-sm border border-slate-700 transition-all">
            <Download size={18} /><span>이미지 저장</span>
          </button>
          <button onClick={handleDownloadPdf} disabled={slides.length === 0} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold shadow-lg border border-blue-500/50">
            <FileText size={18} /><span>PDF 다운로드</span>
          </button>
        </div>
      </header>
      <main className="flex flex-1 overflow-hidden">
        <aside className="w-20 border-r border-slate-800 bg-[#1e293b] flex flex-col items-center py-6 gap-6 shrink-0">
          <button onClick={handleUndo} className="p-3 rounded-xl hover:bg-slate-700 text-slate-400" title="실행 취소"><History size={24} /></button>
          <button onClick={() => { setSlides(prev => prev.map((s, idx) => idx === activeSlideIdx ? { ...s, overlays: [] } : s)); setSelectedOverlayId(null); }} className="p-3 rounded-xl hover:bg-red-900/20 hover:text-red-400 text-slate-400" title="전체 삭제"><Trash2 size={24} /></button>
        </aside>
        <div className="flex-1 flex flex-col bg-slate-950 relative">
          {isProcessing ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 font-medium">변환 중...</p>
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
              <h3 className="text-2xl font-black text-slate-200 mb-3 tracking-tight">AI 슬라이터 에디터</h3>
              <p className="text-slate-500 max-w-xs mx-auto text-sm leading-relaxed mb-10">PDF 또는 이미지를 업로드하여 지능형 텍스트 교체를 시작하세요.</p>
              <label className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black cursor-pointer shadow-2xl">
                파일 선택
                <input type="file" accept=".pdf,image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          )}
        </div>
        <Sidebar
          activeSlide={slides[activeSlideIdx]}
          selection={selection}
          selectedOverlayId={selectedOverlayId}
          onApplyOverlay={handleApplyOverlay}
          onUpdateOverlays={handleUpdateOverlays}
        />
      </main>
    </div>
  );
};

export default App;
