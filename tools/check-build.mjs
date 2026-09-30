// 빌드 결과물 검사(환경별 head, SEO, sitemap·RSS·robots, fixture 유출, 신청 가능 영역, script 범위).
// Fail은 종료 코드 1, Warning은 보고만 한다(04 27장).
// 사용: npm run check:build -- <development|preview|production> [distDir]
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import config from '../astro.config.mjs';

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

// 색인 정책(04 1장): 404·검색은 항상 noindex, sitemap 제외. 신뢰 페이지 4종은 index지만 sitemap 제외
const ALWAYS_NOINDEX = new Set(['/404.html', '/search/']);
const SITEMAP_EXEMPT = new Set(['/contact/', '/privacy/', '/terms/', '/disclosure/']);
const SCRIPT_PAGES = new Set(['/benefits/', '/search/']);

// attr가 붙은 요소 전체(같은 태그의 중첩을 세어 닫는 태그까지)
function regions(html, attr) {
  const out = [];
  const start = new RegExp(`<(\\w+)[^>]*\\s${attr}(?=[\\s>=])`, 'g');
  for (let m; (m = start.exec(html)); ) {
    const tag = new RegExp(`<(/?)${m[1]}\\b[^>]*>`, 'g');
    tag.lastIndex = m.index;
    for (let t, depth = 0; (t = tag.exec(html)); ) {
      depth += t[1] ? -1 : 1;
      if (depth === 0) {
        out.push(html.slice(m.index, tag.lastIndex));
        break;
      }
    }
  }
  return out;
}

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
  const indexable = !ALWAYS_NOINDEX.has(path);
  const fail = (msg) => errors.push(`${rel}: ${msg}`);
  const warn = (msg) => warnings.push(`${rel}: ${msg}`);
  const meta = (attr, name) => html.match(new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`))?.[1];

  const noindex = count(html, /<meta name="robots" content="noindex/g);
  const ga = count(html, /googletagmanager\.com\/gtag\/js\?id=/g);
  const ads = count(html, /adsbygoogle|pagead2\.googlesyndication/g);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/g) ?? [];
  const canonicalUrl = canonical[0]?.match(/href="([^"]+)"/)[1];
  const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '');
  const description = decode(meta('name', 'description') ?? '');
  const h1 = count(html, /<h1\b/g);

  if (ads !== 0) fail(`광고 스크립트 ${ads}건`);
  // 환경별 robots meta·GA4(P2)
  if (env === 'production') {
    if (noindex !== (indexable ? 0 : 1)) fail(`robots noindex ${noindex}건`);
    if (ga !== 1) fail(`GA4 ${ga}건 (기대 1)`);
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
  for (const region of regions(html, 'data-open-list')) {
    openLists++;
    if (region.includes('data-status="closed"')) fail('신청 가능 영역에 신청 종료 카드');
    for (const [, href] of region.matchAll(/href="([^"]+)"/g)) if (closedUrls.has(href)) fail(`신청 가능 영역에 종료 지원 링크 ${href}`);
  }
  // 필터·검색 URL(?status= ?q= 등)은 링크로 만들지 않는다(색인·sitemap 대상 아님, 크롤 트랩 방지)
  if (/href="[^"]*\?[^"]*\b(status|q|category|open)=/.test(html)) fail('필터·검색 URL 링크');
  // 사이트 자체 script는 benefits 허브와 검색 페이지에만(production GA4 loader·JSON-LD 제외)
  const siteScripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].filter(
    ([, attrs, body]) => !attrs.includes('application/ld+json') && !attrs.includes('googletagmanager.com') && !body.includes('window.dataLayer'),
  ).length;
  if (siteScripts > 0 && !SCRIPT_PAGES.has(path)) fail(`허용되지 않은 페이지 script ${siteScripts}건`);

  rows.push({ page: path, noindex, ga, h1, jsonLd: types.join('+') || '-', title: [...title].length, desc: [...description].length });
}

// ── sitemap(04 8장) ──────────────────────────────────
const locs = (xml, tag) => [...xml.matchAll(new RegExp(`<${tag}>\\s*<loc>([^<]+)</loc>(?:<lastmod>([^<]+)</lastmod>)?`, 'g'))].map((m) => ({ loc: m[1], lastmod: m[2] }));
const sitemapIndex = existsSync(join(dist, 'sitemap.xml')) ? read(join(dist, 'sitemap.xml')) : '';
const children = locs(sitemapIndex, 'sitemap').map((s) => s.loc);
const expectedChildren = ['/sitemap-main.xml', '/sitemap-benefits.xml'].map((p) => origin + p);
if (JSON.stringify(children) !== JSON.stringify(expectedChildren)) errors.push(`sitemap.xml: 하위 sitemap ${children.join(', ') || '없음'}`);
const inSitemap = new Map();
for (const part of ['main', 'benefits']) {
  const name = `sitemap-${part}.xml`;
  const xml = existsSync(join(dist, name)) ? read(join(dist, name)) : '';
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
  if (!ALWAYS_NOINDEX.has(path) && !SITEMAP_EXEMPT.has(path) && !inSitemap.has(path)) errors.push(`${path}: sitemap 누락`);
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
