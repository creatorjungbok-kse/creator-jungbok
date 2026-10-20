// 사이트 도구(계산기·체크도구) 목록. 글의 `tool` 필드는 여기 있는 id만 쓸 수 있다.
// 도구 상수가 인용하는 출처(공통 출처 registry id)는 그 글의 출처 목록·S1 검증에 자동으로 들어간다(lib/sources.ts).
import { electricityBill } from './electricity-bill/constants';
import { weeklyHolidayPay } from './weekly-holiday-pay/constants';
import { vatCalculator } from './vat-calculator/constants';
import { socialInsuranceCalculator } from './social-insurance-calculator/constants';
import { severancePay } from './severance-pay/constants';
import { annualLeave } from './annual-leave/constants';
import { takeHomePay } from './take-home-pay/constants';
import { freelancerTax } from './freelancer-tax/constants';
import { parentalLeavePay } from './parental-leave-pay/constants';
import { savingsInterest } from './savings-interest/constants';
import { loanRepayment } from './loan-repayment/constants';

export const toolIds = ['electricity-bill', 'mvno-plan-cost', 'weekly-holiday-pay', 'vat-calculator', 'social-insurance-calculator', 'severance-pay', 'tax-calendar', 'annual-leave', 'take-home-pay', 'freelancer-tax', 'parental-leave-pay', 'savings-interest', 'loan-repayment'] as const;
export type ToolId = (typeof toolIds)[number];

// 사이드바 '계산기·도구' 목록에 쓰는 짧은 이름(도구가 들어 있는 글로 연결된다)
export const toolNames: Record<ToolId, string> = {
  'electricity-bill': '전기요금 계산기',
  'mvno-plan-cost': '알뜰폰 총비용 비교',
  'weekly-holiday-pay': '주휴수당 계산기',
  'vat-calculator': '부가세 계산기',
  'social-insurance-calculator': '4대보험 계산기',
  'severance-pay': '퇴직금 계산기',
  'tax-calendar': '사업자 세금 달력',
  'annual-leave': '연차 계산기',
  'take-home-pay': '실수령액 계산기',
  'freelancer-tax': '3.3% 계산기',
  'parental-leave-pay': '육아휴직급여 계산기',
  'savings-interest': '적금·예금 이자 계산기',
  'loan-repayment': '대출 이자·상환 계산기',
};

// 도구를 둘 수 있는 글 유형(도구마다 하나)
export const toolContentTypes: Record<ToolId, 'cost' | 'compare' | 'guide'> = {
  'electricity-bill': 'cost',
  'mvno-plan-cost': 'compare',
  'weekly-holiday-pay': 'cost',
  'vat-calculator': 'cost',
  'social-insurance-calculator': 'cost',
  'severance-pay': 'cost',
  // 일정 달력은 계산 도구가 아니라 기존 세금 글을 잇는 안내 도구
  'tax-calendar': 'guide',
  'annual-leave': 'cost',
  'take-home-pay': 'cost',
  'freelancer-tax': 'cost',
  'parental-leave-pay': 'cost',
  'savings-interest': 'cost',
  'loan-repayment': 'cost',
};

const eb = electricityBill;
export const toolSourceIds: Record<ToolId, string[]> = {
  'electricity-bill': [
    ...new Set([...eb.tariffSourceIds, ...eb.climate.sourceIds, ...eb.fuelAdjustment.sourceIds, ...eb.vatSourceIds, ...eb.fundSourceIds]),
  ],
  // 사용자가 입력한 값만 계산한다(도구 자체가 인용하는 가격·법령 없음)
  'mvno-plan-cost': [],
  'weekly-holiday-pay': [...weeklyHolidayPay.sourceIds],
  'vat-calculator': [...vatCalculator.sourceIds],
  'social-insurance-calculator': [...socialInsuranceCalculator.sourceIds],
  // 계산 근거(퇴직급여법·근로기준법·평균임금산정 특례 고시·민법)는 글의 localSources에 둔다
  'severance-pay': [...severancePay.sourceIds],
  // 일정 근거(국세청 세무일정·보도자료·부가세법·국기법·월력요항)는 글의 localSources에 둔다
  'tax-calendar': [],
  // 계산 근거(근로기준법·시행령 별표2·대법원 판결·민법)는 글의 localSources에 둔다
  'annual-leave': [...annualLeave.sourceIds],
  // 4대보험 근거는 공통 출처, 소득세법 근거(시행령 별표 2 등)는 글의 localSources에 둔다
  'take-home-pay': [...takeHomePay.sourceIds],
  // 소득세법·시행령·국고금관리법 근거는 글의 localSources에 둔다
  'freelancer-tax': [...freelancerTax.sourceIds],
  // 고용보험법·시행령·남녀고용평등법 근거는 글의 localSources에 둔다
  'parental-leave-pay': [...parentalLeavePay.sourceIds],
  // 소득세법·조특법·농특세법 근거는 글의 localSources에 둔다
  'savings-interest': [...savingsInterest.sourceIds],
  // 이자제한법·대부업법·금융소비자보호법 근거는 글의 localSources에 둔다
  'loan-repayment': [...loanRepayment.sourceIds],
};
