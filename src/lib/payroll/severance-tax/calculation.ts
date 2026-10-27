// 퇴직금 세금(퇴직소득세) 계산기 엔진. 순수 함수, 정수 연산만 쓴다.
// 근거: 소득세법 제48조(근속연수공제·환산급여공제), 제55조(기본세율, 퇴직소득 산출세액), 국고금관리법 제47조(10원 미만 버림),
// 지방세법 제103조의13(퇴직소득세의 10%). 국세청 '퇴직소득세 계산방법' 사례(20년, 1억원 → 112만원)와 맞춘다.
// 범위: 비과세 퇴직소득·중간정산 정산·임원 한도·IRP 이연은 계산하지 않는다(화면 안내).

export const MAX_PAY = 5_000_000_000; // 50억원
export const MAX_YEARS = 60;

const floor10 = (n: number) => Math.floor(n / 10) * 10;

// 근속연수: 1년 미만 끝수는 1년(소득세법 시행령 제105조)
export function serviceYears(years: number, months: number): number {
  return years + (months > 0 ? 1 : 0);
}

// 근속연수공제(소득세법 제48조①2, 2023년 1월 1일 이후 퇴직분)
export function serviceDeduction(y: number): number {
  if (y <= 5) return 1_000_000 * y;
  if (y <= 10) return 5_000_000 + 2_000_000 * (y - 5);
  if (y <= 20) return 15_000_000 + 2_500_000 * (y - 10);
  return 40_000_000 + 3_000_000 * (y - 20);
}

// 환산급여공제(소득세법 제48조②). 금액은 원 단위 정수, 비율 곱셈은 원 미만 버림
export function convertedDeduction(c: number): number {
  if (c <= 8_000_000) return c;
  if (c <= 70_000_000) return 8_000_000 + Math.floor(((c - 8_000_000) * 60) / 100);
  if (c <= 100_000_000) return 45_200_000 + Math.floor(((c - 70_000_000) * 55) / 100);
  if (c <= 300_000_000) return 61_700_000 + Math.floor(((c - 100_000_000) * 45) / 100);
  return 151_700_000 + Math.floor(((c - 300_000_000) * 35) / 100);
}

// 종합소득 기본세율(소득세법 제55조①, 2023년 이후): [상한, 세율%, 누진공제]
const BRACKETS: readonly [number, number, number][] = [
  [14_000_000, 6, 0],
  [50_000_000, 15, 1_260_000],
  [88_000_000, 24, 5_760_000],
  [150_000_000, 35, 15_440_000],
  [300_000_000, 38, 19_940_000],
  [500_000_000, 40, 25_940_000],
  [1_000_000_000, 42, 35_940_000],
  [Infinity, 45, 65_940_000],
];

export function basicTax(base: number): { tax: number; ratePct: number } {
  for (const [cap, rate, minus] of BRACKETS) {
    if (base <= cap) return { tax: Math.max(0, Math.floor((base * rate) / 100) - minus), ratePct: rate };
  }
  throw new RangeError(String(base));
}

export interface SeveranceTaxResult {
  pay: number;
  years: number;
  serviceDeduction: number;
  converted: number;
  convertedDeduction: number;
  taxBase: number;
  ratePct: number;
  convertedTax: number;
  incomeTax: number;
  localTax: number;
  totalTax: number;
  net: number;
}

export type CalcError = 'pay-invalid' | 'over-max' | 'years-invalid';

export function calcSeveranceTax(pay: number, years: number): { ok: true; result: SeveranceTaxResult } | { ok: false; error: CalcError } {
  if (!Number.isSafeInteger(pay) || pay < 1) return { ok: false, error: 'pay-invalid' };
  if (pay > MAX_PAY) return { ok: false, error: 'over-max' };
  if (!Number.isSafeInteger(years) || years < 1 || years > MAX_YEARS) return { ok: false, error: 'years-invalid' };
  // 근속연수공제는 퇴직소득금액을 넘지 못한다
  const sd = Math.min(serviceDeduction(years), pay);
  // 환산급여 = (퇴직소득금액 − 근속연수공제) × 12 ÷ 근속연수, 원 미만 버림
  const converted = Math.floor(((pay - sd) * 12) / years);
  const cd = convertedDeduction(converted);
  const taxBase = Math.max(0, converted - cd);
  const { tax: convertedTax, ratePct } = basicTax(taxBase);
  // 산출세액 = 환산산출세액 ÷ 12 × 근속연수, 10원 미만 버림
  const incomeTax = floor10(Math.floor((convertedTax * years) / 12));
  const localTax = floor10(Math.floor(incomeTax / 10));
  const totalTax = incomeTax + localTax;
  return {
    ok: true,
    result: { pay, years, serviceDeduction: sd, converted, convertedDeduction: cd, taxBase, ratePct: taxBase > 0 ? ratePct : 0, convertedTax, incomeTax, localTax, totalTax, net: pay - totalTax },
  };
}
