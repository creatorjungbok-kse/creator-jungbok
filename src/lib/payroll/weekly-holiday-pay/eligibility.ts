// 주휴수당 판정(스펙 3번 판정 순서). 금액을 계산하지 않는다 — 계산해도 되는지만 사유 코드로 돌려준다.
import { ELIGIBLE_MIN10, FULL_TIME10 } from './rules.ts';

// 같은 종류 업무의 통상근로자가 주 5일 근무하는가(15~40시간 미만일 때 필수)
export type FiveDayStandard = 'yes' | 'no-or-unknown';
// 주 40시간의 근무 형태(40시간일 때 필수)
export type WorkPattern40 = 'five-days-8h' | 'uneven';
// 주 시간에 따라 뜨는 분기 질문(둘 중 하나만, 15시간 미만이면 없음)
export type Branch = 'none' | 'five-day-standard' | 'work-pattern-40';

export interface EligibilityInput {
  hours10: number;
  fullAttendance: boolean;
  fiveDayStandard?: FiveDayStandard;
  workPattern40?: WorkPattern40;
}

export type Eligibility =
  | { kind: 'ok' }
  | { kind: 'not-eligible'; reason: 'under-15h' | 'not-full-attendance' }
  | { kind: 'stop'; reason: 'standard-not-5day' | 'uneven-40h' }
  // 분기 질문이 필요한데 답이 없음(화면에서는 입력 오류)
  | { kind: 'incomplete'; missing: 'five-day-standard' | 'work-pattern-40' };

export const branchFor = (hours10: number): Branch =>
  hours10 < ELIGIBLE_MIN10 ? 'none' : hours10 < FULL_TIME10 ? 'five-day-standard' : 'work-pattern-40';

// 판정 순서: 15시간 미만 → 결근 → 통상근로자 주 5일 아님·모름 → 40시간 요일별 차이 → 계산
export function judge(i: EligibilityInput): Eligibility {
  const branch = branchFor(i.hours10);
  if (branch === 'none') return { kind: 'not-eligible', reason: 'under-15h' };
  if (branch === 'five-day-standard' && i.fiveDayStandard === undefined) return { kind: 'incomplete', missing: 'five-day-standard' };
  if (branch === 'work-pattern-40' && i.workPattern40 === undefined) return { kind: 'incomplete', missing: 'work-pattern-40' };
  if (!i.fullAttendance) return { kind: 'not-eligible', reason: 'not-full-attendance' };
  if (branch === 'five-day-standard' && i.fiveDayStandard !== 'yes') return { kind: 'stop', reason: 'standard-not-5day' };
  if (branch === 'work-pattern-40' && i.workPattern40 !== 'five-days-8h') return { kind: 'stop', reason: 'uneven-40h' };
  return { kind: 'ok' };
}
