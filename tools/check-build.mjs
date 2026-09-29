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

const htmlFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? htmlFiles(path) : name.endsWith('.html') ? [path] : [];
  });

const count = (html, re) => (html.match(re) ?? []).length;
const errors = [];
const rows = [];

for (const file of htmlFiles(dist)) {
  const rel = relative(dist, file).split(sep).join('/');
  const html = readFileSync(file, 'utf8');
  const is404 = rel === '404.html';
  const isDev = rel.startsWith('dev/');
  const path = '/' + rel.replace(/index\.html$/, '');
  const noindex = count(html, /<meta name="robots" content="noindex/g);
  const ga = count(html, /googletagmanager\.com\/gtag\/js\?id=/g);
  const ads = count(html, /adsbygoogle|pagead2\.googlesyndication/g);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
  const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
  const fail = (msg) => errors.push(`${rel}: ${msg}`);

  if (ads !== 0) fail(`광고 스크립트 ${ads}건`);
  if (env === 'production') {
    if (isDev) fail('production에 dev 페이지 포함');
    if (noindex !== (is404 ? 1 : 0)) fail(`robots noindex ${noindex}건`);
    if (ga !== 1) fail(`GA4 ${ga}건 (기대 1)`);
  } else {
    if (noindex !== 1) fail(`robots noindex ${noindex}건 (기대 1)`);
    if (ga !== 0) fail(`GA4 ${ga}건 (기대 0)`);
  }
  if (!is404 && !isDev && canonical !== new URL(path, config.site).href) fail(`canonical ${canonical}`);
  if (!title) fail('title 없음');
  if (!description) fail('description 없음');
  rows.push({ page: path, noindex, ga, canonical: canonical ?? '-', title, descLen: description.length });
}

console.table(rows);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`OK (${env}, ${rows.length} pages)`);
