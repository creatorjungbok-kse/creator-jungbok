// 빌드 결과물의 환경별 head 출력 검사.
// 사용: npm run check:build -- <development|preview|production> [distDir]
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import config from '../astro.config.mjs';

const env = process.argv[2];
const dist = process.argv[3] ?? 'dist';
if (!['development', 'preview', 'production'].includes(env)) {
  console.error('환경값을 지정하세요: development | preview | production');
  process.exit(2);
}

const allFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? allFiles(path) : [path];
  });
const files = allFiles(dist);

const count = (html, re) => (html.match(re) ?? []).length;
const errors = [];
const rows = [];
const htmlFiles = files.filter((f) => f.endsWith('.html'));
const read = (f) => readFileSync(f, 'utf8');
const pathOf = (file) => '/' + relative(dist, file).split(sep).join('/').replace(/index\.html$/, '');

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

// 신청 종료된 지원사업 URL(상세 페이지의 상태 배너 기준)
const closedUrls = new Set(htmlFiles.filter((f) => read(f).includes('status-banner--closed')).map(pathOf));
let openLists = 0;

// dev·test fixture(slug fixture-*)는 production 결과물의 어떤 파일(HTML·검색 색인·sitemap·RSS 포함)에도 없어야 한다
if (env === 'production') {
  for (const file of files.filter((f) => /\.(html|json|xml|txt|js|css|webmanifest)$/.test(f))) {
    if (readFileSync(file, 'utf8').includes('fixture-')) errors.push(`${relative(dist, file)}: fixture 유출`);
  }
}

for (const file of htmlFiles) {
  const rel = relative(dist, file).split(sep).join('/');
  const html = readFileSync(file, 'utf8');
  const is404 = rel === '404.html';
  const path = pathOf(file);
  const noindex = count(html, /<meta name="robots" content="noindex/g);
  const ga = count(html, /googletagmanager\.com\/gtag\/js\?id=/g);
  const ads = count(html, /adsbygoogle|pagead2\.googlesyndication/g);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
  const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
  const fail = (msg) => errors.push(`${rel}: ${msg}`);

  if (ads !== 0) fail(`광고 스크립트 ${ads}건`);
  if (env === 'production') {
    if (noindex !== (is404 ? 1 : 0)) fail(`robots noindex ${noindex}건`);
    if (ga !== 1) fail(`GA4 ${ga}건 (기대 1)`);
  } else {
    if (noindex !== 1) fail(`robots noindex ${noindex}건 (기대 1)`);
    if (ga !== 0) fail(`GA4 ${ga}건 (기대 0)`);
  }
  if (!is404 && canonical !== new URL(path, config.site).href) fail(`canonical ${canonical}`);
  // "신청 가능" 영역(data-open-list)에 종료된 지원이 섞이면 실패
  for (const region of regions(html, 'data-open-list')) {
    openLists++;
    if (region.includes('data-status="closed"')) fail('신청 가능 영역에 신청 종료 카드');
    for (const [, href] of region.matchAll(/href="([^"]+)"/g)) if (closedUrls.has(href)) fail(`신청 가능 영역에 종료 지원 링크 ${href}`);
  }
  // 필터 URL(?status= 등)은 링크로 만들지 않는다(색인·sitemap 대상 아님)
  if (/href="[^"]*\?[^"]*status=/.test(html)) fail('필터 URL 링크');
  // 사이트 자체 script는 benefits 허브에만(production GA4 loader 제외)
  const siteScripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].filter(
    ([tag, body]) => !tag.includes('googletagmanager.com') && !body.includes('window.dataLayer'),
  ).length;
  if (siteScripts > 0 && rel !== 'benefits/index.html') fail(`허용되지 않은 페이지 script ${siteScripts}건`);
  if (!title) fail('title 없음');
  if (!description) fail('description 없음');
  rows.push({ page: path, noindex, ga, canonical: canonical ?? '-', title, descLen: description.length });
}

console.table(rows);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`OK (${env}, ${rows.length} pages, 신청 가능 영역 ${openLists}곳 검사, 종료 지원 ${closedUrls.size}건)`);
