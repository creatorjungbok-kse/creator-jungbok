// 관련 글("다음에 볼 정보") 계산 테스트. 사용: npm run test:related
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { relatedItems } from '../src/lib/related.ts';

const d = (ymd) => new Date(`${ymd}T00:00:00Z`);
// 최소 형태의 가짜 글
const art = (slug, data = {}, category = 'business') => ({
  kind: 'article',
  category,
  url: `/${category}/${slug}/`,
  entry: { data: { topics: ['small-business'], dateModified: d('2026-10-01'), ...data } },
});
const closedBenefit = (slug) => ({
  kind: 'benefit',
  category: 'benefits',
  url: `/benefits/${slug}/`,
  entry: {
    data: {
      topics: ['small-business'],
      dateModified: d('2026-10-01'),
      program: { application: { mode: 'period', start: d('2020-01-01'), end: d('2020-01-31') } },
    },
  },
});
const urls = (items) => items.map((i) => i.url);

const a = art('a');
const b = art('b', { dateModified: d('2026-10-05') });
const c = art('c', { dateModified: d('2026-10-04') });
const p = art('pillar-guide', { dateModified: d('2026-09-01') });
const other = art('other', { topics: ['telecom'] }, 'digital');
const closed = closedBenefit('ended');

test('1. relatedAuto 없음: 수동 → pillar → 같은 주제, 최대 3개 (기존 동작)', () => {
  const item = art('x', { related: ['/digital/other/'], pillar: '/business/pillar-guide/' });
  const all = [item, a, b, c, p, other];
  assert.deepEqual(urls(relatedItems(item, all)), ['/digital/other/', '/business/pillar-guide/', '/business/b/']);
});

test('2. relatedAuto: true는 필드가 없을 때와 결과가 같다', () => {
  const base = { related: ['/digital/other/'], pillar: '/business/pillar-guide/' };
  const without = art('x', base);
  const withTrue = art('x', { ...base, relatedAuto: true });
  const all = (item) => [item, a, b, c, p, other];
  assert.deepEqual(urls(relatedItems(withTrue, all(withTrue))), urls(relatedItems(without, all(without))));
});

test('3. relatedAuto: false + related 2개: 그 2개만 순서대로, 같은 주제 글을 섞지 않는다', () => {
  const item = art('x', { relatedAuto: false, related: ['/business/c/', '/business/a/'] });
  assert.deepEqual(urls(relatedItems(item, [item, a, b, c, p, other])), ['/business/c/', '/business/a/']);
});

test('4. relatedAuto: false: 수동 목록의 종료된 지원 글은 뺀다', () => {
  const item = art('x', { relatedAuto: false, related: ['/benefits/ended/', '/business/a/'] });
  assert.deepEqual(urls(relatedItems(item, [item, a, b, closed])), ['/business/a/']);
});

test('5. relatedAuto: false + related 없음: 0개 (영역 숨김)', () => {
  const item = art('x', { relatedAuto: false });
  assert.deepEqual(relatedItems(item, [item, a, b, c, p]), []);
  const emptyList = art('y', { relatedAuto: false, related: [] });
  assert.deepEqual(relatedItems(emptyList, [emptyList, a, b, c, p]), []);
});

test('6. relatedAuto: false: pillar도 자동으로 넣지 않는다', () => {
  const item = art('x', { relatedAuto: false, pillar: '/business/pillar-guide/' });
  assert.deepEqual(relatedItems(item, [item, a, p]), []);
});

test('7. relatedAuto: false: 수동 목록에 자기 자신이 있으면 빼고 나머지 순서는 유지한다', () => {
  const item = art('x', { relatedAuto: false, related: ['/business/b/', '/business/x/', '/business/a/'] });
  assert.deepEqual(urls(relatedItems(item, [item, a, b, c])), ['/business/b/', '/business/a/']);
});
