// 예적금 세후 이자 계산기 도구 설정(등록되는 도구). 계산 로직은 src/lib/finance/savings/calculation.ts에 있다.
// 설계: docs/ready/savings-2026-10-19/00-savings-interest-fact-design.md, GPT 결정(2026-10-19): 예금·적금, 단리·월복리, 과세 5종, 우대 한도 초과 시 계산 중단.
// 조합 예탁금 세율은 가입 연도별로 정해져 있어(조특법 제89조의3) 해마다 개정 여부를 확인한다. 법령 근거는 글의 localSources에 있다.
export const savingsInterest = {
  id: 'savings-interest',
  checkedAt: '2026-10-19',
  sourceIds: [] as string[],
  reviewFrom: '2027-01-02',
  reviewNote: '이자소득 원천징수세율(소득세법 제129조), 비과세종합저축(조특법 제88조의2)·조합등예탁금(제89조의3) 개정 여부 확인',
} as const;
