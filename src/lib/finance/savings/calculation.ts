// 예적금 세후 이자 계산기 엔진. 순수 함수, 정수 연산만 쓴다(월복리 거듭제곱은 BigInt 분수로 정확히 계산).
// 범위(GPT 승인 2026-10-19): 정기예금·정액적립식 정기적금, 단리·월복리, 1~60개월, 연 0.01~20.00%,
//   과세 5종(일반 15.4%, 비과세종합저축, 조합 예탁금 비과세·5%·9%). 우대 한도를 넘으면 계산하지 않는다.
// 근거: 소득세법 제129조①1라(14%), 지방세법 제103조의13(지방소득세 10%), 국고금관리법 제47조(10원 미만 버림),
//   조세특례제한법 제88조의2(비과세종합저축 5천만원), 제89조의3(조합등예탁금 3천만원, 2026 가입 5%·2027~ 9%),
//   농어촌특별세법 제4조4호(비과세종합저축 농특세 비과세), 제5조①2·④(감면세액의 10%).
// 이자 계산 가정은 금융감독원 '금융상품 한눈에' 예시와 같은 월 단위(단리: 개월/12, 복리: 월복리). 세전 이자는 마지막에 한 번만 원 미만 버림.
// 지방소득세·농특세 10원 미만 버림은 예상 계산 규칙이다.

export type Product = 'deposit' | 'installment';
export type Method = 'simple' | 'monthly';
export type TaxType = 'general' | 'taxfree' | 'coop-exempt' | 'coop-5' | 'coop-9';

export const LIMITS = {
  minMonths: 1,
  maxMonths: 60,
  minRateBp: 1, // 연 0.01%
  maxRateBp: 2000, // 연 20.00%
  maxDeposit: 10_000_000_000, // 예금 원금 100억원
  maxMonthly: 100_000_000, // 적금 월 납입 1억원
} as const;

// 우대 과세의 1명당 원금 한도(이 금액까지는 우대, 1원이라도 넘으면 계산하지 않는다)
export const PREFERENTIAL_LIMIT: Record<TaxType, number | null> = {
  general: null,
  taxfree: 50_000_000, // 조특법 제88조의2①
  'coop-exempt': 30_000_000, // 조특법 제89조의3①
  'coop-5': 30_000_000,
  'coop-9': 30_000_000,
};

// 소득세율(%)과 지방소득세·농특세 적용 여부
const TAX_RULE: Record<TaxType, { incomePct: number; local: boolean; rural: boolean }> = {
  general: { incomePct: 14, local: true, rural: false },
  taxfree: { incomePct: 0, local: false, rural: false },
  'coop-exempt': { incomePct: 0, local: false, rural: true },
  'coop-5': { incomePct: 5, local: false, rural: true },
  'coop-9': { incomePct: 9, local: false, rural: true },
};
// 농특세를 계산할 때 '감면 전' 세율로 보는 이자소득세율(농특세법 제5조④1가)
const BASE_INCOME_PCT = 14;

const floor10 = (n: number) => Math.floor(n / 10) * 10;

export interface SavingsInput {
  product: Product;
  method: Method;
  amount: number; // 예금: 맡길 원금, 적금: 월 납입액
  months: number;
  rateBp: number; // 연이율 × 100 (예: 3.50% → 350)
  tax: TaxType;
}

export interface SavingsResult {
  principal: number; // 원금 합계
  interest: number; // 세전 이자(원 미만 버림)
  incomeTax: number;
  localTax: number;
  ruralTax: number;
  totalTax: number;
  afterTax: number; // 세후 이자
  maturity: number; // 예상 만기 수령액
  // 적금만: 원금 합계를 처음부터 같은 기간 단리로 맡겼을 때의 세전 이자(적금 이자가 적은 이유 설명용)
  lumpSumInterest: number | null;
}

export type SavingsError = 'amount-invalid' | 'months-invalid' | 'rate-invalid' | 'over-max' | 'over-limit';

const D = 120_000n; // 12개월 × 10,000(bp)

