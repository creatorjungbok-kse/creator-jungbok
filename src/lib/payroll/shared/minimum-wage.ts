// 연도별 최저임금(최저임금위원회 연도별 최저임금 결정현황, 확인 2026-10-09). 급여 계열 도구 공용.
// 갱신 규칙: 다음 해 최저임금이 고시되면(통상 8월 초) 이 목록에 연도를 추가하고 reviewFrom·reviewNote를 다음 해로 옮긴다.
// - reviewFrom 이후: production check-build 경고(ToolShell data-review-from)
// - validUntil(마지막 연도 12월 31일) 이후: production check-build 실패, test:tools 실패, 화면은 그 해 최저임금을 자동 선택하지 않는다
// 외부 import 없음 — 화면 스크립트·서버 렌더·node 테스트가 같은 함수를 쓴다.

export interface MinimumWageYear {
  year: number;
  hourly: number;
  daily8h: number;
  monthly209h: number;
  // 적용 기간(한국 날짜, 양 끝 포함)
  from: string;
  to: string;
  decidedAt: string;
  announcedAt: string;
  sourceIds: string[];
  checkedAt: string;
}

export const minimumWages: readonly MinimumWageYear[] = [
  { year: 2026, hourly: 10_320, daily8h: 82_560, monthly209h: 2_156_880, from: '2026-01-01', to: '2026-12-31', decidedAt: '2025-07-10', announcedAt: '2025-08-05', sourceIds: ['minimumwage-decisions'], checkedAt: '2026-10-09' },
  { year: 2027, hourly: 10_700, daily8h: 85_600, monthly209h: 2_236_300, from: '2027-01-01', to: '2027-12-31', decidedAt: '2026-07-14', announcedAt: '2026-08-05', sourceIds: ['minimumwage-decisions'], checkedAt: '2026-10-09' },
];

// soft 경고 시작일과 문구(다음 해 최저임금 확인)
export const reviewFrom = '2027-08-31';
export const reviewNote = '2028년 최저임금 확인 필요';
// hard 기한: 등록된 마지막 연도의 마지막 날
export const validUntil = minimumWages[minimumWages.length - 1].to;

export const minimumWageFor = (year: number): MinimumWageYear | undefined => minimumWages.find((m) => m.year === year);

// 기본 연도: 오늘(한국 날짜)이 적용 기간에 드는 연도. 없으면 null — 지난 연도를 자동 선택하지 않는다
export const defaultYear = (todayKst: string): number | null => minimumWages.find((m) => m.from <= todayKst && todayKst <= m.to)?.year ?? null;

// 오늘 적용되는 최저임금이 목록에 없다(새해가 됐는데 상수가 갱신되지 않음)
export const isStale = (todayKst: string): boolean => defaultYear(todayKst) === null;

// 그 해 적용기간이 끝났는가(지난 연도 표시용)
export const hasEnded = (year: number, todayKst: string): boolean => {
  const m = minimumWageFor(year);
  return m !== undefined && m.to < todayKst;
};

export const belowMinimumWage = (wage: number, year: number): boolean => {
  const m = minimumWageFor(year);
  return m !== undefined && wage < m.hourly;
};
