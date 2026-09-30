// 검색 정규화·점수·정렬 테스트. 사용: npm run test:search
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalize, queryTerms, search } from '../src/lib/search.ts';

const doc = (url, title, { s = '', m = '', status, category = 'living', updated = '2026.09.01', type = 'cost' } = {}) => ({
  url, title, category, categoryName: category, type, summary: m, status, updated,
  t: normalize(title), s: normalize(s), m: normalize(m),
});
const urls = (list) => list.map((d) => d.url);

const docs = [
  doc('/living/move-in-cleaning/', '입주청소 비용, 평수별 정리', { s: '입주청소 비용 새집청소' }),
  doc('/living/moving-cost/', '포장이사 비용', { s: '포장이사 비용', m: '입주청소와 함께 알아보는 이사 비용' }),
  doc('/business/card-terminal/', '카드단말기 설치 비용', { s: '카드기 설치비', category: 'business' }),
  doc('/benefits/energy-open/', '에너지 요금 지원', { s: '에너지바우처', m: '저소득 가구 지원사업', status: 'open', category: 'benefits', type: 'benefit' }),
  doc('/benefits/energy-closed/', '에너지 요금 지원 (지난 회차)', { s: '에너지바우처', m: '지원사업', status: 'closed', category: 'benefits', type: 'benefit', updated: '2026.09.30' }),
  doc('/benefits/energy-guide/', '에너지 비용 줄이는 지원 확인법', { s: '에너지 지원', category: 'benefits', type: 'guide', updated: '2026.09.20' }),
];

test('정규화: 공백·문장부호 제거, 소문자, 동의어 통일', () => {
  assert.equal(normalize(' 입주 청소 · 비용 '), '입주청소비용');
  assert.equal(normalize('이사청소'), '입주청소');
  assert.equal(normalize('보조금 접수'), '지원금신청');
  assert.equal(normalize('ChatGPT 요금'), 'chatgpt요금');
});

test('검색어: 끝에 붙은 비용·가격 등은 떼고, 일반어만 남으면 그대로', () => {
  assert.deepEqual(queryTerms('입주청소비용'), ['입주청소']);
  assert.deepEqual(queryTerms('입주청소 얼마'), ['입주청소']);
  assert.deepEqual(queryTerms('비용'), ['비용']);
  assert.deepEqual(queryTerms('   '), []);
});

test('정확한 제목이 가장 먼저', () => assert.equal(search(docs, '포장이사 비용')[0].url, '/living/moving-cost/'));
test('제목 일치가 요약 일치보다 먼저', () => assert.deepEqual(urls(search(docs, '입주청소')), ['/living/move-in-cleaning/', '/living/moving-cost/']));
test('띄어쓰기가 달라도 찾는다', () => assert.equal(search(docs, '카드 단말기')[0].url, '/business/card-terminal/'));
test('동의어 묶음(이사청소 = 입주청소)', () => assert.equal(search(docs, '이사청소 가격')[0].url, '/living/move-in-cleaning/'));
test('글별 동의어(synonyms)', () => assert.deepEqual(urls(search(docs, '카드기')), ['/business/card-terminal/']));
test('카테고리 필터', () => assert.deepEqual(urls(search(docs, '입주청소', { category: 'business' })), []));
test('신청 가능 지원이 앞, 종료 지원은 최근이어도 맨 뒤', () =>
  assert.deepEqual(urls(search(docs, '에너지 지원')), ['/benefits/energy-open/', '/benefits/energy-guide/', '/benefits/energy-closed/']));
test('신청 가능만 보기', () => assert.deepEqual(urls(search(docs, '에너지', { openOnly: true })), ['/benefits/energy-open/']));
test('동의어: 보조금 → 지원사업을 쓴 글', () => assert.ok(urls(search(docs, '보조금')).includes('/benefits/energy-open/')));
test('모든 핵심어가 있어야 결과', () => assert.deepEqual(search(docs, '입주청소 자동차'), []));
test('결과 0건', () => assert.deepEqual(search(docs, '자동차보험'), []));

// ── 안전장치 ─────────────────────────────────────────
test('비용·가격·요금·얼마·견적만 검색하면 빈 검색어로 만들지 않는다', () => {
  for (const w of ['비용', '가격', '요금', '얼마', '견적']) assert.deepEqual(queryTerms(w), [w]);
  assert.deepEqual(queryTerms('인터넷 요금'), ['인터넷']);
  assert.deepEqual(queryTerms('포장이사비용'), ['포장이사']);
});

test('정규화 후 빈 검색어는 전체 결과가 아니라 0건', () => {
  for (const q of ['', '   ', '!!!', '· - ·']) assert.deepEqual(search(docs, q), []);
});

test('HTML·스크립트 형태의 검색어는 문자열로만 비교되고 결과를 만들지 않는다', () => {
  assert.deepEqual(search(docs, '<img src=x onerror=alert(1)>'), []);
  assert.deepEqual(search(docs, '<script>alert(1)</script>'), []);
});

test('검색 페이지 script는 HTML 문자열을 삽입하지 않는다(textContent·검증된 인덱스 URL만)', async () => {
  const { readFileSync } = await import('node:fs');
  const page = readFileSync(new URL('../src/pages/search/index.astro', import.meta.url), 'utf8');
  const script = page.slice(page.indexOf('<script>'), page.indexOf('</script>'));
  assert.doesNotMatch(script, /innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(|new Function/);
  // 결과 링크 주소는 인덱스의 url만 쓴다
  assert.match(script, /link\.href = doc\.url;/);
});
