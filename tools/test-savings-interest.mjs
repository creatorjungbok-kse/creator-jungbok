// 예적금 세후 이자 계산기 엔진 테스트. 사용: npm run test:tools
// 기대값: GPT 승인 설계(2026-10-19) 검증 사례(GPT가 독립 계산으로 35개 값 일치 확인)와 조문 규칙으로 직접 계산한 값.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calcSavings, interestOf, taxesOf, parseRateBp, LIMITS } from '../src/lib/finance/savings/calculation.ts';

const run = (product, method, amount, months, rateBp, tax = 'general') => {
  const x = calcSavings({ product, method, amount, months, rateBp, tax });
  assert.equal(x.ok, true, `${product} ${method} ${amount} ${months} ${rateBp} ${tax} → ${x.error}`);
  return x.result;
};
const err = (product, method, amount, months, rateBp, tax = 'general') => {
  const x = calcSavings({ product, method, amount, months, rateBp, tax });
  assert.equal(x.ok, false);
  return x;
};

// [상품, 방식, 금액, 개월, bp, 세전 이자, 일반 세후, 조합 비과세 세후, 조합 5% 세후, 조합 9% 세후]
// 조합 예탁금 값은 원금 합계 3천만원 이하 사례만 둔다(한도 초과 사례는 아래 한도 테스트)
const CASES = [
  ['deposit', 'simple', 10_000_000, 12, 300, 300_000, 253_800, 295_800, 282_300, 271_500],
  ['deposit', 'monthly', 10_000_000, 12, 300, 304_159, 257_329, 299_909, 286_229, 275_269],
  ['deposit', 'simple', 30_000_000, 6, 280, 420_000, 355_320, 414_120, 395_220, 380_100],
  ['installment', 'simple', 500_000, 12, 350, 113_750, 96_240, 112_160, 107_050, 102_960],
  ['installment', 'monthly', 500_000, 12, 350, 114_975, 97_285, 113_375, 108_205, 104_065],
  ['installment', 'monthly', 100_000, 12, 295, 19_348, 16_378, 19_078, 18_218, 17_518],
  ['installment', 'simple', 300_000, 36, 400, 666_000, 563_440, 656_680, 626_710, 602_730],
];

test('설계 검증 사례 7건: 세전 이자와 과세 유형별 세후 이자', () => {
  for (const [p, m, a, n, bp, interest, ...after] of CASES) {
    const types = ['general', 'coop-exempt', 'coop-5', 'coop-9'];
    types.forEach((t, k) => {
      const r = run(p, m, a, n, bp, t);
      assert.equal(r.interest, interest, `${p} ${m} ${a} ${n} ${bp}`);
      assert.equal(r.afterTax, after[k], `${p} ${m} ${a} ${n} ${bp} ${t}`);
      assert.equal(r.maturity, r.principal + r.afterTax);
      assert.equal(r.totalTax, r.incomeTax + r.localTax + r.ruralTax);
    });
    // 비과세종합저축은 세금 0원
    const free = run(p, m, a, n, bp, 'taxfree');
    assert.deepEqual([free.totalTax, free.afterTax], [0, interest]);
  }
  // 예금 5천만원 · 2.80% · 6개월은 일반과세·비과세종합저축 예시로만 쓴다
  assert.equal(run('deposit', 'simple', 50_000_000, 6, 280).afterTax, 592_200);
  assert.equal(run('deposit', 'simple', 50_000_000, 6, 280, 'taxfree').afterTax, 700_000);
});

test('적금 월 10만원 · 2.95% · 12개월 월복리: 세금 2,970원, 만기 1,216,378원', () => {
  const r = run('installment', 'monthly', 100_000, 12, 295);
  assert.deepEqual([r.principal, r.interest, r.incomeTax, r.localTax, r.totalTax, r.afterTax, r.maturity], [1_200_000, 19_348, 2_700, 270, 2_970, 16_378, 1_216_378]);
});

