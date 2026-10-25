// 실업급여(구직급여) 계산기 엔진. 계산·판정은 여기에만 있고 화면은 결과를 그리기만 한다.
// 외부 import 없음 — 화면 스크립트·node 테스트가 같은 함수를 쓴다.
// 근거(확인 2026-10-25): 고용보험법 제45조(기초일액·최저기초일액·상한), 제46조(60%·최저구직급여일액 80%), 제50조·별표 1(소정급여일수),
//   고용보험법 시행령 제68조(기초일액 상한 113,500원, 2026.1.1 이후 이직), 소득세법 제12조 제3호 마목(비과세).
//   고용24 실업급여 간편 모의계산(retrieveNewMainCalcAjax, 2026-10-25 조회): 총액 = 기초일액 × 60% × 일수, 일액 끝수 처리 없음 → 총액 원 미만 버림.
//   2027년 상한은 입법예고안(2026.9.22, 최고기초일액 = 최저기초일액 × 1.374) 기준 '예정' 값이다.

// ── 날짜 (YYYY-MM-DD, UTC 일수) ──
const DAY_MS = 86_400_000;
export function parseYmd(s: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = Date.UTC(y, mo - 1, d);
  const back = new Date(t);
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d) return null;
  return t / DAY_MS;
}
export const fmtYmd = (day: number) => new Date(day * DAY_MS).toISOString().slice(0, 10);
const parts = (day: number) => {
  const d = new Date(day * DAY_MS);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate() };
};
const lastDayOfMonth = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
const dayOf = (y: number, m: number, d: number) => Date.UTC(y, m, d) / DAY_MS;

// 평균임금 산정기간(퇴직금 계산기와 같은 방식): 퇴직일(마지막 근무일 다음 날)의 3개월 전 같은 날부터 마지막 근무일까지.
// 같은 날짜가 없으면 2월은 3월 1일부터, 다른 달은 그 달 말일부터.
export function threeMonthDays(lastWorkDay: number): { start: number; end: number; days: number } {
  const retire = lastWorkDay + 1;
  const p = parts(retire);
  const total = p.y * 12 + p.m - 3;
  const y = Math.floor(total / 12);
  const m = total - y * 12;
  let start: number;
  if (p.d <= lastDayOfMonth(y, m)) start = dayOf(y, m, p.d);
  else if (m === 1) start = dayOf(y, 2, 1);
  else start = dayOf(y, m, lastDayOfMonth(y, m));
  return { start, end: lastWorkDay, days: lastWorkDay - start + 1 };
}

// ── 연도별 기준 ──
export interface YearRule {
  year: number;
  minWage: number; // 시간급 최저임금
  capBase: number; // 기초일액 상한(최고기초일액)
  provisional: boolean; // 확정 전(입법예고안)
}
// 2027년 최고기초일액(입법예고안): 8시간 최저기초일액 85,600원 × 1.374 = 117,614.4 → 원 미만 버림(확정 시 끝수 처리 다시 확인)
export const YEAR_RULES: readonly YearRule[] = [
  { year: 2026, minWage: 10_320, capBase: 113_500, provisional: false },
  { year: 2027, minWage: 10_700, capBase: Math.floor(10_700 * 8 * 1.374), provisional: true },
];
export const FIRST_DAY = '2026-01-01';
export const LAST_DAY = '2027-12-31';
export const ruleFor = (year: number) => YEAR_RULES.find((r) => r.year === year);

// ── 소정급여일수(고용보험법 별표 1) ──
export type Tenure = 'u1' | '1to3' | '3to5' | '5to10' | 'o10';
export const TENURES: readonly Tenure[] = ['u1', '1to3', '3to5', '5to10', 'o10'];
const DAYS_UNDER50: Record<Tenure, number> = { u1: 120, '1to3': 150, '3to5': 180, '5to10': 210, o10: 240 };
const DAYS_50: Record<Tenure, number> = { u1: 120, '1to3': 180, '3to5': 210, '5to10': 240, o10: 270 };
export const benefitDays = (tenure: Tenure, senior: boolean) => (senior ? DAYS_50 : DAYS_UNDER50)[tenure];

