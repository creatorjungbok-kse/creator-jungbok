// 사이트 전역 설정. 사이트 URL은 astro.config.mjs의 `site`에서만 관리한다.
// 브랜드 문자열의 유일한 출처: title·OG·RSS·WebSite·Organization·manifest·헤더·푸터가 여기서 읽는다(P9 확정).
export const site = {
  name: '꿀팁정복',
  // 홈 title의 한 줄 정의(`{name}: {tagline}`), 헤더 아래·푸터 설명
  tagline: '생활에 필요한 정보를 쉽고 정확하게',
  // 홈 meta description·RSS 채널 설명
  description: '지원·혜택부터 생활비용, 사업·창업, 통신·디지털까지 알아두면 도움 되는 정보를 최신 기준으로 정리합니다.',
  lang: 'ko',
  // 공유 미리보기 기본 이미지(1200x630 PNG). 글은 frontmatter ogImage가 있으면 그것을 쓴다
  ogImage: '/images/og/default.png',
  // 공개 문의·개인정보 문의 이메일(/contact/, /privacy/)
  contactEmail: 'gkstjsghk1006@gmail.com',
  // 개인정보 보호책임자 실명. /privacy/의 보호책임자 항목에만 쓴다(About·Footer·작성자 영역에는 쓰지 않음).
  // 사용자가 전달하기 전에는 비워 둔다(화면에 이름 줄을 만들지 않고 check-build가 Warning으로 알린다).
  privacyOfficerName: '김시은',
  verification: {
    google: 'pRxHqc98SrcBbNmqe6Ifnc4787W96aQXpCt096UQNN4',
    naver: 'a75a175b725039ead1e7125e7717e581a82e14a2',
    // 다음 웹마스터도구: production robots.txt 첫 줄 `#DaumWebMasterTool:{값}`(공개 값)
    daum: 'c12cf1672dfdff7d7b2d1e9ae88d96a6dde3be20ac7d93f1fa5e51035a321aa6:TjfWRIg4AvRIXkF+EGam5Q==',
  },
  adsenseClient: 'ca-pub-4083301154077390',
  ga4Id: 'G-6B72N2BV55',
} as const;
