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
---
본문
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
  ['cost-without-prices', (f) => (f[C] = f[C].replace(/priceItems:[\s\S]*?changelog:/, 'changelog:')), 'cost 글은 priceItems가 필요하다'],
  ['benefit-without-program', (f) => (f[B] = f[B].replace(/program:[\s\S]*?---/, '---')), 'program'],
  ['benefit-non-official-source', (f) => {
    edit(B, '    - text: 테스트 조건\n      sourceId: gov24', '    - text: 테스트 조건\n      sourceId: local:blog')(f);
    edit(B, 'audience: [low-income]', 'audience: [low-income]\nlocalSources:\n  - id: local:blog\n    title: 테스트 블로그\n    publisher: 테스트\n    url: https://example.com/blog\n    level: S4\n    checkedAt: 2026-09-20')(f);
  }, 'local:blog: 공식(S1) 출처만 허용'],
  ['period-without-dates', edit(B, '    start: 2026-10-01\n    end: 2026-12-31\n', ''), 'period 모드는 start·end가 필요하다'],
  ['until-budget-without-start', edit(B, '    mode: period\n    start: 2026-10-01\n    end: 2026-12-31\n', '    mode: until-budget\n'), 'until-budget 모드는 start가 필요하다'],
  ['unused-local-source', edit(C, 'sourceIds: [local:vendor-a]', 'sourceIds: [nts]'), '인용되지 않은 출처 local:vendor-a'],
  ['benefits-article-type', edit('articles/benefits/test-check-benefits.md', 'contentType: guide', 'contentType: compare'), 'guide·change만'],
  ['url-collision', add('articles/benefits/test-energy-voucher.md', benefitsGuide.replace('테스트 혜택 확인', '테스트 충돌')), '공개 URL 충돌 /benefits/test-energy-voucher/'],
  ['reserved-slug', add('articles/digital/internet.md', guide.replace('subcategory: startup', 'subcategory: internet').replace('테스트 창업 초기 비용', '테스트 인터넷')), '예약된 slug internet'],
  ['duplicate-primary-query', edit('articles/business/test-startup-guide.md', 'primaryQuery: 테스트 창업 초기 비용', 'primaryQuery: 테스트 카드단말기 가격'), 'primaryQuery 중복'],
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
