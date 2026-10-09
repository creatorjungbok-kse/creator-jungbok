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
  // 전기요금 계산기(src/tools/electricity-bill) 근거
  {
    id: 'easylaw-residential-tariff',
    title: '주택용 전기요금(찾기쉬운 생활법령정보, 한국전력 기본공급약관 근거)',
    publisher: '법제처',
    url: 'https://m.easylaw.go.kr/MOB/IssueQnaRetrieve.laf?issueqaSeq=407&sch=&targetRow=1&type=TTL',
    level: 'S1',
    checkedAt: new Date('2026-10-01'),
  },
  {
    id: 'kepco-supply-terms',
    title: '한국전력 기본공급약관',
    publisher: '한국전력공사',
    url: 'https://cyber.kepco.co.kr/ckepco/front/jsp/CY/D/C/CYDCHP00101.jsp',
    level: 'S1',
    checkedAt: new Date('2026-10-01'),
  },
  {
    id: 'kepco-climate-charge',
    title: '기후환경요금 단가 안내',
    publisher: '한국전력공사',
    url: 'https://home.kepco.co.kr/kepco/front/html/WZ/2023_03_04/sub2_1.html',
    level: 'S1',
    checkedAt: new Date('2026-10-01'),
  },
  {
    // 공지 직접 주소가 안정적으로 확인되지 않아 공지 목록 주소를 쓴다(공지 No. 1,909, 2026-09-21 작성)
    id: 'kepco-fuel-adjustment-2026q4',
    title: '2026년 4분기 연료비조정단가 산정내역(공지 No. 1,909, 2026-09-21 작성)',
    publisher: '한국전력공사',
    url: 'https://www.kepco.co.kr/home/media/newsroom/notice/boardList.do',
    level: 'S1',
    checkedAt: new Date('2026-10-01'),
  },
  {
    id: 'law-vat-rate',
    title: '부가가치세법 제30조(세율)',
    publisher: '법제처 국가법령정보센터',
    url: 'https://law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1028444683',
    level: 'S1',
    checkedAt: new Date('2026-10-01'),
  },
  {
    id: 'law-electricity-fund',
    title: '전기사업법 시행령 제36조(전력산업기반기금 부담금)',
    publisher: '법제처 국가법령정보센터',
    url: 'https://law.go.kr/lsLinkCommonInfo.do?chrClsCd=010202&lspttninfSeq=118786',
    level: 'S1',
    checkedAt: new Date('2026-10-01'),
  },
  { id: 'kepco-online', title: '한전ON', publisher: '한국전력공사', url: 'https://online.kepco.co.kr', level: 'S1', checkedAt: new Date('2026-10-01') },
  // 주휴수당 계산기(src/lib/payroll/weekly-holiday-pay) 근거. 권위 수준을 제목으로 구분한다:
  // 법률·시행령 = 법적 근거 / 고용노동부 지침·행정해석 = 행정 기준 / 1350 상담 답변 = 공식 상담 안내(법령과 같은 효력 아님)
  {
    id: 'law-labor-standards-act',
    title: '근로기준법 제18조(단시간근로자의 근로조건)·제55조(휴일)',
    publisher: '법제처 국가법령정보센터',
    url: 'https://www.law.go.kr/법령/근로기준법',
    level: 'S1',
    checkedAt: new Date('2026-10-09'),
  },
  {
    id: 'law-labor-standards-decree',
    title: '근로기준법 시행령 제30조(휴일)·별표1·별표2(단시간근로자의 근로조건 결정기준)',
    publisher: '법제처 국가법령정보센터',
    url: 'https://www.law.go.kr/법령/근로기준법시행령',
    level: 'S1',
    checkedAt: new Date('2026-10-09'),
  },
  {
    id: 'minimumwage-decisions',
    title: '연도별 최저임금 결정현황',
    publisher: '최저임금위원회',
    url: 'https://www.minimumwage.go.kr/minWage/policy/decisionMain.do',
    level: 'S1',
    checkedAt: new Date('2026-10-09'),
  },
  {
    id: 'moel-1350-weekly-holiday-normal-day',
    title: '고용노동부 고객상담센터 — 주휴수당 상담 안내(8일째 근로 예정·정상근로일 소정근로시간)',
    publisher: '고용노동부',
    url: 'https://1350.moel.go.kr/rtmview.do?id=1000323993',
    level: 'S1',
    checkedAt: new Date('2026-10-09'),
  },
  {
    id: 'moel-1350-weekly-holiday-leave',
    title: '고용노동부 고객상담센터 — 주휴수당 상담 안내(지각·조퇴·휴가와 개근, 주 전체 휴가)',
    publisher: '고용노동부',
    url: 'https://1350.moel.go.kr/rtmview.do?id=1000325778',
    level: 'S1',
    checkedAt: new Date('2026-10-09'),
  },
  {
    id: 'moel-1350-weekly-holiday-resign',
    title: '고용노동부 고객상담센터 — 주휴수당 상담 안내(퇴사하는 주, 임금근로시간과-1736 인용)',
    publisher: '고용노동부',
    url: 'https://1350.moel.go.kr/rtmview.do?id=1000322043',
    level: 'S1',
    checkedAt: new Date('2026-10-09'),
  },
];
