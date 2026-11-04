// 중도상환수수료 계산기 도구 설정(등록되는 도구). 계산 로직은 src/lib/finance/prepayment/calculation.ts에 있다.
// 산식은 은행 공통 안내(남은 일수 ÷ 부과기간)이고, 수수료율은 사용자가 계약서·은행 공시에서 확인해 넣는다.
// 금융소비자보호법 제20조(3년 이내 상환만 부과)·2025.1.13 실비용 반영 개편 근거는 글의 localSources에 있다.
export const prepaymentFee = {
  id: 'prepayment-fee',
  checkedAt: '2026-11-04',
  sourceIds: [] as string[],
  reviewFrom: '2027-01-02',
  reviewNote: '은행별 중도상환수수료율(매년 재산정·공시)과 금융소비자보호법 제20조 개정 여부 확인',
} as const;
