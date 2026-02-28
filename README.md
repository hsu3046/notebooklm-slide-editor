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

NotebookLM 등을 이용해서 AI로 생성한 PDF 슬라이드 및 이미지의 텍스트를 편집할 수 있는 웹 에디터입니다.
Gemini API를 활용한 OCR 텍스트 분석과 배경 복원(인페인팅) 기능을 제공하며, 편집된 슬라이드를 PDF 또는 이미지(ZIP)로 다운로드할 수 있습니다.
한국어·일본어·영어 UI를 지원합니다.

## 🇺🇸 English

A web-based slide editor that uses AI to recognize text in PDF slides and replace it with your desired text.
Powered by the Gemini API for OCR text analysis and background inpainting, it lets you download edited slides as PDF or images (ZIP).
Supports Korean, Japanese, and English UI.

## 🇯🇵 日本語

PDFスライドのテキストをAIで認識し、任意のテキストに置き換えることができるWebエディタです。
Gemini APIを活用したOCRテキスト分析と背景復元（インペインティング）機能を提供し、編集したスライドをPDFまたは画像（ZIP）でダウンロードできます。
韓国語・日本語・英語のUIに対応しています。

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

