// 부가세 계산기 상수(확정 문서 docs/ready/vat-calculator/{fact-table,spec}.md). 값은 법령 원문에서 확인한 것만 둔다(확인 2026-10-12).
// 외부 import 없음 — 화면 스크립트·서버 렌더·node 테스트가 같은 값을 쓴다.
// 갱신 규칙: 카드·현금영수증 발행세액공제 한시특례(부가가치세법 제46조①3호 '2026년 12월 31일까지')가 연장·변경되면
//   cardCreditByYear를 고치고 reviewFrom을 옮긴다. 새 연도를 넣을 때는 법령 원문 확인 후 연도를 추가하고 validUntil이 따라간다.
// - reviewFrom 이후: production check-build 경고(ToolShell data-review-from)
// - validUntil(마지막 연도 12월 31일) 이후: production check-build 실패, test:tools 실패, 간이과세자 모드는 그해를 자동 선택하지 않고 막힌다

// 부가가치세 세율(%) — 제30조
export const VAT_RATE_PERCENT = 10;

// 입력 범위(입력 오류 방지용 UX 제한, 법령 값 아님)
export const AMOUNT_MIN = 1;
export const AMOUNT_MAX = 100_000_000_000; // 1,000억원
export const OPTIONAL_AMOUNT_MIN = 0;

// 간이과세자 업종별 부가가치율 — 시행령 제111조② 표의 법정 구분명 그대로(자체 예시 매핑 없음)
export interface IndustryRate {
  key: string;
  label: string;
  // 부가가치율(%) 정수
  rate: number;
}
export const industryRates: readonly IndustryRate[] = [
  { key: 'retail-food', label: '소매업, 재생용 재료수집 및 판매업, 음식점업', rate: 15 },
  { key: 'manufacturing', label: '제조업, 농업·임업 및 어업, 소화물 전문 운송업', rate: 20 },
  { key: 'lodging', label: '숙박업', rate: 25 },
  { key: 'construction', label: '건설업, 운수 및 창고업(소화물 전문 운송업은 제외), 정보통신업', rate: 30 },
  {
    key: 'professional',
    label: '금융 및 보험 관련 서비스업, 전문·과학 및 기술서비스업(인물사진 및 행사용 영상 촬영업은 제외), 사업시설관리·사업지원 및 임대서비스업, 부동산 관련 서비스업, 부동산임대업',
    rate: 40,
  },
  { key: 'other-services', label: '그 밖의 서비스업', rate: 30 },
];
export const industryRateFor = (key: string): IndustryRate | undefined => industryRates.find((i) => i.key === key);

// 매입 공제: 세금계산서등을 받은 매입 공급대가 × 0.5% — 제63조③1호 (천분율)
export const PURCHASE_CREDIT_PERMILLE = 5;

// 납부의무 면제 기준: 해당 과세기간 공급대가 합계 4,800만원 '미만' — 제69조①
export const EXEMPTION_THRESHOLD = 48_000_000;

// 간이과세자 기준(안내 문구용): 직전 연도 공급대가 1억4백만원 미만 — 제61조①, 시행령 제109조①
export const SIMPLIFIED_THRESHOLD = 104_000_000;

// 신용카드매출전표·현금영수증 등 발행세액공제 — 제46조①3호
// 1%(2026.12.31까지 1.3%), 연간 한도 500만원(2026.12.31까지 1천만원)
export interface CardCreditRule {
  year: number;
  // 공제율(천분율): 13 = 1.3%
  permille: number;
  // 연간 한도(원)
  cap: number;
}
export const cardCreditByYear: readonly CardCreditRule[] = [
  { year: 2026, permille: 13, cap: 10_000_000 },
  { year: 2027, permille: 10, cap: 5_000_000 },
];
export const cardCreditFor = (year: number): CardCreditRule | undefined => cardCreditByYear.find((c) => c.year === year);
export const simplifiedYears: readonly number[] = cardCreditByYear.map((c) => c.year);

// 한시특례 연장 여부 재확인(연말 세법 개정)
export const reviewFrom = '2026-12-01';
export const reviewNote = '2027 카드·현금영수증 발행세액공제(1%·연 500만원) 한시특례 연장 여부 재확인';
// 등록된 마지막 연도의 마지막 날
export const validUntil = `${simplifiedYears[simplifiedYears.length - 1]}-12-31`;

// 오늘(한국 연도)의 간이과세자 규칙이 없다 → 간이과세자 모드만 막는다(지난 연도 규칙을 자동 적용하지 않음)
export const isSimplifiedStale = (kstYear: number): boolean => cardCreditFor(kstYear) === undefined;
