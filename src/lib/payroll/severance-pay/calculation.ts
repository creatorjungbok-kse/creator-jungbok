// 퇴직금 계산기 v1 — 확정 설계(docs/ready/severance-pay/calculator-spec.md). 계산·판정은 여기에만 있고 화면은 결과를 그리기만 한다.
// 외부 import 없음 — 화면 스크립트·node 테스트가 같은 함수를 쓴다.
// 금액은 BigInt 분수로 계산한다(부동소수점 없음). 끝수는 고용노동부 계산기와 같게 1일 평균임금 1전 단위 올림, 퇴직금 원 단위 반올림.
//   임금총액 = 3개월 임금(제외기간 임금은 입력에서 이미 뺀 값) + 12개월 상여금 × 3/12 + 연차수당 × 3/12
//   1일 평균임금 = 임금총액 ÷ 3개월 산정일수(제외기간 일수 뺌)
//   적용 1일 임금 = max(1일 평균임금, 1일 통상임금)      ← 근로기준법 제2조②
//   예상 퇴직금 = 적용 1일 임금 × 30 × 재직일수 ÷ 365    ← 고용노동부 퇴직금 계산기 산식

// ── 날짜 (YYYY-MM-DD, 시간대 영향 없음: UTC 일수로만 다룬다) ──
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

export function ymd(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

const parts = (day: number) => {
  const d = new Date(day * DAY_MS);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate() };
};
const lastDayOfMonth = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
const dayOf = (y: number, m: number, d: number) => Date.UTC(y, m, d) / DAY_MS;

// 같은 날짜의 n개월 뒤(음수면 앞). 해당 날짜가 그 달에 없으면 null(호출하는 쪽이 민법 제160조③ 방식으로 처리)
function shiftMonths(day: number, n: number): { day: number } | { missing: { y: number; m: number } } {
  const p = parts(day);
  const total = p.y * 12 + p.m + n;
  const y = Math.floor(total / 12);
  const m = total - y * 12;
  if (p.d > lastDayOfMonth(y, m)) return { missing: { y, m } };
  return { day: dayOf(y, m, p.d) };
}

// 계속근로 1년이 끝나는 날(그날까지 근무하면 1년). 민법 제160조: 연으로 정한 기간은 역에 따라 계산하고,
// 기산일에 해당한 날의 전일로 만료, 최종 월에 해당일이 없으면 그 월의 말일로 만료.
export function oneYearEndDay(hireDay: number): number {
  const s = shiftMonths(hireDay, 12);
  if ('day' in s) return s.day - 1;
  return dayOf(s.missing.y, s.missing.m, lastDayOfMonth(s.missing.y, s.missing.m));
}

// 퇴직 전 3개월 기간: [시작일, 퇴직일 전날]. 고용노동부 퇴직금 계산기(retire_cal.js setDate, 2026-10-16 확인)와 같은 방식.
//   퇴직일의 3개월 전 같은 날짜부터 시작(예: 퇴직일 9.16 → 6.16~9.15)
//   그 날짜가 2월에 없으면(퇴직일 5.29(평년)·5.30·5.31) 3.1부터
//   그 날짜가 2월 아닌 달에 없으면(퇴직일 7.31·12.31) 그달 말일부터(4.30·9.30)
export function threeMonthWindow(retireDay: number): { start: number; end: number } {
  const s = shiftMonths(retireDay, -3);
  let start: number;
  if ('day' in s) start = s.day;
  else if (s.missing.m === 1) start = dayOf(s.missing.y, 2, 1);
  else start = dayOf(s.missing.y, s.missing.m, lastDayOfMonth(s.missing.y, s.missing.m));
  return { start, end: retireDay - 1 };
}

// 3개월 기간을 달 경계로 나눈 입력 칸(고용노동부 계산기와 같은 3~4칸)
export interface WageRow {
  start: number;
  end: number;
  days: number;
}
export function wageRows(retireDay: number): WageRow[] {
  const { start, end } = threeMonthWindow(retireDay);
  const rows: WageRow[] = [];
  let cur = start;
  while (cur <= end) {
    const p = parts(cur);
    const monthEnd = dayOf(p.y, p.m, lastDayOfMonth(p.y, p.m));
    const rowEnd = Math.min(monthEnd, end);
    rows.push({ start: cur, end: rowEnd, days: rowEnd - cur + 1 });
    cur = rowEnd + 1;
  }
  return rows;
}

// ── 판정 ──
export type Plan = 'severance' | 'db' | 'dc' | 'unknown';
export type Hours = 'always15' | 'always-under15' | 'mixed';
export interface Situation {
  plan: Plan;
  hours: Hours;
  interimSettled: boolean; // 중간정산을 받은 적 있음
  leaveOfAbsence: boolean; // 개인 사정 휴직 등 근속기간 반영이 불확실한 기간이 있음
}

