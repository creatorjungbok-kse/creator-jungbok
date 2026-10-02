// 콘텐츠 스키마·교차 검증 테스트. 저장소 콘텐츠를 건드리지 않고 임시 폴더에 프로젝트를 복사해 빌드한다.
// 사용: npm run test:content [-- 케이스이름...]
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const root = resolve('.');

const cost = `---
title: 테스트 카드단말기 비용
subcategory: payment
contentType: cost
contentMode: evergreen
primaryQuery: 테스트 카드단말기 비용
summary: 스키마 검증용 테스트 글
datePublished: 2026-09-01
dateModified: 2026-09-20
researchedAt: 2026-09-20
author: operator
ymyl: low
topics: [small-business]
pillar: /business/test-startup-guide/
sourceIds: [nts]
localSources:
  - id: local:vendor-a
    title: 테스트 업체 가격표
    publisher: 테스트 업체
    url: https://example.com/price
    level: S2
    checkedAt: 2026-09-20
priceItems:
  - label: 유선 단말기
    min: 100000
    max: 200000
    vat: excluded
    sourceIds: [local:vendor-a]
    confidence: L2
  - label: 설치 상담
    text: 무료
changelog:
  - date: 2026-09-20
    summary: 가격 재확인
---
본문
`;

const guide = `---
title: 테스트 창업 비용 가이드
subcategory: startup
contentType: guide
contentMode: evergreen
primaryQuery: 테스트 창업 초기 비용
summary: 스키마 검증용 테스트 글
datePublished: 2026-09-01
dateModified: 2026-09-01
researchedAt: 2026-09-01
author: operator
ymyl: low
topics: [small-business]
related: [/business/test-card-terminal/]
sourceIds: [nts]
checklist:
  items: [테스트 준비 항목]
---
본문
`;

const benefitsGuide = `---
title: 테스트 혜택 확인 방법
subcategory: grants
contentType: guide
contentMode: evergreen
primaryQuery: 테스트 혜택 확인
summary: 스키마 검증용 테스트 글
datePublished: 2026-09-01
dateModified: 2026-09-01
researchedAt: 2026-09-01
author: operator
ymyl: medium
topics: [housing]
sourceIds: [gov24]
notes: [테스트 주의 사항]
actionLinks:
  - org: 정부24
    action: check
    url: https://www.gov.kr/
    sourceId: gov24
---
`;

const benefit = `---
title: 테스트 에너지바우처
subcategory: bill-relief
contentMode: evergreen
primaryQuery: 테스트 에너지바우처
summary: 스키마 검증용 테스트 글
datePublished: 2026-09-01
dateModified: 2026-09-01
researchedAt: 2026-09-01
author: operator
topics: [energy]
audience: [low-income]
program:
  officialName: 테스트 에너지바우처
  operator: 테스트 기관
  programType: recurring
  seriesKey: test-energy-voucher
  region: 전국
  eligibility:
    - text: 테스트 조건
      sourceId: gov24
  benefit:
    kind: voucher
    text: 테스트 금액
    sourceId: gov24
  application:
    mode: period
    start: 2026-10-01
    end: 2026-12-31
    officialUrl: https://www.gov.kr/
  lastStatusCheckedAt: 2026-09-20
  officialSourceIds: [gov24]
actionLinks:
  - org: 정부24
    action: application
    url: https://www.gov.kr/
    sourceId: gov24
---
본문
`;

const valid = {
  'articles/business/test-card-terminal.md': cost,
  'articles/business/test-startup-guide.md': guide,
  'articles/benefits/test-check-benefits.md': benefitsGuide,
  'benefits/test-energy-voucher.md': benefit,
};

const edit = (file, from, to) => (f) => {
  if (!f[file].includes(from)) throw new Error(`fixture 수정 실패: ${file} / ${from}`);
  f[file] = f[file].replace(from, to);
};
const add = (file, content) => (f) => {
  f[file] = content;
};
const C = 'articles/business/test-card-terminal.md';
const B = 'benefits/test-energy-voucher.md';
const G = 'articles/benefits/test-check-benefits.md';
// 행동 링크 한 개를 바꾼다(G의 정부24 링크)
const link = (url, extra = '') => edit(G, '    url: https://www.gov.kr/\n    sourceId: gov24', `    url: ${url}\n    sourceId: gov24${extra}`);
const localOfficial = (hosts) =>
  edit(G, 'notes: [테스트 주의 사항]', `notes: [테스트 주의 사항]\nlocalSources:\n  - id: local:city\n    title: 테스트시청\n    publisher: 테스트시\n    url: https://www.test-city.go.kr/notice/1\n    level: S1\n    checkedAt: 2026-09-20${hosts ? `\n    actionHosts: [${hosts}]` : ''}`);

