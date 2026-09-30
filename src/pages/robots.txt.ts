// robots.txt(04 10장, 05 10장). robots는 수집 제어, 색인 제어는 meta noindex가 한다.
// - production: 전체 허용 + sitemap
// - preview: 수집은 막지 않는다(막으면 meta noindex를 읽지 못함). 색인은 meta noindex + Cloudflare 기본 noindex 헤더. sitemap 안내 없음
// - development: 전체 차단
import { siteEnv } from '../config/env';
import { absoluteUrl } from '../lib/seo';

const policies = {
  production: `User-agent: *\nAllow: /\n\nSitemap: ${absoluteUrl('/sitemap.xml')}\n`,
  preview: 'User-agent: *\nAllow: /\n',
  development: 'User-agent: *\nDisallow: /\n',
};

export function GET() {
  return new Response(policies[siteEnv], { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
