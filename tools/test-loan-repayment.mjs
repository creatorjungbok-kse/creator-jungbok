// 대출 상환 계산기 엔진 테스트. 사용: npm run test:tools
// 기대값: 설계안(2026-10-20) 검증 사례 8건 — GPT 독립 계산과 첫 달·마지막 달·총이자 모두 일치 확인.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calcLoan, levelPaymentOf, parseRateBp, LIMITS } from '../src/lib/finance/loan/calculation.ts';

const run = (method, amount, months, rateBp, graceMonths = 0) => {
  const x = calcLoan({ method, amount, months, rateBp, graceMonths });
  assert.equal(x.ok, true, `${method} ${amount} ${months} ${rateBp} ${graceMonths} → ${x.error}`);
  return x.result;
};
const err = (method, amount, months, rateBp, graceMonths = 0) => {
  const x = calcLoan({ method, amount, months, rateBp, graceMonths });
  assert.equal(x.ok, false, `${method} ${amount} ${months} ${rateBp} ${graceMonths} 는 계산되면 안 됨`);
  return x.error;
};
// 불변식: 원금 상환 합계 = 원금, 마지막 잔액 0, 총상환액 = 원금 + 총이자, 잔액은 늘지 않음, 음수 없음
const invariants = (r, amount) => {
  assert.equal(r.rows.reduce((s, x) => s + x.principal, 0), amount);
  assert.equal(r.rows.at(-1).balance, 0);
  assert.equal(r.totalPayment, amount + r.totalInterest);
  assert.equal(r.rows.reduce((s, x) => s + x.interest, 0), r.totalInterest);
  let prev = amount;
  for (const x of r.rows) {
    assert.ok(x.principal >= 0 && x.interest >= 0 && x.balance >= 0, `음수 회차 ${x.no}`);
    assert.equal(x.payment, x.principal + x.interest);
    assert.equal(x.balance, prev - x.principal);
    prev = x.balance;
  }
  for (const v of [r.totalInterest, r.totalPayment, r.maxPayment]) assert.ok(Number.isSafeInteger(v));
};

// [방식, 원금, 개월, bp, 거치, 첫 달 원금, 첫 달 이자, 첫 달 합계, 마지막 달 합계, 총이자]
const CASES = [
  ['equal-payment', 100_000_000, 360, 400, 0, 144_082, 333_333, 477_415, 477_288, 71_869_273],
  ['equal-principal', 100_000_000, 360, 400, 0, 277_777, 333_333, 611_110, 278_983, 60_166_655],
  ['bullet', 100_000_000, 360, 400, 0, 0, 333_333, 333_333, 100_333_333, 119_999_880],
  ['equal-payment', 30_000_000, 36, 550, 0, 768_377, 137_500, 905_877, 905_862, 2_611_557],
  ['equal-principal', 30_000_000, 36, 550, 0, 833_333, 137_500, 970_833, 837_164, 2_543_734],
  ['bullet', 30_000_000, 12, 550, 0, 0, 137_500, 137_500, 30_137_500, 1_650_000],
  ['equal-payment', 200_000_000, 360, 380, 12, 0, 633_333, 633_333, 949_015, 137_928_004],
  ['equal-payment', 10_000_000, 12, 700, 0, 806_934, 58_333, 865_267, 865_268, 383_205],
];

test('검증 사례 8건(GPT 독립 계산 일치): 첫 달·마지막 달·총이자', () => {
  for (const [method, P, n, bp, g, p1, i1, pay1, payN, totalI] of CASES) {
    const r = run(method, P, n, bp, g);
    const label = `${method} ${P} ${n} ${bp} 거치${g}`;
    assert.deepEqual([r.rows[0].principal, r.rows[0].interest, r.rows[0].payment], [p1, i1, pay1], label);
    assert.equal(r.lastPayment, payN, label);
    assert.equal(r.totalInterest, totalI, label);
    assert.equal(r.totalPayment, P + totalI, label);
    assert.equal(r.rows.length, n);
    invariants(r, P);
  }
});

test('원리금균등: 월 상환액은 이론값을 반올림, 마지막 회차 전까지 매달 같음', () => {
  assert.equal(levelPaymentOf(100_000_000, 360, 400), 477_415); // 이론값 477,415.30
  const r = run('equal-payment', 100_000_000, 360, 400);
  assert.equal(r.levelPayment, 477_415);
  assert.ok(r.rows.slice(0, -1).every((x) => x.payment === 477_415));
  // 거치 12개월: 1~12회는 이자만, 13회부터 348회로 나눈 월 상환액
  const gr = run('equal-payment', 200_000_000, 360, 380, 12);
  assert.ok(gr.rows.slice(0, 12).every((x) => x.principal === 0 && x.interest === 633_333));
  assert.equal(gr.levelPayment, levelPaymentOf(200_000_000, 348, 380));
  assert.equal(gr.firstAmortPayment, gr.levelPayment);
  assert.equal(gr.rows[12].payment, gr.levelPayment);
});

