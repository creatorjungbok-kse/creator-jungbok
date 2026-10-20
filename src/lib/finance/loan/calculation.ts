// 대출 상환 계산기 엔진. 순수 함수, 정수 연산만 쓴다(원리금균등 월 상환액은 BigInt 분수로 정확히 계산한 뒤 반올림).
// 범위(GPT 승인 2026-10-20): 원리금균등·원금균등·만기일시, 거치기간 0~(기간−1)개월(만기일시는 거치 없음),
//   대출금액 1원~100억원, 기간 1~600개월, 연 0~20.00%(20%는 이 계산기의 지원 상한이지 법적 적합성 판정 기준이 아님).
// 계산 규칙(사이트의 예상 계산 규칙, 금융회사마다 다를 수 있음):
//   월 이율 = 연 이율 ÷ 12, 매달 이자 = 남은 원금 × 월 이율(원 미만 버림),
//   원리금균등 월 상환액 = P·r·(1+r)^m ÷ ((1+r)^m − 1)(원 미만 반올림, m = 기간 − 거치기간),
//   원금균등 월 원금 = P ÷ m(원 미만 버림), 마지막 회차에 남은 원금을 모두 갚는다.
//   0%는 원리금균등 공식의 분모가 0이 되므로 원금을 m회로 나누는(원금균등과 같은) 분기로 계산한다.
//   반올림·버림 때문에 마지막 회차 전에 원금이 모두 갚아지거나 매달 갚을 원금이 0원이 되는 극단적 소액 사례는 계산하지 않는다('too-small').

export type RepayMethod = 'equal-payment' | 'equal-principal' | 'bullet';

export const LIMITS = {
  minAmount: 1,
  maxAmount: 10_000_000_000, // 100억원
  minMonths: 1,
  maxMonths: 600, // 50년
  minRateBp: 0,
  maxRateBp: 2000, // 연 20.00%
} as const;

export interface LoanInput {
  method: RepayMethod;
  amount: number; // 대출 원금(원)
  months: number; // 대출기간(거치기간 포함)
  graceMonths: number; // 거치기간(이자만 내는 개월 수)
  rateBp: number; // 연 이율 × 100 (예: 4.00% → 400)
}

export interface LoanRow {
  no: number; // 회차
  principal: number; // 갚는 원금
  interest: number; // 이자
  payment: number; // 그달 낼 돈(원금 + 이자)
  balance: number; // 갚은 뒤 남은 원금
}

export interface LoanResult {
  rows: LoanRow[];
  totalInterest: number;
  totalPayment: number; // 원금 + 총이자
  firstPayment: number;
  lastPayment: number;
  maxPayment: number;
  // 원리금균등(이자 > 0)의 반올림한 월 상환액. 그 밖에는 null
  levelPayment: number | null;
  // 거치기간이 끝난 뒤 첫 상환 회차의 납입액(거치 없음이면 firstPayment와 같음)
  firstAmortPayment: number;
}

export type LoanError = 'amount-invalid' | 'months-invalid' | 'rate-invalid' | 'grace-invalid' | 'too-small';

const D = 120_000n; // 12개월 × 10,000(bp)

// 원리금균등 월 상환액(원 미만 반올림): P·bp·g^m ÷ (D·(g^m − D^m)), g = D + bp
export function levelPaymentOf(amount: number, months: number, rateBp: number): number {
  const p = BigInt(amount);
  const r = BigInt(rateBp);
  const g = D + r;
  const gm = g ** BigInt(months);
  const dm = D ** BigInt(months);
  const num = p * r * gm;
  const den = D * (gm - dm);
  return Number((2n * num + den) / (2n * den));
}

export function calcLoan(i: LoanInput): { ok: true; result: LoanResult } | { ok: false; error: LoanError } {
  if (!Number.isSafeInteger(i.amount) || i.amount < LIMITS.minAmount || i.amount > LIMITS.maxAmount) return { ok: false, error: 'amount-invalid' };
  if (!Number.isInteger(i.months) || i.months < LIMITS.minMonths || i.months > LIMITS.maxMonths) return { ok: false, error: 'months-invalid' };
  if (!Number.isInteger(i.rateBp) || i.rateBp < LIMITS.minRateBp || i.rateBp > LIMITS.maxRateBp) return { ok: false, error: 'rate-invalid' };
  const g = i.graceMonths;
  if (!Number.isInteger(g) || g < 0 || g > i.months - 1 || (i.method === 'bullet' && g !== 0)) return { ok: false, error: 'grace-invalid' };

  const n = i.months;
  const m = n - g; // 원금을 갚는 회차 수
  const r = BigInt(i.rateBp);
  // 0%의 원리금균등은 원금을 m회로 나누는 분기로 계산한다
  const level = i.method === 'equal-payment' && i.rateBp > 0 ? levelPaymentOf(i.amount, m, i.rateBp) : null;
  const evenPrincipal = Math.floor(i.amount / m);
  const usesEven = i.method === 'equal-principal' || (i.method === 'equal-payment' && level === null);
  // 매달 갚을 원금이 0원이 되는 경우(원금이 상환 회차 수보다 작음) — 마지막 회차만 원금을 갚게 되어 계산하지 않는다
  if (usesEven && m > 1 && evenPrincipal === 0) return { ok: false, error: 'too-small' };

  let bal = BigInt(i.amount);
  const rows: LoanRow[] = [];
  let totalInterest = 0;
  for (let k = 1; k <= n; k++) {
    const interest = (bal * r) / D; // 원 미만 버림(BigInt 나눗셈은 0 쪽으로 버림, 값은 항상 0 이상)
    let principal: bigint;
    if (k === n) principal = bal; // 마지막 회차: 남은 원금 전부
    else if (k <= g || i.method === 'bullet') principal = 0n;
    else if (level !== null) principal = BigInt(level) - interest;
    else principal = BigInt(evenPrincipal);
    // 방어: 원금 상환이 음수이거나 마지막 회차 전에 원금이 다 갚아지면 계산하지 않는다
    if (principal < 0n) return { ok: false, error: 'too-small' };
    if (k < n && k > g && i.method !== 'bullet' && (principal === 0n || principal >= bal)) return { ok: false, error: 'too-small' };
    bal -= principal;
    const iNum = Number(interest);
    const pNum = Number(principal);
    totalInterest += iNum;
    rows.push({ no: k, principal: pNum, interest: iNum, payment: pNum + iNum, balance: Number(bal) });
  }
  const payments = rows.map((x) => x.payment);
  return {
    ok: true,
    result: {
      rows,
      totalInterest,
      totalPayment: i.amount + totalInterest,
      firstPayment: payments[0],
      lastPayment: payments[n - 1],
      maxPayment: Math.max(...payments),
      levelPayment: level,
      firstAmortPayment: payments[Math.min(g, n - 1)],
    },
  };
}

// '4', '4.5', '3.85%', '0' → bp(400·450·385·0). 소수 셋째 자리 이상, 음수, 숫자 아님 → null
export function parseRateBp(raw: string): number | null {
  const s = raw.trim().replace(/%$/, '').trim();
  const m = /^(\d{1,2})(?:\.(\d{1,2}))?$/.exec(s);
  if (!m) return null;
  return Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0'));
}
