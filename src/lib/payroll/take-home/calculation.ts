// 월급 실수령액(예상) 계산 v1 엔진. 순수 함수, 정수 연산만 쓴다.
// 범위(GPT 승인 2026-10-17): 4대보험 적용 대상인 일반 월급 근로자, 한 달을 다 일한 달. 과세 월급여 1,000만원 초과는 계산하지 않는다(끝수 규칙 미확인).
// 근거: 소득세법 시행령 제194조·별표 2(2026. 2. 27. 개정), 소득세법 제12조3호러목·머목, 지방세법 제103조의13, 4대보험 엔진(lib/social-insurance).
// 지방소득세 10원 미만 버림은 잠정 규칙(지방회계법 제55조 참고). 공식 특별징수 계산 사례와 대조 전에는 확정 규칙으로 표기하지 않는다.
import { calcSocialInsurance, type SocialInsuranceResult } from '../../social-insurance/calculation.ts';
import type { CompanySizeKey } from '../../social-insurance/rules.ts';
import { AT_10M, TABLE_MAX_THOUSAND, TABLE_MIN_THOUSAND, WITHHOLDING_ROWS } from './withholding-table.ts';

// 비과세 한도(월): 식사대 20만원, 6세 이하 자녀 보육 관련 급여 자녀 1명당 20만원
export const MEAL_EXEMPT_MAX = 200_000;
export const CHILDCARE_EXEMPT_PER_CHILD = 200_000;
// 입력 상한(입력 오류 방지용 UX 제한, 법령 값 아님)
export const CHILDREN_UNDER6_MAX = 20;

// 8세 이상 20세 이하 자녀 공제(별표 2 주석 3, 2026. 3. 1. 이후 원천징수분)
export const CHILD_DEDUCTION = { one: 20_830, two: 45_830, perExtra: 33_330 } as const;

export const RATES = [80, 100, 120] as const;
export type Rate = (typeof RATES)[number];

const floor10 = (n: number) => Math.floor(n / 10) * 10;

export function childDeduction(children: number): number {
  if (children <= 0) return 0;
  if (children === 1) return CHILD_DEDUCTION.one;
  return CHILD_DEDUCTION.two + (children - 2) * CHILD_DEDUCTION.perExtra;
}

// 표에서 가족 수별 세액(가족 11명 초과는 주석 4). taxable은 원 단위, 1,000만원 이하만
export function tableTax(taxable: number, family: number): number {
  if (!Number.isSafeInteger(taxable) || taxable < 0) throw new RangeError(`과세 월급여: ${taxable}`);
  if (!Number.isInteger(family) || family < 1) throw new RangeError(`공제대상가족 수: ${family}`);
  if (taxable > TABLE_MAX_THOUSAND * 1000) throw new RangeError('1,000만원 초과 구간은 v1에서 계산하지 않는다');
  if (taxable < TABLE_MIN_THOUSAND * 1000) return 0;
  let cells: readonly number[];
  if (taxable === TABLE_MAX_THOUSAND * 1000) cells = AT_10M;
  else {
    // 하한(천원) ≤ 과세 월급여 < 다음 행 하한. 이진 탐색
    let lo = 0;
    let hi = WITHHOLDING_ROWS.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (WITHHOLDING_ROWS[mid][0] * 1000 <= taxable) lo = mid;
      else hi = mid - 1;
    }
    cells = WITHHOLDING_ROWS[lo].slice(1);
  }
  if (family <= 11) return cells[family - 1];
  const f10 = cells[9];
  const f11 = cells[10];
  return Math.max(0, f11 - (f10 - f11) * (family - 11));
}

// 월 원천징수 소득세: 표 세액 − 자녀 공제(음수면 0) → 비율 적용 → 10원 미만 버림(국세청 안내 예시와 같은 순서)
export function monthlyIncomeTax(taxable: number, family: number, children8to20: number, rate: Rate): number {
  const base = Math.max(0, tableTax(taxable, family) - childDeduction(children8to20));
  return floor10((base * rate) / 100);
}

