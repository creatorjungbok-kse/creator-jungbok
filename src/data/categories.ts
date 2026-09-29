export interface Category {
  slug: string;
  name: string;
  // H1
  title: string;
  // <title> 앞부분(04-seo-rules.md 4장 패턴)
  seoTitle: string;
  description: string;
}

// 배열 순서 = 헤더·홈·푸터 표시 순서
export const categories: Category[] = [
  {
    slug: 'benefits',
    name: '지원·혜택',
    title: '지원·혜택',
    seoTitle: '지원·혜택 모아보기',
    description: '지원금, 환급, 요금 감면처럼 받을 수 있는 돈과 혜택을 공식 공고 기준으로 정리합니다.',
  },
  {
    slug: 'business',
    name: '사업·창업',
    title: '사업·창업 비용',
    seoTitle: '사업·창업 비용·정보',
    description: '창업 준비, 매장 운영, 세무·결제 등 사업에 드는 비용을 조건별로 비교합니다.',
  },
  {
    slug: 'living',
    name: '집·생활',
    title: '집·생활 비용',
    seoTitle: '집·생활 비용·정보',
    description: '이사, 청소, 수리, 인테리어 등 집과 생활에 드는 비용을 확인합니다.',
  },
  {
    slug: 'digital',
    name: '통신·디지털',
    title: '통신·디지털 비용',
    seoTitle: '통신·디지털 비용·정보',
    description: '요금제, 인터넷, 구독 서비스, 쇼핑몰 구축 등 통신·디지털 비용을 비교합니다.',
  },
];

export const categoryHref = (c: Category) => `/${c.slug}/`;

export const categoryLinks = categories.map((c) => ({ href: categoryHref(c), title: c.name }));
