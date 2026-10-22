// 자동차 검사기간 계산기 v1 — 설계(docs/ready/car-inspection-1022/, GPT 10/22 조건부 승인). 판정은 여기에만 있고 화면은 그리기만 한다.
// 외부 import 없음 — 화면 스크립트·node 테스트가 같은 함수를 쓴다.
// 근거
//   검사기간: 검사유효기간 만료일(연장·유예 시 그 만료일) 전 90일부터 후 31일까지
//     자동차관리법 시행규칙 제77조②, 자동차종합검사규칙 제9조②(2024.12.17. 개정, 2025.1.1. 이후 검사받는 차부터)
//   기간 전·후에 받으면 다음 유효기간은 검사받은 날 다음 날부터(시행규칙 제74조②③, 종합검사규칙 제9조①)
//   과태료: 자동차관리법 시행령 별표 2 제2호 소목 — 지연 30일 이내 4만원 / 30일 초과 114일 이내 4만원에 31일째부터
//     3일 초과 시마다 2만원 / 115일 이상 60만원. 31일 이후의 정확한 증가 시점은 해석하지 않고 구간만 보여 준다(GPT 결정).

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

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
// 2026년 10월 22일(목)
export function dateLabel(day: number): string {
  const d = new Date(day * DAY_MS);
  return `${d.getUTCFullYear()}년 ${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일(${WEEK[d.getUTCDay()]})`;
}

const seoulFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });
// 한국 날짜(방문자 기기 시간대와 무관)
export function seoulTodayDay(now: Date = new Date()): number {
  const p = Object.fromEntries(seoulFormatter.formatToParts(now).map((x) => [x.type, x.value]));
  return parseYmd(`${p.year}-${p.month}-${p.day}`)!;
}

// ── 기준 ──
export const BEFORE_DAYS = 90; // 만료일 전 90일부터
export const AFTER_DAYS = 31; // 만료일 후 31일까지
export const MIN_DAY = parseYmd('2000-01-01')!;
export const MAX_DAY = parseYmd('2099-12-31')!;
// 90일 규정은 2025.1.1. 이후 정기검사를 받는 자동차부터(부칙 제1415호 제2조). 그 전 검사일은 계산하지 않는다.
export const RULE_FROM = parseYmd('2025-01-01')!;

export const FINE_BASE = 40_000;
export const FINE_STEP = 20_000;
export const FINE_MAX = 600_000;

export type FineBand = 'none' | 'base' | 'rising' | 'max';
export function fineBand(lateDays: number): FineBand {
  if (lateDays <= 0) return 'none';
  if (lateDays <= 30) return 'base';
  if (lateDays <= 114) return 'rising';
  return 'max';
}

export interface Window {
  start: number; // 검사 가능 첫날
  end: number; // 검사기간 마지막 날
}
export const inspectionWindow = (expiry: number): Window => ({ start: expiry - BEFORE_DAYS, end: expiry + AFTER_DAYS });

export type Status = 'early' | 'open' | 'late';
export interface Judgement {
  window: Window;
  status: Status;
  // early: 검사기간 시작까지 남은 날 / open: 마감까지 남은 날(0이면 오늘 마감) / late: 검사 지연 일수(마감 다음 날이 1일째)
  days: number;
  fine: FineBand;
  // 검사 받을 날이 오늘보다 뒤인지(그날까지 받지 않았을 때를 가정한 예상)
  future: boolean;
}

export type InputError = 'expiry-empty' | 'expiry-range' | 'check-empty' | 'check-range' | 'check-before-rule';

export function judge(expiry: number, checkDay: number, today: number): Judgement {
  const w = inspectionWindow(expiry);
  const future = checkDay > today;
  if (checkDay < w.start) return { window: w, status: 'early', days: w.start - checkDay, fine: 'none', future };
  if (checkDay <= w.end) return { window: w, status: 'open', days: w.end - checkDay, fine: 'none', future };
  const late = checkDay - w.end;
  return { window: w, status: 'late', days: late, fine: fineBand(late), future };
}

export function validate(expiry: number | null, checkDay: number | null): InputError[] {
  const errors: InputError[] = [];
  if (expiry === null) errors.push('expiry-empty');
  else if (expiry < MIN_DAY || expiry > MAX_DAY) errors.push('expiry-range');
  if (checkDay === null) errors.push('check-empty');
  else if (checkDay < MIN_DAY || checkDay > MAX_DAY) errors.push('check-range');
  else if (checkDay < RULE_FROM) errors.push('check-before-rule');
  return errors;
}

export const won = (n: number): string => `${n.toLocaleString('ko-KR')}원`;

// 화면 문구(테스트가 같은 문구를 확인한다)
export function headline(j: Judgement): string {
  if (j.status === 'early') return `검사기간 시작까지 ${j.days}일 남았습니다`;
  if (j.status === 'open') return j.days === 0 ? '오늘이 검사기간 마지막 날입니다' : `검사기간입니다 · 마감까지 ${j.days}일`;
  return `검사기간이 ${j.days}일 지났습니다`;
}

export function fineLine(j: Judgement): string {
  const when = j.future ? '그날까지 검사를 받지 않으면 ' : '';
  switch (j.fine) {
    case 'none':
      return '과태료 없음';
    case 'base':
      return `${when}과태료 기준 구간: 지연 30일 이내, 기준 과태료 ${won(FINE_BASE)}`;
    case 'rising':
      return `${when}과태료 기준 구간: 지연 31일부터 114일까지, ${won(FINE_BASE)}에 3일 초과 시마다 ${won(FINE_STEP)}씩 더해짐(최대 ${won(FINE_MAX)})`;
    case 'max':
      return `${when}과태료 기준 구간: 지연 115일 이상, 기준 과태료 ${won(FINE_MAX)}`;
  }
}
