// 퇴직금 계산기 도구 설정(등록되는 도구). 계산 로직은 src/lib/payroll/severance-pay/에 있다.
// 확정 설계: docs/ready/severance-pay/calculator-spec.md
// 해마다 바뀌는 상수(요율·최저임금 등)가 없어 유효 기한을 두지 않는다. 계산 근거 법령은 글의 localSources에 있다.
export const severancePay = {
  id: 'severance-pay',
  checkedAt: '2026-10-16',
  sourceIds: [] as string[],
} as const;
