# Project Memory

**Last Updated:** 2026-02-14 (v2)

## Critical Issues & Solutions

### 2026-02-14 Issue: Base64 DataURL로 인한 메모리 폭증 (해결됨)
- **Problem:** PDF 변환 시 `canvas.toDataURL('image/png')` → 한 장당 20~50MB Base64 문자열이 React state에 상주
- **Root Cause:** `pdfService.ts`에서 scale 2.0 PNG DataURL 사용
- **Solution:** `canvas.toBlob('image/jpeg', 0.85)` + `URL.createObjectURL()` 전환. `revokeSlideUrls()` 유틸로 교체/언마운트 시 revoke
- **Prevention:** 대용량 바이너리는 항상 Blob/ObjectURL 사용. Base64는 API 전송용으로만 사용
- **관련 파일:** `pdfService.ts`, `App.tsx`

### 2026-02-14 Issue: Image 객체 미해제로 인한 누적 (해결됨)
- **Problem:** `new Image()` 생성 후 `img.src=""` / `img.onload=null` 미호출 → 슬라이드 전환 시 이전 이미지가 GC되지 않음
- **Root Cause:** `useEffect` cleanup 함수 미구현 (EditorCanvas), 임시 Image 사용 후 미정리 (Sidebar, App)
- **Solution:** cleanup에서 `img.onload = null; img.src = "";` 추가. 임시 canvas도 `canvas.width = 0; canvas.height = 0;`으로 정리
- **Prevention:** `new Image()` 사용 시 반드시 사용 후 src 초기화. useEffect에서 Image 로드 시 반드시 cleanup 함수 작성

### 2026-02-14 Issue: API 키가 .env.local에 하드코딩
- **Problem:** 실제 Gemini API 키가 `.env.local`에 평문 저장
- **Root Cause:** 초기 개발 시 편의를 위해 직접 입력
- **Solution:** 키 rotate 후 `.env.example`에 placeholder만 커밋
- **Prevention:** CI에서 `.env.local` 포함 여부 검사

### 2026-02-14 Issue: 프로덕션 API 프록시 부재
- **Problem:** `geminiProxy.ts`는 Vite `configureServer` 전용 → `vite build` 후 동작 불가
- **Root Cause:** 개발 서버 미들웨어로만 구현
- **Solution:** Express/Cloud Functions 등 별도 API 서버 필요
- **Prevention:** 프로덕션 배포 계획을 초기에 수립

### 2026-02-14 Issue: editImage API가 Vertex AI 전용
- **Problem:** `@google/genai` SDK의 `ai.models.editImage()` (Imagen 3) → `This method is only supported by the Vertex AI` 에러
- **Root Cause:** `editImage`는 Vertex AI SDK 전용. 일반 Gemini API Key로는 호출 불가
- **Solution:** `ai.models.generateContent()` + `gemini-2.5-flash-image` 모델로 전환. 이미지와 텍스트 프롬프트를 함께 보내면 이미지 편집 가능
- **Prevention:** Gemini API Key 환경에서는 `editImage` 사용 불가. 이미지 편집은 반드시 `generateContent` + image 모델 사용
- **응답 구조:** `response.candidates[0].content.parts[]` 중 `part.inlineData.data`에 Base64 이미지

## Important Decisions

### Decision: Base64 → Blob/ObjectURL 전환
- **Date:** 2026-02-14
- **Options:** A) JPEG DataURL (간단), B) Blob + ObjectURL (최적), C) 지연 로딩 + 가상화 (이상적)
- **Chosen:** B
- **Reasoning:** A는 여전히 문자열 기반으로 메모리 부담. B는 GC 가능한 Blob 참조만 유지. C는 오버엔지니어링
- **Trade-offs:** ObjectURL은 반드시 `revokeObjectURL()`로 명시적 해제 필요

