// 4대보험 계산기 상수(확정 문서 docs/ready/social-insurance-calculator/{fact-table,spec}.md). 공식 자료에서 확인한 값만 둔다(확인 2026-10-14).
// 외부 import 없음 — 화면 스크립트·서버 렌더·node 테스트가 같은 값을 쓴다(다음 단계 실수령액 계산기도 재사용).
// 갱신 규칙:
// - 해마다 1월: 건강보험료율·장기요양보험료율·국민연금 보험료율(2033년까지 매년 0.5%p 인상)을 공식 자료로 다시 확인하고 바꾼다
// - 해마다 7월: 국민연금 기준소득월액 상·하한(npsBaseRange)을 국민연금공단 공지로 바꾼다
// - reviewFrom 이후: production check-build 경고 / validUntil 이후: check-build 실패, test:tools 실패, 화면은 결과 대신 안내만

// 국민연금 — 근로자·사용자 각각 보험료율(1만분율). 2026년 9.5%의 절반 = 4.75% (국민연금공단 G1)
export const NPS_HALF_RATE_BP = 475;
// 기준소득월액 천원 미만 절사 (G1)
export const NPS_BASE_UNIT = 1_000;
// 기준소득월액 상·하한 — 2026.7.1~2027.6.30 (국민연금공단 G1·G2)
export const npsBaseRange = { min: 410_000, max: 6_590_000, from: '2026-07-01', to: '2027-06-30' } as const;
// 직전 기간(안내 문구용) — 2025.7.1~2026.6.30
export const npsPrevBaseRange = { min: 400_000, max: 6_370_000, to: '2026-06-30' } as const;

// 건강보험 — 2026년 7.19%의 절반 = 3.595% (10만분율) (보건복지부 G4)
export const NHI_HALF_RATE = { n: 3_595, d: 100_000 } as const;
// 보수월액 상·하한 2026년 — 4대사회보험 정보연계센터 모의계산(C1) 값
export const nhiBaseRange = { min: 280_528, max: 127_725_730 } as const;

// 장기요양 — 건강보험료 × (0.9448% ÷ 7.19%) (보건복지부 G5: 소득 대비 0.9448%, 건강보험료 대비 13.14%)
export const LTC_OVER_NHI = { n: 9_448, d: 71_900 } as const;

// 고용보험 — 실업급여 1천분의 18, 근로자·사업주 각 절반 0.9% (시행령 제12조①2, 법 제13조②④)
export const EI_UNEMPLOYMENT_HALF = { n: 9, d: 1_000 } as const;
// 고용안정·직업능력개발 — 사업주만(1만분율), 시행령 제12조①1
export interface CompanySize {
  key: 'under150' | 'priority150' | 'under1000' | 'over1000';
  label: string;
  // 1만분율: 25 = 0.25%
  bp: number;
}
export const companySizes: readonly CompanySize[] = [
  { key: 'under150', label: '150명 미만', bp: 25 },
  { key: 'priority150', label: '150명 이상 · 우선지원대상기업', bp: 45 },
  { key: 'under1000', label: '150명 이상 1,000명 미만', bp: 65 },
  { key: 'over1000', label: '1,000명 이상 · 국가·지방자치단체', bp: 85 },
];
export type CompanySizeKey = CompanySize['key'];
export const companySizeFor = (key: string): CompanySize | undefined => companySizes.find((c) => c.key === key);

// 입력 범위(입력 오류 방지용 UX 제한, 법령 값 아님)
export const PAY_MIN = 1;
export const PAY_MAX = 1_000_000_000; // 10억원

// 끝수: 4대사회보험 정보연계센터 모의계산과 같은 방식(10원 미만 버림). 법정 끝수 규칙이라고 표현하지 않는다
export const ROUND_UNIT = 10;

// 계산 기준 기간(2026년 7월 이후 현재 기준). 2027년 요율이 모두 확정·검증되면 갱신
export const reviewFrom = '2026-12-01';
export const reviewNote = '2027년 4대보험 요율(국민연금 10%, 건강·장기요양) 공식 확정값 확인 후 상수 갱신';
export const validUntil = '2026-12-31';

// 오늘(한국 날짜 YYYY-MM-DD)이 기한을 넘었는가 → 화면은 결과 대신 안내만
export const isStale = (kstDateStr: string): boolean => kstDateStr > validUntil;
