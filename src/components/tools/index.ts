// 도구 id → 화면 컴포넌트. 글의 `tool` 값(src/tools/registry.ts의 toolIds)마다 하나씩 둔다.
import type { ToolId } from '../../tools/registry';
import ElectricityBill from './ElectricityBill.astro';
import MvnoPlanCost from './MvnoPlanCost.astro';
import WeeklyHolidayPay from './WeeklyHolidayPay.astro';
import VatCalculator from './VatCalculator.astro';
import SocialInsurance from './SocialInsurance.astro';
import SeverancePay from './SeverancePay.astro';
import TaxCalendar from './TaxCalendar.astro';
import AnnualLeave from './AnnualLeave.astro';

export const toolComponents: Record<ToolId, typeof ElectricityBill> = {
  'electricity-bill': ElectricityBill,
  'mvno-plan-cost': MvnoPlanCost,
  'weekly-holiday-pay': WeeklyHolidayPay,
  'vat-calculator': VatCalculator,
  'social-insurance-calculator': SocialInsurance,
  'severance-pay': SeverancePay,
  'tax-calendar': TaxCalendar,
  'annual-leave': AnnualLeave,
};
