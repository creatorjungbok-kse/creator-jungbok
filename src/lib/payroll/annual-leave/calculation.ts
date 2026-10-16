// 연차 계산기 v1 — 설계 v2(docs/ready/annual-leave/calculator-design.md, GPT 10/16 승인). 계산·판정은 여기에만 있고 화면은 결과를 그리기만 한다.
// 외부 import 없음 — 화면 스크립트·node 테스트가 같은 함수를 쓴다.
// 근거: 근로기준법 제18조③·제60조, 시행령 별표2 4-나, 대법원 2021다227100·2022다245419·2018다239110, 민법 제160조,
//       법률 제15108호(2017.11.28, 제60조③ 삭제, 2018.5.29 시행) 부칙
//   첫 1년: k번째 달(1~11) 1개월 개근을 마친 다음 날 1일
//   n년 근로를 마친 다음 날: 15 + ⌊(n−1)/2⌋일, 25일 한도
//   그 발생일까지 근로관계가 있어야 생긴다(마지막 근무일 ≥ 발생일)
//   단시간근로자: ⌈일수 × 내 주 소정근로시간 ÷ 통상근로자 주 소정근로시간 × 8⌉시간

// ── 날짜 (YYYY-MM-DD, UTC 일수로만 다룬다) ──
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

export const ymd = (day: number): string => new Date(day * DAY_MS).toISOString().slice(0, 10);
export const dot = (day: number): string => ymd(day).replaceAll('-', '.');

const seoulFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });
// 한국 날짜(방문자 기기 시간대와 무관)
export function seoulTodayDay(now: Date = new Date()): number {
  const p = Object.fromEntries(seoulFormatter.formatToParts(now).map((x) => [x.type, x.value]));
  return parseYmd(`${p.year}-${p.month}-${p.day}`)!;
}

const parts = (day: number) => {
  const d = new Date(day * DAY_MS);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate() };
};
const lastDayOfMonth = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
const dayOf = (y: number, m: number, d: number) => Date.UTC(y, m, d) / DAY_MS;

// 입사일부터 n개월 근로를 마친 다음 날(= 그 기간에 대한 연차가 생기는 날).
// 같은 날짜가 그 달에 없으면 민법 제160조③에 따라 그 달 말일 만료 → 다음 날 발생으로 보되, uncertain으로 표시한다.
function ariseAfterMonths(hireDay: number, months: number): { day: number; uncertain: boolean } {
  const p = parts(hireDay);
  const total = p.y * 12 + p.m + months;
  const y = Math.floor(total / 12);
  const m = total - y * 12;
  if (p.d > lastDayOfMonth(y, m)) return { day: dayOf(y, m, lastDayOfMonth(y, m)) + 1, uncertain: true };
  return { day: dayOf(y, m, p.d), uncertain: false };
}

// n년 근로를 마친 다음 날. 연 단위는 민법 제160조 그대로 단정한다(퇴직금 계산기와 같은 방식: 2.29 입사 → 다음 해 2.28 만료, 3.1 발생).
export const annualAriseDay = (hireDay: number, n: number): number => ariseAfterMonths(hireDay, 12 * n).day;
// 첫 1년 만료일(월 단위 연차 사용기간 끝)
export const firstYearEndDay = (hireDay: number): number => annualAriseDay(hireDay, 1) - 1;

// n년 근로 뒤 생기는 연차 일수(통상근로자)
export function annualDays(n: number): number {
  if (n < 1) return 0;
  return Math.min(25, 15 + Math.floor((n - 1) / 2));
}

// 2018.5.29 시행 개정(제60조③ 삭제)이 첫 1년부터 분명히 적용되는 입사일. 이보다 앞이면 이력을 계산하지 않는다.
export const NEW_RULE_HIRE_FROM = parseYmd('2017-05-30')!;
// 2020.3.31 시행 개정(법률 제17185호, 제60조⑦ 단서): 첫해 월 단위 연차는 최초 1년이 끝날 때까지 사용.
// 부칙 제2조: 시행 전에 발생한 연차는 종전 규정(발생일부터 1년)에 따른다 → 2020.3.30 이전 발생분은 각자 1년.
export const USE_PERIOD_RULE_FROM = parseYmd('2020-03-31')!;
export const MIN_HIRE = parseYmd('1970-01-01')!;
export const MAX_DAY = parseYmd('2099-12-31')!;