// ── 계산 ──
export interface Input {
  lastWorkDay: number; // 마지막 근무일
  wage3m: number; // 퇴사 전 3개월 세전 임금 합계(원)
  hours: number; // 이직 전 1일 소정근로시간(0.1시간 단위, 8 초과는 8 — 고용24 선택지 '8시간 이상')
  age: number; // 퇴사 당시 만 나이
  disabled: boolean; // 장애인고용촉진법상 장애인
  tenure: Tenure; // 고용보험 가입기간
}
export type CalcError = 'date-invalid' | 'date-range' | 'wage-invalid' | 'hours-invalid' | 'age-invalid';
export type Basis = 'floor' | 'cap' | 'rate';
export interface Result {
  year: number;
  provisional: boolean;
  periodStart: number;
  periodEnd: number;
  periodDays: number;
  avgDaily: number; // 1일 평균임금(원, 소수 포함)
  baseUsed: number; // 적용한 기초일액(원, 소수 포함)
  daily: number; // 하루 금액(원, 소수 포함)
  dailyShown: number; // 화면 표시용(원 미만 버림)
  floorDaily: number; // 그 해·그 시간의 하한(원)
  capDaily: number; // 그 해 상한(원 미만 버림)
  basis: Basis;
  days: number; // 소정급여일수
  total: number; // 총액(원 미만 버림)
  month30: number; // 30일 기준(원 미만 버림)
}
export const MAX_WAGE = 300_000_000;
// 소수 오차를 막기 위해 원 미만 6자리에서 정리한 뒤 버린다
export const fix = (x: number) => Math.floor(Math.round(x * 1e6) / 1e6);

// 1일 평균임금 → 하루 금액(상한·하한 적용). 고용24 간편 모의계산과 같은 산식.
export function dailyFromAvg(avgDaily: number, hours: number, rule: YearRule) {
  const h = Math.min(hours, 8);
  const minBase = rule.minWage * h; // 최저기초일액
  const floorDaily = minBase * 0.8; // 최저구직급여일액
  const capDaily = Math.floor(rule.capBase * 0.6);
  let basis: Basis = 'rate';
  let baseUsed = Math.max(avgDaily, minBase);
  let daily = avgDaily * 0.6;
  if (avgDaily >= rule.capBase) {
    basis = 'cap';
    baseUsed = rule.capBase;
    daily = rule.capBase * 0.6;
  }
  if (daily < floorDaily) {
    basis = 'floor';
    daily = floorDaily;
    baseUsed = minBase;
  }
  return { daily, floorDaily, capDaily, basis, baseUsed };
}

export function calc(i: Input): { ok: true; result: Result } | { ok: false; error: CalcError } {
  if (!Number.isInteger(i.lastWorkDay)) return { ok: false, error: 'date-invalid' };
  const ymd = fmtYmd(i.lastWorkDay);
  if (ymd < FIRST_DAY || ymd > LAST_DAY) return { ok: false, error: 'date-range' };
  if (!Number.isInteger(i.wage3m) || i.wage3m < 1 || i.wage3m > MAX_WAGE) return { ok: false, error: 'wage-invalid' };
  if (!Number.isFinite(i.hours) || i.hours < 0.1 || i.hours > 24 || Math.abs(i.hours * 10 - Math.round(i.hours * 10)) > 1e-9) return { ok: false, error: 'hours-invalid' };
  if (!Number.isInteger(i.age) || i.age < 15 || i.age > 100) return { ok: false, error: 'age-invalid' };
  // 이직일(마지막 근무일)이 속한 해의 최저임금·상한
  const rule = ruleFor(Number(ymd.slice(0, 4)))!;
  const period = threeMonthDays(i.lastWorkDay);
  const avgDaily = i.wage3m / period.days;
  const d = dailyFromAvg(avgDaily, i.hours, rule);
  const days = benefitDays(i.tenure, i.age >= 50 || i.disabled);
  return {
    ok: true,
    result: {
      year: rule.year,
      provisional: rule.provisional,
      periodStart: period.start,
      periodEnd: period.end,
      periodDays: period.days,
      avgDaily,
      baseUsed: d.baseUsed,
      daily: d.daily,
      dailyShown: fix(d.daily),
      floorDaily: fix(d.floorDaily),
      capDaily: d.capDaily,
      basis: d.basis,
      days,
      total: fix(d.daily * days),
      month30: fix(d.daily * 30),
    },
  };
}