export type Stop =
  | { kind: 'not-eligible'; reason: 'under15' | 'under1year' }
  | { kind: 'stop'; reason: 'dc' | 'mixed-hours' | 'interim' | 'all-excluded' | 'small-pre2013' };

// 계산 전에 막는 상황(날짜와 무관한 것)
export function preStop(s: Situation): Stop | null {
  if (s.plan === 'dc') return { kind: 'stop', reason: 'dc' };
  if (s.hours === 'always-under15') return { kind: 'not-eligible', reason: 'under15' };
  if (s.hours === 'mixed') return { kind: 'stop', reason: 'mixed-hours' };
  // 중간정산 뒤 1년 미만이어도 정산 이후 기간분 퇴직금이 생길 수 있다(고용노동부 FAQ 81) → '대상 아님'으로 판정하지 않고 계산을 멈춘다
  if (s.interimSettled) return { kind: 'stop', reason: 'interim' };
  return null;
}

// ── 평균임금 제외기간 ──
export interface Range {
  start: number;
  end: number;
}
export type ExclusionCheck =
  | { ok: true; excludedDays: number }
  | { ok: false; code: 'reversed' | 'overlap' | 'outside' | 'all' };

// 3개월 기간 안의 제외기간 일수. 겹치거나, 3개월과 전혀 안 겹치거나, 3개월 전체를 덮으면 계산하지 않는다.
export function checkExclusions(win: { start: number; end: number }, ranges: Range[]): ExclusionCheck {
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  for (const r of sorted) if (r.end < r.start) return { ok: false, code: 'reversed' };
  for (let i = 1; i < sorted.length; i++) if (sorted[i].start <= sorted[i - 1].end) return { ok: false, code: 'overlap' };
  let days = 0;
  for (const r of sorted) {
    const s = Math.max(r.start, win.start);
    const e = Math.min(r.end, win.end);
    if (e < s) return { ok: false, code: 'outside' };
    days += e - s + 1;
  }
  const total = win.end - win.start + 1;
  // 평균임금산정 특례 고시 제1조: 제외기간이 3개월 이상이면 그 최초일을 산정사유 발생일로 본다 → 이 계산기 범위 밖
  if (days >= total) return { ok: false, code: 'all' };
  return { ok: true, excludedDays: days };
}

// ── 금액 ──
export interface Frac {
  n: bigint;
  d: bigint;
}
const frac = (n: bigint, d: bigint): Frac => ({ n, d });
export const floorWon = (f: Frac): bigint => f.n / f.d; // n, d ≥ 0
// 원 단위 반올림(0.5원 이상 올림)
export const roundWon = (f: Frac): bigint => (2n * f.n + f.d) / (2n * f.d);
// 1전(0.01원) 단위 올림 → 분모 100의 분수
export const ceilCents = (f: Frac): Frac => frac((f.n * 100n + f.d - 1n) / f.d, 100n);
export const greater = (a: Frac, b: Frac) => a.n * b.d > b.n * a.d;

export interface Inputs {
  hireDay: number;
  lastWorkDay: number; // 마지막 근무일(퇴직일 = 그다음 날)
  wages: number[]; // 3개월 칸별 기본급+기타수당 합(제외기간에 받은 임금은 뺀 값), 원
  bonus12: number; // 최근 12개월 상여금 총액
  annualLeavePay: number; // 퇴직 전 이미 발생한 미사용 연차수당
  ordinaryDaily: number | null; // 1일 통상임금(입력 안 하면 null)
  exclusions: Range[];
  // 2012.12.31 이전 근무기간 중 상시 4명 이하 사업장이었던 적이 없다고 확인했는가(2013년 이전 입사자만 의미 있음)
  noSmallWorkplaceBefore2013?: boolean;
}

// 상시 4명 이하 사업장은 2010.11.30 이전 적용 제외, 2010.12.1~2012.12.31 기간분 50%(퇴직급여법 부칙 제8조)
export const SMALL_WORKPLACE_FULL_FROM = '2013-01-01';
export const needsSmallWorkplaceCheck = (hireDay: number) => hireDay < (parseYmd(SMALL_WORKPLACE_FULL_FROM) as number);

export interface Amount {
  kind: 'amount';
  retireDay: number;
  serviceDays: number;
  window: { start: number; end: number };
  windowDays: number;
  excludedDays: number;
  calcDays: number;
  wageTotal: bigint; // 3개월 임금 합
  bonusAdd: Frac; // 상여금 × 3/12
  leaveAdd: Frac; // 연차수당 × 3/12
  total: Frac; // 임금총액
  averageDailyRaw: Frac; // 정밀값
  averageDaily: Frac; // 1전 단위 올림한 값(고용노동부 계산기 방식)
  ordinaryDaily: Frac | null;
  usedOrdinary: boolean;
  appliedDaily: Frac;
  severance: Frac; // 적용 1일 임금 × 30 × 재직일수 ÷ 365 (정밀값)
  severanceWon: bigint; // 원 단위 반올림(고용노동부 계산기 방식)
}

