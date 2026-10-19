// 육아휴직급여 계산기 도구 설정(등록되는 도구). 계산 로직은 src/lib/payroll/parental-leave/calculation.ts에 있다.
// 설계: docs/ready/parental-2026-10-19/00-parental-leave-fact-design.md, GPT 결정(2026-10-19): 일반·6+6·한부모, 이미 쓴 정수 개월, 월별 지급액.
// 지급률·상한·하한은 고용보험법 시행령 제95조·제95조의3 상수라 해마다 개정 여부를 확인한다. 법령 근거는 글의 localSources에 있다.
export const parentalLeavePay = {
  id: 'parental-leave-pay',
  checkedAt: '2026-10-19',
  sourceIds: [] as string[],
  reviewFrom: '2027-01-02',
  reviewNote: '고용보험법 시행령 제95조·제95조의3(지급률·상한·하한) 개정 여부와 고용24 모의계산 방식 확인',
} as const;