// [이름, 수정, 기대 오류 문구(없으면 통과 기대)]
const cases = [
  ['valid', () => {}, null],
  ['unknown-category-folder', add('articles/unknown/test-x.md', guide.replace('테스트 창업 초기 비용', '테스트 기타')), '콘텐츠 파일 경로 오류'],
  ['unknown-subcategory', edit(C, 'subcategory: payment', 'subcategory: nope'), '없는 subcategory'],
  ['unknown-topic', edit(C, 'topics: [small-business]', 'topics: [nope]'), 'topics'],
  ['fixture-prefix-in-real-content', add('articles/living/fixture-moving.md', guide.replace('테스트 창업 초기 비용', '테스트 이사')), 'fixture 전용'],
  ['frontmatter-slug', edit(C, 'contentMode: evergreen', 'contentMode: evergreen\nslug: other'), 'slug'],
  ['missing-source', edit(C, 'sourceIds: [local:vendor-a]', 'sourceIds: [local:missing]'), '존재하지 않는 출처 local:missing'],
  ['article-without-source', edit('articles/business/test-startup-guide.md', 'sourceIds: [nts]\n', ''), '출처가 1개 이상 필요하다'],
  ['price-without-source', edit(C, '    sourceIds: [local:vendor-a]\n', ''), '가격 숫자에는 출처가 필요하다'],
  ['confidence-mismatch', edit(C, 'confidence: L2', 'confidence: L3'), 'L3는 서로 다른 S2 출처 3개 이상'],
  ['date-order', edit(C, 'dateModified: 2026-09-20', 'dateModified: 2026-08-01'), 'dateModified < datePublished'],
  ['modified-without-changelog', edit(C, 'changelog:\n  - date: 2026-09-20\n    summary: 가격 재확인\n', ''), 'changelog'],
  ['cost-without-prices', (f) => (f[C] = f[C].replace(/priceItems:[\s\S]*?changelog:/, 'changelog:')), 'cost 글은 priceItems 또는 tool이 필요하다'],
  ['cost-with-tool-only', (f) => (f[C] = f[C].replace(/localSources:[\s\S]*?changelog:/, 'tool: electricity-bill\nchangelog:')), null],
  ['unknown-tool', edit(C, 'contentType: cost', 'contentType: cost\ntool: nope'), 'tool'],
  ['tool-on-guide', edit('articles/business/test-startup-guide.md', 'contentType: guide', 'contentType: guide\ntool: electricity-bill'), 'tool electricity-bill은 cost 글에만'],
  ['mvno-tool-on-cost', edit(C, 'contentType: cost', 'contentType: cost\ntool: mvno-plan-cost'), 'tool mvno-plan-cost은 compare 글에만'],
  ['benefit-without-program', (f) => (f[B] = f[B].replace(/program:[\s\S]*?---/, '---')), 'program'],
  ['benefit-non-official-source', (f) => {
    edit(B, '    - text: 테스트 조건\n      sourceId: gov24', '    - text: 테스트 조건\n      sourceId: local:blog')(f);
    edit(B, 'audience: [low-income]', 'audience: [low-income]\nlocalSources:\n  - id: local:blog\n    title: 테스트 블로그\n    publisher: 테스트\n    url: https://example.com/blog\n    level: S4\n    checkedAt: 2026-09-20')(f);
  }, 'local:blog: 공식(S1) 출처만 허용'],
  ['period-without-dates', edit(B, '    start: 2026-10-01\n    end: 2026-12-31\n', ''), 'period 모드는 start·end가 필요하다'],
  ['until-budget-without-start', edit(B, '    mode: period\n    start: 2026-10-01\n    end: 2026-12-31\n', '    mode: until-budget\n'), 'until-budget 모드는 start가 필요하다'],
  ['unused-local-source', edit(C, 'sourceIds: [local:vendor-a]', 'sourceIds: [nts]'), '인용되지 않은 출처 local:vendor-a'],
  ['benefits-article-type', (f) => {
    edit(G, 'contentType: guide', 'contentType: compare')(f);
    edit(G, 'notes: [테스트 주의 사항]', 'notes: [테스트 주의 사항]\ncompare:\n  caption: 테스트 비교\n  options: [A, B]\n  rows:\n    - label: 가격\n      values: [1만 원, 2만 원]')(f);
  }, 'guide·change만'],
  ['url-collision', add('articles/benefits/test-energy-voucher.md', benefitsGuide.replace('테스트 혜택 확인', '테스트 충돌')), '공개 URL 충돌 /benefits/test-energy-voucher/'],
  ['reserved-slug', add('articles/digital/internet.md', guide.replace('subcategory: startup', 'subcategory: internet').replace('테스트 창업 초기 비용', '테스트 인터넷')), '예약된 slug internet'],
  ['duplicate-primary-query', edit('articles/business/test-startup-guide.md', 'primaryQuery: 테스트 창업 초기 비용', 'primaryQuery: 테스트 카드단말기 가격'), 'primaryQuery 중복'],
  // ── 짧은 페이지 품질(글자 수 기준 없음): 정리 블록 + 출처 ──
  ['no-value-block', edit('articles/business/test-startup-guide.md', 'checklist:\n  items: [테스트 준비 항목]\n', ''), '정리 블록이 1개 이상 필요하다'],
  ['link-only-page', edit(G, 'notes: [테스트 주의 사항]\n', ''), '정리 블록이 1개 이상 필요하다'],
  ['compare-without-table-or-tool', edit('articles/business/test-startup-guide.md', 'contentType: guide', 'contentType: compare'), 'compare 글은 compare 표 또는 tool이 필요하다'],
  ['compare-table-only', (f) => {
    edit('articles/business/test-startup-guide.md', 'contentType: guide', 'contentType: compare')(f);
    edit('articles/business/test-startup-guide.md', 'checklist:', 'compare:\n  caption: 테스트 비교\n  options: [A, B]\n  rows:\n    - label: 가격\n      values: [1만 원, 2만 원]\nchecklist:')(f);
  }, null],
  ['compare-tool-only', edit('articles/business/test-startup-guide.md', 'contentType: guide', 'contentType: compare\ntool: mvno-plan-cost'), null],
  ['compare-table-and-tool', (f) => {
    edit('articles/business/test-startup-guide.md', 'contentType: guide', 'contentType: compare\ntool: mvno-plan-cost')(f);
    edit('articles/business/test-startup-guide.md', 'checklist:', 'compare:\n  caption: 테스트 비교\n  options: [A, B]\n  rows:\n    - label: 가격\n      values: [1만 원, 2만 원]\nchecklist:')(f);
  }, 'compare 글에는 compare 표와 tool 중 하나만'],
  ['compare-table-on-guide', edit('articles/business/test-startup-guide.md', 'checklist:', 'compare:\n  caption: 테스트 비교\n  options: [A, B]\n  rows:\n    - label: 가격\n      values: [1만 원, 2만 원]\nchecklist:'), 'compare 표는 compare 글에만 둔다'],
  ['compare-row-length', (f) => {
    edit('articles/business/test-startup-guide.md', 'contentType: guide', 'contentType: compare')(f);
    edit('articles/business/test-startup-guide.md', 'checklist:', 'compare:\n  caption: 테스트 비교\n  options: [A, B]\n  rows:\n    - label: 가격\n      values: [1만 원]\nchecklist:')(f);
  }, '값 1개 ≠ 선택지 2개'],
  ['benefit-checklist-field', edit(B, 'actionLinks:', 'checklist:\n  items: [x]\nactionLinks:'), 'program.application.documents에 쓴다'],
  // ── 공식 행동 링크 ──
  ['action-subdomain-ok', link('https://plus.gov.kr/service/1'), null],
  ['action-other-domain', link('https://www.example.com/gov'), '출처(www.gov.kr)와 다른 도메인 www.example.com'],
  ['action-lookalike-domain', link('https://www.gov.kr.example.com/'), '다른 도메인 www.gov.kr.example.com'],
  ['action-lookalike-suffix', link('https://evilgov.kr/'), '다른 도메인 evilgov.kr'],
  ['action-userinfo', link('https://www.gov.kr@example.com/'), '포트·사용자 정보'],
  ['action-http', link('http://www.gov.kr/'), 'https 주소만 허용'],
  ['action-org-mismatch', edit(G, '  - org: 정부24', '  - org: 국세청'), "기관명 '국세청'이 출처 이름"],
  ['action-non-official-source', (f) => {
    edit(G, '    sourceId: gov24', '    sourceId: local:blog')(f);
    edit(G, '  - org: 정부24', '  - org: 테스트 블로그')(f);
    edit(G, 'notes: [테스트 주의 사항]', 'notes: [테스트 주의 사항]\nlocalSources:\n  - id: local:blog\n    title: 테스트 블로그\n    publisher: 테스트\n    url: https://blog.example.com/\n    level: S2\n    checkedAt: 2026-09-20')(f);
  }, 'local:blog: 공식(S1) 출처만 허용'],
  ['action-missing-source', edit(G, '    sourceId: gov24', '    sourceId: nope'), '존재하지 않는 출처 nope'],
  ['action-application-in-article', edit(G, 'action: check', 'action: application'), 'application 링크는 지원·혜택(benefit) 글에서만'],
  ['benefit-without-links', (f) => (f[B] = f[B].replace(/actionLinks:[\s\S]*?---/, '---')), 'actionLinks'],
  ['benefit-first-link-not-official', edit(B, '    action: application\n    url: https://www.gov.kr/', '    action: application\n    url: https://plus.gov.kr/'), '첫 행동 링크는 action application + program.application.officialUrl'],
  // 예외 호스트: 사람이 확인해 출처에 등록한 정확한 호스트만
  ['action-host-exception-ok', (f) => {
    localOfficial('form.test-city.kr')(f);
    edit(G, '  - org: 정부24\n    action: check\n    url: https://www.gov.kr/\n    sourceId: gov24', '  - org: 테스트시청\n    action: check\n    url: https://form.test-city.kr/form\n    sourceId: local:city')(f);
  }, null],
  ['action-host-not-registered', (f) => {
    localOfficial('')(f);
    edit(G, '  - org: 정부24\n    action: check\n    url: https://www.gov.kr/\n    sourceId: gov24', '  - org: 테스트시청\n    action: check\n    url: https://form.test-city.kr/form\n    sourceId: local:city')(f);
  }, '다른 도메인 form.test-city.kr'],
  ['action-host-exception-suffix', (f) => {
    localOfficial('go.kr')(f);
    edit(G, '  - org: 정부24\n    action: check\n    url: https://www.gov.kr/\n    sourceId: gov24', '  - org: 테스트시청\n    action: check\n    url: https://www.test-city.go.kr/notice/1\n    sourceId: local:city')(f);
  }, '공용 도메인 접미사는 예외로 둘 수 없음: go.kr'],
  // S1 = 원 제공자의 공식 1차 출처: 사업자의 자기 상품 공식 페이지도 행동 링크에 쓸 수 있다(도메인 검증은 같음)
  ['action-operator-s1-ok', (f) => {
    edit(G, 'notes: [테스트 주의 사항]', 'notes: [테스트 주의 사항]\nlocalSources:\n  - id: local:telecom\n    title: 테스트텔레콤 요금제\n    publisher: 테스트텔레콤\n    url: https://www.test-telecom.co.kr/plans\n    level: S1\n    checkedAt: 2026-09-20')(f);
    edit(G, '  - org: 정부24\n    action: check\n    url: https://www.gov.kr/\n    sourceId: gov24', '  - org: 테스트텔레콤\n    action: check\n    url: https://shop.test-telecom.co.kr/plans/1\n    sourceId: local:telecom')(f);
  }, null],
  ['action-operator-other-domain', (f) => {
    edit(G, 'notes: [테스트 주의 사항]', 'notes: [테스트 주의 사항]\nlocalSources:\n  - id: local:telecom\n    title: 테스트텔레콤 요금제\n    publisher: 테스트텔레콤\n    url: https://www.test-telecom.co.kr/plans\n    level: S1\n    checkedAt: 2026-09-20')(f);
    edit(G, '  - org: 정부24\n    action: check\n    url: https://www.gov.kr/\n    sourceId: gov24', '  - org: 테스트텔레콤\n    action: check\n    url: https://www.other-telecom.co.kr/plans\n    sourceId: local:telecom')(f);
  }, '다른 도메인 www.other-telecom.co.kr'],
  // 버튼 목적 문구(purpose)·한눈에 보기(quickFacts)·SEO 제목(seoTitle)
  ['action-purpose-ok', edit(G, '    action: check\n', '    action: check\n    purpose: 받을 수 있는 혜택 확인하기\n'), null],
  ['action-purpose-bad-ending', edit(G, '    action: check\n', '    action: check\n    purpose: 혜택 조회\n'), "purpose는 '하기'·'보기'로 끝나는 목적 문구"],
  ['action-purpose-on-application', edit(B, '    action: application\n', '    action: application\n    purpose: 신청하기\n'), 'application 링크는 상태별 문구를 쓰므로 purpose를 둘 수 없다'],
  ['quickfacts-as-value-block', (f) => {
    edit(G, 'notes: [테스트 주의 사항]\n', 'quickFacts:\n  title: 무엇이 필요한가요?\n  items:\n    - label: 테스트 상황\n      value: 테스트 할 일\n')(f);
    edit(G, 'contentMode: evergreen', 'contentMode: evergreen\nseoTitle: 테스트 SEO 제목')(f);
  }, null],
  ['action-host-exception-non-official', edit(C, '    level: S2\n    checkedAt: 2026-09-20', '    level: S2\n    checkedAt: 2026-09-20\n    actionHosts: [form.example.com]'), 'actionHosts는 공식(S1) 출처에만'],
  ['thumbnail-local', edit(G, 'contentMode: evergreen', 'contentMode: evergreen\nthumbnail: /images/thumbnails/test-guide.svg'), null],
  ['og-image-local', edit(G, 'contentMode: evergreen', 'contentMode: evergreen\nogImage: /images/og/test-guide.png'), null],
  ['og-image-svg', edit(G, 'contentMode: evergreen', 'contentMode: evergreen\nogImage: /images/og/test-guide.svg'), '공유 이미지 경로 형식'],
  ['og-image-remote', edit(G, 'contentMode: evergreen', 'contentMode: evergreen\nogImage: https://example.com/a.png'), '공유 이미지 경로 형식'],
  ['thumbnail-remote', edit(G, 'contentMode: evergreen', 'contentMode: evergreen\nthumbnail: https://example.com/a.png'), '대표 이미지 경로 형식'],
  ['broken-related-link', edit('articles/business/test-startup-guide.md', 'related: [/business/test-card-terminal/]', 'related: [/business/nope/]'), '존재하지 않는 글 링크 /business/nope/'],
];

