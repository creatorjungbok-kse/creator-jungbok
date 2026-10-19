// 3.3% 계산기 엔진 테스트. 사용: npm run test:tools
// 기대값: GPT 승인 기준(2026-10-19)과 소득세법·시행령 규칙으로 직접 계산한 값.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calcWithholding, reversePay, MAX_PAY, OTHER_EXEMPT_MAX_PAY } from '../src/lib/payroll/freelancer/calculation.ts';

const r = (kind, pay) => {
  const x = calcWithholding(kind, pay);
  assert.equal(x.ok, true, `${kind} ${pay}`);
  return x.result;
};

test('3.3%: 금액별 소득세·지방소득세·받는 금액', () => {
  for (const [pay, tax, local, net] of [
    [1_000_000, 30_000, 3_000, 967_000],
    [3_000_000, 90_000, 9_000, 2_901_000],
    [1_234_567, 37_030, 3_700, 1_193_837],
    [500_000, 15_000, 1_500, 483_500],
  ]) {
    const x = r('business', pay);
    assert.deepEqual([x.incomeTax, x.localTax, x.net], [tax, local, net], String(pay));
  }
});

test('3.3%: 계속·반복 인적용역은 소액부징수 미적용 — 30,000원 → 소득세 900원, 받는 금액 29,010원', () => {
  const x = r('business', 30_000);
  assert.deepEqual([x.incomeTax, x.localTax, x.net], [900, 90, 29_010]);
  // 10원 미만 버림: 300원 → 소득세 0원(3% = 9원)
  assert.equal(r('business', 300).incomeTax, 0);
});

test('8.8%: 금액별 계산과 필요경비 60%', () => {
  for (const [pay, tax, local, net] of [
    [1_000_000, 80_000, 8_000, 912_000],
    [500_000, 40_000, 4_000, 456_000],
    [300_000, 24_000, 2_400, 273_600],
  ]) {
    const x = r('other', pay);
    assert.deepEqual([x.incomeTax, x.localTax, x.net], [tax, local, net], String(pay));
  }
});

test('8.8% 과세최저한: 125,000원까지 0원, 125,001원부터 기타소득금액 전체에 과세', () => {
  assert.equal(OTHER_EXEMPT_MAX_PAY, 125_000);
  const a = r('other', 125_000);
  assert.deepEqual([a.expense, a.income, a.belowMinimum, a.totalTax, a.net], [75_000, 50_000, true, 0, 125_000]);
  const b = r('other', 125_001);
  assert.deepEqual([b.expense, b.income, b.belowMinimum, b.incomeTax, b.localTax, b.net], [75_000, 50_001, false, 10_000, 1_000, 114_001]);
  const c = r('other', 125_002);
  assert.deepEqual([c.expense, c.income, c.totalTax, c.net], [75_001, 50_001, 11_000, 114_002]);
  for (let p = 1; p <= 125_000; p += 997) assert.equal(r('other', p).totalTax, 0, String(p));
});

test('역산 필수 사례(GPT 승인 기준)', () => {
  for (const [kind, target, pay] of [
    ['business', 1_000_000, 1_034_120],
    ['business', 3_000_000, 3_102_370],
    ['other', 1_000_000, 1_096_480],
    ['other', 120_000, 120_000],
    ['other', 125_000, 125_000],
    ['other', 125_001, 137_051],
  ]) {
    const x = reversePay(kind, target);
    assert.equal(x.ok, true);
    assert.equal(x.pay, pay, `${kind} ${target}`);
    assert.ok(x.result.net >= target);
  }
});

// 전수 대조: 목표 금액마다 1원부터 하나씩 늘려 처음으로 목표 이상이 되는 지급액(정답)을 구하고 엔진 결과와 비교한다.
// 받는 금액이 단조 증가가 아니므로(10원 버림, 125,000원 경계) 정답은 '처음 도달'로 정의한다.
const bruteMin = (kind, target) => {
  for (let p = 1; p <= MAX_PAY; p++) if (calcWithholding(kind, p).result.net >= target) return p;
  return null;
};

test('받는 금액은 단조 증가가 아니다(그래서 이진 탐색을 쓰지 않는다)', () => {
  let drops = 0;
  for (let p = 1; p < 200_000; p++) if (r('business', p + 1).net < r('business', p).net) drops++;
  assert.ok(drops > 0);
  assert.ok(r('other', 125_001).net < r('other', 125_000).net);
});

