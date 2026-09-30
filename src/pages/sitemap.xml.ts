// sitemap index(04 8장). Search Console·Naver 진입점은 이 주소 하나다.
import { absoluteUrl, xmlResponse } from '../lib/seo';

export function GET() {
  const maps = ['/sitemap-main.xml', '/sitemap-benefits.xml'].map((p) => `  <sitemap><loc>${absoluteUrl(p)}</loc></sitemap>`);
  return xmlResponse(`<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${maps.join('\n')}\n</sitemapindex>\n`);
}
