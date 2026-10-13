// 부가세 계산기 v1 — 스펙(docs/ready/vat-calculator/spec.md) §5 테스트 T1~T32. 사용: npm run test:tools
// raw = 내부 정확값(분수), disp = 화면 표시값(0.5원 이상 올림). 기대값은 손으로 계산했다(스펙 표와 같은 값).
// 화면 동작(탭·단계 노출·오류 문구·복사·GA 1회)은 같은 함수를 쓰는 화면에서 따로 확인한다 — 여기서는 그 함수의 판정을 고정한다.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { exact, isWholeWon, roundHalfUpWon } from '../src/lib/payroll/shared/money.ts';
import { parseWonInt } from '../src/lib/payroll/shared/validation.ts';
import { kstDate, kstYear } from '../src/lib/payroll/shared/korea-time.ts';
import { evaluateSimplified, isExempt, quickConvert, quickCopyText } from '../src/lib/vat/calculation.ts';
import {
  AMOUNT_MAX,
  AMOUNT_MIN,
  cardCreditFor,
  EXEMPTION_THRESHOLD,
  industryRates,
  isSimplifiedStale,
  reviewFrom,
  validUntil,
} from '../src/lib/vat/rules.ts';

const amt = (s) => parseWonInt(s, { min: AMOUNT_MIN, max: AMOUNT_MAX });
const q = (basis, n) => {
  const r = quickConvert(basis, n);
  return { s: r.supply.disp, v: r.vat.disp, t: r.total.disp, approx: [r.supply.approx, r.vat.approx, r.total.approx] };
};
const won = (x) => roundHalfUpWon(x);
const simple = (o, pre = []) => evaluateSimplified(pre, { year: 2026, industry: 'retail-food', purchases: 0, cardSales: 0, ...o });

// ── ① 빠른 계산 ──
test('T1 공급가액 1,000,000 → 100,000 / 1,100,000, 약 없음', () => {
  assert.deepEqual(q('supply', 1_000_000), { s: 1_000_000, v: 100_000, t: 1_100_000, approx: [false, false, false] });
});
test('T2 공급가액 12,345 → 부가세 1234.5 → 1,235(0.5 올림), 합계 13,580, 약', () => {
  assert.deepEqual(q('supply', 12_345), { s: 12_345, v: 1_235, t: 13_580, approx: [false, true, true] });
});
test('T3 공급가액 12,344 → 부가세 1234.4 → 1,234, 합계 13,578, 약', () => {
  assert.deepEqual(q('supply', 12_344), { s: 12_344, v: 1_234, t: 13_578, approx: [false, true, true] });
});
test('T4 합계 1,100,000 → 1,000,000 / 100,000, 약 없음', () => {
  assert.deepEqual(q('total', 1_100_000), { s: 1_000_000, v: 100_000, t: 1_100_000, approx: [false, false, false] });
});
test('T5 합계 50,000 → 약 45,455 / 약 4,545', () => {
  assert.deepEqual(q('total', 50_000), { s: 45_455, v: 4_545, t: 50_000, approx: [true, true, false] });
});
test('T6 합계 1 → 약 1 / 약 0 (경계)', () => {
  assert.deepEqual(q('total', 1), { s: 1, v: 0, t: 1, approx: [true, true, false] });
});
test('T7 합계 5 → 약 5 / 약 0', () => {
  assert.deepEqual(q('total', 5), { s: 5, v: 0, t: 5, approx: [true, true, false] });
});
test('T8 부가세 4,545 → 공급가액 45,450 / 합계 49,995, 약 없음', () => {
  assert.deepEqual(q('vat', 4_545), { s: 45_450, v: 4_545, t: 49_995, approx: [false, false, false] });
});
test('T9 0·음수·소수·1,000억 초과 → 오류', () => {
  for (const s of ['0', '-1', '1.5', '100000000001', '999999999999999999']) assert.equal(amt(s).ok, false, s);
  assert.equal(amt('100000000000').ok, true);
});
test('T10 합계 1~100,000 전부: 표시 공급가액 + 표시 부가세 = 입력 합계', () => {
  for (let t = 1; t <= 100_000; t++) {
    const r = quickConvert('total', t);
    assert.equal(r.supply.disp + r.vat.disp, t);
  }
});