test('역산 = 전수 탐색 결과(작은 금액 전체, 경계 주변, 큰 금액 표본)', () => {
  // 작은 목표는 미리 받는 금액 표를 만들어 '처음 도달 지급액'을 구한다
  for (const kind of ['business', 'other']) {
    const first = new Map();
    let best = 0;
    for (let p = 1; p <= 220_000; p++) {
      const n = r(kind, p).net;
      while (best < n) first.set(++best, p);
    }
    for (let t = 1; t <= 200_000; t++) assert.equal(reversePay(kind, t).pay, first.get(t), `${kind} ${t}`);
  }
  for (const kind of ['business', 'other'])
    for (const t of [999_999, 1_000_001, 12_345_678, 87_654_321, 500_000_000]) {
      const x = reversePay(kind, t);
      assert.ok(x.result.net >= t);
      assert.ok(r(kind, x.pay - 1).net < t || x.pay === 1, `${kind} ${t} 최소성`);
      // 더 작은 지급액 중 목표에 닿는 값이 없는지 구간 아래 200원까지 확인
      for (let p = Math.max(1, x.pay - 200); p < x.pay; p++) assert.ok(r(kind, p).net < t, `${kind} ${t} ${p}`);
    }
});

test('입력 검증: 0원·음수·소수·10억 초과, 역산 결과가 10억을 넘는 경우', () => {
  assert.deepEqual(calcWithholding('business', 0), { ok: false, error: 'pay-invalid' });
  assert.deepEqual(calcWithholding('business', -1), { ok: false, error: 'pay-invalid' });
  assert.deepEqual(calcWithholding('business', 1.5), { ok: false, error: 'pay-invalid' });
  assert.deepEqual(calcWithholding('other', MAX_PAY + 1), { ok: false, error: 'over-max' });
  assert.equal(calcWithholding('business', MAX_PAY).ok, true);
  assert.deepEqual(reversePay('business', 0), { ok: false, error: 'target-invalid' });
  // 3.3%로 9억 7천만원 넘게 받으려면 지급액이 10억을 넘어야 한다
  // 10억원일 때 받는 금액은 10억원 이하 지급액으로 달성된다(10원 버림 때문에 더 작은 지급액일 수 있다)
  const top = reversePay('business', r('business', MAX_PAY).net);
  assert.ok(top.ok && top.pay <= MAX_PAY && top.result.net >= r('business', MAX_PAY).net);
  // 10억원 이하 지급액으로 받을 수 있는 최대 금액보다 1원 많으면 범위 초과
  for (const kind of ['business', 'other']) {
    let best = 0;
    for (let p = MAX_PAY - 200; p <= MAX_PAY; p++) best = Math.max(best, r(kind, p).net);
    assert.equal(reversePay(kind, best).ok, true);
    assert.deepEqual(reversePay(kind, best + 1), { ok: false, error: 'over-max' }, kind);
  }
});

test('화면: GA 신호는 도구 이름만 1곳, 저장·전송 없음, 예상 지방소득세 표기, 필수 안내 3가지', async () => {
  const { readFileSync } = await import('node:fs');
  const src = readFileSync('src/components/tools/FreelancerTax.astro', 'utf8');
  assert.equal((src.match(/dispatchEvent\(/g) ?? []).length, 1);
  assert.match(src, /new CustomEvent\('kkultip:tool-use', \{ detail: 'freelancer-tax' \}\)/);
  assert.doesNotMatch(src, /localStorage|sessionStorage|fetch\(|sendBeacon|gtag/);
  assert.match(src, /예상 지방소득세/);
  assert.match(src, /고르는 세율이 아니라 실제 소득의 성격/);
  assert.match(src, /실제 지급처의 계산·처리와 차이가 있을 수 있습니다/);
  assert.match(src, /고용보험료, 부가가치세, 그 밖의 공제액은 포함하지 않습니다/);
  // 계산은 lib 함수만 사용(화면 안에서 세율을 곱하지 않는다)
  assert.doesNotMatch(src.split('<script>')[1], /0\.033|0\.088|\* 3 \/|\* 20 \//);
});
