// dev 전용 셸 미리보기 데이터. 실제 콘텐츠가 아니며 production build에 쓰이지 않는다.
// 실제 콘텐츠가 들어와 실제 페이지에서 부품을 확인할 수 있게 되면(P5·P6) 이 파일과 src/pages/dev/는 삭제한다.
import type { CollectionEntry } from 'astro:content';
import type { Props as HomeProps } from '../components/HomeView.astro';

const link = (title: string, meta?: string) => ({ href: '#', title, meta });

// 비율 확인용 중립 이미지(인라인 SVG). 파일로 저장하지 않는다.
const placeholder = {
  src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3Crect width='16' height='9' fill='%23e2e6eb'/%3E%3C/svg%3E",
  alt: '',
};

export const homeFixture: HomeProps = {
  featured: [
    { href: '#', title: '예시 · 개업 전 꼭 계산해야 할 초기 비용 총정리', category: '사업·창업', excerpt: '보증금, 인테리어, 설비, 결제 단말기까지 항목별 가격 범위와 줄이는 방법을 한 번에 정리합니다.', meta: ['2026.09.28'], image: placeholder },
    { href: '#', title: '예시 · 이사 비용, 포장이사와 반포장 차이', category: '집·생활', meta: ['2026.09.27'], image: placeholder },
    { href: '#', title: '예시 · 올해 받을 수 있는 정부 혜택 확인하는 법', category: '지원·혜택', meta: ['2026.09.26'], image: placeholder },
  ],
  benefits: [
    { href: '#', title: '예시 지원금 A — 소상공인 전기요금 지원', status: 'open', excerpt: '대상: 연 매출 기준 충족 소상공인 · 혜택: 최대 20만 원', meta: ['마감 2026.10.31', 'D-32'] },
    { href: '#', title: '예시 지원금 B — 청년 월세 지원', status: 'closing-soon', excerpt: '대상: 무주택 청년 · 혜택: 월 최대 20만 원', meta: ['마감 2026.10.05', 'D-6'] },
  ],
  costs: [
    { href: '#', title: '예시 · 카드단말기 설치 비용', category: '사업·창업', excerpt: '구매·임대·무선 단말기 조건별 가격 범위', meta: ['조사 기준 2026.09', 'VAT 별도'] },
    { href: '#', title: '예시 · 입주청소 비용', category: '집·생활', excerpt: '평형·오염도에 따라 달라지는 가격 범위', meta: ['조사 기준 2026.09'] },
    { href: '#', title: '예시 · 세무사 기장료', category: '사업·창업', excerpt: '개인·법인, 매출 규모별 월 기장료 범위', meta: ['조사 기준 2026.09'] },
    { href: '#', title: '예시 · 알뜰폰 요금제 비교', category: '통신·디지털', excerpt: '데이터 용량별 월 요금 범위', meta: ['조사 기준 2026.09'] },
  ],
  trending: [link('예시 · 근로장려금 신청 방법'), link('예시 · 이사 비용 줄이는 방법'), link('예시 · 쇼핑몰 제작 비용')],
  byCategory: {
    benefits: [link('예시 · 받을 수 있는 정부 혜택 확인하는 법'), link('예시 · 에너지바우처')],
    business: [link('예시 · 카드단말기 설치 비용'), link('예시 · 세무사 기장료'), link('예시 · 간판 제작 비용')],
    living: [link('예시 · 입주청소 비용'), link('예시 · 도배 비용')],
    digital: [link('예시 · 카페24 vs 아임웹'), link('예시 · 알뜰폰 요금제 비교')],
  },
  recent: [
    { href: '#', title: '예시 · 간판 제작 비용, 재질별로 얼마나 다를까', category: '사업·창업', excerpt: '실사·채널·LED 간판의 가격 범위와 추가 비용을 정리합니다.', meta: ['2026.09.28'], image: placeholder },
    { href: '#', title: '예시 · 도배 비용, 평형과 벽지 종류별 정리', category: '집·생활', excerpt: '합지·실크 벽지와 시공 범위에 따른 비용 차이를 확인합니다.', meta: ['2026.09.27'], image: placeholder },
    { href: '#', title: '예시 · 에너지바우처 신청 방법과 대상', category: '지원·혜택', excerpt: '공식 공고 기준 대상, 지원 금액, 신청 기간을 정리합니다.', meta: ['2026.09.26'] },
  ],
  popular: [link('예시 · 입주청소 비용', '집·생활'), link('예시 · 카드단말기 설치 비용', '사업·창업'), link('예시 · 근로장려금 신청', '지원·혜택'), link('예시 · 알뜰폰 요금제 비교', '통신·디지털')],
  updates: [
    { href: '#', title: '예시 · 세무사 기장료 가격 재조사', date: '2026-09-28' },
    { href: '#', title: '예시 · 청년 월세 지원 마감일 확인', date: '2026-09-27' },
    { href: '#', title: '예시 · 이사 비용 추가 비용 항목 보강', date: '2026-09-25' },
  ],
  benefitLinks: [link('예시 · 지금 신청 가능한 지원'), link('예시 · 곧 시작하는 지원'), link('예시 · 혜택 확인 방법')],
};

