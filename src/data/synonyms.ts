// 검색·중복 검사용 사전(검색 알고리즘은 P7).
// genericTerms: 주제와 무관하게 붙는 일반어. primaryQuery 비교 시 제거하고 대상만 남긴다(02 6장).
export const genericTerms = ['비용', '가격', '요금', '얼마', '견적', '신청', '방법', '지원금'] as const;

// 같은 뜻으로 검색되는 말 묶음(01 G). 글별 동의어는 각 글의 synonyms에 둔다.
export const synonymGroups: readonly (readonly string[])[] = [
  ['입주청소', '이사청소', '새집청소'],
  ['지원금', '보조금', '지원사업'],
  ['환급', '돌려받기'],
  ['신청', '접수'],
];