export interface TakeHomeInput {
  // 세전 월 지급액(원, 비과세 포함)
  gross: number;
  // 비과세로 받는 금액(원). 실제 지급받고 법정 요건을 충족한 경우만 입력한다
  meal: number;
  childcare: number;
  childrenUnder6: number;
  otherExempt: number;
  // 공제대상가족 수(본인 포함), 그중 8세 이상 20세 이하 자녀 수
  family: number;
  children8to20: number;
  rate: Rate;
  companySize: CompanySizeKey;
  age60: boolean;
  newHireAfter65: boolean;
}

export type TakeHomeError =
  | 'gross-invalid'
  | 'family-invalid'
  | 'children-exceed-family'
  | 'exempt-invalid'
  | 'exempt-exceeds-gross'
  | 'over-10m';

export type TakeHomeNotice = 'meal-over-limit' | 'childcare-over-limit' | 'below-table';

export interface TakeHomeResult {
  gross: number;
  exempt: { meal: number; childcare: number; other: number; total: number };
  taxable: number;
  insurance: SocialInsuranceResult;
  incomeTax: number;
  localTax: number;
  deductions: number;
  net: number;
  notices: TakeHomeNotice[];
}

const isNonNegInt = (n: number) => Number.isSafeInteger(n) && n >= 0;

export function calcTakeHome(i: TakeHomeInput): { ok: true; result: TakeHomeResult } | { ok: false; error: TakeHomeError } {
  if (!Number.isSafeInteger(i.gross) || i.gross < 1) return { ok: false, error: 'gross-invalid' };
  if (!Number.isInteger(i.family) || i.family < 1 || i.family > 30) return { ok: false, error: 'family-invalid' };
  if (!isNonNegInt(i.children8to20) || !isNonNegInt(i.childrenUnder6)) return { ok: false, error: 'family-invalid' };
  if (i.childrenUnder6 > CHILDREN_UNDER6_MAX) return { ok: false, error: 'family-invalid' };
  // 8~20세 자녀는 공제대상가족에 포함되므로 본인을 뺀 인원을 넘을 수 없다
  if (i.children8to20 > i.family - 1) return { ok: false, error: 'children-exceed-family' };
  if (![i.meal, i.childcare, i.otherExempt].every(isNonNegInt)) return { ok: false, error: 'exempt-invalid' };
  if (!RATES.includes(i.rate)) return { ok: false, error: 'gross-invalid' };

  const notices: TakeHomeNotice[] = [];
  const meal = Math.min(i.meal, MEAL_EXEMPT_MAX);
  if (i.meal > MEAL_EXEMPT_MAX) notices.push('meal-over-limit');
  const childcareCap = CHILDCARE_EXEMPT_PER_CHILD * i.childrenUnder6;
  const childcare = Math.min(i.childcare, childcareCap);
  if (i.childcare > childcareCap) notices.push('childcare-over-limit');
  const other = i.otherExempt;
  // 입력한 비과세 합계(한도 적용 전)가 급여 이상이면 계산하지 않는다
  if (i.meal + i.childcare + other >= i.gross) return { ok: false, error: 'exempt-exceeds-gross' };
  const total = meal + childcare + other;
  const taxable = i.gross - total;
  if (taxable > TABLE_MAX_THOUSAND * 1000) return { ok: false, error: 'over-10m' };
  if (taxable < TABLE_MIN_THOUSAND * 1000) notices.push('below-table');

  const insurance = calcSocialInsurance({ pay: taxable, companySize: i.companySize, age60: i.age60, newHireAfter65: i.newHireAfter65 });
  const incomeTax = monthlyIncomeTax(taxable, i.family, i.children8to20, i.rate);
  // 개인지방소득세 특별징수 = 소득세의 10%(지방세법 제103조의13). 10원 미만 버림은 잠정 규칙
  const localTax = floor10(Math.floor(incomeTax / 10));
  const deductions = insurance.workerTotal + incomeTax + localTax;
  return {
    ok: true,
    result: {
      gross: i.gross,
      exempt: { meal, childcare, other, total },
      taxable,
      insurance,
      incomeTax,
      localTax,
      deductions,
      net: i.gross - deductions,
      notices,
    },
  };
}
