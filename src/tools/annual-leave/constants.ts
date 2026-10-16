// 연차 계산기 도구 설정(등록되는 도구). 계산 로직은 src/lib/payroll/annual-leave/에 있다.
// 설계: docs/ready/annual-leave/calculator-design.md
// 해마다 바뀌는 상수가 없어 유효 기한을 두지 않는다. 2027.6.10 시행 개정(시간 단위 사용 청구)은 시행 전에 다시 확인한다.
// 계산 근거 법령·판결은 글의 localSources에 있다.
export const annualLeave = {
  id: 'annual-leave',
  checkedAt: '2026-10-16',
  sourceIds: [] as string[],
} as const;
