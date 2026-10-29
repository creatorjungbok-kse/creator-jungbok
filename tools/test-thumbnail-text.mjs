// 운영자 규칙(2026-10-29): 썸네일 글자는 제목에서 가져온다.
// tools/thumbnail-text.json 의 [첫 줄, 빨간 상자, 뒤 글자] 낱말이 모두 글 제목에 있어야 한다.
// 제목에 없는 말(예: 총정리)을 썸네일에 넣으면 실패한다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const manifest = JSON.parse(readFileSync(join(root, 'tools/thumbnail-text.json'), 'utf8'));
const files = [];
for (const base of ['src/content/articles', 'src/content']) {
  const dir = join(root, base);
  for (const d of readdirSync(dir, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    for (const f of readdirSync(join(dir, d.name))) if (f.endsWith('.md')) files.push(join(dir, d.name, f));
  }
}
const find = (slug) => files.find((f) => f.endsWith(`/${slug}.md`));
const fm = (md, key) => (md.match(new RegExp(`^${key}: (.*)$`, 'm')) || [])[1]?.trim();

export function missingWords(title, parts) {
  const t = title.replace(/\s+/g, '').toLowerCase();
  return parts.join(' ').split(/\s+/).filter((w) => w && w !== '·').filter((w) => !t.includes(w.toLowerCase()));
}

test('검사기 자체: 제목에 없는 말은 잡는다', () => {
  assert.deepEqual(missingWords('연차 계산기 발생 기준', ['연차 계산기', '발생 기준', '총정리']), ['총정리']);
  assert.deepEqual(missingWords('클로드 코드 요금제 Pro와 Max 차이', ['클로드 코드 요금제', 'Pro · Max 차이', '']), []);
});

for (const [slug, parts] of Object.entries(manifest)) {
  test(`썸네일 글자가 제목에 있음: ${slug}`, () => {
    const f = find(slug);
    assert.ok(f, `글 파일 없음: ${slug}`);
    const md = readFileSync(f, 'utf8');
    const title = fm(md, 'title');
    assert.deepEqual(missingWords(title, parts), [], `제목 "${title}"에 없는 썸네일 글자`);
    assert.equal(fm(md, 'thumbnail'), `/images/thumbnails/${slug}.webp`);
    assert.ok(existsSync(join(root, 'public/images/thumbnails', `${slug}.webp`)));
  });
}
