// 4대보험 계산기 v1 — 스펙(docs/ready/social-insurance-calculator/spec.md) §7 테스트. 사용: npm run test:tools
// 기대값은 4대사회보험 정보연계센터 모의계산(2026년 기준)에 같은 금액을 넣어 받은 응답(2026-10-14 확인)과 국민연금공단 예시다.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { parseWonInt } from '../src/lib/payroll/shared/validation.ts';
import { kstDate } from '../src/lib/payroll/shared/korea-time.ts';
import { calcSocialInsurance, floorTo10 } from '../src/lib/social-insurance/calculation.ts';
import { isStale, PAY_MAX, PAY_MIN, reviewFrom, validUntil } from '../src/lib/social-insurance/rules.ts';

const calc = (pay, o = {}) => calcSocialInsurance({ pay, companySize: 'under150', age60: false, newHireAfter65: false, ...o });
const row = (r) => [r.nps.worker, r.nhi.worker, r.ltc.worker, r.ei.worker, r.ei.employer];

test('T1 월 3,000,000원 · 150명 미만 → 근로자 291,520 / 사업주 299,020 (모의계산)', () => {
  const r = calc(3_000_000);
  assert.deepEqual(row(r), [142_500, 107_850, 14_170, 27_000, 34_500]);
  assert.equal(r.workerTotal, 291_520);
  assert.equal(r.employerTotal, 299_020);
  assert.deepEqual([r.nps.employer, r.nhi.employer, r.ltc.employer], [142_500, 107_850, 14_170]);
  assert.deepEqual(r.notices, []);
});

test('T2 1,234,567원 · 회사 규모 4단계 — 국민연금 기준 1,234,000, 사업주 고용 14,190/16,660/19,130/21,600', () => {
  const exp = { under150: 14_190, priority150: 16_660, under1000: 19_130, over1000: 21_600 };
  for (const [k, v] of Object.entries(exp)) {
    const r = calc(1_234_567, { companySize: k });
    assert.equal(r.npsBase, 1_234_000);
    assert.deepEqual(row(r), [58_610, 44_380, 5_830, 11_110, v], k);
  }
});

test('T3 2,156,789원 → 102,410 / 77,530 / 10,180 / 19,410', () => {
  assert.deepEqual(row(calc(2_156_789)).slice(0, 4), [102_410, 77_530, 10_180, 19_410]);
});

test('T4 333,333원 → 국민연금 하한 41만 적용 19,470 / 건강 11,980 / 장기요양 1,570 / 고용 2,990', () => {
  const r = calc(333_333);
  assert.deepEqual(row(r).slice(0, 4), [19_470, 11_980, 1_570, 2_990]);
  assert.deepEqual(r.notices, ['nps-min']);
});

test('T5 200,000원 → 국민연금·건강 하한 모두 적용, 사업주 고용 2,300', () => {
  const r = calc(200_000);
  assert.deepEqual(row(r), [19_470, 10_080, 1_320, 1_800, 2_300]);
  assert.deepEqual(r.notices, ['nps-min', 'nhi-min']);
  assert.equal(r.nhiBase, 280_528);
});

test('T6 1,001,370원 → 장기요양은 근로자 건강보험료 기준(4,720 — 월급×0.4724%면 4,730)', () => {
  const r = calc(1_001_370);
  assert.deepEqual([r.nhi.worker, r.ltc.worker], [35_990, 4_720]);
});

test('T7 1,000,875원 · 150명 미만 → 사업주 고용 11,500(따로 버린 뒤 합산, 한 번에 계산하면 11,510)', () => {
  const r = calc(1_000_875);
  assert.deepEqual(row(r), [47_500, 35_980, 4_720, 9_000, 11_500]);
  assert.deepEqual(r.eiEmployerParts, { unemployment: 9_000, stability: 2_500 });
});

test('T8 1,000,574원 · 1,000명 이상 → 사업주 고용 17,500', () => {
  assert.equal(calc(1_000_574, { companySize: 'over1000' }).ei.employer, 17_500);
});

test('T9 6,590,999원 → 국민연금 상한 아님(기준 6,590,000) 313,020 / 236,940 / 31,130 / 59,310 / 75,780', () => {
  const r = calc(6_590_999);
  assert.deepEqual(row(r), [313_020, 236_940, 31_130, 59_310, 75_780]);
  assert.deepEqual(r.notices, []);
});

test('T10 9,999,999원 → 국민연금 상한 659만 적용', () => {
  const r = calc(9_999_999);
  assert.deepEqual(row(r).slice(0, 4), [313_020, 359_490, 47_230, 89_990]);
  assert.deepEqual(r.notices, ['nps-max']);
});

