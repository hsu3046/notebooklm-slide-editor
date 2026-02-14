export type Locale = 'ko' | 'ja' | 'en';

export const translations = {
    // ── Header ──
    'header.title': {
        ko: 'NotebookLM Editor',
        ja: 'NotebookLM Editor',
        en: 'NotebookLM Editor',
    },
    'header.subtitle': {
        ko: 'AI Power',
        ja: 'AI Power',
        en: 'AI Power',
    },
    'header.upload': {
        ko: '파일 업로드',
        ja: 'ファイルアップロード',
        en: 'Upload File',
    },
    'header.saveImages': {
        ko: '이미지 저장',
        ja: '画像保存',
        en: 'Save Images',
    },
    'header.downloadPdf': {
        ko: 'PDF 다운로드',
        ja: 'PDFダウンロード',
        en: 'Download PDF',
    },

    // ── Toolbar ──
    'toolbar.undo': {
        ko: '실행 취소',
        ja: '元に戻す',
        en: 'Undo',
    },
    'toolbar.clearAll': {
        ko: '전체 삭제',
        ja: '全削除',
        en: 'Clear All',
    },
    'toolbar.redo': {
        ko: '다시 실행',
        ja: 'やり直す',
        en: 'Redo',
    },

    // ── Empty state ──
    'empty.title': {
        ko: 'AI 슬라이드 에디터',
        ja: 'AIスライドエディタ',
        en: 'AI Slide Editor',
    },
    'empty.description': {
        ko: 'PDF 또는 이미지를 업로드하여 지능형 텍스트 교체를 시작하세요.',
        ja: 'PDFまたは画像をアップロードして、AI テキスト置換を始めましょう。',
        en: 'Upload a PDF or image to start intelligent text replacement.',
    },
    'empty.selectFile': {
        ko: '파일 선택',
        ja: 'ファイル選択',
        en: 'Select File',
    },
    'processing': {
        ko: '변환 중...',
        ja: '変換中...',
        en: 'Converting...',
    },

    // ── Sidebar ──
    'sidebar.editText': {
        ko: '텍스트 수정',
        ja: 'テキスト編集',
        en: 'Edit Text',
    },
    'sidebar.replaceText': {
        ko: '텍스트 교체',
        ja: 'テキスト置換',
        en: 'Replace Text',
    },
    'sidebar.placeholder': {
        ko: '텍스트 교체 영역을 선택하거나\n교체된 텍스트를 클릭하세요',
        ja: 'テキスト置換エリアを選択するか\n置換済みテキストをクリックしてください',
        en: 'Select a text area to replace\nor click on replaced text',
    },
    'sidebar.aiAnalysis': {
        ko: 'AI 텍스트 분석',
        ja: 'AIテキスト分析',
        en: 'AI Text Analysis',
    },
    'sidebar.analyzing': {
        ko: '분석 중...',
        ja: '分析中...',
        en: 'Analyzing...',
    },
    'sidebar.extracting': {
        ko: '텍스트 추출 중...',
        ja: 'テキスト抽出中...',
        en: 'Extracting text...',
    },
    'sidebar.restoringBg': {
        ko: '배경 복원 중...',
        ja: '背景復元中...',
        en: 'Restoring background...',
    },
    'sidebar.postProcessing': {
        ko: '후처리 중...',
        ja: '後処理中...',
        en: 'Post-processing...',
    },
    'sidebar.background': {
        ko: '배경:',
        ja: '背景:',
        en: 'BG:',
    },
    'sidebar.bgComplex': {
        ko: '🖼 복잡',
        ja: '🖼 複雑',
        en: '🖼 Complex',
    },
    'sidebar.bgGradient': {
        ko: '🌈 그라디언트',
        ja: '🌈 グラデーション',
        en: '🌈 Gradient',
    },
    'sidebar.bgSolid': {
        ko: '⬜ 단색',
        ja: '⬜ 単色',
        en: '⬜ Solid',
    },
    'sidebar.bgRestoring': {
        ko: '배경 복원 중...',
        ja: '背景復元中...',
        en: 'Restoring...',
    },
    'sidebar.bgRestored': {
        ko: '✓ 복원 완료',
        ja: '✓ 復元完了',
        en: '✓ Restored',
    },
    'sidebar.runOcr': {
        ko: 'AI 분석 (OCR) 실행',
        ja: 'AI分析 (OCR) 実行',
        en: 'Run AI Analysis (OCR)',
    },
    'sidebar.content': {
        ko: '내용',
        ja: '内容',
        en: 'Content',
    },
    'sidebar.hAlign': {
        ko: '수평 정렬',
        ja: '水平揃え',
        en: 'H-Align',
    },
    'sidebar.vAlign': {
        ko: '수직 정렬',
        ja: '垂直揃え',
        en: 'V-Align',
    },
    'sidebar.vAlignTop': {
        ko: '위쪽',
        ja: '上',
        en: 'Top',
    },
    'sidebar.vAlignMiddle': {
        ko: '가운데',
        ja: '中央',
        en: 'Middle',
    },
    'sidebar.vAlignBottom': {
        ko: '아래쪽',
        ja: '下',
        en: 'Bottom',
    },
    'sidebar.font': {
        ko: '글꼴',
        ja: 'フォント',
        en: 'Font',
    },
    'sidebar.size': {
        ko: '크기',
        ja: 'サイズ',
        en: 'Size',
    },
    'sidebar.color': {
        ko: '색상',
        ja: 'カラー',
        en: 'Color',
    },
    'sidebar.weight': {
        ko: '두께',
        ja: '太さ',
        en: 'Weight',
    },
    'sidebar.apply': {
        ko: '텍스트 적용',
        ja: 'テキスト適用',
        en: 'Apply Text',
    },

    // ── Alert messages ──
    'alert.fileTooLarge': {
        ko: '파일 크기가 너무 큽니다. 최대 50MB까지 지원됩니다.',
        ja: 'ファイルサイズが大きすぎます。最大50MBまで対応しています。',
        en: 'File is too large. Maximum 50MB supported.',
    },
    'alert.unsupportedType': {
        ko: '지원하지 않는 파일 형식입니다. PDF 또는 이미지 파일을 업로드해주세요.',
        ja: 'サポートされていないファイル形式です。PDFまたは画像ファイルをアップロードしてください。',
        en: 'Unsupported file type. Please upload a PDF or image file.',
    },
    'alert.uploadError': {
        ko: '파일 변환 중 오류가 발생했습니다. 다른 파일로 다시 시도해주세요.',
        ja: 'ファイルの変換中にエラーが発生しました。別のファイルでお試しください。',
        en: 'Error converting file. Please try a different file.',
    },
    'alert.imageDownloadError': {
        ko: '이미지 다운로드 중 오류가 발생했습니다.',
        ja: '画像ダウンロード中にエラーが発生しました。',
        en: 'Error downloading images.',
    },
    'alert.pdfDownloadError': {
        ko: 'PDF 다운로드 중 오류가 발생했습니다.',
        ja: 'PDFダウンロード中にエラーが発生しました。',
        en: 'Error downloading PDF.',
    },
    'alert.analysisError': {
        ko: 'AI 분석 중 오류가 발생했습니다. 다시 시도해주세요.',
        ja: 'AI分析中にエラーが発生しました。再度お試しください。',
        en: 'AI analysis error. Please try again.',
    },
    'alert.confirmOverwrite': {
        ko: '이미 로딩된 파일이 있습니다. 새 파일로 교체하시겠습니까?\n(현재 편집 내용이 사라집니다)',
        ja: '既にファイルが読み込まれています。新しいファイルに置き換えますか？\n（現在の編集内容は失われます）',
        en: 'A file is already loaded. Replace with new file?\n(Current edits will be lost)',
    },
    'empty.dropzone': {
        ko: '여기에 파일을 드롭하세요',
        ja: 'ここにファイルをドロップ',
        en: 'Drop file here',
    },
    'empty.dropHint': {
        ko: '또는 파일을 여기로 드래그하세요',
        ja: 'またはファイルをここにドラッグ',
        en: 'or drag a file here',
    },

    // ── API Key Setup ──
    'apikey.title': {
        ko: 'Gemini API Key 설정',
        ja: 'Gemini APIキー設定',
        en: 'Gemini API Key Setup',
    },
    'apikey.description': {
        ko: 'Google AI Studio에서 발급받은 API Key를 입력하세요.',
        ja: 'Google AI Studioで取得したAPIキーを入力してください。',
        en: 'Enter your API Key from Google AI Studio.',
    },
    'apikey.placeholder': {
        ko: 'AIzaSy...',
        ja: 'AIzaSy...',
        en: 'AIzaSy...',
    },
    'apikey.start': {
        ko: '시작하기',
        ja: '始める',
        en: 'Get Started',
    },
    'apikey.getKey': {
        ko: 'API Key 발급받기 →',
        ja: 'APIキーを取得する →',
        en: 'Get API Key →',
    },
    'apikey.privacy1': {
        ko: '🔒 API 키는 이 브라우저에만 저장됩니다 (서버 전송 ❌)',
        ja: '🔒 APIキーはこのブラウザにのみ保存されます（サーバー送信 ❌）',
        en: '🔒 API key is stored only in this browser (never sent to server ❌)',
    },
    'apikey.privacy2': {
        ko: '📡 슬라이드 데이터는 Google AI에 직접 전송됩니다',
        ja: '📡 スライドデータはGoogle AIに直接送信されます',
        en: '📡 Slide data is sent directly to Google AI',
    },
    'apikey.privacy3': {
        ko: '🗑️ 탭을 닫으면 API 키가 자동 삭제됩니다',
        ja: '🗑️ タブを閉じるとAPIキーが自動削除されます',
        en: '🗑️ API key is auto-deleted when you close the tab',
    },
    'apikey.change': {
        ko: 'API Key 변경',
        ja: 'APIキー変更',
        en: 'Change API Key',
    },
    'apikey.opensource': {
        ko: '⭐ 이 프로젝트는 오픈소스입니다',
        ja: '⭐ このプロジェクトはオープンソースです',
        en: '⭐ This project is open source',
    },

    // ── API Cost ──
    'cost.session': {
        ko: '이번 세션',
        ja: '今回のセッション',
        en: 'Session',
    },
    'cost.ocr': {
        ko: '텍스트 분석',
        ja: 'テキスト分析',
        en: 'Text Analysis',
    },
    'cost.inpaint': {
        ko: '글자 지우기',
        ja: '文字消し',
        en: 'Text Removal',
    },
    'cost.estimated': {
        ko: '예상 비용',
        ja: '概算費用',
        en: 'Est. Cost',
    },
    'cost.perOcr': {
        ko: '1회당 ~$0.0003',
        ja: '1回あたり ~$0.0003',
        en: '~$0.0003 per call',
    },
    'cost.perInpaint': {
        ko: '1회당 ~$0.003',
        ja: '1回あたり ~$0.003',
        en: '~$0.003 per call',
    },
} as const;

export type TranslationKey = keyof typeof translations;
