// 퇴직금 세금 계산기 도구 설정(등록되는 도구). 계산 로직은 src/lib/payroll/severance-tax/calculation.ts에 있다.
// 공제표·세율은 법령 상수라 기한 대신 해마다 세법 개정 여부를 확인한다. 법령 근거는 글의 localSources에 있다.
export const severanceTax = {
  id: 'severance-tax',
  checkedAt: '2026-10-27',
  sourceIds: [] as string[],
  reviewFrom: '2027-01-02',
  reviewNote: '소득세법 제48조(근속연수공제·환산급여공제)와 제55조(기본세율) 개정 여부 확인',
} as const;