// ── ② 간이과세자 ──
test('T11 2026·15%·매출 8천만·매입 3천만·카드 5천만(대상) → 1,200,000 − 150,000 − 650,000 = 400,000', () => {
  const r = simple({ sales: 80_000_000, purchases: 30_000_000, cardSales: 50_000_000, cardEligible: true });
  assert.equal(r.kind, 'amount');
  assert.deepEqual([won(r.base), won(r.purchaseCredit), won(r.cardCredit), won(r.tax)], [1_200_000, 150_000, 650_000, 400_000]);
  assert.equal(r.cardCapped, false);
});
test('T12 같은 입력 2027 → 카드 공제 500,000 → 550,000', () => {
  const r = simple({ year: 2027, sales: 80_000_000, purchases: 30_000_000, cardSales: 50_000_000, cardEligible: true });
  assert.deepEqual([won(r.cardCredit), won(r.tax)], [500_000, 550_000]);
});
test('T13 2026 카드 한도: 매출·카드매출 각 10억, 40% → 카드 공제 10,000,000(한도)', () => {
  const r = simple({ industry: 'professional', sales: 1_000_000_000, cardSales: 1_000_000_000, cardEligible: true });
  assert.equal(won(r.cardCredit), 10_000_000);
  assert.equal(r.cardCapped, true);
  assert.equal(won(r.tax), 40_000_000 - 10_000_000);
});
test('T14 공제가 기본보다 큼 → 0원(음수 없음)', () => {
  const r = simple({ sales: 50_000_000, purchases: 50_000_000, cardSales: 50_000_000, cardEligible: true });
  // 기본 750,000 < 공제 250,000 + 650,000
  assert.equal(won(r.tax), 0);
  assert.equal(r.creditExceeded, true);
});
test('T15 매출 47,999,999 → 면제(업종 등 없어도 됨)', () => {
  assert.deepEqual(evaluateSimplified([], { year: 2026, sales: 47_999_999 }), { kind: 'exempt' });
  assert.equal(isExempt(47_999_999), true);
});
test('T16 매출 48,000,000 → 계산함(미만이 기준)', () => {
  assert.equal(isExempt(EXEMPTION_THRESHOLD), false);
  assert.equal(simple({ sales: 48_000_000 }).kind, 'amount');
});
test('T17 사전 확인 체크 1개 → 중단, 금액 없음', () => {
  assert.deepEqual(evaluateSimplified(['multi-industry'], { year: 2026, sales: 80_000_000 }), { kind: 'stop', reasons: ['multi-industry'] });
});
test('T18 카드 매출 > 1년 매출 → 거부', () => {
  assert.throws(() => simple({ sales: 50_000_000, cardSales: 50_000_001, cardEligible: true }));
});
test('T19 공제 대상 아니오·모름 → 카드 공제 0 + 안내 표시 신호', () => {
  const r = simple({ sales: 80_000_000, cardSales: 50_000_000, cardEligible: false });
  assert.equal(won(r.cardCredit), 0);
  assert.equal(r.cardNotApplied, true);
  assert.equal(won(r.tax), 1_200_000);
});
test('T20 상수 reviewFrom·validUntil — 기한이 지나면 실패', () => {
  assert.equal(reviewFrom, '2026-12-01');
  assert.equal(validUntil, '2027-12-31');
  assert.ok(kstDate() <= validUntil, `부가세 계산기 상수 기한(${validUntil}) 지남 — src/lib/vat/rules.ts 갱신`);
});
test('T21 합계 1~1,000,000 전부: 합 일치, 약 여부 = (10T mod 11 ≠ 0)', () => {
  for (let t = 1; t <= 1_000_000; t++) {
    const r = quickConvert('total', t);
    assert.equal(r.supply.disp + r.vat.disp, t);
    assert.equal(r.supply.approx, (10 * t) % 11 !== 0);
  }
});
test('T22 반올림 경계: 0.5→1, 0.4999…→0, 1234.5→1235, 2.5→3(짝수 반올림 아님)', () => {
  assert.equal(roundHalfUpWon(exact(1, 2)), 1);
  assert.equal(roundHalfUpWon(exact(4999, 10000)), 0);
  assert.equal(roundHalfUpWon(exact(12345, 10)), 1235);
  assert.equal(roundHalfUpWon(exact(5, 2)), 3);
  assert.equal(isWholeWon(exact(5, 2)), false);
});
test('T23 입력 형식: 빈 값·공백은 empty, "1,000" 허용, "1000원"·전각 숫자 오류', () => {
  assert.deepEqual(amt(''), { ok: false, code: 'empty' });
  assert.deepEqual(amt('   '), { ok: false, code: 'empty' });
  assert.deepEqual(amt('1,000'), { ok: true, value: 1000 });
  assert.equal(amt('1000원').ok, false);
  assert.equal(amt('１０００').ok, false);
});
test('T24 기준(Q1)을 바꾸면 같은 숫자를 새 기준으로 계산', () => {
  assert.notDeepEqual(q('total', 55_000), q('supply', 55_000));
  assert.deepEqual(q('total', 55_000), { s: 50_000, v: 5_000, t: 55_000, approx: [false, false, false] });
  assert.deepEqual(q('supply', 55_000), { s: 55_000, v: 5_500, t: 60_500, approx: [false, false, false] });
});
test('T25 오늘이 2028년이면 간이과세자 모드 차단, 빠른 계산은 정상', () => {
  assert.equal(isSimplifiedStale(2028), true);
  assert.equal(isSimplifiedStale(kstYear(new Date('2028-01-01T00:00:00+09:00'))), true);
  assert.equal(isSimplifiedStale(2026), false);
  assert.equal(isSimplifiedStale(2027), false);
  assert.deepEqual(evaluateSimplified([], { year: 2028, sales: 80_000_000 }), { kind: 'no-rule' });
  assert.equal(quickConvert('total', 11_000).supply.disp, 10_000);
});
test('T26 2단계 입력값이 있어도 매출을 4,800만원 미만으로 바꾸면 면제', () => {
  const r = evaluateSimplified([], { year: 2026, sales: 40_000_000, industry: 'lodging', purchases: 1, cardSales: 1, cardEligible: true });
  assert.deepEqual(r, { kind: 'exempt' });
});
test('T27 공제 합계 = 기본 세액 → 0원', () => {
  // 기본 = 60,000,000 × 15% × 10% = 900,000 / 매입 180,000,000 × 0.5% = 900,000 — 매입은 매출보다 클 수 있다(재고 매입 등)
  const r = simple({ sales: 60_000_000, purchases: 180_000_000 });
  assert.equal(won(r.base), 900_000);
  assert.equal(won(r.tax), 0);
  assert.equal(r.creditExceeded, true);
});
test('T28 2026 카드 한도 직전/직후: 769,230,769 → 약 10,000,000(한도 아님) / 769,230,770 → 한도 10,000,000', () => {
  const below = simple({ industry: 'professional', sales: 1_000_000_000, cardSales: 769_230_769, cardEligible: true });
  assert.equal(below.cardCapped, false);
  assert.equal(isWholeWon(below.cardCredit), false);
  assert.equal(won(below.cardCredit), 10_000_000);
  const above = simple({ industry: 'professional', sales: 1_000_000_000, cardSales: 769_230_770, cardEligible: true });
  assert.equal(above.cardCapped, true);
  assert.deepEqual(above.cardCredit, exact(10_000_000));
});
test('T29 2027 카드 한도: 500,000,000 × 1% = 5,000,000(한도와 같음, 한도 초과 아님)', () => {
  const r = simple({ year: 2027, industry: 'professional', sales: 1_000_000_000, cardSales: 500_000_000, cardEligible: true });
  assert.deepEqual(r.cardCredit, exact(5_000_000));
  assert.equal(r.cardCapped, false);
  assert.equal(cardCreditFor(2027).cap, 5_000_000);
});
test('T30 GA: 신호는 도구 이름 고정 문자열 1곳, 1회 가드, 값 없음', () => {
  const code = readFileSync('src/components/tools/VatCalculator.astro', 'utf8');
  const all = code.match(/kkultip:tool-use/g) ?? [];
  assert.equal(all.length, 1);
  assert.match(code, /new CustomEvent\('kkultip:tool-use', \{ detail: 'vat-calculator' \}\)/);
  assert.match(code, /if \(signaled\) return;\s+signaled = true;/);
  // 입력 오류·복사 처리 안에서는 신호를 보내지 않는다
  const copyHandler = code.slice(code.indexOf("$('[data-vat-copy]')"), code.indexOf('// ── ② 간이과세자'));
  assert.doesNotMatch(copyHandler, /signalUse\(\)/);
  assert.doesNotMatch(code, /localStorage|sessionStorage|location\.(search|hash)\s*=|history\.(push|replace)State/);
});
test('T31 계산됨 결과: 제목에 기납부세액 반영 전, 기납부 미반영 고정 문구', () => {
  const code = readFileSync('src/components/tools/VatCalculator.astro', 'utf8');
  assert.match(code, /예상 연간 부가세 \(예정부과·기납부세액 반영 전\)/);
  assert.match(code, /올해 예정부과·예정신고 등으로 이미 납부한 세액은 반영하지 않았습니다\. 실제 확정신고 때 납부할 금액은 이 결과보다 달라질 수 있습니다\./);
  assert.doesNotMatch(code, /실제로 낼/);
});
test('T32 과세유형 전환(양방향) 체크 → 중단', () => {
  assert.deepEqual(evaluateSimplified(['type-change'], { year: 2026, sales: 80_000_000 }), { kind: 'stop', reasons: ['type-change'] });
  const code = readFileSync('src/components/tools/VatCalculator.astro', 'utf8');
  assert.match(code, /간이과세자와 일반과세자 사이에서 과세유형이 바뀌었어요/);
});

// ── 상수 자체(법령 원문 값) ──
test('업종별 부가가치율 6구분(시행령 제111조②)', () => {
  assert.deepEqual(industryRates.map((i) => i.rate), [15, 20, 25, 30, 40, 30]);
});
test('복사 문구', () => {
  assert.equal(quickCopyText(quickConvert('total', 50_000)), '공급가액 약 45,455원 / 부가세 약 4,545원 / 합계 50,000원');
});
