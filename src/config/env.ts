// 셸 미리보기(dev 전용 페이지·광고 자리 표시)는 `astro dev` 또는 PUBLIC_SHELL_PREVIEW=1 빌드에서만 켠다.
// 기본 production build에는 미리보기 페이지와 광고 자리 표시가 생성되지 않는다.
export const isShellPreview = import.meta.env.DEV || import.meta.env.PUBLIC_SHELL_PREVIEW === '1';
