// sitemap index(04 8장). Search Console·Naver 진입점은 이 주소 하나다.
// 색인 대상 URL이 하나도 없는 sitemap(예: 공개 글이 없는 /benefits/)은 index에 넣지 않는다. 첫 글이 생기면 자동으로 들어간다.
import { absoluteUrl, sitemapEntriesOf, sitemapParts, xmlResponse } from '../lib/seo';

export async function GET() {
  const parts = [];
  for (const part of sitemapParts) if ((await sitemapEntriesOf(part)).length > 0) parts.push(part);
  const maps = parts.map((p) => `  <sitemap><loc>${absoluteUrl(`/sitemap-${p}.xml`)}</loc></sitemap>`);
  return xmlResponse(`<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${maps.join('\n')}\n</sitemapindex>\n`);
}
