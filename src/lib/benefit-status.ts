// 지원사업 상태 계산(빌드 시점). 외부 import 없이 순수 함수로 유지한다(node 테스트에서 직접 import).
// 날짜는 한국 날짜(Asia/Seoul)의 YYYY-MM-DD 경계로 비교한다. 시각은 쓰지 않는다.

export type BenefitStatus = 'upcoming' | 'open' | 'closing-soon' | 'paused' | 'closed';

// 종료일까지 남은 날이 이 값 이하면 마감 임박(D-7 ~ D-0). 이 상수 한 곳에서만 관리한다.
export const CLOSING_SOON_DAYS = 7;
// 시작일까지 남은 날이 이 값 이하인 신청 예정 지원은 홈 '지금 확인할 혜택'에 올린다.
export const STARTING_SOON_DAYS = 7;

export const statusLabels: Record<BenefitStatus, string> = {
  upcoming: '신청 예정',
  open: '신청 가능',
  'closing-soon': '마감 임박',
  paused: '신청 일시 중단',
  closed: '신청 종료',
};

interface StatusInput {
  // pauses: 신청 기간 안의 공식 일시 중단 기간(예: 포인트 생성 처리기간). 그 날짜에만 '신청 일시 중단'
  application: { mode: 'period' | 'rolling' | 'until-budget'; start?: Date; end?: Date; pauses?: { start: Date; end: Date; reason?: string }[] };
  statusOverride?: { value: BenefitStatus };
}

interface StatusResult {
  status: BenefitStatus;
  // 상태와 함께 보여줄 날짜 안내(예: D-6, 오늘 마감, 10월 5일부터). 표시할 근거가 없으면 없음
  detail?: string;
  overridden: boolean;
  // 일시 중단 중이면 그 공식 사유(상태 배너에 표시)
  pauseReason?: string;
}

const DAY = 86_400_000;
const seoulYmd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });

// 기준일(현재 시각) → 한국 날짜의 일 번호
const seoulDay = (now: Date) => Date.parse(seoulYmd.format(now)) / DAY;
// 콘텐츠 날짜(frontmatter YYYY-MM-DD, UTC 자정으로 파싱됨) → 일 번호
const contentDay = (d: Date) => Math.floor(d.getTime() / DAY);
const monthDay = (d: Date) => `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`;

export function benefitStatus(program: StatusInput, now: Date = new Date()): StatusResult {
  const today = seoulDay(now);
  const { start, end } = program.application;
  const startDay = start && contentDay(start);
  const endDay = end && contentDay(end);

  const detailFor = (status: BenefitStatus): string | undefined => {
    if (status === 'upcoming') return start && startDay! > today ? `${monthDay(start)}부터` : undefined;
    if (status === 'closed' || endDay === undefined || endDay < today) return undefined;
    const left = endDay - today;
    return left === 0 ? '오늘 마감' : `D-${left}`;
  };

  const override = program.statusOverride?.value;
  if (override) return { status: override, detail: detailFor(override), overridden: true };

  let status: BenefitStatus;
  if (startDay !== undefined && today < startDay) status = 'upcoming';
  else if (endDay !== undefined && today > endDay) status = 'closed';
  else if (endDay !== undefined && endDay - today <= CLOSING_SOON_DAYS) status = 'closing-soon';
  else status = 'open';
  // 신청 기간 중 공식 일시 중단일이면 그날만 중단으로 표시하고, 다음 날부터 원래 상태로 돌아간다
  const pause = program.application.pauses?.find((x) => contentDay(x.start) <= today && today <= contentDay(x.end));
  if (pause && status !== 'upcoming' && status !== 'closed') {
    const resume = new Date(pause.end.getTime() + DAY);
    return { status: 'paused', detail: endDay !== undefined && contentDay(resume) > endDay ? undefined : `${monthDay(resume)}부터 재개`, overridden: false, pauseReason: pause.reason };
  }
  return { status, detail: detailFor(status), overridden: false };
}

// 신청 예정 지원이 오늘(한국 날짜)부터 days일 안에 시작하는지(D-0 ~ D-days)
export function startsWithin(program: StatusInput, days: number, now: Date = new Date()): boolean {
  const { start } = program.application;
  if (!start || benefitStatus(program, now).status !== 'upcoming') return false;
  const left = contentDay(start) - seoulDay(now);
  return left >= 0 && left <= days;
}
