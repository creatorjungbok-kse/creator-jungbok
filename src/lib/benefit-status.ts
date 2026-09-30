// 지원사업 상태 계산(빌드 시점). 외부 import 없이 순수 함수로 유지한다(node 테스트에서 직접 import).
// 날짜는 한국 날짜(Asia/Seoul)의 YYYY-MM-DD 경계로 비교한다. 시각은 쓰지 않는다.

export type BenefitStatus = 'upcoming' | 'open' | 'closing-soon' | 'closed';

// 종료일까지 남은 날이 이 값 이하면 마감 임박(D-7 ~ D-0). 이 상수 한 곳에서만 관리한다.
export const CLOSING_SOON_DAYS = 7;

export const statusLabels: Record<BenefitStatus, string> = {
  upcoming: '신청 예정',
  open: '신청 가능',
  'closing-soon': '마감 임박',
  closed: '신청 종료',
};

// 공식 사이트 버튼(OfficialCta) 문구: 상태에 따라 이 표에서만 정한다. 신청할 수 없는 상태에는 '신청'을 쓰지 않는다
export const ctaLabels: Record<BenefitStatus, string> = {
  upcoming: '공식 안내 보기',
  open: '공식 신청 페이지 보기',
  'closing-soon': '공식 신청 페이지 보기',
  closed: '공식 공고 보기',
};

interface StatusInput {
  application: { mode: 'period' | 'rolling' | 'until-budget'; start?: Date; end?: Date };
  statusOverride?: { value: BenefitStatus };
}

interface StatusResult {
  status: BenefitStatus;
  // 상태와 함께 보여줄 날짜 안내(예: D-6, 오늘 마감, 10월 5일부터). 표시할 근거가 없으면 없음
  detail?: string;
  overridden: boolean;
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
  return { status, detail: detailFor(status), overridden: false };
}
