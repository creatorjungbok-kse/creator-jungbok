// 부가세 계산(스펙 §1·§2). 내부값은 정확값(분수)으로 보존하고, 반올림은 표시 단계(roundHalfUpWon)에서만 한다.
// 원 단위 반올림은 법정 끝수 규칙이 아니라 이 계산기의 화면 표시 규칙이다(사실표 A1 — 세금계산서 한 장의 끝수 규칙은 법령에서 확인하지 못함).
// 외부 import는 같은 폴더·급여 공용 정확값 모듈뿐 — 화면 스크립트·서버 렌더·node 테스트가 같은 함수를 쓴다.
import { add, exact, isWholeWon, lessThan, roundHalfUpWon, type Exact } from '../payroll/shared/money.ts';
import { cardCreditFor, EXEMPTION_THRESHOLD, industryRateFor, PURCHASE_CREDIT_PERMILLE, VAT_RATE_PERCENT } from './rules.ts';

// ── 모드 ① 빠른 계산 ──────────────────────────────────────────

export type QuickBasis = 'total' | 'supply' | 'vat';

export interface QuickLine {
  raw: Exact;
  // 화면 표시값(원)
  disp: number;
  // 원 미만이 생긴 값(앞에 '약')
  approx: boolean;
}
export interface QuickResult {
  supply: QuickLine;
  vat: QuickLine;
  total: QuickLine;
}

const line = (raw: Exact, disp = roundHalfUpWon(raw)): QuickLine => ({ raw, disp, approx: !isWholeWon(raw) });

// amount: 검증을 통과한 정수(1원 이상)
export function quickConvert(basis: QuickBasis, amount: number): QuickResult {
  const r = VAT_RATE_PERCENT; // 10
  if (basis === 'supply') {
    // 부가세 = 공급가액 × 10% (제31조). 표시 합계 = 공급가액 + 표시 부가세 → 세 값 합 일치
    const vat = line(exact(amount * r, 100));
    const totalRaw = exact(amount * (100 + r), 100);
    return { supply: line(exact(amount)), vat, total: { raw: totalRaw, disp: amount + vat.disp, approx: vat.approx } };
  }
  if (basis === 'total') {
    // 공급가액 = 합계 × 100/110 (제63조⑦의 환산식). 표시 부가세 = 입력 합계 − 표시 공급가액 → 세 값 합 일치
    const supply = line(exact(amount * 100, 100 + r));
    const vatRaw = exact(amount * r, 100 + r);
    return { supply, vat: { raw: vatRaw, disp: amount - supply.disp, approx: supply.approx }, total: line(exact(amount)) };
  }
  // 부가세가 공급가액의 정확히 10%일 때: 공급가액 = 부가세 × 10, 합계 = 부가세 × 11 (원 미만 없음)
  const supply = amount * (100 / r);
  return { supply: line(exact(supply)), vat: line(exact(amount)), total: line(exact(supply + amount)) };
}

// 결과 복사 문구(한 줄)
export const quickCopyText = (q: QuickResult): string => {
  const f = (l: QuickLine) => `${l.approx ? '약 ' : ''}${l.disp.toLocaleString('ko-KR')}원`;
  return `공급가액 ${f(q.supply)} / 부가세 ${f(q.vat)} / 합계 ${f(q.total)}`;
};

// ── 모드 ② 간이과세자 예상 연간 부가세 ───────────────────────────

// 사전 확인 — 하나라도 해당하면 계산하지 않는다(스펙 §2-1, 결정 9)
export const precheckKeys = ['multi-industry', 'open-close', 'type-change', 'tax-exempt-mix', 'zero-rated'] as const;
export type PrecheckKey = (typeof precheckKeys)[number];

export interface SimplifiedInput {
  year: number;
  // 1년 공급대가(부가세 포함 매출)
  sales: number;
  industry?: string;
  // 세금계산서등을 받은 매입 공급대가
  purchases?: number;
  // 카드·현금영수증 등 발급금액
  cardSales?: number;
  // 발행세액공제 대상인가(cardSales > 0일 때 필요)
  cardEligible?: boolean;
}

export interface SimplifiedAmounts {
  rate: number;
  base: Exact;
  purchaseCredit: Exact;
  cardCredit: Exact;
  // 카드 공제가 연간 한도에 걸렸는가
  cardCapped: boolean;
  // 카드 매출은 있지만 대상 여부가 '아니오·모름'이라 반영하지 않았는가
  cardNotApplied: boolean;
  totalCredit: Exact;
  tax: Exact;
  // 공제 합계가 기본 세액 이상이라 0원(넘는 부분은 없는 것으로 봄 — 제63조⑥)
  creditExceeded: boolean;
}

export type SimplifiedResult =
  | { kind: 'no-rule' } // 그 해 상수 없음
  | { kind: 'stop'; reasons: PrecheckKey[] }
  | { kind: 'exempt' }
  | ({ kind: 'amount' } & SimplifiedAmounts);

const ZERO = exact(0);
const permille = (amount: number, p: number): Exact => exact(amount * p, 1000);
const subOrZero = (a: Exact, b: Exact): Exact => (lessThan(b, a) ? exact(a.n * b.d - b.n * a.d, a.d * b.d) : ZERO);

// 매출만으로 면제 여부를 먼저 판단한다(스펙 §2-4: 면제면 업종 등 나머지 입력을 요구하지 않음)
export const isExempt = (sales: number): boolean => sales < EXEMPTION_THRESHOLD;

// 판정 순서: 상수 없음 → 사전 확인 → 면제 → 계산. 입력 검증은 화면에서 끝낸 값만 넣는다
export function evaluateSimplified(precheck: readonly PrecheckKey[], i: SimplifiedInput): SimplifiedResult {
  const card = cardCreditFor(i.year);
  if (!card) return { kind: 'no-rule' };
  if (precheck.length) return { kind: 'stop', reasons: precheckKeys.filter((k) => precheck.includes(k)) };
  if (isExempt(i.sales)) return { kind: 'exempt' };
  const industry = industryRateFor(i.industry ?? '');
  if (!industry) throw new RangeError(`업종 없음: ${i.industry}`);
  const purchases = i.purchases ?? 0;
  const cardSales = i.cardSales ?? 0;
  if (cardSales > i.sales) throw new RangeError('카드 매출이 1년 매출보다 큼');
  if (cardSales > 0 && i.cardEligible === undefined) throw new RangeError('발행세액공제 대상 여부 없음');

  // 기본 세액 = 공급대가 × 부가가치율 × 10% (제63조②) = sales × rate / 1000
  const base = exact(i.sales * industry.rate * VAT_RATE_PERCENT, 10_000);
  const purchaseCredit = permille(purchases, PURCHASE_CREDIT_PERMILLE);
  const applyCard = cardSales > 0 && i.cardEligible === true;
  const cardRaw = applyCard ? permille(cardSales, card.permille) : ZERO;
  const capE = exact(card.cap);
  const cardCapped = applyCard && lessThan(capE, cardRaw);
  const cardCredit = cardCapped ? capE : cardRaw;
  const totalCredit = add(purchaseCredit, cardCredit);
  const tax = subOrZero(base, totalCredit);
  return {
    kind: 'amount',
    rate: industry.rate,
    base,
    purchaseCredit,
    cardCredit,
    cardCapped,
    cardNotApplied: cardSales > 0 && i.cardEligible === false,
    totalCredit,
    tax,
    creditExceeded: !lessThan(totalCredit, base),
  };
}