test('세금 내역: 일반 14%+1.4%, 조합 1.4%·5.9%·9.5%(소득세·농특세 분리, 지방소득세 없음)', () => {
  assert.deepEqual(taxesOf(300_000, 'general'), { incomeTax: 42_000, localTax: 4_200, ruralTax: 0 });
  assert.deepEqual(taxesOf(300_000, 'coop-exempt'), { incomeTax: 0, localTax: 0, ruralTax: 4_200 });
  assert.deepEqual(taxesOf(300_000, 'coop-5'), { incomeTax: 15_000, localTax: 0, ruralTax: 2_700 });
  assert.deepEqual(taxesOf(300_000, 'coop-9'), { incomeTax: 27_000, localTax: 0, ruralTax: 1_500 });
  assert.deepEqual(taxesOf(300_000, 'taxfree'), { incomeTax: 0, localTax: 0, ruralTax: 0 });
  // 10원 미만 버림: 304,159원 → 소득세 42,582 → 42,580, 지방 4,258 → 4,250
  assert.deepEqual(taxesOf(304_159, 'general'), { incomeTax: 42_580, localTax: 4_250, ruralTax: 0 });
  // 조합 5%: 소득세 15,207 → 15,200, 농특세 (42,582.26 − 15,200) × 10% = 2,738 → 2,730
  assert.deepEqual(taxesOf(304_159, 'coop-5'), { incomeTax: 15_200, localTax: 0, ruralTax: 2_730 });
  // 작은 이자: 71원 → 소득세 9원 → 0원
  assert.deepEqual(taxesOf(71, 'general'), { incomeTax: 0, localTax: 0, ruralTax: 0 });
});

test('우대 한도: 비과세종합저축 5천만원, 조합 예탁금 3천만원까지만 계산하고 1원 넘으면 중단', () => {
  assert.equal(run('deposit', 'simple', 50_000_000, 12, 300, 'taxfree').principal, 50_000_000);
  const a = err('deposit', 'simple', 50_000_001, 12, 300, 'taxfree');
  assert.deepEqual([a.error, a.limit], ['over-limit', 50_000_000]);
  for (const t of ['coop-exempt', 'coop-5', 'coop-9']) {
    assert.equal(run('deposit', 'monthly', 30_000_000, 12, 300, t).principal, 30_000_000);
    const b = err('deposit', 'monthly', 30_000_001, 12, 300, t);
    assert.deepEqual([b.error, b.limit], ['over-limit', 30_000_000]);
  }
  // 적금은 월 납입 × 개월로 확인: 250만원 × 12 = 3천만원(가능), 2,500,001원 × 12(초과)
  assert.equal(run('installment', 'simple', 2_500_000, 12, 300, 'coop-5').principal, 30_000_000);
  assert.equal(err('installment', 'simple', 2_500_001, 12, 300, 'coop-5').error, 'over-limit');
  // 월 100만원 × 60개월 = 6천만원 → 비과세종합저축 한도 초과
  assert.equal(err('installment', 'monthly', 1_000_000, 60, 300, 'taxfree').error, 'over-limit');
  // 일반과세는 한도 없음
  assert.equal(run('deposit', 'simple', 1_000_000_000, 12, 300).interest, 30_000_000);
});

test('경계: 금리 0.01%·20%, 기간 1·60개월, 1원·최대 금액', () => {
  assert.equal(run('deposit', 'simple', 10_000_000, 12, 1).interest, 1_000);
  assert.equal(run('deposit', 'simple', 10_000_000, 12, 2000).interest, 2_000_000);
  assert.equal(run('deposit', 'simple', 10_000_000, 1, 300).interest, 25_000);
  assert.equal(run('installment', 'simple', 100_000, 1, 300).interest, 250);
  // 60개월 월복리 예금: 1,000만원 × (1.0025^60 − 1) = 1,616,167.9…
  assert.equal(run('deposit', 'monthly', 10_000_000, 60, 300).interest, 1_616_167);
  // 1원 예금은 이자 0원
  assert.equal(run('deposit', 'simple', 1, 12, 300).interest, 0);
  assert.equal(run('installment', 'monthly', 1, 1, 2000).interest, 0);
  // 최대 금액 · 최대 금리 · 최대 기간(BigInt 계산이 안전 정수 범위 안)
  const big = run('deposit', 'monthly', LIMITS.maxDeposit, 60, 2000);
  assert.ok(Number.isSafeInteger(big.interest) && big.interest > 0);
  const bigI = run('installment', 'monthly', LIMITS.maxMonthly, 60, 2000);
  assert.ok(Number.isSafeInteger(bigI.interest) && bigI.maturity > bigI.principal);
});

