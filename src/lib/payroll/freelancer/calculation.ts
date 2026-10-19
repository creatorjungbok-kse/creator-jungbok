// 3.3% 계산기(프리랜서 원천징수) 엔진. 순수 함수, 정수 연산만 쓴다.
// 범위(GPT 승인 2026-10-19): 사업소득 3.3%(계속·반복 인적용역), 기타소득 8.8%(필요경비 60% 적용 소득), 두 방식 모두 역산. 지급액 10억원까지.
// 근거: 소득세법 제129조①3·6라, 제84조3호, 제86조1호, 시행령 제87조1의2, 제149조의3, 국고금관리법 제47조, 지방세법 제103조의13.
// 지방소득세 10원 미만 버림은 예상 계산 규칙(지방회계법 제55조는 '할 수 있다' 재량 규정).

export type IncomeKind = 'business' | 'other';
export const MAX_PAY = 1_000_000_000;

// 사업소득 원천징수세율 3%, 기타소득 20%, 기타소득 필요경비율 60%, 과세최저한 기타소득금액 건별 5만원
export const RULES = {
  businessRatePct: 3,
  otherRatePct: 20,
  otherExpensePct: 60,
  otherMinimumIncome: 50_000,
  localPct: 10,
} as const;
// 필요경비 60%일 때 과세하지 않는 최대 지급액(기타소득금액 50,000원이 되는 지급액)
export const OTHER_EXEMPT_MAX_PAY = 125_000;

const floor10 = (n: number) => Math.floor(n / 10) * 10;

export interface WithholdingResult {
  kind: IncomeKind;
  pay: number;
  // 기타소득만: 필요경비(원 미만 버림)·기타소득금액, 과세최저한 해당 여부
  expense: number;
  income: number;
  belowMinimum: boolean;
  incomeTax: number;
  localTax: number;
  totalTax: number;
  net: number;
}

export type CalcError = 'pay-invalid' | 'target-invalid' | 'over-max';

export function calcWithholding(kind: IncomeKind, pay: number): { ok: true; result: WithholdingResult } | { ok: false; error: CalcError } {
  if (!Number.isSafeInteger(pay) || pay < 1) return { ok: false, error: 'pay-invalid' };
  if (pay > MAX_PAY) return { ok: false, error: 'over-max' };
  let expense = 0;
  let income = pay;
  let belowMinimum = false;
  let incomeTax: number;
  if (kind === 'business') {
    // 계속·반복 인적용역 사업소득은 소액부징수(1천원 미만 면제)를 적용하지 않는다(시행령 제149조의3)
    incomeTax = floor10(Math.floor((pay * RULES.businessRatePct) / 100));
  } else {
    expense = Math.floor((pay * RULES.otherExpensePct) / 100);
    income = pay - expense;
    belowMinimum = income <= RULES.otherMinimumIncome;
    // 과세최저한을 넘으면 기타소득금액 전체에 20%(넘은 부분만이 아님)
    incomeTax = belowMinimum ? 0 : floor10(Math.floor((income * RULES.otherRatePct) / 100));
  }
  const localTax = floor10(Math.floor((incomeTax * RULES.localPct) / 100));
  const totalTax = incomeTax + localTax;
  return { ok: true, result: { kind, pay, expense, income, belowMinimum, incomeTax, localTax, totalTax, net: pay - totalTax } };
}

const netOf = (kind: IncomeKind, pay: number) => {
  const r = calcWithholding(kind, pay);
  if (!r.ok) throw new RangeError(String(pay));
  return r.result.net;
};

// 역산: 받는 금액이 목표 이상인 가장 작은 지급액.
// 받는 금액은 지급액에 대해 단조 증가가 아니다(10원 버림 경계, 기타소득 125,000원 경계). 그래서 이진 탐색을 쓰지 않고,
// 세율로 후보 구간을 좁힌 뒤 구간 안의 모든 정수를 실제 계산 함수로 확인한다.
// 사업소득: 0.967·지급액 ≤ 받는 금액 ≤ 0.967·지급액 + 21, 기타소득(과세 구간): 0.912·지급액 − 1 ≤ 받는 금액 ≤ 0.912·지급액 + 22
// → 답은 [(목표 − 50) ÷ 비율, (목표 + 1) ÷ 비율 + 2] 안에 있다(여유 50원). 테스트에서 전수 탐색과 대조한다
export function reversePay(kind: IncomeKind, target: number): { ok: true; pay: number; result: WithholdingResult } | { ok: false; error: CalcError } {
  if (!Number.isSafeInteger(target) || target < 1) return { ok: false, error: 'target-invalid' };
  if (target > MAX_PAY) return { ok: false, error: 'over-max' };
  const done = (pay: number) => {
    const r = calcWithholding(kind, pay);
    return r.ok ? ({ ok: true, pay, result: r.result } as const) : r;
  };
  if (kind === 'other' && target <= OTHER_EXEMPT_MAX_PAY) {
    // 비과세 구간은 받는 금액 = 지급액. 목표보다 작은 지급액은 비과세든 과세든 받는 금액이 목표보다 작다
    return done(target);
  }
  // 비율은 천분율 정수로 계산한다(사업소득 967, 기타소득 912)
  const keep = kind === 'business' ? 967 : 912;
  const slack = 50;
  let lo = Math.max(1, Math.floor(((target - slack) * 1000) / keep) - 1);
  if (kind === 'other') lo = Math.max(lo, OTHER_EXEMPT_MAX_PAY + 1);
  const hi = Math.ceil(((target + 1) * 1000) / keep) + 2;
  for (let pay = lo; pay <= Math.min(hi, MAX_PAY); pay++) {
    if (netOf(kind, pay) >= target) return done(pay);
  }
  return { ok: false, error: 'over-max' };
}