### Decision: GoogleGenAI 싱글톤 패턴 적용
- **Date:** 2026-02-14
- **Options:** A) 매 요청 인스턴스 생성, B) 모듈 레벨 싱글톤
- **Chosen:** B
- **Reasoning:** SDK 내부 연결 풀/캐시 재사용, API 키 변경 시에만 재생성
- **Trade-offs:** 없음 (apiKey 변경 시 자동 재생성 로직 포함)

### Decision: Server-side Proxy 패턴 채택
- **Date:** 프로젝트 초기
- **Options:** A) 클라이언트 직접 호출, B) Vite 미들웨어 프록시
- **Chosen:** B
- **Reasoning:** API 키가 클라이언트 번들에 노출되지 않도록 보호
- **Trade-offs:** 프로덕션 배포 시 별도 백엔드 필요

### Decision: 전체 슬라이드 전송 Inpainting
- **Date:** 2026-02-14
- **Options:** A) 전체 슬라이드 + 좌표 전송, B) 선택 영역 + 주변 패딩 crop, C) 선택 영역만 crop (기존)
- **Chosen:** A
- **Reasoning:** crop만 보내면 Gemini가 주변 맥락(패턴, 이미지)을 모름 → 복잡한 배경 복원 품질 저하. 전체 슬라이드 전송 시 비용 차이 미미 (Gemini은 이미지당 고정 ~258 토큰)
- **Trade-offs:** 반환된 전체 이미지에서 선택 영역만 crop하는 후처리 필요

### Decision: Canvas Edge Feathering으로 경계 블렌딩
- **Date:** 2026-02-14
- **Options:** A) 렌더링 시 매번 feathering, B) crop 시 1회 feathering
- **Chosen:** B
- **Reasoning:** crop 시점에 한번만 처리하면 캔버스/다운로드/PDF 모든 렌더링에 자동 적용
- **구현:** `globalCompositeOperation = 'destination-in'` + 가로/세로 `linearGradient` (8px 알파 페이드)

### Decision: CDN으로 pdf.js, jspdf 로드
- **Date:** 프로젝트 초기
- **Options:** A) npm, B) CDN
- **Chosen:** B
- **Reasoning:** 빠른 프로토타이핑
- **Trade-offs:** `declare const any` 타입 불안, 오프라인 불가, SRI hash 미적용

## Recurring Patterns

### Pattern: Canvas/Image 리소스 미해제 (해결됨)
- **Occurrences:** 5곳 (EditorCanvas, App handleDownloadImages, App handleFileUpload, Sidebar handleAnalyze, pdfService downloadAsPdf)
- **Context:** `new Image()` 또는 `document.createElement('canvas')` 사용 후 정리 없이 방치
- **Fix:** 사용 후 `img.onload = null; img.src = "";` / `canvas.width = 0; canvas.height = 0;` 호출
- **Prevention:** Image/Canvas 생성 코드 작성 시 반드시 정리 코드 병행

### Pattern: PDF.js 내부 캐시 미해제 (해결됨)
- **Context:** `pdf.getPage()` 후 `page.cleanup()` 미호출, `pdf.destroy()` 미호출
- **Fix:** 렌더링 완료 후 `page.cleanup()`, 전체 완료 후 `pdf.destroy()` 호출

## Architecture Notes

- 렌더링 로직은 `utils/renderOverlay.ts`에 공용화 (3곳에서 사용)
- 슬라이드 이미지는 Blob ObjectURL로 관리 (`revokeSlideUrls()`로 해제)
- 상태 관리: React useState로 단순 관리 (별도 상태 관리 라이브러리 미사용)
- Undo: 단순 pop() — 히스토리 스택/Redo 미구현
- Gemini API: `geminiProxy.ts`에서 싱글톤 패턴으로 SDK 인스턴스 관리
- Inpainting: `gemini-2.5-flash-image` + `generateContent`로 텍스트 제거. 전체 슬라이드 전송 + 좌표 프롬프트 → 결과에서 영역 crop + 8px feathering
