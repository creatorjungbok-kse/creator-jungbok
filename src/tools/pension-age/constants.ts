// 국민연금 수령나이 계산기 도구 설정(등록되는 도구). 판정 로직은 src/lib/pension-age/pension-age.ts에 있다.
// 해마다 바뀌는 상수가 없어 유효 기한을 두지 않는다. 수령 나이·조기·연기 비율이 개정되면 다시 확인한다.
// 근거(국민연금법 제54·61·62·63조, 부칙)는 글의 localSources에 있다.
export const pensionAge = {
  id: 'pension-age',
  checkedAt: '2026-10-23',
  sourceIds: [] as string[],
} as const;
