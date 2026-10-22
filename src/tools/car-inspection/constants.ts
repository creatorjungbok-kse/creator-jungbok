// 자동차 검사기간 계산기 도구 설정(등록되는 도구). 판정 로직은 src/lib/car-inspection/inspection.ts에 있다.
// 해마다 바뀌는 상수가 없어 유효 기한을 두지 않는다. 검사기간·과태료 기준이 개정되면 다시 확인한다.
// 근거 법령(시행규칙 제74·75·77조, 종합검사규칙 제9·10조, 시행령 별표 2)은 글의 localSources에 있다.
export const carInspection = {
  id: 'car-inspection',
  checkedAt: '2026-10-22',
  sourceIds: [] as string[],
} as const;
