// 새 문체로 다시 쓴 글(tools/style-v2.txt)의 가독성 규칙을 검사한다.
// 1) 소제목에 문장부호(? ! … ~ ...)를 쓰지 않는다
// 2) 한 문단은 3문장까지
// 3) '직접 겪은 일:' 같은 꼬리표·인용 상자로 경험을 붙이지 않는다(본문에 녹인다)
// 4) 본문 문장 끝이 '~니다'로만 이어지지 않는다(해요체 위주로 섞는다)
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

export function checkStyle(md) {
  const body = md.replace(/^---[\s\S]*?\n---\n/, '');
  const errors = [];
  const lines = body.split('\n');
  for (const l of lines) {
    if (/^#{2,4} /.test(l) && /[?!…~]|\.\.\./.test(l)) errors.push(`소제목 문장부호: ${l.trim()}`);
    if (/^>\s*\*\*(직접 겪은 일|실제로 있었던 일)\*\*/.test(l)) errors.push(`경험 꼬리표: ${l.trim().slice(0, 40)}`);
  }
  // 문단: 빈 줄로 나뉜 일반 텍스트 블록(목록·표·HTML·제목 제외)
  const paras = body.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p && !/^(#|-|\d+\.|\||<|>)/.test(p));
  let total = 0, formal = 0;
  for (const p of paras) {
    const text = p.replace(/\([^)]*\)/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
    const sentences = text.split(/(?<=[.!?])\s+(?=\S)/).filter((s) => /[가-힣]/.test(s) && /[.!?]$/.test(s.trim()));
    if (sentences.length > 3) errors.push(`긴 문단(${sentences.length}문장): ${p.slice(0, 40)}`);
    for (const s of sentences) { total++; if (/니다[.!?]*$/.test(s.trim())) formal++; }
  }
  if (total >= 10 && formal / total > 0.4) errors.push(`'~니다' 문장 비율이 너무 높음: ${formal}/${total}`);
  return errors;
}

const files = readFileSync(new URL('./style-v2.txt', import.meta.url), 'utf8').split('\n').map((s) => s.trim()).filter((s) => s && !s.startsWith('#'));
for (const f of files) {
  test(`문체 규칙: ${f}`, () => {
    const errs = checkStyle(readFileSync(f, 'utf8'));
    assert.deepEqual(errs, []);
  });
}

test('검사기 자체: 위반 사례를 잡는다', () => {
  const bad = '---\na: 1\n---\n## 이건 되나요?\n\n> **직접 겪은 일**: 해 봤어요.\n\n하나입니다. 둘입니다. 셋입니다. 넷입니다.\n';
  const errs = checkStyle(bad);
  assert.ok(errs.some((e) => e.startsWith('소제목')));
  assert.ok(errs.some((e) => e.startsWith('경험 꼬리표')));
  assert.ok(errs.some((e) => e.startsWith('긴 문단')));
});
