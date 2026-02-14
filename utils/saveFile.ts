/**
 * Chrome의 blob URL + <a download> 버그 대응 — 파일명이 UUID로 저장되는 문제.
 * showSaveFilePicker API (File System Access API) 우선 사용.
 * 미지원 브라우저는 레거시 a.click() 폴백.
 */

interface SaveFileOptions {
    suggestedName: string;
    mimeType: string;
    /** showSaveFilePicker의 accept 확장자 목록, e.g. ['.zip'] */
    extensions?: string[];
}

/**
 * Blob을 파일로 저장하는 유틸리티.
 * Chrome에서 blob URL download attribute 버그를 회피하기 위해
 * File System Access API(showSaveFilePicker)를 우선 사용합니다.
 */
export async function saveFile(blob: Blob, options: SaveFileOptions): Promise<void> {
    // 1차 시도: showSaveFilePicker (Chrome 86+)
    if ('showSaveFilePicker' in window) {
        try {
            const handle = await (window as any).showSaveFilePicker({
                suggestedName: options.suggestedName,
                types: [
                    {
                        description: options.suggestedName,
                        accept: { [options.mimeType]: options.extensions || [] },
                    },
                ],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            return;
        } catch (err: any) {
            // 유저가 취소한 경우
            if (err.name === 'AbortError') return;
            // 그 외 에러(user activation 만료 등)는 폴백으로 이동
            console.warn('[saveFile] showSaveFilePicker failed, falling back:', err.message);
        }
    }

    // 2차 폴백: 레거시 a.click() 방식
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = options.suggestedName;
    a.style.display = 'none';
    document.body.appendChild(a);

    // MouseEvent dispatch가 .click()보다 더 안정적인 경우가 있음
    a.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true, view: window })
    );

    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 60_000);
}
