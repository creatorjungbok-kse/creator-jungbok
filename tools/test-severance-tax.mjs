// 퇴직금 세금 계산기 엔진 테스트. 사용: npm run test:tools
// 기대값: 국세청 계산 사례(20년, 1억원 → 퇴직소득세 112만원)와 소득세법 제48조·제55조로 직접 계산한 값(글의 표와 같음).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calcSeveranceTax, serviceYears, serviceDeduction, convertedDeduction, MAX_PAY } from '../src/lib/payroll/severance-tax/calculation.ts';

const t = (pay, years) => {
  const x = calcSeveranceTax(pay, years);
  assert.equal(x.ok, true, `${pay} ${years}`);
  return x.result;
};

test('국세청 사례: 20년, 퇴직금 1억원 → 퇴직소득세 1,120,000원, 지방소득세 112,000원', () => {
  const x = t(100_000_000, 20);
  assert.deepEqual([x.serviceDeduction, x.converted, x.incomeTax, x.localTax, x.totalTax], [40_000_000, 36_000_000, 1_120_000, 112_000, 1_232_000]);
});

test('글의 표: 월급 300만원·500만원, 근속연수별 세금 합계', () => {
  for (const [pay, years, total] of [
    [3_000_000, 1, 35_200],
    [9_000_000, 3, 105_600],
    [15_000_000, 5, 176_000],
    [30_000_000, 10, 220_000],
    [60_000_000, 20, 176_000],
    [90_000_000, 30, 0],
    [5_000_000, 1, 104_500],
    [15_000_000, 3, 313_500],
    [25_000_000, 5, 522_500],
    [50_000_000, 10, 748_000],
    [150_000_000, 30, 1_584_000],
  ]) assert.equal(t(pay, years).totalTax, total, `${pay}/${years}`);
});

test('같은 퇴직금 5,000만원: 근속연수별 세금(글의 표)', () => {
  for (const [years, total] of [[3, 4_138_200], [5, 2_358_120], [10, 748_000], [20, 0]]) assert.equal(t(50_000_000, years).totalTax, total, String(years));
});

test('10년, 5,000만원 단계값(글의 그림)', () => {
  const x = t(50_000_000, 10);
  assert.deepEqual([x.serviceDeduction, x.converted, x.convertedDeduction, x.taxBase, x.convertedTax, x.incomeTax, x.localTax, x.net], [15_000_000, 42_000_000, 28_400_000, 13_600_000, 816_000, 680_000, 68_000, 49_252_000]);
});

test('근속연수: 1년 미만 끝수는 1년, 공제는 퇴직금을 넘지 않음', () => {
  assert.equal(serviceYears(1, 6), 2);
  assert.equal(serviceYears(0, 3), 1);
  assert.equal(serviceYears(5, 0), 5);
  const x = t(3_000_000, 5);
  assert.deepEqual([x.serviceDeduction, x.converted, x.totalTax, x.net], [3_000_000, 0, 0, 3_000_000]);
});

test('공제표 경계값', () => {
  assert.deepEqual([5, 6, 10, 11, 20, 21].map(serviceDeduction), [5_000_000, 7_000_000, 15_000_000, 17_500_000, 40_000_000, 43_000_000]);
  assert.deepEqual([8_000_000, 70_000_000, 100_000_000, 300_000_000, 400_000_000].map(convertedDeduction), [8_000_000, 45_200_000, 61_700_000, 151_700_000, 186_700_000]);
});

test('입력 오류', () => {
  assert.deepEqual(calcSeveranceTax(0, 5), { ok: false, error: 'pay-invalid' });
  assert.deepEqual(calcSeveranceTax(MAX_PAY + 1, 5), { ok: false, error: 'over-max' });
  assert.deepEqual(calcSeveranceTax(10_000_000, 0), { ok: false, error: 'years-invalid' });
  assert.deepEqual(calcSeveranceTax(10_000_000, 61), { ok: false, error: 'years-invalid' });
});

test('세금은 퇴직금보다 작고 세후는 0 이상(넓은 범위 표본)', () => {
  for (let y = 1; y <= 40; y += 3) for (let p = 1_000_000; p <= 3_000_000_000; p = Math.floor(p * 1.7)) {
    const x = t(p, y);
    assert.ok(x.totalTax >= 0 && x.totalTax < p && x.net > 0, `${p}/${y}`);
    assert.equal(x.incomeTax % 10, 0);
  }
});
