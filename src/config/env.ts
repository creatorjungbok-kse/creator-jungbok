import { SHELL_PREVIEW, SITE_ENV } from 'astro:env/server';

// 사이트 환경 판정은 이 파일에서만 한다.
// - astro dev → development
// - build + SITE_ENV 값 → 그 값 (허용값 외는 astro.config.mjs 스키마에서 빌드 실패)
// - build + 값 없음 → preview (색인·GA 데이터 오염 방지 쪽으로 실패)
export type SiteEnv = 'development' | 'preview' | 'production';

export const siteEnv: SiteEnv = import.meta.env.DEV ? 'development' : (SITE_ENV ?? 'preview');
export const isProduction = siteEnv === 'production';

// dev 전용 셸 미리보기(미리보기 페이지·광고 자리 표시)
export const isShellPreview = import.meta.env.DEV || SHELL_PREVIEW;

if (isProduction && isShellPreview) {
  throw new Error('SHELL_PREVIEW는 production build에서 켤 수 없습니다.');
}
