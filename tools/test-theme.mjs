// 블로그 테마(B안 매거진형, 2026-10-26) 회귀 테스트. 사용: npm run test:theme (production build 후)
// - 모든 공개 글·지원사업에 썸네일이 있고 파일이 실제로 있다(홈 카드에 회색 대체 칸이 생기지 않게)
// - config/home.ts의 인기 글 주소가 모두 실제 글이다
// - 홈에 대표 글·요즘 많이 찾는 글·최신 글(이미지 카드)·운영자 상자·헤더 검색이 있다
// - 글 화면에 운영자 상자와 이미지 카드 관련 글이 있다
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const root = new URL('..', import.meta.url).pathname;
const dist = join(root, 'dist');
const mdFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? mdFiles(join(dir, e.name)) : e.name.endsWith('.md') ? [join(dir, e.name)] : []));
const fm = (file) => readFileSync(file, 'utf8').split('---')[1];

test('모든 글·지원사업에 썸네일 파일이 있다', () => {
  for (const f of [...mdFiles(join(root, 'src/content/articles')), ...mdFiles(join(root, 'src/content/benefits'))]) {
    const m = fm(f).match(/^thumbnail:\s*(\S+)/m);
    assert.ok(m, `썸네일 없음: ${f.slice(root.length)}`);
    assert.ok(existsSync(join(root, 'public', m[1])), `썸네일 파일 없음: ${m[1]}`);
  }
});

test('인기 글 목록 주소가 모두 실제 글이다', () => {
  const src = readFileSync(join(root, 'src/config/home.ts'), 'utf8');
  const urls = [...src.matchAll(/'(\/[^']+\/)'/g)].map((m) => m[1]);
  assert.ok(urls.length >= 5, '인기 글이 5개 미만');
  for (const u of urls) assert.ok(existsSync(join(dist, u, 'index.html')), `없는 주소: ${u}`);
});

test('홈 구성(대표 글·요즘 많이 찾는 글·최신 글·운영자·헤더 검색)', () => {
  const html = readFileSync(join(dist, 'index.html'), 'utf8');
  assert.match(html, /class="[^"]*lead-main/, '대표 글 없음');
  assert.match(html, /요즘 많이 찾는 글/, '요즘 많이 찾는 글 없음');
  const latest = html.split('class="latest"')[1]?.split('</section>')[0] ?? '';
  assert.ok((latest.match(/card--tile/g) ?? []).length >= 3, '최신 글 카드가 3개 미만');
  assert.ok(!/class="thumb[^"]*"[^>]*>\s*<span/.test(latest), '최신 글에 썸네일 없는 카드');
  assert.match(html, /class="author/, '운영자 상자 없음');
  assert.match(html, /class="header-search"/, '홈 헤더 검색 없음');
});

test('글 화면: 운영자 상자와 이미지 카드 관련 글', () => {
  const html = readFileSync(join(dist, 'work/unemployment-benefit/index.html'), 'utf8');
  assert.match(html, /class="author author--full/, '글 끝 운영자 상자 없음');
  assert.match(html, /related-grid[\s\S]*card--tile/, '관련 글 이미지 카드 없음');
});
