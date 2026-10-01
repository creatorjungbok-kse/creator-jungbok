// 도구 id → 화면 컴포넌트. 글의 `tool` 값(src/tools/registry.ts의 toolIds)마다 하나씩 둔다.
import type { ToolId } from '../../tools/registry';
import ElectricityBill from './ElectricityBill.astro';
import MvnoPlanCost from './MvnoPlanCost.astro';

export const toolComponents: Record<ToolId, typeof ElectricityBill> = {
  'electricity-bill': ElectricityBill,
  'mvno-plan-cost': MvnoPlanCost,
};
