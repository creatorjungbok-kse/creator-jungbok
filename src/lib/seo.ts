// SEO 메타데이터의 한 곳(04). title·canonical URL·날짜 형식·JSON-LD·sitemap 목록을 여기서 만든다.
// 브랜드명·설명은 config/site.ts에서만 읽는다(P9 브랜드 확정 때 한 곳만 바꾼다).
import { site } from '../config/site';
import { categoryHref } from '../data/categories';
import { infoPages } from '../data/pages';
import { people } from '../data/people';
import { activeCategories, getAllContent, type ContentItem } from './content';

// 사이트 절대 URL(astro.config.mjs `site`)
export const absoluteUrl = (path: string) => new URL(path, import.meta.env.SITE).href;

// <title>: 홈은 `{브랜드}: {한 줄 정의}`, 나머지는 `{페이지 제목} | {브랜드}`(04 4장)
export const pageTitle = (title?: string) => (title ? `${title} | ${site.name}` : `${site.name}: ${site.tagline}`);

// 콘텐츠 날짜(YYYY-MM-DD, UTC 자정으로 파싱)를 한국 시간 자정으로 표기(04 7장: 시간대 포함)
const ymd = (d: Date) => d.toISOString().slice(0, 10);
const isoKst = (d: Date) => `${ymd(d)}T00:00:00+09:00`;
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const rfc822Kst = (d: Date) =>
  `${DAYS[d.getUTCDay()]}, ${String(d.getUTCDate()).padStart(2, '0')} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()} 00:00:00 +0900`;

// ── JSON-LD(04 13장). 화면에 있는 값만 쓰고, 없는 정보(로고·검수·평점 등)는 만들지 않는다 ──
const organization = () => ({ '@type': 'Organization', name: site.name, url: absoluteUrl('/') });

export const homeJsonLd = () => [
  { '@context': 'https://schema.org', '@type': 'WebSite', name: site.name, url: absoluteUrl('/') },
  { '@context': 'https://schema.org', ...organization() },
];

export const collectionJsonLd = (name: string, description: string, path: string) => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name,
  description,
  url: absoluteUrl(path),
});

// benefit·change 포함 모든 글은 Article(04 13장). author url은 작성자 소개 페이지(P9)가 생기면 연결한다
export function articleJsonLd(item: ContentItem) {
  const { data } = item.entry;
  const author = people.find((p) => p.id === data.author)!;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.title,
    description: data.description ?? data.summary,
    datePublished: isoKst(data.datePublished),
    dateModified: isoKst(data.dateModified),
    // 사이트 이름으로 쓰는 글은 Organization, 실제 사람이면 Person
    author: author.isSite ? organization() : { '@type': 'Person', name: author.name },
    publisher: organization(),
    mainEntityOfPage: absoluteUrl(item.url),
    inLanguage: site.lang,
  };
}

// ── sitemap(04 8장): 색인 대상 URL만. lastmod는 dateModified가 있는 콘텐츠만(빌드 날짜를 쓰지 않음) ──
interface SitemapEntry {
  url: string;
  lastmod?: string;
}

async function sitemapEntries(): Promise<SitemapEntry[]> {
  // 공개 글이 없는 대분류 허브는 noindex라 넣지 않는다
  const pages = ['/', ...(await activeCategories()).map(categoryHref), ...infoPages.filter((p) => p.inSitemap).map((p) => p.href)].map((url) => ({ url }));
  const content = (await getAllContent()).map((i) => ({ url: i.url, lastmod: ymd(i.entry.data.dateModified) }));
  return [...pages, ...content];
}

// /benefits/ 아래 전체는 sitemap-benefits, 나머지는 sitemap-main
const isBenefitsPath = (url: string) => url.startsWith('/benefits/');

export const sitemapParts = ['main', 'benefits'] as const;
export type SitemapPart = (typeof sitemapParts)[number];
export const sitemapEntriesOf = async (part: SitemapPart) => (await sitemapEntries()).filter((e) => isBenefitsPath(e.url) === (part === 'benefits'));

export async function urlsetResponse(part: SitemapPart) {
  const urls = (await sitemapEntriesOf(part)).map((e) => `  <url><loc>${escapeXml(absoluteUrl(e.url))}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''}</url>`);
  return xmlResponse(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
}

const entities: Record<string, string> = { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' };
export const escapeXml = (s: string) => s.replace(/[<>&'"]/g, (c) => entities[c]);

export const xmlResponse = (body: string, type = 'application/xml') =>
  new Response(`<?xml version="1.0" encoding="UTF-8"?>\n${body}`, { headers: { 'Content-Type': `${type}; charset=utf-8` } });
