// 육아휴직급여 계산기 v1 엔진. 순수 함수, 정수 연산만 쓴다(날짜는 UTC 일 단위).
// 범위(GPT 승인 2026-10-19): 일반·부모 함께(6+6)·한부모, 같은 자녀로 이미 쓴 정수 개월 반영, 시작일·종료일과 월 통상임금으로 월별 지급액 계산.
// 근거: 고용보험법 시행령 제95조(일반·분할 합산·1개월 미만 일수 비례), 제95조의3(6+6·한부모), 남녀고용평등법 제19조(최대 1년 6개월).
// 월 구간과 일할 방식은 고용24 육아휴직급여 모의계산 결과(2026-10-19, 약 200건 대조)에 맞춘 규칙이다.
//  · k번째 구간 시작 = 최초 시작일 + k개월(그 날짜가 없으면 그 달 말일, 시작일이 말일이면 그 달 말일). 구간 끝은 다음 구간 시작 전날
//  · 마지막 부분 구간 = (통상임금 × 지급률, 상한 적용) × 쉰 일수 ÷ 그 구간이 시작하는 달의 일수 → 10원 미만 버림. 하한 달은 70만원 × 일수 ÷ 분모, 원 미만 버림
//    (구간이 그 달보다 길면 월 지급액을 넘을 수 있음)
//  · 시작일에 해당하는 날이 없어 말일로 당겨진 구간 시작일(예: 1.31 시작의 2.28)에 휴직이 끝나면 그날은 직전 달에 포함(민법 제160조③)
// v1 제외: 회사 지급 금품 감액(시행령 제98조), 이전 사용의 일 단위 잔여, 6+6 공통 기간의 일 단위, 차액 소급 지급 시점, 수급자격 판정.

export type LeaveKind = 'general' | 'both' | 'single';

export const FLOOR = 700_000;
export const MAX_MONTHS = 18;
// 일반: 1~3개월 100%·250만원, 4~6개월 100%·200만원, 7개월째부터 80%·160만원(시행령 제95조①)
// 한부모: 1~3개월 상한 300만원, 나머지는 일반과 같다(시행령 제95조의3③)
// 6+6: 공통 개월까지 상한 250·250·300·350·400·450만원, 100%(시행령 제95조의3①)
export const BOTH_CAPS = [2_500_000, 2_500_000, 3_000_000, 3_500_000, 4_000_000, 4_500_000] as const;
export const MAX_WAGE = 100_000_000;

export interface Tier {
  ratePct: 100 | 80;
  cap: number;
  basis: 'general' | 'single' | 'both';
}

// n번째 달(같은 자녀로 쓴 기간을 합산한 순번, 1부터)의 지급률·상한
export function tierFor(kind: LeaveKind, n: number, sharedMonths: number): Tier {
  if (kind === 'both' && n <= sharedMonths && n <= 6) return { ratePct: 100, cap: BOTH_CAPS[n - 1], basis: 'both' };
  if (n <= 3) return kind === 'single' ? { ratePct: 100, cap: 3_000_000, basis: 'single' } : { ratePct: 100, cap: 2_500_000, basis: 'general' };
  if (n <= 6) return { ratePct: 100, cap: 2_000_000, basis: 'general' };
  return { ratePct: 80, cap: 1_600_000, basis: 'general' };
}

const floor10 = (n: number) => Math.floor(n / 10) * 10;

// 월별 지급액 = 통상임금 × 지급률(원 미만 버림) → 상한·하한 → 10원 미만 버림
export function monthlyAmount(wage: number, t: Tier): number {
  const base = Math.floor((wage * t.ratePct) / 100);
  return floor10(Math.min(t.cap, Math.max(FLOOR, base)));
}

// 부분 구간 지급액(고용24 방식): 통상임금 × 지급률(원 미만을 버리지 않은 값)과 상한 중 작은 값 × 일수 ÷ 분모 → 10원 미만 버림.
// 하한(70만원)이 적용되는 달은 70만원 × 일수 ÷ 분모 → 원 미만 버림(10원 단위로 버리지 않는다).
// 정수로만 계산한다: 통상임금 × 지급률(%)은 100배 값으로 다룬다.
export function partialAmount(wage: number, t: Tier, days: number, divisor: number): number {
  const base100 = Math.min(t.cap * 100, wage * t.ratePct);
  if (base100 < FLOOR * 100) return Math.floor((FLOOR * days) / divisor);
  return floor10(Math.floor((base100 * days) / (100 * divisor)));
}

