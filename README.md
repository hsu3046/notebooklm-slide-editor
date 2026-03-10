# ✏️ NotebookLM Slide Editor

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vite.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Gemini](https://img.shields.io/badge/Gemini_API-google-4285F4?logo=google)](https://ai.google.dev)

## Tagline-en

NotebookLM makes research effortless — but editing those slides? Not so much.
Now you can fix them in seconds and put them straight to work.

## Tagline-ko

자료 수집부터 정리까지 너무나 편리한 NotebookLM.
근데 만들어진 슬라이드는 수정이 안 돼서 답답하셨죠?
이제 쉽게 고쳐서, 바로 실무에 활용하세요.

## Tagline-ja

リサーチから整理まで驚くほど便利なNotebookLM。
でも、できたスライドが編集できなくてもどかしかったですよね？
もう大丈夫 — サッと直して、すぐ仕事に使えます。

---

## Summary-en

You spent hours perfecting your NotebookLM slides — then spotted a typo at the very end.
Start all over? That's the last thing you want to do.
This editor fills that last 2%.
Just drag over the text you want to fix, and the AI corrects the content and seamlessly restores the background.
No Photoshop. No regenerating from scratch.
Drag → Edit → Download. Your slide is ready to use, right now.

## Summary-ko

NotebookLM으로 완성한 슬라이드, 마지막에 오타 하나를 발견했습니다.
처음부터 다시 만들어야 할까요? 그건 너무 아깝죠.
이 에디터가 그 2%를 채워드립니다.
수정하고 싶은 텍스트를 드래그하면, AI가 내용을 고치고 배경까지 깔끔하게 복원합니다.
포토샵도, 재생성도 필요 없습니다.
드래그 → 수정 → 다운로드. 바로 실무에 쓸 수 있는 슬라이드가 완성됩니다.

## Summary-ja

NotebookLM で仕上げたスライド、最後の最後でタイポを発見。
また最初からやり直し？　それはさすがに、もったいない。
このエディターが、その2%を補います。
修正したいテキストをドラッグするだけで、AIが内容を直し、背景まできれいに復元します。
Photoshopも、再生成も必要ありません。
ドラッグ → 修正 → ダウンロード。 すぐに現場で使えるスライドが完成します。

---

## ✨ What It Does

- **Edits text right on your slides** — Drag to select any text region, and Gemini AI detects the content with font details for instant editing
- **Restores backgrounds seamlessly** — AI-powered inpainting removes old text and fills the area to match surrounding colors and textures
- **Converts PDFs into editable slides** — Upload any PDF and each page becomes a high-quality slide image ready for editing
- **Gives you full control over styling** — Customize replacement text with font size, weight, color, alignment, and family from 20 Google Fonts
- **Tracks your API costs in real time** — See exactly how much each Gemini API call costs, displayed directly in the UI
- **Supports undo/redo for every edit** — Full history management with Cmd+Z / Cmd+Shift+Z for worry-free editing
- **Exports as PDF or PNG bundle** — Download all edited slides as a single PDF or individual PNG images in a ZIP
- **Speaks your language** — Full Korean, Japanese, and English UI with automatic browser language detection
- **Keeps your API key private** — BYOK (Bring Your Own Key) model — your key stays in your browser session, never sent to any server

---

## 🚀 Try It Now

👉 **[Live Demo](https://notebooklm.knowai.app/)**

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 |
| Language | TypeScript 5.8 (Strict) |
| Build | Vite 6 |
| AI / OCR | Google Gemini API (`@google/genai`) |
| PDF | PDF.js (CDN), jsPDF (CDN) |
| Icons | Lucide React |
| File Export | JSZip, File System Access API |
| Fonts | Google Fonts (20 families) |
| Deploy | Vercel |

---

## 📦 Installation

```bash
git clone https://github.com/hsu3046/notebooklm-slide-editor.git
cd notebooklm-slide-editor
npm install
cp .env.example .env.local   # Fill in your Gemini API key (optional — you can also enter it in the UI)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 📁 Project Structure

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
│   └── analytics.ts        # Usage analytics (GA4)
└── constants/
    └── i18n.ts             # Translation strings (ko/ja/en)
```

---

## 🗺 Roadmap

- [ ] Batch editing — select and replace multiple text regions at once
- [ ] Image overlay support — insert logos or images onto slides
- [ ] Drag-and-drop slide reordering
- [ ] Cloud save — persist edits across sessions
- [ ] Custom font upload — use your own fonts beyond Google Fonts

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat(scope): add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.html).

---

*Built by [KnowAI](https://knowai.space) · © 2026 KnowAI*
