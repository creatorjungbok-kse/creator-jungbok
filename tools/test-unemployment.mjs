// 실업급여 계산기 엔진 테스트. 사용: npm run test:tools
// 기대값: 고용24 실업급여 간편 모의계산(retrieveNewMainCalcAjax, 2026-10-25 조회) 결과와 고용보험법 제45조·제46조·별표 1로 직접 계산한 값.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calc, dailyFromAvg, fix, ruleFor, benefitDays, threeMonthDays, parseYmd, fmtYmd } from '../src/lib/payroll/unemployment/calculation.ts';

const D = (s) => {
  const x = parseYmd(s);
  assert.ok(x !== null, s);
  return x;
};
const tenureOf = (months) => (months < 12 ? 'u1' : months < 36 ? '1to3' : months < 60 ? '3to5' : months < 120 ? '5to10' : 'o10');

// [나이, 가입 개월, 1일 소정근로시간, 월 평균임금, 고용24 일수, 고용24 총액] — 고용24 간편 모의계산은 1일 평균임금 = floor(월 평균임금 / 30)
const OFFICIAL = [
  [35, 24, 8, 3_000_000, 150, 9_907_200],
  [35, 24, 8, 3_400_000, 150, 10_199_970],
  [35, 24, 8, 3_420_000, 150, 10_215_000],
  [35, 24, 8, 5_000_000, 150, 10_215_000],
  [35, 24, 7, 2_000_000, 150, 8_668_800],
  [35, 24, 4, 1_200_000, 150, 4_953_600],
  [52, 60, 8, 4_000_000, 240, 16_344_000],
  [35, 6, 8, 3_000_000, 120, 7_925_760],
  [35, 130, 8, 3_000_000, 240, 15_851_520],
  [55, 130, 8, 3_000_000, 270, 17_832_960],
];

test('고용24 간편 모의계산과 일수·총액 일치(2026년)', () => {
  const rule = ruleFor(2026);
  for (const [age, months, hours, monthly, days, total] of OFFICIAL) {
    const d = dailyFromAvg(Math.floor(monthly / 30), hours, rule);
    const n = benefitDays(tenureOf(months), age >= 50);
    assert.equal(n, days, `${age}세 ${months}개월`);
    assert.equal(fix(d.daily * n), total, `${age}세 ${months}개월 ${hours}시간 ${monthly}`);
  }
});

test('2026년 상한·하한', () => {
  const rule = ruleFor(2026);
  assert.equal(dailyFromAvg(200_000, 8, rule).capDaily, 68_100);
  assert.equal(fix(dailyFromAvg(10_000, 8, rule).daily), 66_048);
  assert.equal(fix(dailyFromAvg(10_000, 7, rule).daily), 57_792);
  assert.equal(fix(dailyFromAvg(10_000, 10, rule).daily), 66_048, '8시간 초과는 8시간');
  assert.equal(dailyFromAvg(10_000, 8, rule).basis, 'floor');
  assert.equal(dailyFromAvg(113_500, 8, rule).basis, 'cap');
  assert.equal(dailyFromAvg(112_000, 8, rule).basis, 'rate');
});

test('주 단위 계약: 하루 시간 = 주 소정근로시간 ÷ 5(주휴 포함 ÷ 48 × 8)', () => {
  const rule = ruleFor(2026);
  // 주 3일 × 8시간 = 주 24시간 → (24 + 4.8) ÷ 48 × 8 = 4.8시간
  assert.equal(fix(dailyFromAvg(10_000, 4.8, rule).daily), 39_628);
  const r = calc({ lastWorkDay: D('2026-09-30'), wage3m: 3_000_000, hours: 4.8, age: 35, disabled: false, tenure: '1to3' });
  assert.equal(r.ok, true);
  assert.equal(r.result.dailyShown, 39_628);
  assert.equal(calc({ lastWorkDay: D('2026-09-30'), wage3m: 3_000_000, hours: 4.85, age: 35, disabled: false, tenure: '1to3' }).error, 'hours-invalid');
});

test('2027년(입법예고안)', () => {
  const rule = ruleFor(2027);
  assert.equal(rule.provisional, true);
  assert.equal(rule.capBase, 117_614);
  assert.equal(fix(dailyFromAvg(10_000, 8, rule).daily), 68_480);
  assert.equal(dailyFromAvg(200_000, 8, rule).capDaily, 70_568);
});

test('3개월 산정기간', () => {
  const p = threeMonthDays(D('2026-09-30'));
  assert.equal(fmtYmd(p.start), '2026-07-01');
  assert.equal(p.days, 92);
  const q = threeMonthDays(D('2026-05-30'));
  assert.equal(fmtYmd(q.start), '2026-03-01', '3개월 전 같은 날짜가 2월에 없으면 3월 1일부터');
  const r = threeMonthDays(D('2026-07-30'));
  assert.equal(fmtYmd(r.start), '2026-04-30');
});

test('calc 전체', () => {
  const r = calc({ lastWorkDay: D('2026-09-30'), wage3m: 9_000_000, hours: 8, age: 35, disabled: false, tenure: '1to3' });
  assert.equal(r.ok, true);
  assert.equal(r.result.periodDays, 92);
  assert.equal(r.result.basis, 'floor');
  assert.equal(r.result.days, 150);
  assert.equal(r.result.total, 9_907_200);
  assert.equal(r.result.month30, 1_981_440);
  const s = calc({ lastWorkDay: D('2026-09-30'), wage3m: 15_000_000, hours: 8, age: 45, disabled: true, tenure: 'o10' });
  assert.equal(s.result.basis, 'cap');
  assert.equal(s.result.days, 270, '장애인은 50세 이상 표');
  assert.equal(s.result.total, 68_100 * 270);
  assert.equal(calc({ lastWorkDay: D('2025-12-31'), wage3m: 9_000_000, hours: 8, age: 35, disabled: false, tenure: 'u1' }).error, 'date-range');
  assert.equal(calc({ lastWorkDay: D('2026-09-30'), wage3m: 0, hours: 8, age: 35, disabled: false, tenure: 'u1' }).error, 'wage-invalid');
  const t = calc({ lastWorkDay: D('2027-03-31'), wage3m: 9_000_000, hours: 8, age: 35, disabled: false, tenure: 'u1' });
  assert.equal(t.result.year, 2027);
  assert.equal(t.result.provisional, true);
  assert.equal(t.result.dailyShown, 68_480);
});
