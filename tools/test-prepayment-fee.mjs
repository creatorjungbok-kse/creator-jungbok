// 중도상환수수료 계산기 엔진 테스트. 사용: npm run test:tools
// 기대값은 손계산(BigInt 정확값 후 원 미만 버림)과 KB국민은행 안내 예시(1억 × 0.55% × 730/1,095 ≈ 36.7만원)로 확인했다.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calcFee, addMonths, parseFeeRateBp, LIMITS } from '../src/lib/finance/prepayment/calculation.ts';

const ok = (x) => {
  const r = calcFee(x);
  assert.equal(r.ok, true, JSON.stringify(x) + ' → ' + r.error);
  return r.result;
};
const base = { amount: 100_000_000, freeAmount: 0, rateBp: 55, start: '2026-01-01', repay: '2027-01-01', loanMonths: 360 };

test('1억, 0.55%, 1년 뒤 상환: 남은 731일 ÷ 1,096일(윤년 포함)', () => {
  const r = ok(base);
  assert.equal(r.totalDays, 1096);
  assert.equal(r.remainDays, 731);
  assert.equal(r.fee, 366_833);
  assert.equal(r.feeEnd, '2029-01-01');
  // KB 예시(1,095일 고정)와 1천원 이내
  assert.ok(Math.abs(r.fee - 367_000) < 1_000);
});

test('부과기간(3년)이 지나면 0원, 그날부터 면제', () => {
  assert.equal(ok({ ...base, repay: '2029-01-01' }).fee, 0);
  assert.equal(ok({ ...base, repay: '2029-01-01' }).expired, true);
  assert.equal(ok({ ...base, repay: '2031-05-05' }).fee, 0);
  assert.ok(ok({ ...base, repay: '2028-12-31' }).fee > 0);
});

test('대출기간이 3년보다 짧으면 대출기간이 부과기간', () => {
  const r = ok({ amount: 30_000_000, freeAmount: 0, rateBp: 12, start: '2026-03-10', repay: '2026-09-10', loanMonths: 12 });
  assert.equal(r.feeEnd, '2027-03-10');
  assert.equal(r.totalDays, 365);
  assert.equal(r.remainDays, 181);
  assert.equal(r.fee, 17_852); // 30,000,000 × 0.0012 × 181 ÷ 365 = 17,852.05
});

test('면제 한도를 뺀 금액에만 수수료, 한도 안이면 0원', () => {
  const r = ok({ ...base, freeAmount: 10_000_000 });
  assert.equal(r.base, 90_000_000);
  assert.equal(r.fee, 330_150); // 90,000,000 × 0.0055 × 731 ÷ 1096 = 330,150.5
  assert.equal(ok({ ...base, amount: 5_000_000, freeAmount: 10_000_000 }).fee, 0);
});

test('실행일 당일 상환은 전액 비율, 수수료율 0%는 0원', () => {
  assert.equal(ok({ ...base, repay: '2026-01-01' }).fee, 550_000);
  assert.equal(ok({ ...base, rateBp: 0 }).fee, 0);
});

test('말일 보정과 수수료율 입력', () => {
  assert.equal(addMonths('2026-01-31', 1), '2026-02-28');
  assert.equal(addMonths('2028-02-29', 36), '2031-02-28');
  assert.equal(parseFeeRateBp('0.56'), 56);
  assert.equal(parseFeeRateBp('0.56%'), 56);
  assert.equal(parseFeeRateBp('1.2'), 120);
  assert.equal(parseFeeRateBp('3'), 300);
  assert.equal(parseFeeRateBp('0.555'), null);
  assert.equal(parseFeeRateBp('12'), null);
});

test('잘못된 입력은 계산하지 않음', () => {
  const err = (x) => calcFee({ ...base, ...x }).error;
  assert.equal(err({ amount: 0 }), 'amount-invalid');
  assert.equal(err({ amount: LIMITS.maxAmount + 1 }), 'amount-invalid');
  assert.equal(err({ rateBp: 301 }), 'rate-invalid');
  assert.equal(err({ loanMonths: 0 }), 'months-invalid');
  assert.equal(err({ start: '2026-02-30' }), 'date-invalid');
  assert.equal(err({ repay: '2025-12-31' }), 'repay-before-start');
  assert.equal(err({ freeAmount: -1 }), 'free-invalid');
});