// ── 단시간근로자 시간 환산 (시간은 0.1시간 단위 정수: 18시간 = 180) ──
export const HOURS_MIN_T = 150; // 15시간 미만은 연차 적용 없음(제18조③)
export const HOURS_MAX_T = 400; // 소정근로시간은 주 40시간 한도(제50조①)

// ⌈days × mine ÷ regular × 8⌉ (정수 연산)
export function partTimeHours(days: number, mineT: number, regularT: number): number {
  const num = days * mineT * 8;
  return Math.floor((num + regularT - 1) / regularT);
}
// 1일분 시간(끝수 처리 없음, 표시용): '3.6'
export function oneDayHoursLabel(mineT: number, regularT: number): string {
  const hundredths = Math.round((mineT * 800) / regularT);
  return (hundredths / 100).toFixed(2).replace(/\.?0+$/, '');
}

// ── 판정 ──
export type Workplace = 'five-plus' | 'four-or-less' | 'changed' | 'unknown';
export type Attendance = 'yes' | 'no' | 'unknown';
export type Basis = 'hire' | 'fiscal' | 'unknown';

export interface Inputs {
  workplace: Workplace;
  mineHoursT: number; // 내 주 소정근로시간 ×10
  regularHoursT: number; // 통상근로자 주 소정근로시간 ×10
  hireDay: number;
  // 기준일: 오늘(한국 날짜) 또는 마지막 근무일
  mode: 'today' | 'retire';
  baseDay: number;
  attendance80: Attendance | null; // 기준일까지 1년 이상일 때만 필요
  missedMonths: number | null; // 첫 1년 개근하지 못한 달 수. 2017.5.29 이전 입사면 null
  companyBasis: Basis;
}

export interface Grant {
  kind: 'monthly' | 'annual';
  n: number; // 월 단위: 몇 번째 달, 연 단위: 몇 년
  arise: number; // 발생일
  uncertain: boolean; // 월 단위 발생일이 달 말 경계라 날짜를 단정하지 않음
  expires: number; // 사용기간 마지막 날
  days: number;
  hours: number | null; // 단시간근로자 연 단위만(월 단위는 합계 시간을 내지 않음)
}

export type StopReason = 'four-or-less' | 'size-changed' | 'under15' | 'attendance' | 'old-rule-early' | 'legacy-period-missed';
export type ErrorCode = 'date-order' | 'hire-range' | 'missed-too-many' | 'hours-order';

export interface Result {
  kind: 'result';
  partTime: boolean;
  oneDayHours: string | null; // 단시간근로자 1일분 시간(표시용)
  oldRule: boolean; // 2017.5.29 이전 입사 → 이력 계산 안 함
  monthlyRows: Grant[]; // 첫 1년 날짜표(발생 여부와 관계없이 1~11번째 달)
  monthlyArisen: number; // 기준일까지 날짜가 지난 달 수
  monthlyDays: number; // 개근 못 한 달을 뺀 월 단위 발생 일수
  monthlyUsable: boolean; // 기준일에 사용기간이 남은 월 단위 연차가 있음
  monthlyUsableDays: number; // 기준일에 사용기간이 남은 월 단위 연차 일수(개근 못 한 달 뺌)
  monthlyUsableUntil: number | null; // 그중 가장 늦은 사용기간 끝
  monthlyLegacyPeriod: boolean; // 2020.3.30 이전 발생분이 있어 발생일부터 1년 규정이 섞임
  annuals: Grant[]; // 기준일까지 생긴 연 단위(oldRule이면 마지막 1건만)
  latestAnnual: Grant | null;
  // A: 셋으로 나눔
  usableDays: number; // 새로 생겨 기준일에 사용기간이 남아 있는 연차(통상근로자 일수, 쓴 일수는 빼지 않음)
  usableHours: number | null; // 단시간근로자: 연 단위 시간(월 단위는 일수로만)
  cumulativeDays: number | null; // 누적 이력(oldRule이면 null)
  cumulativeAnnualHours: number | null;
  nextGrant: Grant | null; // 오늘 기준일 때 다음에 생기는 연차
  cautions: CautionCode[];
}
export type CautionCode = 'workplace-unknown' | 'fiscal' | 'basis-unknown' | 'month-boundary' | 'retire-on-completion' | 'year-exact' | 'missed-months';