// 세전 이자(원 미만 버림). BigInt로 정확히 계산한 뒤 마지막에 한 번만 버린다
export function interestOf(product: Product, method: Method, amount: number, months: number, rateBp: number): number {
  const a = BigInt(amount);
  const n = BigInt(months);
  const r = BigInt(rateBp);
  if (method === 'simple') {
    // 예금: 원금 × r × n / 120,000, 적금: 월 납입 × r × n(n+1)/2 / 120,000
    const num = product === 'deposit' ? a * r * n : (a * r * n * (n + 1n)) / 2n;
    // n(n+1)은 항상 짝수라 위 나눗셈은 정확하다
    return Number(num / D);
  }
  // 월복리: 한 달 성장률 = (120,000 + r) / 120,000
  const g = D + r;
  if (product === 'deposit') {
    const den = D ** n;
    return Number((a * (g ** n - den)) / den);
  }
  // 적금: Σ(k=1..n) 월 납입 × (g^k / D^k − 1) = 월 납입 × Σ(g^k × D^(n−k) − D^n) / D^n
  const den = D ** n;
  let sum = 0n;
  for (let k = 1n; k <= n; k++) sum += g ** k * D ** (n - k) - den;
  return Number((a * sum) / den);
}

export function taxesOf(interest: number, tax: TaxType): { incomeTax: number; localTax: number; ruralTax: number } {
  const rule = TAX_RULE[tax];
  const incomeTax = floor10(Math.floor((interest * rule.incomePct) / 100));
  const localTax = rule.local ? floor10(Math.floor(incomeTax / 10)) : 0;
  // 농특세 = (이자 × 14% − 실제 소득세) × 10% = (이자 × 14 − 소득세 × 100) / 1,000
  const ruralTax = rule.rural ? floor10(Math.floor((interest * BASE_INCOME_PCT - incomeTax * 100) / 1000)) : 0;
  return { incomeTax, localTax, ruralTax };
}

export function calcSavings(i: SavingsInput): { ok: true; result: SavingsResult } | { ok: false; error: SavingsError; limit?: number } {
  if (!Number.isSafeInteger(i.amount) || i.amount < 1) return { ok: false, error: 'amount-invalid' };
  if (!Number.isInteger(i.months) || i.months < LIMITS.minMonths || i.months > LIMITS.maxMonths) return { ok: false, error: 'months-invalid' };
  if (!Number.isInteger(i.rateBp) || i.rateBp < LIMITS.minRateBp || i.rateBp > LIMITS.maxRateBp) return { ok: false, error: 'rate-invalid' };
  if (i.amount > (i.product === 'deposit' ? LIMITS.maxDeposit : LIMITS.maxMonthly)) return { ok: false, error: 'over-max' };
  const principal = i.product === 'deposit' ? i.amount : i.amount * i.months;
  const limit = PREFERENTIAL_LIMIT[i.tax];
  // 우대 한도 초과: 한도 초과분을 나눠 과세하지 않으며, 전액에 우대세율을 적용한 결과도 내지 않는다(GPT 결정 2026-10-19)
  if (limit !== null && principal > limit) return { ok: false, error: 'over-limit', limit };
  const interest = interestOf(i.product, i.method, i.amount, i.months, i.rateBp);
  const t = taxesOf(interest, i.tax);
  const totalTax = t.incomeTax + t.localTax + t.ruralTax;
  const afterTax = interest - totalTax;
  const lumpSumInterest = i.product === 'installment' ? interestOf('deposit', 'simple', principal, i.months, i.rateBp) : null;
  return { ok: true, result: { principal, interest, ...t, totalTax, afterTax, maturity: principal + afterTax, lumpSumInterest } };
}

// '3.5', '3.50', '12' → bp(350·350·1200). 소수 셋째 자리 이상, 음수, 숫자 아님 → null
export function parseRateBp(raw: string): number | null {
  const s = raw.trim().replace(/%$/, '').trim();
  const m = /^(\d{1,2})(?:\.(\d{1,2}))?$/.exec(s);
  if (!m) return null;
  return Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0'));
}