test('원금균등: 월 원금은 원 미만 버림, 남는 원금은 마지막 회차', () => {
  const r = run('equal-principal', 100_000_000, 360, 400);
  assert.ok(r.rows.slice(0, -1).every((x) => x.principal === 277_777));
  assert.equal(r.rows.at(-1).principal, 100_000_000 - 277_777 * 359);
  assert.equal(r.maxPayment, r.firstPayment);
  assert.equal(r.levelPayment, null);
});

test('0% 무이자: 세 방식 모두 이자 0원, 원리금균등은 원금을 나누는 분기', () => {
  const a = run('equal-payment', 10_000_000, 12, 0);
  assert.equal(a.totalInterest, 0);
  assert.equal(a.levelPayment, null);
  assert.ok(a.rows.slice(0, -1).every((x) => x.payment === 833_333));
  assert.equal(a.lastPayment, 10_000_000 - 833_333 * 11);
  const b = run('equal-principal', 10_000_000, 12, 0);
  assert.deepEqual(b.rows.map((x) => x.payment), a.rows.map((x) => x.payment));
  const c = run('bullet', 10_000_000, 12, 0);
  assert.equal(c.totalInterest, 0);
  assert.equal(c.firstPayment, 0);
  assert.equal(c.lastPayment, 10_000_000);
  for (const [x, P] of [[a, 10_000_000], [b, 10_000_000], [c, 10_000_000]]) invariants(x, P);
  // 0% + 거치
  const d = run('equal-payment', 1_000_000, 10, 0, 4);
  assert.ok(d.rows.slice(0, 4).every((x) => x.payment === 0));
  assert.equal(d.rows[4].payment, 166_666);
  invariants(d, 1_000_000);
});

test('거치기간 경계: 0개월, 기간−1개월, 만기일시는 거치 불가', () => {
  const g0 = run('equal-principal', 12_000_000, 12, 500, 0);
  assert.equal(g0.firstAmortPayment, g0.firstPayment);
  const gMax = run('equal-payment', 12_000_000, 12, 500, 11);
  assert.ok(gMax.rows.slice(0, 11).every((x) => x.principal === 0 && x.interest === 50_000));
  assert.equal(gMax.lastPayment, 12_050_000);
  invariants(gMax, 12_000_000);
  const pMax = run('equal-principal', 12_000_000, 12, 500, 11);
  assert.deepEqual(pMax.rows.map((x) => x.payment), gMax.rows.map((x) => x.payment));
  assert.equal(err('equal-payment', 12_000_000, 12, 500, 12), 'grace-invalid');
  assert.equal(err('equal-payment', 12_000_000, 12, 500, -1), 'grace-invalid');
  assert.equal(err('equal-payment', 12_000_000, 12, 500, 1.5), 'grace-invalid');
  assert.equal(err('bullet', 12_000_000, 12, 500, 1), 'grace-invalid');
});

test('금액·기간·금리 경계: 1원·100억원, 1개월·600개월, 0%·20%', () => {
  // 1개월: 세 방식 모두 원금 + 한 달 이자
  for (const m of ['equal-payment', 'equal-principal', 'bullet']) {
    const r = run(m, 10_000_000, 1, 600);
    assert.deepEqual([r.rows.length, r.firstPayment, r.totalInterest], [1, 10_050_000, 50_000]);
  }
  // 1원 1개월
  for (const m of ['equal-payment', 'equal-principal', 'bullet']) assert.equal(run(m, 1, 1, 2000).lastPayment, 1);
  // 600개월
  const long = run('equal-payment', 100_000_000, 600, 400);
  assert.equal(long.rows.length, 600);
  invariants(long, 100_000_000);
  // 최대 금액 · 최대 금리 · 최대 기간(안전 정수)
  for (const m of ['equal-payment', 'equal-principal', 'bullet']) invariants(run(m, LIMITS.maxAmount, 600, 2000), LIMITS.maxAmount);
  assert.equal(run('bullet', LIMITS.maxAmount, 600, 2000).totalInterest, 166_666_666 * 600);
  // 20% 단리 이자 한 달 = 100억 × 0.2 / 12 = 166,666,666.67 → 166,666,666
  assert.equal(run('bullet', LIMITS.maxAmount, 1, 2000).totalInterest, 166_666_666);
});

