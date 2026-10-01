// 전기요금 계산기 상수(주택용 저압 일반가구). 요금표·계산·출처의 유일한 출처 — 화면의 요금표도 이 값으로 그린다.
// 단가는 0.1원 단위 정수(rate10: 120.0원 → 1200)로 두어 부동소수 오차 없이 계산한다.
// 갱신 규칙: 분기별로 바뀌는 값(연료비조정요금)은 effectiveFrom·effectiveTo·checkedAt을 반드시 둔다.
// production check-build가 effectiveTo 14일 전부터 Warning, 지나면 Fail로 막는다.
// 단가가 소수로 바뀌면(예: 7.3원) 끝수 규칙을 공식 기준으로 다시 확인한 뒤 바꾼다(지금 규칙을 추측해 일반화하지 않는다).
// 끝수 처리(전력량요금 원 미만 절사, 부가세 원 미만 4사5입, 기금 10원 미만 절사, 청구액 10원 미만 절사)는
// 한국전력 계산기 안내의 처리 방식과 기본공급약관 제7조(10원 미만 끝수)를 따른다. 그 계산기 안내의 기금률 3.7%는 옛 값이라 쓰지 않는다.

export interface Tier {
  // 이 구간의 상한 kWh(마지막 구간은 null)
  upTo: number | null;
  // 총 사용량이 이 구간에 들면 한 번 적용하는 기본요금(원)
  basic: number;
  // 이 구간 사용분 전력량요금(0.1원/kWh)
  rate10: number;
}

export const electricityBill = {
  id: 'kepco-residential-low-2026q4',
  appliesTo: '주택용 저압 일반가구',
  checkedAt: '2026-10-01',
  // 사용량 입력 범위(v1): 1,000kWh 초과는 계산하지 않는다
  minKwh: 1,
  maxKwh: 1000,
  seasons: {
    other: {
      label: '그 외',
      period: '7~8월이 아닌 기간',
      tiers: [
        { upTo: 200, basic: 910, rate10: 1200 },
        { upTo: 400, basic: 1600, rate10: 2146 },
        { upTo: null, basic: 7300, rate10: 3073 },
      ] as Tier[],
    },
    summer: {
      label: '7~8월',
      period: '하계(7월 1일~8월 31일)',
      tiers: [
        { upTo: 300, basic: 910, rate10: 1200 },
        { upTo: 450, basic: 1600, rate10: 2146 },
        { upTo: null, basic: 7300, rate10: 3073 },
      ] as Tier[],
    },
  },
  tariffSourceIds: ['easylaw-residential-tariff', 'kepco-supply-terms'],
  // 기후환경요금: 월 사용량 × 단가
  climate: { rate10: 90, checkedAt: '2026-10-01', sourceIds: ['kepco-climate-charge'] },
  // 연료비조정요금: 월 사용전력량 × 연료비조정단가(분기별)
  fuelAdjustment: {
    rate10: 50,
    effectiveFrom: '2026-10-01',
    effectiveTo: '2026-12-31',
    checkedAt: '2026-10-01',
    sourceIds: ['kepco-fuel-adjustment-2026q4'],
  },
  // 부가가치세 10%(부가가치세법 제30조)
  vatRate: 0.1,
  vatSourceIds: ['law-vat-rate'],
  // 전력산업기반기금 2.7%(전기사업법 시행령 제36조: 전기요금의 1,000분의 27)
  fundRate: 0.027,
  fundSourceIds: ['law-electricity-fund'],
} as const;

export type ElectricityBillConstants = typeof electricityBill;
export type Season = keyof ElectricityBillConstants['seasons'];
