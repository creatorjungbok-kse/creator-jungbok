// 글 상단 '핵심 요약' 회귀 테스트(2026-10-28 시은님 요청: '결론부터' 대신 '핵심 요약', 문장마다 나눈 목록).
// 사용: npm run test:style (빌드 결과 dist/ 가 있으면 페이지도 검사)
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { splitSummary } from '../src/lib/summary.ts';

test('요약을 문장마다 나눈다', () => {
  assert.deepEqual(splitSummary('하루 금액은 60%입니다. 상한은 68,100원이에요. 세금은 없죠!'), ['하루 금액은 60%입니다.', '상한은 68,100원이에요.', '세금은 없죠!']);
});

test('숫자 속 점에서는 자르지 않는다', () => {
  assert.deepEqual(splitSummary('3.3% 세금과 2026.9.1 발표를 봅니다. 끝입니다.'), ['3.3% 세금과 2026.9.1 발표를 봅니다.', '끝입니다.']);
});

test('괄호 뒤 마침표에서도 나눈다', () => {
  assert.deepEqual(splitSummary('서점이 있습니다(10월 27일 기준). 다음 문장입니다.'), ['서점이 있습니다(10월 27일 기준).', '다음 문장입니다.']);
});

const dist = 'dist';
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
test('빌드된 글: 핵심 요약 제목과 목록, 결론부터 없음', { skip: !existsSync(dist) }, () => {
  let n = 0;
  for (const f of walk(dist).filter((p) => p.endsWith('index.html'))) {
    const html = readFileSync(f, 'utf8');
    const m = html.match(/<section class="summary-box[^"]*"[^>]*>([\s\S]*?)<\/section>/);
    if (!m) continue;
    n++;
    assert.match(m[1], /<h2[^>]*>핵심 요약<\/h2>/, `${f}: 제목이 '핵심 요약'이 아님`);
    assert.ok((m[1].match(/<li/g) || []).length >= 1, `${f}: 요약 목록 없음`);
    assert.ok(!/<p[ >]/.test(m[1]), `${f}: 요약이 한 문단으로 남아 있음`);
    assert.ok(!html.includes('>결론부터<'), `${f}: '결론부터'가 남아 있음`);
  }
  assert.ok(n > 10, `요약 상자가 있는 글이 너무 적음(${n})`);
});

test('모든 글 요약은 해요체(문장 끝 ~니다 금지)', () => {
  const files = walk('src/content/articles').filter((p) => p.endsWith('.md') && !/\/test-/.test(p));
  for (const f of files) {
    const m = readFileSync(f, 'utf8').match(/^summary: (.*)$/m);
    if (!m) continue;
    for (const s of splitSummary(m[1])) assert.ok(!/니다[.!?]$/.test(s), `${f}: 요약 문장이 ~니다로 끝남: ${s.slice(-20)}`);
  }
});