// ── 날짜(UTC 일수) ──
export interface Ymd {
  y: number;
  m: number; // 1~12
  d: number;
}
const DAY = 86_400_000;
export const toDays = (x: Ymd) => Math.floor(Date.UTC(x.y, x.m - 1, x.d) / DAY);
export const fromDays = (n: number): Ymd => {
  const dt = new Date(n * DAY);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
};
const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
// 시작일 + k개월(고용24 방식): 그 날짜가 없으면 그 달 말일, 시작일이 그 달 말일이면 대상 달의 말일
export function addMonths(x: Ymd, k: number): Ymd {
  const idx = x.y * 12 + (x.m - 1) + k;
  const y = Math.floor(idx / 12);
  const m = (idx % 12) + 1;
  const last = daysInMonth(y, m);
  return { y, m, d: x.d === daysInMonth(x.y, x.m) ? last : Math.min(x.d, last) };
}
export function parseYmd(s: string): Ymd | null {
  const mt = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!mt) return null;
  const x = { y: Number(mt[1]), m: Number(mt[2]), d: Number(mt[3]) };
  if (x.y < 2000 || x.y > 2100 || x.m < 1 || x.m > 12 || x.d < 1 || x.d > daysInMonth(x.y, x.m)) return null;
  return x;
}
export const fmtYmd = (x: Ymd) => `${x.y}-${String(x.m).padStart(2, '0')}-${String(x.d).padStart(2, '0')}`;

// 시작일부터 N개월을 다 채우는 종료일(빠른 선택 버튼용): 시작일 + N개월의 전날
export function endAfterMonths(start: Ymd, months: number): Ymd {
  return fromDays(toDays(addMonths(start, months)) - 1);
}
export interface Segment {
  n: number; // 합산 순번
  start: Ymd;
  end: Ymd;
  days: number; // 이 구간에서 실제로 쉰 일수
  segDays: number; // 이 구간 전체 일수
  divisor: number; // 부분 구간 일할 계산의 분모(구간이 시작하는 달의 일수)
  full: boolean;
  tier: Tier;
  monthly: number;
  amount: number;
}

export interface LeaveInput {
  kind: LeaveKind;
  start: Ymd;
  end: Ymd;
  wage: number;
  priorMonths: number; // 같은 자녀로 이미 쓴 정수 개월(0~17)
  sharedMonths: number; // 6+6에서 부모 각각의 사용기간 중 공통으로 인정되는 개월(1~6), 일반·한부모는 0
}

// both-shared-over: 공통 개월이 본인 사용 개월(이미 쓴 개월 + 이번 정수 개월)보다 많음
// both-shared-partial: 공통 기간에 며칠 단위가 걸림(v1 범위 밖, 일반 기준으로 바꿔 계산하지 않는다)
// work24-leap: 31일까지 있는 달의 30일에 시작해 구간 시작이 윤년 2월 29일로 당겨진 뒤 그 구간을 다 채운 경우.
//   (6·9·11월처럼 30일이 말일인 달에 시작하면 말일 규칙이 적용돼 고용24와 같다: 2027.9.30 시작 실측 일치)
//   고용24는 그 구간을 한 달로 보지 않고 일할(30/29)로 계산해 엔진과 다르다(2028·2032년 실측). 산정 기준 확인 전까지 범위 밖(GPT 결정 2026-10-19)
export type LeaveError = 'date-invalid' | 'end-before-start' | 'wage-invalid' | 'prior-invalid' | 'shared-invalid' | 'over-18' | 'both-shared-over' | 'both-shared-partial' | 'work24-leap';
// future-year: 종료일이 LAW_YEAR 다음 해 이후(현재 법령·상한이 유지된다고 가정)
// both-tail-partial: 6+6에서 특례 개월 바로 다음 달이 며칠 단위로 끝남(배우자가 더 오래 쉬면 그 며칠도 특례 기간일 수 있음)
export type LeaveNotice = 'under-7' | 'under-30' | 'over-12' | 'future-year' | 'both-tail-partial';
// 지급률·상한을 확인한 해(시행령 제95조·제95조의3, 2026-10-19 확인)
export const LAW_YEAR = 2026;

