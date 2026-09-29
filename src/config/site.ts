// 사이트 전역 설정. 사이트 URL은 astro.config.mjs의 `site`에서만 관리한다.
export const site = {
  // 브랜드명 확정 전 임시 표기(P11에서 교체)
  name: 'creatorjungbok',
  tagline: '한국에서 돈을 쓰고, 아끼고, 받을 때 필요한 정보',
  description:
    '비용·비교·지원금 정보를 공식 출처 기준으로 정리합니다. 얼마 드는지, 어떻게 아끼는지, 무엇을 받을 수 있는지 빠르게 확인하세요.',
  lang: 'ko',
  verification: {
    google: 'pRxHqc98SrcBbNmqe6Ifnc4787W96aQXpCt096UQNN4',
    naver: 'a75a175b725039ead1e7125e7717e581a82e14a2',
  },
  adsenseClient: 'ca-pub-4083301154077390',
  ga4Id: 'G-6B72N2BV55',
} as const;
