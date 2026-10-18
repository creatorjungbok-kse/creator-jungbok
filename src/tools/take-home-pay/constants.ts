// 실수령액 계산기 도구 설정(등록되는 도구). 계산 로직은 src/lib/payroll/take-home/(소득세)과 src/lib/social-insurance/(4대보험)에 있다.
// 설계: docs/ready/day1-2026-10-18/04-take-home-pay-calculator.md, GPT 결정(2026-10-17): 월급·연봉 2모드, 시급 제외, 과세 월급여 1,000만원 초과 제외.
// 4대보험 요율 기한을 그대로 따른다(2027년 요율 갱신 때 두 계산기가 함께 바뀐다). 소득세법 근거는 글의 localSources에 있다.
import { reviewFrom, validUntil } from '../../lib/social-insurance/rules.ts';
import { socialInsuranceCalculator } from '../social-insurance-calculator/constants';

export const takeHomePay = {
  id: 'take-home-pay',
  checkedAt: '2026-10-18',
  sourceIds: [...socialInsuranceCalculator.sourceIds],
  reviewFrom,
  reviewNote: '2027년 4대보험 요율과 근로소득 간이세액표 개정 여부 확인 후 상수 갱신',
  validUntil,
} as const;