test('잘못된 입력', () => {
  assert.equal(err('deposit', 'simple', 0, 12, 300).error, 'amount-invalid');
  assert.equal(err('deposit', 'simple', 1.5, 12, 300).error, 'amount-invalid');
  assert.equal(err('deposit', 'simple', LIMITS.maxDeposit + 1, 12, 300).error, 'over-max');
  assert.equal(err('installment', 'simple', LIMITS.maxMonthly + 1, 12, 300).error, 'over-max');
  assert.equal(err('deposit', 'simple', 1_000, 0, 300).error, 'months-invalid');
  assert.equal(err('deposit', 'simple', 1_000, 61, 300).error, 'months-invalid');
  assert.equal(err('deposit', 'simple', 1_000, 1.5, 300).error, 'months-invalid');
  assert.equal(err('deposit', 'simple', 1_000, 12, 0).error, 'rate-invalid');
  assert.equal(err('deposit', 'simple', 1_000, 12, 2001).error, 'rate-invalid');
  assert.equal(parseRateBp('3.5'), 350);
  assert.equal(parseRateBp('3.50%'), 350);
  assert.equal(parseRateBp(' 12 '), 1200);
  assert.equal(parseRateBp('0.01'), 1);
  assert.equal(parseRateBp('3.555'), null);
  assert.equal(parseRateBp('-1'), null);
  assert.equal(parseRateBp('abc'), null);
  assert.equal(parseRateBp('100'), null);
});

test('BigInt 계산과 부동소수점 참조 계산 대조(무작위 3,000건, 차이 1원 이하)', () => {
  let seed = 11;
  const rnd = (n) => ((seed = (seed * 48271) % 2147483647), seed % n);
  for (let k = 0; k < 3000; k++) {
    const product = k % 2 ? 'deposit' : 'installment';
    const method = k % 3 ? 'monthly' : 'simple';
    const amount = 1 + rnd(product === 'deposit' ? 200_000_000 : 3_000_000);
    const n = 1 + rnd(60);
    const bp = 1 + rnd(2000);
    const r = bp / 120_000;
    let ref;
    if (method === 'simple') ref = product === 'deposit' ? (amount * bp * n) / 120_000 : (amount * bp * n * (n + 1)) / 2 / 120_000;
    else if (product === 'deposit') ref = amount * ((1 + r) ** n - 1);
    else { ref = 0; for (let j = 1; j <= n; j++) ref += amount * ((1 + r) ** j - 1); }
    const got = interestOf(product, method, amount, n, bp);
    assert.ok(Number.isInteger(got));
    assert.ok(Math.abs(got - Math.floor(ref)) <= 1, `${product} ${method} ${amount} ${n} ${bp}: ${got} vs ${ref}`);
  }
});

test('적금 비교값: 원금 합계를 처음부터 맡긴 단리 이자(설명용), 단리 비율 (n+1)/(2n)', () => {
  const r = run('installment', 'simple', 500_000, 12, 350);
  assert.equal(r.lumpSumInterest, 210_000);
  assert.equal(Math.round((r.interest / r.lumpSumInterest) * 1000), Math.round((13 / 24) * 1000));
  assert.equal(run('deposit', 'simple', 1_000_000, 12, 350).lumpSumInterest, null);
});
