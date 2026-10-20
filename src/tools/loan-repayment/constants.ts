// 대출 상환 계산기 도구 설정(등록되는 도구). 계산 로직은 src/lib/finance/loan/calculation.ts에 있다.
// 설계: docs/ready/loan-2026-10-20/00-loan-fact-design.md, GPT 결정(2026-10-20): 원리금균등·원금균등·만기일시, 거치기간, 연 0~20%, 월 이율 = 연 이율 ÷ 12.
// 계산 산식은 법령이 정하지 않는다(표준 상환 산식). 금리 상한·중도상환수수료 법령 근거는 글의 localSources에 있다.
export const loanRepayment = {
  id: 'loan-repayment',
  checkedAt: '2026-10-20',
  sourceIds: [] as string[],
  reviewFrom: '2027-01-02',
  reviewNote: '최고이자율(이자제한법·대부업법 시행령 제5조·제9조), 중도상환수수료(금융소비자보호법 제20조) 개정 여부 확인',
} as const;
