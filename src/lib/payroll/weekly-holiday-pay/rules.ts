// 주휴수당 계산기 v1 규칙(docs/ready/weekly-holiday-pay/spec.md 확정본). 시간은 0.1시간 단위 정수(hours10).
// 근거: 근로기준법 제18조제3항(주 15시간), 시행령 제30조(개근), 시행령 별표2(단시간근로자 1일 소정근로시간), 1350 상담 안내(정상근로일 소정근로시간)

export const HOURS_DECIMALS = 1;
// 입력: 0.5시간 단위, 0.5~40시간 (40 초과는 입력 오류 — 연장근로 제외)
export const HOURS_STEP10 = 5;
export const HOURS_MIN10 = 5;
export const HOURS_MAX10 = 400;
// 주휴 적용: 1주 소정근로시간 15시간 이상
export const ELIGIBLE_MIN10 = 150;
// 주 40시간(통상근로자 법정 상한)
export const FULL_TIME10 = 400;
// 단순화식 전제: 같은 종류 업무의 통상근로자 주 5일 → 주휴시간 = 주 소정근로시간 ÷ 5
export const STANDARD_DAYS = 5;

// 시급 입력 범위(원, 정수). 상한은 입력 오류 방지용 UX 제한
export const WAGE_MIN = 1;
export const WAGE_MAX = 1_000_000;