export type Outcome = Result | { kind: 'stop'; reason: StopReason } | { kind: 'error'; code: ErrorCode };

// 기준일까지 1년 근로를 마친 다음 날이 지났는지(출근율 질문을 보일지)
export const needsAttendance = (hireDay: number, baseDay: number): boolean => baseDay >= annualAriseDay(hireDay, 1);
export const isOldRule = (hireDay: number): boolean => hireDay < NEW_RULE_HIRE_FROM;

// 입력 전 단계 판정(날짜 없이 정할 수 있는 것)
export function preStop(i: { workplace: Workplace; mineHoursT: number }): StopReason | null {
  if (i.workplace === 'four-or-less') return 'four-or-less';
  if (i.workplace === 'changed') return 'size-changed';
  if (i.mineHoursT < HOURS_MIN_T) return 'under15';
  return null;
}

export function calculate(i: Inputs): Outcome {
  const pre = preStop(i);
  if (pre) return { kind: 'stop', reason: pre };
  if (i.hireDay < MIN_HIRE || i.hireDay > MAX_DAY || i.baseDay > MAX_DAY) return { kind: 'error', code: 'hire-range' };
  if (i.baseDay < i.hireDay) return { kind: 'error', code: 'date-order' };
  if (i.regularHoursT < i.mineHoursT) return { kind: 'error', code: 'hours-order' };
  const partTime = i.mineHoursT < i.regularHoursT;
  const B = i.baseDay;
  const oldRule = isOldRule(i.hireDay);
  const cautions: CautionCode[] = [];

  // 출근율: 1년 이상이면 80% 이상인 경우만 계산
  if (needsAttendance(i.hireDay, B) && i.attendance80 !== 'yes') return { kind: 'stop', reason: 'attendance' };
  // 2017.5.29 이전 입사인데 기준일이 2년차 발생일 전: 옛 제60조③이 걸릴 수 있어 계산하지 않음
  if (oldRule && B < annualAriseDay(i.hireDay, 2)) return { kind: 'stop', reason: 'old-rule-early' };

  const hoursOf = (days: number) => (partTime ? partTimeHours(days, i.mineHoursT, i.regularHoursT) : null);
  const fyEnd = firstYearEndDay(i.hireDay);

  // 첫 1년 월 단위
  const monthlyRows: Grant[] = [];
  let monthlyArisen = 0;
  if (!oldRule) {
    for (let k = 1; k <= 11; k++) {
      const a = ariseAfterMonths(i.hireDay, k);
      // 사용기간 끝: 2020.3.31 이후 발생 → 첫 1년 만료일, 그 전 발생 → 발생일부터 1년(종전 규정)
      const expires = a.day < USE_PERIOD_RULE_FROM ? ariseAfterMonths(a.day, 12).day - 1 : fyEnd;
      monthlyRows.push({ kind: 'monthly', n: k, arise: a.day, uncertain: a.uncertain, expires, days: 1, hours: null });
      if (a.day <= B) monthlyArisen++;
      // 달 말 경계: 기준일이 그 달 말일~다음 날 사이면 하루 차이로 달라질 수 있음
      if (a.uncertain && (B === a.day || B === a.day - 1)) cautions.push('month-boundary');
      // 퇴직 기준: 마지막 근무일이 1개월 개근을 마친 날이면 그 1일은 넣지 않고 확인 안내
      if (i.mode === 'retire' && B === a.day - 1) cautions.push('retire-on-completion');
    }
  }
  const missed = oldRule ? 0 : (i.missedMonths ?? 0);
  if (missed > monthlyArisen) return { kind: 'error', code: 'missed-too-many' };
  if (missed > 0) cautions.push('missed-months');
  const monthlyDays = monthlyArisen - missed;
  const arisenRows = monthlyRows.slice(0, monthlyArisen);
  const stillUsable = arisenRows.filter((g) => B <= g.expires);
  const monthlyLegacyPeriod = arisenRows.some((g) => g.arise < USE_PERIOD_RULE_FROM);
  // 종전 규정으로 사용기간이 달마다 달라 일부만 남았는데 개근 못 한 달이 있으면, 어느 달이 빠졌는지 몰라 남은 일수를 정할 수 없다
  if (missed > 0 && stillUsable.length > 0 && stillUsable.length < arisenRows.length) return { kind: 'stop', reason: 'legacy-period-missed' };
  const monthlyUsableDays = stillUsable.length === 0 ? 0 : stillUsable.length - (stillUsable.length === arisenRows.length ? missed : 0);
  const monthlyUsable = monthlyUsableDays > 0;
  const monthlyUsableUntil = monthlyUsable ? Math.max(...stillUsable.map((g) => g.expires)) : null;

  // 연 단위
  const all: Grant[] = [];
  for (let n = 1; ; n++) {
    const arise = annualAriseDay(i.hireDay, n);
    if (arise > B) break;
    const days = annualDays(n);
    all.push({ kind: 'annual', n, arise, uncertain: false, expires: annualAriseDay(i.hireDay, n + 1) - 1, days, hours: hoursOf(days) });
  }
  const latestAnnual = all.at(-1) ?? null;
  const annuals = oldRule ? (latestAnnual ? [latestAnnual] : []) : all;
  // 퇴직 기준: 마지막 근무일이 n년 근로를 마친 날이면 그 해 몫은 생기지 않는다(대법원 2021다227100) — 안내만
  if (i.mode === 'retire' && B === annualAriseDay(i.hireDay, all.length + 1) - 1) cautions.push('year-exact');

  let usableDays = 0;
  let usableHours: number | null = partTime ? 0 : null;
  usableDays += monthlyUsableDays;
  if (latestAnnual && B <= latestAnnual.expires) {
    usableDays += latestAnnual.days;
    if (usableHours !== null) usableHours += latestAnnual.hours!;
  }

  const cumulativeDays = oldRule ? null : monthlyDays + all.reduce((s, g) => s + g.days, 0);
  const cumulativeAnnualHours = oldRule || !partTime ? null : all.reduce((s, g) => s + g.hours!, 0);

  let nextGrant: Grant | null = null;
  if (i.mode === 'today') {
    const nm = monthlyRows.find((g) => g.arise > B);
    const n = all.length + 1;
    const nextAnnual: Grant = { kind: 'annual', n, arise: annualAriseDay(i.hireDay, n), uncertain: false, expires: annualAriseDay(i.hireDay, n + 1) - 1, days: annualDays(n), hours: hoursOf(annualDays(n)) };
    nextGrant = nm ?? nextAnnual;
  }

  if (i.workplace === 'unknown') cautions.unshift('workplace-unknown');
  if (i.companyBasis === 'fiscal') cautions.push('fiscal');
  if (i.companyBasis === 'unknown') cautions.push('basis-unknown');

  return {
    kind: 'result',
    partTime,
    oneDayHours: partTime ? oneDayHoursLabel(i.mineHoursT, i.regularHoursT) : null,
    oldRule,
    monthlyRows,
    monthlyArisen,
    monthlyDays,
    monthlyUsable,
    monthlyUsableDays,
    monthlyUsableUntil,
    monthlyLegacyPeriod,
    annuals,
    latestAnnual,
    usableDays,
    usableHours,
    cumulativeDays,
    cumulativeAnnualHours,
    nextGrant,
    cautions: [...new Set(cautions)],
  };
}

// ── 미사용 연차수당 (사용자가 회사 기록으로 확인한 미사용·미정산 일수·시간을 직접 입력) ──
// 통상근로자: 일수(0.5일 단위, ×10) × 1일 통상임금 / 단시간근로자: 시간(0.1시간 단위, ×10) × 시간급 통상임금. 원 미만 버림.
export const UNUSED_DAYS_MAX_T = 4000; // 400일
export const UNUSED_HOURS_MAX_T = 40000; // 4,000시간
export const DAILY_WAGE_MAX = 10_000_000;
export const HOURLY_WAGE_MAX = 1_000_000;
export function unusedPay(unitsT: number, wage: number): number {
  return Math.floor((unitsT * wage) / 10);
}
export const tenthsLabel = (t: number): string => (t % 10 === 0 ? String(t / 10) : (t / 10).toFixed(1));
