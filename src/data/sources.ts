// 여러 글에서 재사용하는 공통 출처 registry.
// 한 글에서만 쓰는 출처는 registry에 넣지 않고 글의 localSources에 둔다(id는 `local:` 접두).
// level: S1 공식 / S2 공개 가격·공신력 자료 / S3 실제 견적·사례 / S4 커뮤니티·참고 (02 7장)
export const sourceLevels = ['S1', 'S2', 'S3', 'S4'] as const;

export interface Source {
  id: string;
  title: string;
  publisher: string;
  url: string;
  level: (typeof sourceLevels)[number];
  // 특정 문서를 가리킬 때만. 사이트 단위 공통 출처는 비워 둔다.
  checkedAt?: Date;
}

export const commonSources: Source[] = [
  { id: 'gov24', title: '정부24', publisher: '행정안전부', url: 'https://www.gov.kr/', level: 'S1' },
  { id: 'nts', title: '국세청', publisher: '국세청', url: 'https://www.nts.go.kr/', level: 'S1' },
  { id: 'kepco', title: '한국전력공사', publisher: '한국전력공사', url: 'https://home.kepco.co.kr/', level: 'S1' },
];
