// 빌드 결과물 검사(환경별 head·GA4, SEO, sitemap·RSS·robots, fixture 유출, 신청 가능 영역, script 범위, 도구 상수 기한, 광고 슬롯).
// Fail은 종료 코드 1, Warning은 보고만 한다(04 27장).
// 사용: npm run check:build -- <development|preview|production> [distDir]
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import config from '../astro.config.mjs';
import { categories } from '../src/data/categories.ts';

const env = process.argv[2];
const dist = process.argv[3] ?? 'dist';
if (!['development', 'preview', 'production'].includes(env)) {
  console.error('환경값을 지정하세요: development | preview | production');
  process.exit(2);
}

const origin = new URL(config.site).origin;
const allFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? allFiles(path) : [path];
  });
const files = allFiles(dist);
const read = (f) => readFileSync(f, 'utf8');
const relOf = (file) => relative(dist, file).split(sep).join('/');
const pathOf = (file) => '/' + relOf(file).replace(/index\.html$/, '');
const count = (text, re) => (text.match(re) ?? []).length;
const decode = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

const errors = [];
const warnings = [];
const rows = [];
const htmlFiles = files.filter((f) => f.endsWith('.html'));
const pages = new Set(htmlFiles.map(pathOf));
// 공개 글이 없는 대분류 허브(lib/content.ts activeCategories와 같은 규칙): noindex, sitemap 제외, 다른 페이지에서 링크하지 않음.
// 글이 생기면 자동으로 일반 허브가 된다(색인·메뉴 필수)
const hubs = categories.map((c) => `/${c.slug}/`);
const emptyHubs = new Set(hubs.filter((hub) => ![...pages].some((p) => p !== hub && p.startsWith(hub))));

// 색인 정책(04 1장): 404·검색은 항상 noindex, sitemap 제외. 신뢰 페이지 4종은 index지만 sitemap 제외
const ALWAYS_NOINDEX = new Set(['/404.html', '/search/']);
const SITEMAP_EXEMPT = new Set(['/contact/', '/privacy/', '/terms/', '/disclosure/']);
const SCRIPT_PAGES = new Set(['/benefits/', '/search/']);
// 도구 상수 기한(production만): 남은 날이 이 값 이하면 Warning, 지나면 Fail. 오늘 = 한국 날짜
const TOOL_EXPIRY_WARN_DAYS = 14;
const todayKst = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
// 광고 없는 페이지(03 12장): 검색·정책·404
const NO_AD_PAGES = new Set(['/search/', '/404.html', '/about/', '/editorial-policy/', '/contact/', '/privacy/', '/terms/', '/disclosure/']);
// 광고 설정 단일 출처(src/config/ads.ts)의 on/off
const adsEnabled = readFileSync('src/config/ads.ts', 'utf8').match(/export const adsEnabled: boolean = (true|false);/)?.[1];
if (!adsEnabled) {
  console.error('src/config/ads.ts에서 adsEnabled 값을 읽지 못했습니다.');
  process.exit(2);
}

// 여는 태그(정규식 그룹 1 = 태그 이름)부터 같은 태그의 중첩을 세어 닫는 태그까지의 [시작, 끝] 위치
function spans(html, start) {
  const out = [];
  for (const m of html.matchAll(start)) {
    const tag = new RegExp(`<(/?)${m[1]}\\b[^>]*>`, 'g');
    tag.lastIndex = m.index;
    for (let t, depth = 0; (t = tag.exec(html)); ) {
      depth += t[1] ? -1 : 1;
      if (depth === 0) {
        out.push([m.index, tag.lastIndex]);
        break;
      }
    }
  }
  return out;
}
// attr가 붙은 요소의 [시작, 끝]
const regions = (html, attr) => spans(html, new RegExp(`<(\\w+)[^>]*\\s${attr}(?=[\\s>=])`, 'g'));
const within = ([s, e], [os, oe]) => os <= s && e <= oe;
// 두 위치 사이에 보이는 내용(태그를 뺀 글자)이 없으면 인접
const adjacent = (html, [s, e], [ps, pe]) => (pe <= s || e <= ps) && html.slice(Math.min(e, pe), Math.max(s, ps)).replace(/<[^>]*>/g, '').trim() === '';

