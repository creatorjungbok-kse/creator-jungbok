// 검색·중복 검사용 사전. 정규화 규칙은 lib/search.ts 한 곳에서 쓴다.
// genericTerms: 주제와 무관하게 붙는 일반어. primaryQuery 비교 시 제거하고 대상만 남긴다(02 6장).
export const genericTerms = ['비용', '가격', '요금', '얼마', '견적', '신청', '방법', '지원금'] as const;

// 검색어 끝에 붙어도 대상이 바뀌지 않는 말(01 G "비용·가격·요금·얼마 등 제거 후 핵심어 매칭").
// genericTerms보다 좁다: "지원금·신청"은 검색에서 그 자체로 의미가 있다.
export const searchSuffixTerms = ['비용', '가격', '요금', '얼마', '견적'] as const;

// 같은 뜻으로 검색되는 말 묶음(01 G). 글별 동의어는 각 글의 synonyms에 둔다.
export const synonymGroups: readonly (readonly string[])[] = [
  ['입주청소', '이사청소', '새집청소'],
  ['지원금', '보조금', '지원사업'],
  ['환급', '돌려받기'],
  ['신청', '접수'],
];