test('T11 127,725,731원 → 건강 상한 적용 4,591,730 / 603,370, 고용 1,149,530 / 1,468,840', () => {
  const r = calc(127_725_731);
  assert.deepEqual(row(r), [313_020, 4_591_730, 603_370, 1_149_530, 1_468_840]);
  assert.deepEqual(r.notices, ['nps-max', 'nhi-max']);
});

test('T12 국민연금공단 예시 1,060,000원 → 본인 50,350 / 사용자 50,350', () => {
  const r = calc(1_060_000);
  assert.deepEqual([r.nps.worker, r.nps.employer], [50_350, 50_350]);
});

test('T13 합계 = 각 항목 합(여러 금액·규모·체크 조합)', () => {
  for (const pay of [1, 9_999, 410_000, 2_500_000, 6_590_000, 500_000_000, PAY_MAX]) {
    for (const companySize of ['under150', 'priority150', 'under1000', 'over1000']) {
      for (const age60 of [false, true]) {
        for (const newHireAfter65 of [false, true]) {
          const r = calc(pay, { companySize, age60, newHireAfter65 });
          assert.equal(r.workerTotal, r.nps.worker + r.nhi.worker + r.ltc.worker + r.ei.worker);
          assert.equal(r.employerTotal, r.nps.employer + r.nhi.employer + r.ltc.employer + r.ei.employer);
          for (const v of [r.nps, r.nhi, r.ltc, r.ei].flatMap((p) => [p.worker, p.employer])) assert.equal(v % 10, 0);
        }
      }
    }
  }
});

test('T14 만 60세 이상 → 국민연금 0원, 국민연금 상·하한 안내 없음', () => {
  const r = calc(200_000, { age60: true });
  assert.deepEqual(r.nps, { worker: 0, employer: 0 });
  assert.equal(r.npsBase, null);
  assert.deepEqual(r.notices, ['nhi-min']);
});

test('T15 65세 이후 새로 고용 → 근로자 고용 0원, 사업주는 고용안정 몫만', () => {
  const r = calc(3_000_000, { newHireAfter65: true });
  assert.deepEqual(r.ei, { worker: 0, employer: 7_500 });
  const big = calc(3_000_000, { newHireAfter65: true, companySize: 'over1000' });
  assert.deepEqual(big.ei, { worker: 0, employer: 25_500 });
});

test('T16 입력 검사: 0·음수·소수·문자·10억 초과는 오류, 10억은 통과', () => {
  const p = (s) => parseWonInt(s, { min: PAY_MIN, max: PAY_MAX });
  for (const s of ['0', '-1', '1.5', 'abc', '1000000001', '99999999999999999999']) assert.equal(p(s).ok, false, s);
  assert.deepEqual(p('1,000,000,000'), { ok: true, value: 1_000_000_000 });
  assert.throws(() => calc(0));
  assert.throws(() => calc(1_000, { companySize: 'nope' }));
});

test('T17 floorTo10 큰 수(BigInt 경로)와 일반 경로 일치', () => {
  assert.equal(floorTo10(1_000_000_000, 3_595, 100_000), 35_950_000);
  assert.equal(floorTo10(9_007_199_254_740, 9_999, 10_000), Number((9_007_199_254_740n * 9_999n) / 100_000n) * 10);
});

test('T18 상수 기한 — reviewFrom 2026-12-01, validUntil 2026-12-31, 지나면 실패', () => {
  assert.equal(reviewFrom, '2026-12-01');
  assert.equal(validUntil, '2026-12-31');
  assert.equal(isStale('2026-12-31'), false);
  assert.equal(isStale('2027-01-01'), true);
  assert.ok(!isStale(kstDate()), `4대보험 계산기 상수 기한(${validUntil}) 지남 — src/lib/social-insurance/rules.ts 갱신`);
});

test('T19 화면: GA 신호는 도구 이름만, dispatch 코드 1곳, 결과 제목·산재 제외 문구 고정', () => {
  const src = readFileSync('src/components/tools/SocialInsurance.astro', 'utf8');
  const dispatches = src.match(/dispatchEvent\(/g) ?? [];
  assert.equal(dispatches.length, 1);
  assert.match(src, /new CustomEvent\('kkultip:tool-use', \{ detail: 'social-insurance-calculator' \}\)/);
  assert.match(src, /근로자 월 공제 예상액/);
  assert.match(src, /사업주 월 부담 예상액 · 산재보험 제외/);
  assert.doesNotMatch(src, /4대보험 총액/);
  assert.doesNotMatch(src, /localStorage|sessionStorage|fetch\(|sendBeacon|gtag/);
});
