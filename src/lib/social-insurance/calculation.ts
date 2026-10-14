// 4대보험(국민연금·건강보험·장기요양·고용보험) 월 보험료 계산. 순수 함수 — 실수령액 계산기가 그대로 재사용한다.
// 정수 연산만 쓴다(부동소수점 곱셈 없음). 결과는 4대사회보험 정보연계센터 모의계산(2026년 기준) 응답과 같아야 한다(tools/test-social-insurance.mjs).
import {
  companySizeFor,
  EI_UNEMPLOYMENT_HALF,
  LTC_OVER_NHI,
  NHI_HALF_RATE,
  nhiBaseRange,
  NPS_BASE_UNIT,
  NPS_HALF_RATE_BP,
  npsBaseRange,
  ROUND_UNIT,
  type CompanySizeKey,
} from './rules.ts';

// n × k / d 를 10원 미만 버림. 안전 정수 범위를 넘으면 BigInt로 계산
export function floorTo10(n: number, k: number, d: number): number {
  const p = n * k;
  if (Number.isSafeInteger(p)) return Math.floor(p / d / ROUND_UNIT) * ROUND_UNIT;
  const q = (BigInt(n) * BigInt(k)) / (BigInt(d) * BigInt(ROUND_UNIT));
  return Number(q) * ROUND_UNIT;
}

const clamp = (x: number, min: number, max: number) => Math.min(Math.max(x, min), max);

export interface SocialInsuranceInput {
  // 월 보험료 계산 기준 보수(원, 1 이상 정수)
  pay: number;
  companySize: CompanySizeKey;
  // 만 60세 이상 → 국민연금 계산 제외
  age60: boolean;
  // 만 65세 이후 새로 고용 → 실업급여 보험료 없음
  newHireAfter65: boolean;
}

export interface Pair {
  worker: number;
  employer: number;
}

export type Notice = 'nps-min' | 'nps-max' | 'nhi-min' | 'nhi-max';

export interface SocialInsuranceResult {
  nps: Pair;
  nhi: Pair;
  ltc: Pair;
  ei: Pair;
  // 고용보험 사업주 몫 내역
  eiEmployerParts: { unemployment: number; stability: number };
  workerTotal: number;
  employerTotal: number; // 산재보험 제외
  npsBase: number | null; // 만 60세 이상이면 null
  nhiBase: number;
  notices: Notice[];
}

export function calcSocialInsurance(input: SocialInsuranceInput): SocialInsuranceResult {
  const { pay, age60, newHireAfter65 } = input;
  const size = companySizeFor(input.companySize);
  if (!size) throw new RangeError(`알 수 없는 회사 규모: ${input.companySize}`);
  if (!Number.isSafeInteger(pay) || pay < 1) throw new RangeError(`보수는 1원 이상 정수: ${pay}`);
  const notices: Notice[] = [];

  // 국민연금: 천원 미만 절사 → 상·하한 → 근로자 몫 10원 미만 버림, 사업주 같음
  let npsBase: number | null = null;
  let npsW = 0;
  if (!age60) {
    const floored = Math.floor(pay / NPS_BASE_UNIT) * NPS_BASE_UNIT;
    npsBase = clamp(floored, npsBaseRange.min, npsBaseRange.max);
    if (floored < npsBaseRange.min) notices.push('nps-min');
    if (floored > npsBaseRange.max) notices.push('nps-max');
    npsW = floorTo10(npsBase, NPS_HALF_RATE_BP, 10_000);
  }

  // 건강보험: 상·하한 → 근로자 몫 10원 미만 버림
  const nhiBase = clamp(pay, nhiBaseRange.min, nhiBaseRange.max);
  if (pay < nhiBaseRange.min) notices.push('nhi-min');
  if (pay > nhiBaseRange.max) notices.push('nhi-max');
  const nhiW = floorTo10(nhiBase, NHI_HALF_RATE.n, NHI_HALF_RATE.d);

  // 장기요양: 근로자 건강보험료 × 0.9448/7.19 → 10원 미만 버림
  const ltcW = floorTo10(nhiW, LTC_OVER_NHI.n, LTC_OVER_NHI.d);

  // 고용보험: 실업급여 몫(각 0.9%)과 고용안정 몫(사업주만)을 따로 버린 뒤 합산
  const unemp = newHireAfter65 ? 0 : floorTo10(pay, EI_UNEMPLOYMENT_HALF.n, EI_UNEMPLOYMENT_HALF.d);
  const stability = floorTo10(pay, size.bp, 10_000);

  const nps = { worker: npsW, employer: npsW };
  const nhi = { worker: nhiW, employer: nhiW };
  const ltc = { worker: ltcW, employer: ltcW };
  const ei = { worker: unemp, employer: unemp + stability };
  return {
    nps,
    nhi,
    ltc,
    ei,
    eiEmployerParts: { unemployment: unemp, stability },
    workerTotal: nps.worker + nhi.worker + ltc.worker + ei.worker,
    employerTotal: nps.employer + nhi.employer + ltc.employer + ei.employer,
    npsBase,
    nhiBase,
    notices,
  };
}
