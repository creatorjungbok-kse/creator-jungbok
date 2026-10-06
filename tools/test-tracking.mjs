// GA4 측정 계약 테스트(02 1-E). 브라우저 없이 소스 코드로 "GA로 무엇을 보낼 수 있는가"를 고정한다. 사용: npm run test:tracking
// - GA 전송(gtag)은 BaseLayout 한 곳에서만
// - 이벤트 이름·파라미터 이름은 허용 목록만, 링크 글자·입력값·결과값 같은 필드 금지
// - 계산기 신호는 고정된 이름 문자열 하나만 담고, 이름↔계산기 페이지 대응이 실제 계산기 글과 맞아야 한다
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ALLOWED_EVENTS = {
  official_cta_click: [],
  feedback_helpful: [],
  feedback_not_helpful: [],
  related_click: ['link_path', 'link_position'],
  internal_link_click: ['link_path'],
  tool_use: ['tool_name'],
};
const TOOL_PAGES = {
  'electricity-bill': '/living/electricity-bill-calculator/',
  'mvno-plan-cost': '/digital/mvno-plan-comparison/',
};
const FORBIDDEN = /\b(link_text|link_url|text|value|kwh|kWh|price|amount|bill|result|query|search_term|q|name|input)\s*:/;

const files = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
const srcFiles = files('src').filter((p) => /\.(astro|ts|js|mjs)$/.test(p));
const base = readFileSync('src/layouts/BaseLayout.astro', 'utf8');

// gtag('event', 이름식, 파라미터식?) 호출을 괄호 짝을 맞춰 잘라낸다
const gtagEventCalls = (code) => {
  const calls = [];
  for (let i = code.indexOf("gtag('event'"); i !== -1; i = code.indexOf("gtag('event'", i + 1)) {
    let depth = 0;
    let j = code.indexOf('(', i);
    for (; j < code.length; j++) {
      if (code[j] === '(') depth++;
      else if (code[j] === ')' && --depth === 0) break;
    }
    calls.push(code.slice(code.indexOf(',', i) + 1, j).trim());
  }
  return calls;
};
const calls = gtagEventCalls(base);
// 파라미터 객체와 비교식(=== '값')을 뺀 나머지 문자열 상수가 이벤트 이름이다(삼항식이면 여러 개)
const eventNames = (call) =>
  [...call.replace(/\{[^{}]*\}/g, '').replace(/[!=]==\s*'[^']*'/g, '').matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);

test('GA 전송(gtag)은 BaseLayout에서만 한다', () => {
  const others = srcFiles.filter((p) => !p.endsWith('BaseLayout.astro') && /\bgtag\s*\(/.test(readFileSync(p, 'utf8')));
  assert.deepEqual(others, []);
});

test('이벤트 이름은 허용 목록만 쓴다', () => {
  assert.ok(calls.length > 0, 'gtag event 호출을 찾지 못함');
  for (const call of calls) {
    const names = eventNames(call);
    assert.ok(names.length > 0, `이벤트 이름이 문자열 상수가 아님: ${call}`);
    for (const n of names) assert.ok(n in ALLOWED_EVENTS, `허용되지 않은 이벤트: ${n}`);
  }
});

test('이벤트별 파라미터는 허용된 키만, 금지 필드 없음', () => {
  for (const call of calls) {
    const names = eventNames(call);
    const name = names[0];
    assert.ok(names.every((n) => ALLOWED_EVENTS[n]?.length === ALLOWED_EVENTS[name]?.length), `${call}: 파라미터가 다른 이벤트를 한 호출에 섞음`);
    const objects = [...call.matchAll(/\{([^{}]*)\}/g)].map((m) => m[1]);
    for (const body of objects) {
      assert.doesNotMatch(body, FORBIDDEN, `${name}: 금지 필드 ${body}`);
      const keys = body
        .split(',')
        .map((k) => k.trim().split(':')[0].trim())
        .filter(Boolean);
      for (const k of keys) assert.ok(ALLOWED_EVENTS[name].includes(k), `${name}: 허용되지 않은 파라미터 ${k}`);
    }
    if (ALLOWED_EVENTS[name].length === 0) assert.equal(objects.length, 0, `${name}는 파라미터 없이 보낸다`);
  }
});

test('계산기 이름↔페이지 대응이 BaseLayout과 계산기 글에서 일치한다', () => {
  const m = base.match(/const toolPages = (\{[^}]*\});/);
  assert.ok(m, 'BaseLayout에 toolPages가 없음');
  const inBase = Function(`return ${m[1]}`)();
  assert.deepEqual(inBase, TOOL_PAGES);
  // 각 계산기 글의 tool 필드와 URL이 대응과 같아야 한다
  const fromContent = {};
  for (const p of files('src/content/articles')) {
    const tool = readFileSync(p, 'utf8').match(/^tool: ([a-z-]+)$/m)?.[1];
    if (tool) {
      const [, category, slug] = p.replaceAll('\\', '/').match(/articles\/([^/]+)\/([^/]+)\.md$/);
      fromContent[tool] = `/${category}/${slug}/`;
    }
  }
  assert.deepEqual(fromContent, TOOL_PAGES);
  assert.match(base, /toolPages\[tool_name\] !== location\.pathname/, '현재 페이지 대조가 빠짐');
  assert.match(base, /toolSent\.has\(tool_name\)/, '중복 방지가 빠짐');
});

test('계산기 신호는 고정 이름 문자열만 담는다(입력·결과 값 없음)', () => {
  let total = 0;
  for (const p of srcFiles) {
    const code = readFileSync(p, 'utf8');
    const all = code.match(/kkultip:tool-use/g)?.length ?? 0;
    if (!all || p.endsWith('BaseLayout.astro')) continue;
    const strict = [...code.matchAll(/new CustomEvent\('kkultip:tool-use', \{ detail: '([a-z-]+)' \}\)/g)];
    assert.equal(strict.length, all, `${p}: detail이 고정 문자열이 아닌 신호가 있음`);
    for (const s of strict) assert.ok(s[1] in TOOL_PAGES, `${p}: 허용되지 않은 계산기 이름 ${s[1]}`);
    total += strict.length;
  }
  assert.equal(total, Object.keys(TOOL_PAGES).length, '계산기마다 신호가 정확히 1곳');
});

test('링크 측정은 경로(pathname)만 보내고 query·hash·링크 글자를 쓰지 않는다', () => {
  const start = base.indexOf('// 클릭 측정');
  const end = base.indexOf('// 계산기 사용');
  assert.ok(start !== -1 && end > start, '클릭 측정 구역을 찾지 못함');
  const click = base.slice(start, end);
  assert.match(click, /const link_path = url\.pathname;/);
  assert.doesNotMatch(click, /url\.(search|searchParams|hash|href)\b/);
  assert.doesNotMatch(click, /\.(textContent|innerText|innerHTML|title)\b/);
  assert.match(click, /url\.origin !== location\.origin/, '같은 사이트 판별이 빠짐');
});