export const articleFixture = {
  title: '예시 · 카드단말기 설치 비용, 조건별로 얼마나 들까',
  description: 'dev 전용 글 셸 미리보기',
  updated: '2026-09-29',
  headings: [
    { id: 'summary', text: '결론부터' },
    { id: 'range', text: '가격 범위' },
    { id: 'why', text: '가격이 달라지는 이유' },
    { id: 'extra', text: '추가 비용' },
    { id: 'checklist', text: '선택 체크리스트' },
    { id: 'faq', text: '자주 묻는 질문' },
  ],
  sameTopic: [link('예시 · 포스기 구매 비용'), link('예시 · 카드 수수료 비교'), link('예시 · 무선 단말기 임대')],
  guides: [link('예시 · 개업 전 준비 비용 체크리스트'), link('예시 · 사업자등록 방법')],
  related: [
    { href: '#', title: '예시 · 포스기 구매 비용', category: '사업·창업', meta: ['조사 기준 2026.09'] },
    { href: '#', title: '예시 · 간판 제작 비용', category: '사업·창업', meta: ['조사 기준 2026.09'] },
    { href: '#', title: '예시 · 매장 인테리어 비용', category: '사업·창업', meta: ['조사 기준 2026.09'] },
  ],
};

// ── P4 부품 미리보기 ──────────────────────────────────

type Benefit = CollectionEntry<'benefits'>['data'];
type Program = Benefit['program'];
type PriceItem = NonNullable<CollectionEntry<'articles'>['data']['priceItems']>[number];

// 한국 날짜 기준 오늘 + n일(콘텐츠 날짜와 같은 UTC 자정 형식)
const seoulToday = Date.parse(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date()));
const day = (n: number) => new Date(seoulToday + n * 86_400_000);

const program = (application: Omit<Program['application'], 'officialUrl'>, extra: Partial<Program> = {}): Program => ({
  officialName: '예시 지원사업',
  operator: '예시 기관',
  programType: 'one-off',
  region: '전국',
  eligibility: [{ text: '예시 조건', sourceId: 'gov24' }],
  benefit: { kind: 'cash', text: '최대 20만 원(예시)', sourceId: 'gov24' },
  application: { officialUrl: 'https://www.gov.kr/', ...application },
  lastStatusCheckedAt: day(-1),
  officialSourceIds: ['gov24'],
  ...extra,
});

export const componentFixture = {
  summary: '예시 요약입니다. 실제 글에서는 조사된 가격 범위, 가장 큰 변수, 자주 붙는 추가 비용을 두세 문장으로 먼저 알려 줍니다.',
  researchedAt: day(-3),
  priceItems: [
    { label: '범위', min: 100000, max: 200000, unit: '원', vat: 'excluded', sourceIds: [], confidence: 'L2' },
    { label: '정확한 가격', min: 150000, max: 150000, unit: '원', vat: 'included', sourceIds: [], confidence: 'L1' },
    { label: '최소값만', min: 30000, unit: '원', per: '월', vat: 'unknown', sourceIds: [], confidence: 'L2', region: '수도권' },
    { label: '최대값만', max: 2.5, unit: '%', sourceIds: [], confidence: 'L1', condition: '카드 매출 규모와 업종, 단말기 약정 기간에 따라 달라지는 긴 조건 설명 예시' },
    { label: '숫자 없는 가격', text: '무료(설치 상담)', unit: '원', sourceIds: [] },
  ] satisfies PriceItem[],
  benefits: [
    ['신청 예정(시작 5일 전)', program({ mode: 'period', start: day(5), end: day(40) })],
    ['신청 가능', program({ mode: 'period', start: day(-10), end: day(30) })],
    ['마감 임박(D-6)', program({ mode: 'period', start: day(-10), end: day(6) })],
    ['오늘 마감', program({ mode: 'period', start: day(-10), end: day(0) })],
    ['신청 종료', program({ mode: 'period', start: day(-40), end: day(-1) })],
    ['조기 마감(override)', program({ mode: 'period', start: day(-10), end: day(20) }, { statusOverride: { value: 'closed', reason: '예산 소진으로 조기 마감되었습니다(예시).', sourceId: 'gov24' } })],
    ['상시 신청', program({ mode: 'rolling' })],
    ['예산 소진 시까지', program({ mode: 'until-budget', start: day(-5) })],
  ] satisfies [string, Program][],
  audience: ['low-income', 'household'] satisfies Benefit['audience'],
  sourceData: {
    sourceIds: ['gov24'],
    localSources: [
      { id: 'local:vendor-a', title: '예시 업체 가격표', publisher: '예시 업체', url: 'https://example.com/price', level: 'S2' as const, checkedAt: day(-3) },
      { id: 'local:unused', title: '인용되지 않은 출처(표시되면 안 됨)', publisher: '예시', url: 'https://example.com/unused', level: 'S4' as const, checkedAt: day(-3) },
    ],
    priceItems: [{ sourceIds: ['local:vendor-a', 'nts'] }],
  },
};