export interface LeaveResult {
  segments: Segment[];
  total: number;
  fullMonths: number;
  extraDays: number;
  totalDays: number;
  notices: LeaveNotice[];
}

export function calcLeave(i: LeaveInput): { ok: true; result: LeaveResult } | { ok: false; error: LeaveError } {
  if (!Number.isSafeInteger(i.wage) || i.wage < 1 || i.wage > MAX_WAGE) return { ok: false, error: 'wage-invalid' };
  if (!Number.isInteger(i.priorMonths) || i.priorMonths < 0 || i.priorMonths > MAX_MONTHS - 1) return { ok: false, error: 'prior-invalid' };
  if (i.kind === 'both' ? !Number.isInteger(i.sharedMonths) || i.sharedMonths < 1 || i.sharedMonths > 6 : i.sharedMonths !== 0)
    return { ok: false, error: 'shared-invalid' };
  const s0 = toDays(i.start);
  const e0 = toDays(i.end);
  if (!Number.isFinite(s0) || !Number.isFinite(e0)) return { ok: false, error: 'date-invalid' };
  if (e0 < s0) return { ok: false, error: 'end-before-start' };

  const segments: Segment[] = [];
  for (let k = 0; ; k++) {
    const cur = addMonths(i.start, k);
    const cs = toDays(cur);
    if (cs > e0) break;
    // 말일로 당겨진 구간 시작일에 휴직이 끝나면 그날은 직전 달(이미 다 채운 달)에 포함한다
    if (k > 0 && cs === e0 && cur.d < i.start.d) {
      const prev = segments[segments.length - 1];
      prev.end = cur;
      prev.days += 1;
      prev.segDays += 1;
      break;
    }
    const n = i.priorMonths + k + 1;
    if (n > MAX_MONTHS) return { ok: false, error: 'over-18' };
    const segEnd = toDays(addMonths(i.start, k + 1)) - 1;
    if (k > 0 && cur.m === 2 && cur.d === 29 && i.start.d === 30 && daysInMonth(i.start.y, i.start.m) === 31 && segEnd <= e0) return { ok: false, error: 'work24-leap' };
    const segDays = segEnd - cs + 1;
    const lastDay = Math.min(segEnd, e0);
    const days = lastDay - cs + 1;
    const divisor = daysInMonth(cur.y, cur.m);
    const tier = tierFor(i.kind, n, i.sharedMonths);
    const monthly = monthlyAmount(i.wage, tier);
    const full = days === segDays;
    const amount = full ? monthly : partialAmount(i.wage, tier, days, divisor);
    segments.push({ n, start: cur, end: fromDays(lastDay), days, segDays, divisor, full, tier, monthly, amount });
  }
  const totalDays = e0 - s0 + 1;
  const last = segments[segments.length - 1];
  if (i.kind === 'both') {
    if (!last.full && last.n <= i.sharedMonths) return { ok: false, error: 'both-shared-partial' };
    if (i.sharedMonths > i.priorMonths + segments.filter((g) => g.full).length) return { ok: false, error: 'both-shared-over' };
  }
  const fullMonths = segments.filter((s) => s.full).length;
  const notices: LeaveNotice[] = [];
  if (totalDays < 7) notices.push('under-7');
  else if (totalDays < 30) notices.push('under-30');
  if (last.n > 12) notices.push('over-12');
  if (i.end.y > LAW_YEAR) notices.push('future-year');
  if (i.kind === 'both' && !last.full && last.n === i.sharedMonths + 1 && last.n <= 6) notices.push('both-tail-partial');
  return {
    ok: true,
    result: { segments, total: segments.reduce((a, s) => a + s.amount, 0), fullMonths, extraDays: last.full ? 0 : last.days, totalDays, notices },
  };
}
