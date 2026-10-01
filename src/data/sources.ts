// 여러 글에서 재사용하는 공통 출처 registry.
// 한 글에서만 쓰는 출처는 registry에 넣지 않고 글의 localSources에 둔다(id는 `local:` 접두).
// level: S1 공식 1차 출처 / S2 공개 가격·공신력 자료 / S3 실제 견적·사례 / S4 커뮤니티·참고 (02 7장)
// S1 = 해당 정보의 원 제공자가 직접 제공하는 공식 1차 출처. 정부·공공기관뿐 아니라 통신사·카드사·서비스 사업자의
// 자기 상품·서비스 공식 페이지도 S1이다. 단 사업자 S1은 자기 상품의 가격·조건·신청·확인 근거로만 쓰고,
// 경쟁사보다 낫다는 판단이나 객관적 비교 결론의 근거로 쓰지 않는다(비교 판단은 여러 출처를 같은 기준으로 정리해서 쓴다).
export const sourceLevels = ['S1', 'S2', 'S3', 'S4'] as const;

// 화면에 보여줄 등급 설명(내부 코드 S1~S4는 노출하지 않는다)
export const sourceLevelLabels: Record<(typeof sourceLevels)[number], string> = {
  S1: '공식 자료',
  S2: '공개 가격 자료',
  S3: '견적·사례',
  S4: '참고 자료',
};

export interface Source {
  id: string;
  title: string;
  publisher: string;
  url: string;
  level: (typeof sourceLevels)[number];
  // 특정 문서를 가리킬 때만. 사이트 단위 공통 출처는 비워 둔다.
  checkedAt?: Date;
  // 행동 링크(actionLinks) 예외: 출처 도메인과 다르지만 같은 기관이 실제로 쓰는 공식 호스트(정확한 이름만, 사람이 확인 후 등록)
  actionHosts?: string[];
}

export const commonSources: Source[] = [
  { id: 'gov24', title: '정부24', publisher: '행정안전부', url: 'https://www.gov.kr/', level: 'S1' },
  { id: 'nts', title: '국세청', publisher: '국세청', url: 'https://www.nts.go.kr/', level: 'S1' },
  { id: 'kepco', title: '한국전력공사', publisher: '한국전력공사', url: 'https://home.kepco.co.kr/', level: 'S1' },
];
