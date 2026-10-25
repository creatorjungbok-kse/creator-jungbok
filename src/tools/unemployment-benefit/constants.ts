// 실업급여 계산기 도구 설정(등록되는 도구). 계산 로직은 src/lib/payroll/unemployment/calculation.ts에 있다.
// 최저임금·기초일액 상한은 해마다 바뀐다. 2027년 상한은 입법예고안(2026.9.22) 값이라 시행령 확정 시 반드시 다시 확인한다.
export const unemploymentBenefit = {
  id: 'unemployment-benefit',
  checkedAt: '2026-10-25',
  sourceIds: [] as string[],
  reviewFrom: '2026-12-15',
  reviewNote: '2027년 구직급여 상한(고용보험법 시행령 제68조 개정 확정 여부)과 2028년 최저임금 확인',
} as const;
