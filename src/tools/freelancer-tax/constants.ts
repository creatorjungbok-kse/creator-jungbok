// 3.3% 계산기 도구 설정(등록되는 도구). 계산 로직은 src/lib/payroll/freelancer/calculation.ts에 있다.
// 설계: docs/ready/calc33-2026-10-19/00-calc33-fact-design.md, GPT 결정(2026-10-19): 3.3%·8.8%·양방향 역산, 지급액 10억원까지.
// 세율·필요경비율은 법령 상수라 기한 대신 해마다 세법 개정 여부를 확인한다. 법령 근거는 글의 localSources에 있다.
export const freelancerTax = {
  id: 'freelancer-tax',
  checkedAt: '2026-10-19',
  sourceIds: [] as string[],
  reviewFrom: '2027-01-02',
  reviewNote: '소득세법 원천징수세율(제129조)과 기타소득 필요경비율(시행령 제87조) 개정 여부 확인',
} as const;
