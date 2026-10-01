// check-build 회귀 테스트: 정상 빌드는 통과하고, 일부러 망가뜨린 결과물은 기대한 Fail로 막히는지 확인한다.
// 사용: npm run test:seo   (production 빌드 1회 + fixture preview 빌드 1회)
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const work = mkdtempSync(join(tmpdir(), 'check-build-test-'));
const run = (cmd, args, env = {}) => spawnSync(cmd, args, { encoding: 'utf8', env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1', ...env } });
const build = (name, env) => {
  const out = join(work, name);
  const r = run('npx', ['astro', 'build', '--outDir', out], env);
  if (r.status !== 0) throw new Error(`${name} 빌드 실패\n${r.stdout}${r.stderr}`);
  return out;
};
const check = (env, dir) => {
  const r = run('node', ['tools/check-build.mjs', env, dir]);
  return { status: r.status, out: r.stdout + r.stderr };
};
const edit = (file, from, to) => (dir) => {
  const path = join(dir, file);
  const text = readFileSync(path, 'utf8');
  if (!text.includes(from)) throw new Error(`수정 대상 없음: ${file} / ${from}`);
  writeFileSync(path, text.replace(from, to));
};
const loc = (path) => `<url><loc>https://creatorjungbok.co.kr${path}</loc></url>`;
const addToMain = (xml) => edit('sitemap-main.xml', '</urlset>', `${xml}\n</urlset>`);

const TOOL = 'living/electricity-bill-calculator/index.html';
const VALID = 'data-valid-until="2026-12-31"';
const kstPlus = (days) => new Date(Date.now() + 9 * 3600e3 + days * 864e5).toISOString().slice(0, 10);

// [환경, 이름, 망가뜨리기, 기대 문구, 기대 종료 코드(기본 1 = Fail, 0 = Warning만)]
const cases = [
  ['production', 'title 없음', edit('business/index.html', '<title>', '<title data-x>'), 'title 없음'],
  ['production', 'description 없음', edit('business/index.html', '<meta name="description"', '<meta name="x-description"'), 'description 없음'],
  ['production', 'canonical 다른 도메인', edit('business/index.html', 'rel="canonical" href="https://creatorjungbok.co.kr/business/"', 'rel="canonical" href="https://www.creatorjungbok.co.kr/business/"'), 'canonical https://www.creatorjungbok.co.kr/business/'],
  ['production', 'canonical 잘못된 path', edit('living/index.html', 'rel="canonical" href="https://creatorjungbok.co.kr/living/"', 'rel="canonical" href="https://creatorjungbok.co.kr/business/"'), '(기대 https://creatorjungbok.co.kr/living/)'],
  ['production', 'H1 2개', edit('digital/index.html', '</main>', '<h1>x</h1></main>'), 'H1 2개'],
  ['production', 'noindex 페이지가 sitemap에', addToMain(loc('/search/')), 'sitemap 제외 대상'],
  ['production', 'sitemap URL에 route 없음', addToMain(loc('/business/nope/')), '실제 페이지 없음'],
  ['production', 'filter URL이 sitemap에', edit('sitemap-benefits.xml', '</urlset>', `${loc('/benefits/?status=open')}\n</urlset>`), 'query·fragment 포함'],
  ['production', 'indexable 페이지 sitemap 누락', edit('sitemap-main.xml', loc('/living/'), ''), '/living/: sitemap 누락'],
  ['production', 'production sitemap에 fixture', addToMain(loc('/business/fixture-cost/')), 'sitemap-main.xml: fixture 유출'],
  ['production', 'production RSS에 fixture', edit('rss.xml', '</channel>', '<item><link>https://creatorjungbok.co.kr/business/fixture-cost/</link></item></channel>'), 'rss.xml: fixture 유출'],
  ['production', 'JSON-LD 파싱 실패', edit('index.html', '{"@context":"https://schema.org","@type":"WebSite"', '{"@context":"https://schema.org","@type":"WebSite",'), 'JSON-LD 파싱 실패'],
  ['production', 'production robots 전체 차단', edit('robots.txt', 'Allow: /', 'Disallow: /'), 'robots.txt: production 정책과 다름'],
  ['production', 'production 색인 페이지에 noindex', edit('business/index.html', '<meta name="description"', '<meta name="robots" content="noindex, follow"><meta name="description"'), 'robots noindex 1건'],
  ['production', 'GA4 검색어 제거 누락', edit('index.html', "url.searchParams.delete('q')", "url.searchParams.get('q')"), 'GA4 검색어 제거 script가 loader보다 앞에 없음'],
  ['production', 'AdSense 광고 코드', edit('business/index.html', '</main>', '<ins class="adsbygoogle"></ins></main>'), 'business/index.html: 광고 코드'],
  ['production', '광고가 꺼져 있는데 슬롯 출력', edit('index.html', '</main>', '<div data-ad-slot="home-1"></div></main>'), '광고가 꺼져 있는데 광고 슬롯 1건'],
  ['production', '광고 없는 페이지(검색)에 슬롯', edit('search/index.html', '</main>', '<div data-ad-slot="home-1"></div></main>'), '광고 없는 페이지에 광고 슬롯'],
  ['production', '도구 없는 페이지에 script', edit('business/index.html', '</main>', '<script>1</script></main>'), '허용되지 않은 페이지 script 1건'],
  ['production', '도구 상수 기한 지남', edit(TOOL, VALID, `data-valid-until="${kstPlus(-1)}"`), '도구 상수 기한 지남'],
  ['production', '도구 상수 기한 14일 이내', edit(TOOL, VALID, `data-valid-until="${kstPlus(7)}"`), '도구 상수 기한 임박', 0],
  ['preview', 'preview는 도구 기한을 막지 않음', edit(TOOL, VALID, `data-valid-until="${kstPlus(-1)}"`), 'OK (preview', 0],
  ['production', 'sidebar에 슬롯', edit('business/index.html', '</aside>', '<div data-ad-slot="home-1"></div></aside>'), '광고 슬롯 home-1: main 본문 밖·sidebar'],
  ['preview', '공식 신청 버튼 바로 아래 슬롯', edit('benefits/fixture-open/index.html', '공식 사이트로 이동</span></a>', '공식 사이트로 이동</span></a><div data-ad-slot="benefit-mid"></div>'), '광고 슬롯 benefit-mid: 보호 영역(official-cta) 안 또는 인접'],
  ['preview', '공식 신청 버튼 위 슬롯', edit('benefits/fixture-open/index.html', '<h1', '<div data-ad-slot="benefit-mid"></div><h1'), '광고 슬롯 benefit-mid: 공식 신청 버튼보다 위'],
  ['preview', 'Article headline ≠ H1', edit('business/fixture-cost/index.html', '"headline":"예시', '"headline":"다른'), 'Article.headline ≠ 화면 H1'],
  ['preview', 'BreadcrumbList ≠ 화면', edit('business/fixture-cost/index.html', '"name":"사업·창업"', '"name":"다른 이름"'), 'BreadcrumbList ≠ 화면 Breadcrumb'],
];

let failed = 0;
try {
  const dists = { production: build('production', { SITE_ENV: 'production' }), preview: build('preview', { SHELL_PREVIEW: 'true' }) };
  for (const [env, dir] of Object.entries(dists)) {
    const r = check(env, dir);
    const ok = r.status === 0;
    if (!ok) failed++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  정상 ${env} 빌드 통과${ok ? '' : `\n${r.out.slice(-1500)}`}`);
  }
  for (const [env, name, mutate, expected, status = 1] of cases) {
    const dir = join(work, `case-${cases.findIndex((c) => c[1] === name)}`);
    cpSync(dists[env], dir, { recursive: true });
    mutate(dir);
    const r = check(env, dir);
    const ok = r.status === status && r.out.includes(expected);
    if (!ok) failed++;
    const evidence = r.out.split('\n').find((l) => l.includes(expected))?.trim();
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? `  ← ${evidence}` : `\n${r.out.slice(-1500)}`}`);
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