export type InputError = 'date-order' | 'rows' | 'too-long' | 'exclusion-reversed' | 'exclusion-overlap' | 'exclusion-outside';
export interface CalcError {
  kind: 'error';
  code: InputError;
}
export const MAX_SERVICE_DAYS = 365 * 60;

export function calculate(i: Inputs): Amount | Stop | CalcError {
  if (i.lastWorkDay < i.hireDay) return { kind: 'error', code: 'date-order' };
  const retireDay = i.lastWorkDay + 1;
  const serviceDays = retireDay - i.hireDay;
  if (serviceDays > MAX_SERVICE_DAYS) return { kind: 'error', code: 'too-long' };
  if (i.lastWorkDay < oneYearEndDay(i.hireDay)) return { kind: 'not-eligible', reason: 'under1year' };
  // 2013년 이전 입사자는 당시 사업장 규모에 따라 기간별 적용률이 달라진다 → 5명 이상이었다고 확인한 경우만 계산
  if (needsSmallWorkplaceCheck(i.hireDay) && i.noSmallWorkplaceBefore2013 !== true) return { kind: 'stop', reason: 'small-pre2013' };
  const rows = wageRows(retireDay);
  if (rows.length !== i.wages.length) return { kind: 'error', code: 'rows' };
  const window = threeMonthWindow(retireDay);
  const windowDays = window.end - window.start + 1;
  const ex = checkExclusions(window, i.exclusions);
  if (!ex.ok) return ex.code === 'all' ? { kind: 'stop', reason: 'all-excluded' } : { kind: 'error', code: `exclusion-${ex.code}` };
  const calcDays = windowDays - ex.excludedDays;

  const wageTotal = i.wages.reduce((s, w) => s + BigInt(w), 0n);
  // 상여금·연차수당 × 3/12. 제외기간이 있으면 고용노동부 계산기처럼 (산정일수 ÷ 3개월 일수)를 곱한다
  const W = BigInt(windowDays);
  const C = BigInt(calcDays);
  const addDen = 4n * W;
  const bonusAdd = frac(BigInt(i.bonus12) * C, addDen);
  const leaveAdd = frac(BigInt(i.annualLeavePay) * C, addDen);
  const total = frac(addDen * wageTotal + bonusAdd.n + leaveAdd.n, addDen);
  // 끝수 처리는 고용노동부 퇴직금 계산기(retire_cal.js)와 같게: 1일 평균임금은 1전 단위 올림, 퇴직금은 원 단위 반올림
  const averageDailyRaw = frac(total.n, total.d * BigInt(calcDays));
  const averageDaily = ceilCents(averageDailyRaw);
  const ordinaryDaily = i.ordinaryDaily === null ? null : frac(BigInt(i.ordinaryDaily), 1n);
  const usedOrdinary = ordinaryDaily !== null && greater(ordinaryDaily, averageDaily);
  const appliedDaily = usedOrdinary ? ordinaryDaily! : averageDaily;
  const severance = frac(appliedDaily.n * 30n * BigInt(serviceDays), appliedDaily.d * 365n);
  return {
    kind: 'amount',
    retireDay,
    serviceDays,
    window,
    windowDays,
    excludedDays: ex.excludedDays,
    calcDays,
    wageTotal,
    bonusAdd,
    leaveAdd,
    total,
    averageDailyRaw,
    averageDaily,
    ordinaryDaily,
    usedOrdinary,
    appliedDaily,
    severance,
    severanceWon: roundWon(severance),
  };
}

// 표시용: 원 미만 버림 + 소수 둘째 자리(전 단위) 버림 표기
export function wonLabel(f: Frac): string {
  return `${floorWon(f).toLocaleString('ko-KR')}원`;
}
export function wonCentsLabel(f: Frac): string {
  const cents = (f.n * 100n) / f.d;
  const won = cents / 100n;
  const c = cents % 100n;
  return c === 0n ? `${won.toLocaleString('ko-KR')}원` : `${won.toLocaleString('ko-KR')}.${c.toString().padStart(2, '0')}원`;
}

// 금액 입력 범위(안전한 계산을 위한 상한)
export const WAGE_MAX = 100_000_000; // 칸별 1억 원
export const BONUS_MAX = 1_000_000_000; // 10억 원
export const LEAVE_MAX = 100_000_000;
export const ORDINARY_MAX = 10_000_000; // 1일 1천만 원
