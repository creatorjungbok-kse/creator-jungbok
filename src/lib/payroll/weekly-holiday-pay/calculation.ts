// 주휴수당 계산(스펙 4번). 내부값은 정확값(분수)으로 보존하고, 반올림은 표시 단계(roundHalfUpWon)에서만 한다.
//   주휴시간 = 1주 소정근로시간 ÷ 5   (같은 종류 업무의 통상근로자가 주 5일일 때 시행령 별표2 계산과 같은 값.
//                                     주 40시간·주 5일·하루 8시간이면 8시간 — 1350 안내의 '정상근로일 소정근로시간'과 같은 값)
//   주휴수당 = 주휴시간 × 시급,  소정근로 임금 = 1주 소정근로시간 × 시급,  예상 세전 임금 = 둘의 합
import { add, exact, type Exact } from '../shared/money.ts';
import { judge, type EligibilityInput } from './eligibility.ts';
import { STANDARD_DAYS } from './rules.ts';

export interface WeeklyHolidayPayAmounts {
  // 주휴시간(0.1시간 단위 정수)
  holidayHours10: number;
  holidayPay: Exact;
  regularPay: Exact;
  grossWeekly: Exact;
}

// 판정을 통과한 입력만 넣는다(hours10은 0.5시간 단위 정수)
export function calcAmounts(wage: number, hours10: number): WeeklyHolidayPayAmounts {
  if (hours10 % STANDARD_DAYS !== 0) throw new RangeError(`주 소정근로시간은 0.5시간 단위: ${hours10}`);
  const holidayHours10 = hours10 / STANDARD_DAYS;
  const holidayPay = exact(wage * holidayHours10, 10);
  const regularPay = exact(wage * hours10, 10);
  return { holidayHours10, holidayPay, regularPay, grossWeekly: add(regularPay, holidayPay) };
}

export type WeeklyHolidayPayResult =
  | ({ kind: 'amount' } & WeeklyHolidayPayAmounts)
  | Exclude<ReturnType<typeof judge>, { kind: 'ok' }>;

// 판정 + 계산
export function evaluate(wage: number, i: EligibilityInput): WeeklyHolidayPayResult {
  const e = judge(i);
  if (e.kind !== 'ok') return e;
  return { kind: 'amount', ...calcAmounts(wage, i.hours10) };
}

// 0.1시간 단위 정수 → '3.6', '4', '7.8' (표시용)
export const hoursLabel = (hours10: number): string => (hours10 % 10 === 0 ? String(hours10 / 10) : `${Math.floor(hours10 / 10)}.${hours10 % 10}`);
