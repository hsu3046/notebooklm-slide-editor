<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# NotebookLM Slide Editor

**AI-powered PDF slide editor with OCR text replacement and background inpainting**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vite.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Gemini](https://img.shields.io/badge/Gemini_API-google-4285F4?logo=google)](https://ai.google.dev)

</div>

---

## 🇰🇷 한국어

NotebookLM으로 멋진 슬라이드를 만들었는데, 오타 하나 고치려면 처음부터 다시?
이제 그럴 필요 없습니다.

영역을 드래그하면 AI가 텍스트를 자동 인식하고, 원하는 내용으로 바꿔주고, 배경까지 깔끔하게 복원합니다.
포토샵 없이, 재생성 없이 — **드래그 → 수정 → 다운로드**, 그게 전부입니다.

## 🇺🇸 English

You just generated beautiful slides with NotebookLM — but there's a typo. Start over?
Not anymore.

Drag over any text region and AI instantly recognizes it, lets you edit in place, and seamlessly restores the background.
No Photoshop, no regeneration — just **drag → edit → download**. That's it.

## 🇯🇵 日本語

NotebookLMで素敵なスライドを作ったのに、誤字を一つ直すためにまた最初から？
もう、その必要はありません。

テキスト領域をドラッグするだけで、AIが自動認識・編集・背景復元まで一括処理。
Photoshopも再生成も不要 — **ドラッグ → 編集 → ダウンロード**、それだけです。

---

## Features

- 📄 **PDF to Slide Conversion** — Upload a PDF and convert each page into high-quality slide images for editing
- 🔍 **AI-Powered OCR** — Select a text region on a slide, and Gemini analyzes the text content, font size, weight, color, family, and background
- ✏️ **Text Replacement** — Replace recognized text with new content, fully customizable (font size, weight, color, alignment)
- 🎨 **Background Inpainting** — AI-powered text removal that seamlessly fills the background, matching surrounding colors and textures
- 🖼️ **Canvas Editor** — Interactive canvas with zoom, pan, drag-to-select, and 8-handle resizing for precise overlay positioning
- ↩️ **Undo / Redo** — Full undo/redo history for all overlay operations
- 💾 **Export Options** — Download edited slides as a PDF or as individual PNG images bundled in a ZIP archive
- 🌐 **i18n Support** — Full Korean, Japanese, and English UI with auto-detection from browser language settings
- 💰 **API Cost Tracking** — Real-time Gemini API usage cost estimation displayed in the UI
- 🔑 **Flexible API Key** — Use your own Gemini API key via the UI or configure a server-side key via environment variable

## Tech Stack

| Category | Technology |
|---|---|
| Frontend | React 19, TypeScript 5.8, Vite 6 |
| AI / OCR | Google Gemini API (`@google/genai`) |
| PDF Processing | PDF.js (CDN), jsPDF (CDN) |
| Icons | Lucide React |
| File Export | JSZip, File System Access API |
| Deployment | Vercel |

## Architecture

```
notebooklm-slide-editor/
├── App.tsx                 # Main application component
├── index.tsx               # Entry point with I18nProvider
├── types.ts                # TypeScript type definitions
├── constants.ts            # Canvas & UI constants
├── components/
│   ├── EditorCanvas.tsx    # Interactive canvas with zoom/pan/selection
│   ├── Sidebar.tsx         # OCR analysis panel & text editing controls
│   ├── SettingsModal.tsx   # Settings popup (API key, model selection, language)
│   └── ToastContainer.tsx  # Notification system
├── hooks/
│   ├── useApiKey.ts        # API key management (localStorage + env)
│   ├── useApiCost.ts       # Real-time API cost tracking
│   ├── useModelConfig.ts   # AI model preset selection
│   ├── useI18n.tsx         # Internationalization (ko/ja/en)
│   ├── useToast.ts         # Toast notification state
│   └── useUndoHistory.ts   # Undo/Redo history management
├── services/
│   ├── geminiService.ts    # Gemini API integration (OCR + Inpaint)
│   └── pdfService.ts       # PDF ↔ Image conversion
├── utils/
│   ├── renderOverlay.ts    # Canvas overlay rendering
│   ├── saveFile.ts         # File download utilities
│   └── analytics.ts        # Usage analytics
└── constants/
    └── i18n.ts             # Translation strings
```

## Getting Started

### Prerequisites

- **Node.js** 18+
- **Gemini API Key** — Get one at [Google AI Studio](https://aistudio.google.com/apikey)

### Installation

```bash
# Clone the repository
git clone https://github.com/hsu3046/notebooklm-slide-editor.git
cd notebooklm-slide-editor

# Install dependencies
npm install

# Configure API key (optional — you can also enter it in the UI)
cp .env.example .env.local
# Edit .env.local and set your GEMINI_API_KEY
```

### Run Locally

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build for Production

```bash
npm run build
npm run preview
```

## Usage

1. **Upload a PDF** — Click the upload button or drag & drop a PDF file
2. **Select a text region** — Click and drag on the canvas to select the text area you want to edit
3. **Analyze with AI** — Click "Analyze" to run Gemini OCR on the selected region
4. **Edit the text** — Modify the recognized text, adjust font properties (size, weight, color, alignment)
5. **Apply the overlay** — Click "Apply" to place the text overlay on the slide
6. **Download** — Export all slides as a PDF or as PNG images (ZIP)

## Gemini Models

The app supports model selection via the Settings modal:

| Preset | OCR Model | Inpaint Model | OCR Cost | Inpaint Cost |
|---|---|---|---|---|
| Default (v2.5) | `gemini-3-flash-preview` | `gemini-2.5-flash-image` | ~$0.0003 | ~$0.003 |
| Unified (v3.1) | `gemini-3.1-flash-image-preview` | `gemini-3.1-flash-image-preview` | ~$0.0004 | ~$0.05 |

All models include automatic fallback to `gemini-2.5-flash`.

## Deployment

Pre-configured for Vercel deployment with `vercel.json`. Supports sub-path routing at `/notebooklm-slide-editor`.

```bash
# Deploy to Vercel
npx vercel --prod
```

## License

MIT

