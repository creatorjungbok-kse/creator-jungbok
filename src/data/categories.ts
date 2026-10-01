interface Subcategory {
  slug: string;
  name: string;
}

export interface Category {
  slug: string;
  name: string;
  // H1
  title: string;
  // <title> 앞부분(04-seo-rules.md 4장 패턴)
  seoTitle: string;
  description: string;
  // 중분류(01 A-1). 글 URL에는 들어가지 않고 메타데이터로만 쓴다.
  subcategories: Subcategory[];
}

// 배열 순서 = 헤더·홈·푸터 표시 순서
export const categories: Category[] = [
  {
    slug: 'benefits',
    name: '지원·혜택',
    title: '지원·혜택',
    seoTitle: '지원·혜택 모아보기',
    description: '지원금, 환급, 요금 감면처럼 받을 수 있는 돈과 혜택을 공식 공고 기준으로 정리합니다.',
    subcategories: [
      { slug: 'grants', name: '지원금·보조금' },
      { slug: 'tax-refunds', name: '환급·세금 혜택' },
      { slug: 'bill-relief', name: '요금·생활비 감면' },
      { slug: 'housing', name: '주거 지원' },
      { slug: 'business-support', name: '소상공인·사업자 지원' },
    ],
  },
  {
    slug: 'business',
    name: '사업·창업',
    title: '사업·창업',
    seoTitle: '사업·창업 비용·정보',
    description: '사업자등록·세무 절차부터 창업과 운영에 드는 비용까지 사업에 필요한 정보를 정리합니다.',
    subcategories: [
      { slug: 'tax', name: '세무·회계' },
      { slug: 'labor', name: '노무·직원' },
      { slug: 'payment', name: '결제·POS' },
      { slug: 'website', name: '홈페이지·쇼핑몰' },
      { slug: 'marketing', name: '마케팅·광고' },
      { slug: 'operations', name: '운영·업무' },
      { slug: 'startup', name: '창업 초기비용' },
    ],
  },
  {
    slug: 'living',
    name: '집·생활',
    title: '집·생활',
    seoTitle: '집·생활 비용·정보',
    description: '공과금처럼 집과 생활에 드는 비용과 알아두면 좋은 정보를 정리합니다.',
    subcategories: [
      { slug: 'moving', name: '이사' },
      { slug: 'cleaning', name: '청소' },
      { slug: 'repair', name: '수리' },
      { slug: 'interior', name: '인테리어' },
      { slug: 'install', name: '설치·교체' },
      { slug: 'rental', name: '렌탈' },
      { slug: 'services', name: '생활 서비스' },
      { slug: 'utilities', name: '공과금' },
    ],
  },
  {
    slug: 'digital',
    name: '통신·디지털',
    title: '통신·디지털',
    seoTitle: '통신·디지털 비용·정보',
    description: '휴대폰 요금제처럼 통신·디지털 생활에 드는 비용과 정보를 정리합니다.',
    subcategories: [
      { slug: 'internet', name: '인터넷' },
      { slug: 'mobile', name: '휴대폰·알뜰폰' },
      { slug: 'ai', name: 'AI 서비스' },
      { slug: 'cloud', name: '클라우드' },
      { slug: 'software', name: '소프트웨어' },
      { slug: 'subscription', name: '구독 서비스' },
      { slug: 'hosting', name: '도메인·호스팅' },
    ],
  },
];

export const categoryHref = (c: Category) => `/${c.slug}/`;