test('극단적 소액: 매달 원금이 0원이거나 마지막 전에 다 갚아지면 계산하지 않음', () => {
  // 원금균등·0% 원리금균등: 원금 < 상환 회차 수
  assert.equal(err('equal-principal', 100, 360, 400), 'too-small');
  assert.equal(err('equal-payment', 100, 360, 0), 'too-small');
  // 원리금균등: 반올림한 월 상환액이 첫 달 이자 이하(갚는 원금 0원)
  assert.equal(err('equal-payment', 1, 600, 100), 'too-small');
  // 원리금균등: 반올림 때문에 마지막 회차 전에 원금이 다 갚아짐(원금 2원, 3회, 월 상환액 0.67 → 1원: 2회차에 잔액 0)
  assert.equal(levelPaymentOf(2, 3, 1), 1);
  assert.equal(err('equal-payment', 2, 3, 1), 'too-small');
  assert.equal(err('equal-payment', 1, 3, 1), 'too-small');
  // 계산되는 가장 작은 사례들은 불변식을 지킨다
  invariants(run('equal-principal', 360, 360, 400), 360);
  invariants(run('equal-payment', 2, 2, 0), 2);
  // 만기일시는 원금이 작아도 계산된다(매달 이자 0원일 수 있음)
  invariants(run('bullet', 1, 600, 2000), 1);
});

test('잘못된 입력', () => {
  assert.equal(err('equal-payment', 0, 12, 400), 'amount-invalid');
  assert.equal(err('equal-payment', 1.5, 12, 400), 'amount-invalid');
  assert.equal(err('equal-payment', LIMITS.maxAmount + 1, 12, 400), 'amount-invalid');
  assert.equal(err('equal-payment', 1_000_000, 0, 400), 'months-invalid');
  assert.equal(err('equal-payment', 1_000_000, 601, 400), 'months-invalid');
  assert.equal(err('equal-payment', 1_000_000, 12.5, 400), 'months-invalid');
  assert.equal(err('equal-payment', 1_000_000, 12, -1), 'rate-invalid');
  assert.equal(err('equal-payment', 1_000_000, 12, 2001), 'rate-invalid');
  assert.equal(err('equal-payment', 1_000_000, 12, 4.5), 'rate-invalid');
  assert.equal(parseRateBp('4'), 400);
  assert.equal(parseRateBp('3.85%'), 385);
  assert.equal(parseRateBp(' 0 '), 0);
  assert.equal(parseRateBp('20.00'), 2000);
  assert.equal(parseRateBp('3.855'), null);
  assert.equal(parseRateBp('-1'), null);
  assert.equal(parseRateBp('abc'), null);
  assert.equal(parseRateBp('100'), null);
});

test('부동소수점 이론식과 대조(무작위 3,000건): 원리금균등 월 상환액 ±1원, 원금균등·만기일시 총이자', () => {
  let seed = 7;
  const rnd = (n) => ((seed = (seed * 48271) % 2147483647), seed % n);
  let checked = 0;
  for (let k = 0; k < 3000; k++) {
    const method = ['equal-payment', 'equal-principal', 'bullet'][k % 3];
    const P = 1_000_000 + rnd(1_000_000_000);
    const n = 1 + rnd(600);
    const g = method === 'bullet' ? 0 : rnd(Math.min(n, 60));
    const bp = 1 + rnd(2000);
    const x = calcLoan({ method, amount: P, months: n, rateBp: bp, graceMonths: g });
    if (!x.ok) {
      assert.equal(x.error, 'too-small');
      continue;
    }
    const r = x.result;
    invariants(r, P);
    const mr = bp / 120_000;
    const m = n - g;
    if (method === 'equal-payment') {
      const M = (P * mr * (1 + mr) ** m) / ((1 + mr) ** m - 1);
      assert.ok(Math.abs(r.levelPayment - M) <= 1, `${P} ${n} ${bp} ${g}: ${r.levelPayment} vs ${M}`);
    } else if (method === 'bullet') {
      // 매달 같은 이자(버림)
      assert.equal(r.totalInterest, Math.floor((P * bp) / 120_000) * n);
    } else {
      // 이론 총이자 = 거치 이자 + P·r·(m+1)/2. 차이 원인: 매달 이자 버림(회차당 1원 미만, 적게 나옴)과
      // 월 원금 버림으로 마지막 회차까지 남겨 두는 나머지(P mod m < m원)에 붙는 이자(최대 m × r × m, 많게 나옴)
      const ideal = P * mr * g + (P * mr * (m + 1)) / 2;
      assert.ok(Math.abs(r.totalInterest - ideal) <= n + m * mr * m + 2, `${P} ${n} ${bp} ${g}: ${r.totalInterest} vs ${ideal}`);
    }
    checked++;
  }
  assert.ok(checked > 2900);
});