const only = process.argv.slice(2);
let failed = 0;
for (const [name, mutate, expected] of cases) {
  if (only.length && !only.includes(name)) continue;
  const files = { ...valid };
  mutate(files);
  const dir = mkdtempSync(join(tmpdir(), 'content-test-'));
  try {
    for (const p of ['src', 'public', 'astro.config.mjs', 'tsconfig.json', 'package.json']) cpSync(join(root, p), join(dir, p), { recursive: true });
    symlinkSync(join(root, 'node_modules'), join(dir, 'node_modules'));
    for (const [path, content] of Object.entries(files)) {
      const target = join(dir, 'src/content', path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, content);
    }
    const r = spawnSync('npx', ['astro', 'build'], {
      cwd: dir,
      encoding: 'utf8',
      env: { ...process.env, SITE_ENV: 'preview', ASTRO_TELEMETRY_DISABLED: '1' },
    });
    const out = r.stdout + r.stderr;
    const ok = expected === null ? r.status === 0 : r.status !== 0 && out.includes(expected);
    if (!ok) failed++;
    const evidence = expected && out.split('\n').find((l) => l.includes(expected))?.trim();
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? (evidence ? `  ← ${evidence}` : '') : `\n${out.slice(-1500)}`}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
process.exit(failed ? 1 : 0);
