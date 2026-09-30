// 사이트 정보 페이지(P9, 04 1장). Footer 링크와 sitemap 포함 여부를 여기서만 정한다.
// 모두 index, follow. sitemap에는 소개·정보 조사 원칙만 넣는다(나머지는 Footer 링크로 발견).
export const infoPages = [
  { href: '/about/', label: '소개', inSitemap: true },
  { href: '/editorial-policy/', label: '정보 조사 원칙', inSitemap: true },
  { href: '/disclosure/', label: '고지 사항', inSitemap: false },
  { href: '/contact/', label: '문의', inSitemap: false },
  { href: '/privacy/', label: '개인정보처리방침', inSitemap: false },
  { href: '/terms/', label: '이용약관', inSitemap: false },
] as const;