// ── 결과물 전체 ─────────────────────────────────────
// 비공개 파일이 배포 폴더에 없어야 한다(04 10·27장)
for (const f of files.map(relOf)) {
  if (/^(docs|scripts|\.claude)\//.test(f) || /(^|\/)(\.env|CLAUDE\.md|[^/]+\.map)$/.test(f)) errors.push(`${f}: 비공개 파일 포함`);
}
// dev·test fixture(slug fixture-*)는 production 결과물의 어떤 파일(HTML·검색 색인·sitemap·RSS 포함)에도 없어야 한다
if (env === 'production') {
  for (const file of files.filter((f) => /\.(html|json|xml|txt|js|css|webmanifest)$/.test(f))) {
    if (read(file).includes('fixture-')) errors.push(`${relOf(file)}: fixture 유출`);
  }
}

// 신청 종료된 지원사업 URL(상세 페이지의 상태 배너 기준)
const closedUrls = new Set(htmlFiles.filter((f) => read(f).includes('status-banner--closed')).map(pathOf));
let openLists = 0;
let jsonLdCount = 0;
const canonicals = new Map();
const seen = { title: new Map(), description: new Map() };

// ── 페이지별 ─────────────────────────────────────────
for (const file of htmlFiles) {
  const rel = relOf(file);
  const path = pathOf(file);
  const html = read(file);
  const indexable = !ALWAYS_NOINDEX.has(path) && !emptyHubs.has(path);
  const fail = (msg) => errors.push(`${rel}: ${msg}`);
  const warn = (msg) => warnings.push(`${rel}: ${msg}`);
  const meta = (attr, name) => html.match(new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`))?.[1];

  const noindex = count(html, /<meta name="robots" content="noindex/g);
  const ga = count(html, /googletagmanager\.com\/gtag\/js\?id=/g);
  const ads = count(html, /adsbygoogle|googlesyndication|googleads|doubleclick|<ins\b/g);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/g) ?? [];
  const canonicalUrl = canonical[0]?.match(/href="([^"]+)"/)[1];
  const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '');
  const description = decode(meta('name', 'description') ?? '');
  const h1 = count(html, /<h1\b/g);

  if (ads !== 0) fail(`광고 코드 ${ads}건`);
  // 환경별 robots meta·GA4(P2)
  if (env === 'production') {
    if (noindex !== (indexable ? 0 : 1)) fail(`robots noindex ${noindex}건`);
    if (ga !== 1) fail(`GA4 ${ga}건 (기대 1)`);
    // 검색어 제거(q → history.state)가 GA4 loader보다 먼저 실행돼야 한다
    const setup = html.indexOf("url.searchParams.delete('q')");
    if (setup < 0 || setup > html.indexOf('googletagmanager.com/gtag/js')) fail('GA4 검색어 제거 script가 loader보다 앞에 없음');
  } else {
    if (noindex !== 1) fail(`robots noindex ${noindex}건 (기대 1)`);
    if (ga !== 0) fail(`GA4 ${ga}건 (기대 0)`);
  }

  // title·description·canonical·H1(04 2·4·5·6장)
  if (!title) fail('title 없음');
  if (!description) fail('description 없음');
  if (path !== '/404.html') {
    const self = new URL(path, config.site).href;
    if (canonical.length !== 1) fail(`canonical ${canonical.length}개`);
    else if (canonicalUrl !== self) fail(`canonical ${canonicalUrl} (기대 ${self})`);
    else if (canonicals.has(canonicalUrl)) fail(`canonical 중복: ${canonicals.get(canonicalUrl)}`);
    canonicals.set(canonicalUrl, rel);
    if (meta('property', 'og:url') !== canonicalUrl) fail('og:url ≠ canonical');
    if (decode(meta('property', 'og:title') ?? '') !== title) fail('og:title ≠ title');
    if (decode(meta('property', 'og:description') ?? '') !== description) fail('og:description ≠ description');
  }
  if (indexable) {
    if (h1 !== 1) fail(`H1 ${h1}개`);
    const len = [...title].length;
    if (len > 40 || len < 10) warn(`title ${len}자 (권장 40자 이내)`);
    const dlen = [...description].length;
    if (dlen > 80 || dlen < 20) warn(`description ${dlen}자 (권장 80자 내외)`);
    for (const [key, value] of [['title', title], ['description', description]]) {
      if (seen[key].has(value)) warn(`${key} 중복: ${seen[key].get(value)}`);
      seen[key].set(value, rel);
    }
  }

  // JSON-LD: 모두 파싱되어야 하고, 글은 Article 필수 필드·화면 값과 일치(04 13·27장)
  const ld = [];
  for (const [, body] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    jsonLdCount++;
    try {
      ld.push(JSON.parse(body));
    } catch {
      fail('JSON-LD 파싱 실패');
    }
  }
  const types = ld.map((d) => d['@type']);
  const article = ld.find((d) => d['@type'] === 'Article');
  if (path === '/' && !(types.includes('WebSite') && types.includes('Organization'))) fail('홈 JSON-LD(WebSite·Organization) 누락');
  if (meta('property', 'og:type') === 'article') {
    if (!article) fail('Article JSON-LD 누락');
    else {
      for (const k of ['headline', 'datePublished', 'dateModified', 'author', 'publisher']) if (!article[k]) fail(`Article.${k} 누락`);
      const h1Text = decode(html.match(/<h1[^>]*>([^<]*)<\/h1>/)?.[1] ?? '');
      if (article.headline !== h1Text) fail('Article.headline ≠ 화면 H1');
      const shown = html.match(/최종 업데이트 <time[^>]*datetime="([^"]+)"/)?.[1];
      if (!article.dateModified?.startsWith(shown)) fail(`Article.dateModified ≠ 화면 최종 업데이트(${shown})`);
    }
  }
  const crumbs = ld.find((d) => d['@type'] === 'BreadcrumbList');
  const shownCrumbs = [...(html.match(/<nav class="breadcrumb"[\s\S]*?<\/nav>/)?.[0] ?? '').matchAll(/<li[^>]*>(?:<a [^>]*>|<span [^>]*>)([^<]*)</g)].map((m) => decode(m[1]));
  if (shownCrumbs.length && JSON.stringify(crumbs?.itemListElement.map((i) => i.name)) !== JSON.stringify(shownCrumbs)) fail('BreadcrumbList ≠ 화면 Breadcrumb');

  // "신청 가능" 영역(data-open-list)에 종료된 지원이 섞이면 실패
  for (const region of regions(html, 'data-open-list').map(([s, e]) => html.slice(s, e))) {
    openLists++;
    if (region.includes('data-status="closed"')) fail('신청 가능 영역에 신청 종료 카드');
    for (const [, href] of region.matchAll(/href="([^"]+)"/g)) if (closedUrls.has(href)) fail(`신청 가능 영역에 종료 지원 링크 ${href}`);
  }
  // 필터·검색 URL(?status= ?q= 등)은 링크로 만들지 않는다(색인·sitemap 대상 아님, 크롤 트랩 방지)
  if (/href="[^"]*\?[^"]*\b(status|q|category|open)=/.test(html)) fail('필터·검색 URL 링크');
  // 대분류 메뉴: 글이 있는 대분류는 모두, 글이 없는 대분류는 어디에서도 링크하지 않는다
  const nav = html.match(/<nav id="site-nav"[\s\S]*?<\/nav>/)?.[0] ?? '';
  for (const hub of hubs) {
    if (emptyHubs.has(hub)) {
      if (path !== hub && html.includes(`href="${hub}"`)) fail(`공개 글 없는 카테고리 링크 ${hub}`);
    } else if (!nav.includes(`href="${hub}"`)) fail(`메뉴에 없는 카테고리 ${hub}`);
  }
  // 검색 카테고리 필터 칩도 같은 규칙
  if (path === '/search/') {
    for (const hub of hubs) {
      const chip = html.includes(`data-category="${hub.slice(1, -1)}"`);
      if (emptyHubs.has(hub) && chip) fail(`공개 글 없는 카테고리 검색 필터 ${hub}`);
      if (!emptyHubs.has(hub) && !chip) fail(`검색 필터에 없는 카테고리 ${hub}`);
    }
  }

  // 사이트 자체 script는 benefits 허브·검색 페이지·도구(data-tool)가 있는 글에만(production GA4 loader·JSON-LD 제외)
  const siteScripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].filter(
    ([, attrs, body]) => !attrs.includes('application/ld+json') && !attrs.includes('googletagmanager.com') && !body.includes('window.dataLayer'),
  ).length;
  const hasTool = /\sdata-tool="/.test(html);
  if (siteScripts > 0 && !SCRIPT_PAGES.has(path) && !hasTool) fail(`허용되지 않은 페이지 script ${siteScripts}건`);

  // 도구 상수 기한(연료비조정단가 등 기간이 있는 값). production에서만 막는다
  if (env === 'production') {
    for (const [, until] of html.matchAll(/\sdata-valid-until="([^"]*)"/g)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(until)) fail(`도구 상수 기한 형식 오류 ${until}`);
      else if (until < todayKst) fail(`도구 상수 기한 지남(${until}, 오늘 ${todayKst}): src/tools 상수를 갱신하세요`);
      else if ((Date.parse(until) - Date.parse(todayKst)) / 864e5 <= TOOL_EXPIRY_WARN_DAYS) warn(`도구 상수 기한 임박(${until}까지, 오늘 ${todayKst})`);
    }
  }

  // 광고 슬롯(03 3·5·12·13장): 꺼져 있으면 0개. 켜져 있어도 광고 없는 페이지·main 밖·sidebar·보호 영역 안이나 바로 옆·공식 신청 버튼 위 금지
  const slots = regions(html, 'data-ad-slot');
  if (adsEnabled === 'false' && slots.length) fail(`광고가 꺼져 있는데 광고 슬롯 ${slots.length}건`);
  if (slots.length && NO_AD_PAGES.has(path)) fail('광고 없는 페이지에 광고 슬롯');
  const main = spans(html, /<(main)\b/g);
  const asides = spans(html, /<(aside)\b/g);
  const protectedAreas = regions(html, 'data-ad-protected');
  const cta = regions(html, 'data-ad-protected="official-cta"')[0];
  for (const slot of slots) {
    const id = html.slice(...slot).match(/data-ad-slot="([^"]*)"/)?.[1];
    if (!main.some((m) => within(slot, m)) || asides.some((a) => within(slot, a))) fail(`광고 슬롯 ${id}: main 본문 밖·sidebar`);
    for (const p of protectedAreas) {
      const name = html.slice(...p).match(/data-ad-protected="([^"]*)"/)?.[1];
      if (within(slot, p) || adjacent(html, slot, p)) fail(`광고 슬롯 ${id}: 보호 영역(${name}) 안 또는 인접`);
    }
    if (cta && slot[0] < cta[0]) fail(`광고 슬롯 ${id}: 공식 신청 버튼보다 위`);
  }

  rows.push({ page: path, noindex, ga, h1, jsonLd: types.join('+') || '-', title: [...title].length, desc: [...description].length });
}

// 개인정보 보호책임자 실명: 사용자가 전달하기 전에는 비워 두므로 Warning으로 알린다(05 5-E)
if (pages.has('/privacy/') && !read(join(dist, 'privacy/index.html')).includes('data-privacy-officer-name')) {
  warnings.push('privacy/index.html: 개인정보 보호책임자 이름 미입력(config/site.ts privacyOfficerName)');
}

// ── sitemap(04 8장) ──────────────────────────────────
const locs = (xml, tag) => [...xml.matchAll(new RegExp(`<${tag}>\\s*<loc>([^<]+)</loc>(?:<lastmod>([^<]+)</lastmod>)?`, 'g'))].map((m) => ({ loc: m[1], lastmod: m[2] }));
const sitemapIndex = existsSync(join(dist, 'sitemap.xml')) ? read(join(dist, 'sitemap.xml')) : '';
const children = locs(sitemapIndex, 'sitemap').map((s) => s.loc);
const partXml = Object.fromEntries(['main', 'benefits'].map((part) => [part, existsSync(join(dist, `sitemap-${part}.xml`)) ? read(join(dist, `sitemap-${part}.xml`)) : '']));
// index에는 색인 URL이 1개 이상인 하위 sitemap만(main은 항상 있다)
const expectedChildren = Object.entries(partXml).filter(([, xml]) => locs(xml, 'url').length > 0).map(([part]) => `${origin}/sitemap-${part}.xml`);
if (JSON.stringify(children) !== JSON.stringify(expectedChildren) || !children.includes(`${origin}/sitemap-main.xml`)) {
  errors.push(`sitemap.xml: 하위 sitemap ${children.join(', ') || '없음'} (기대 ${expectedChildren.join(', ')})`);
}
const inSitemap = new Map();
for (const [part, xml] of Object.entries(partXml)) {
  const name = `sitemap-${part}.xml`;
  if (!xml.includes('<urlset')) errors.push(`${name}: 없음`);
  for (const { loc, lastmod } of locs(xml, 'url')) {
    const url = new URL(loc);
    const fail = (msg) => errors.push(`${name}: ${loc} ${msg}`);
    if (url.origin !== origin) fail('다른 도메인');
    if (url.search || url.hash) fail('query·fragment 포함');
    if (!pages.has(url.pathname)) fail('실제 페이지 없음');
    if (ALWAYS_NOINDEX.has(url.pathname) || SITEMAP_EXEMPT.has(url.pathname)) fail('sitemap 제외 대상');
    if (env === 'production' && pages.has(url.pathname) && read(join(dist, url.pathname, 'index.html')).includes('content="noindex')) fail('noindex 페이지');
    if (url.pathname.startsWith('/benefits/') !== (part === 'benefits')) fail(`잘못된 sitemap(${part})`);
    if (lastmod && !/^\d{4}-\d{2}-\d{2}$/.test(lastmod)) fail(`lastmod 형식 ${lastmod}`);
    if (inSitemap.has(url.pathname)) fail('중복');
    inSitemap.set(url.pathname, name);
  }
}
for (const path of pages) {
  if (!ALWAYS_NOINDEX.has(path) && !SITEMAP_EXEMPT.has(path) && !emptyHubs.has(path) && !inSitemap.has(path)) errors.push(`${path}: sitemap 누락`);
  if (emptyHubs.has(path) && inSitemap.has(path)) errors.push(`${path}: 공개 글 없는 카테고리가 sitemap에 있음`);
}

// ── RSS(04 9장) ──────────────────────────────────────
const rss = existsSync(join(dist, 'rss.xml')) ? read(join(dist, 'rss.xml')) : '';
if (!rss.startsWith('<?xml') || !rss.includes('<rss version="2.0">') || !rss.trimEnd().endsWith('</rss>')) errors.push('rss.xml: 형식 오류 또는 없음');
const rssItems = [...rss.matchAll(/<item>[\s\S]*?<link>([^<]+)<\/link>[\s\S]*?<\/item>/g)].map((m) => m[1]);
for (const link of rssItems) if (!pages.has(new URL(link).pathname) || !link.startsWith(origin)) errors.push(`rss.xml: 실제 페이지 없음 ${link}`);

// ── robots.txt(04 10장, 05 10장) — meta robots와 모순 없게 ──
const robots = existsSync(join(dist, 'robots.txt')) ? read(join(dist, 'robots.txt')) : '';
const robotsRules = {
  production: robots === `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`,
  preview: robots === 'User-agent: *\nAllow: /\n',
  development: robots === 'User-agent: *\nDisallow: /\n',
};
if (!robotsRules[env]) errors.push(`robots.txt: ${env} 정책과 다름\n${robots}`);

// ── 검색 인덱스: 모든 항목이 실제 페이지를 가리킨다 ──
const index = JSON.parse(read(join(dist, 'search-index.json')));
for (const doc of index) if (!pages.has(doc.url)) errors.push(`search-index.json: 없는 페이지 ${doc.url}`);

console.table(rows);
if (warnings.length) console.warn(`Warning ${warnings.length}건\n- ${warnings.join('\n- ')}`);
if (errors.length) {
  console.error(`Fail ${errors.length}건\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(
  `OK (${env}, ${rows.length} pages, sitemap ${inSitemap.size} URL, RSS ${rssItems.length}건, 검색 인덱스 ${index.length}건, JSON-LD ${jsonLdCount}개, 신청 가능 영역 ${openLists}곳, 종료 지원 ${closedUrls.size}건, Warning ${warnings.length})`,
);
