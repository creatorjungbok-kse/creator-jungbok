// 운영자 경험 문장이 여러 글에 거의 똑같이 들어가지 않았는지 확인한다.
// 같은 경험을 다른 글에서 언급할 수는 있지만, 문장은 그 글 주제에 맞게 달라야 한다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = ['src/content/articles', 'src/content/benefits'];
const FIRST_PERSON = /(^|[\s"'(])(저는|저도|제가|저희|제 )/;
const THRESHOLD = Number(process.env.EXP_DUP_T || 0.6);

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.md') ? [p] : [];
  });
}

function body(text) {
  const m = text.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return m ? m[1] : text;
}

function sentences(text) {
  // 1인칭 문장이 있는 문단의 모든 문장을 경험 문장으로 본다.
  return body(text)
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => !p.startsWith('<') && !p.startsWith('|') && !p.startsWith('#') && !p.startsWith('>'))
    .filter((p) => FIRST_PERSON.test(p) && !p.startsWith('-'))
    .flatMap((p) => p.split(/(?<=[.!?요])\s+/))
    .map((x) => x.trim())
    .filter((x) => x.length >= 15 && !/기준이에요|기준입니다/.test(x));
}

function bigrams(s) {
  const t = s.replace(/[^가-힣A-Za-z0-9]/g, '');
  const set = new Set();
  for (let i = 0; i < t.length - 1; i++) set.add(t.slice(i, i + 2));
  return set;
}

function jaccard(a, b) {
  // 짧은 쪽 문장의 글자쌍이 긴 쪽에 얼마나 들어 있는지(포함 비율)
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (Math.min(a.size, b.size) || 1);
}

export function findDuplicates(files) {
  const items = files.flatMap((f) => sentences(readFileSync(f, 'utf8')).map((s) => ({ f, s, g: bigrams(s) })));
  const dups = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (items[i].f === items[j].f) continue;
      const score = jaccard(items[i].g, items[j].g);
      if (score >= THRESHOLD) dups.push({ a: items[i], b: items[j], score });
    }
  }
  return dups;
}

test('운영자 경험 문장이 다른 글과 거의 똑같지 않음', () => {
  const files = ROOTS.flatMap(walk);
  const dups = findDuplicates(files);
  const msg = dups
    .map((d) => `${d.score.toFixed(2)}\n  ${d.a.f}: ${d.a.s.slice(0, 80)}\n  ${d.b.f}: ${d.b.s.slice(0, 80)}`)
    .join('\n');
  assert.equal(dups.length, 0, `비슷한 경험 문장:\n${msg}`);
});
