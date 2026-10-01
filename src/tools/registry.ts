// 사이트 도구(계산기·체크도구) 목록. 글의 `tool` 필드는 여기 있는 id만 쓸 수 있다.
// 도구 상수가 인용하는 출처(공통 출처 registry id)는 그 글의 출처 목록·S1 검증에 자동으로 들어간다(lib/sources.ts).
import { electricityBill } from './electricity-bill/constants';

export const toolIds = ['electricity-bill', 'mvno-plan-cost'] as const;
export type ToolId = (typeof toolIds)[number];

// 도구를 둘 수 있는 글 유형(도구마다 하나)
export const toolContentTypes: Record<ToolId, 'cost' | 'compare'> = {
  'electricity-bill': 'cost',
  'mvno-plan-cost': 'compare',
};

const eb = electricityBill;
export const toolSourceIds: Record<ToolId, string[]> = {
  'electricity-bill': [
    ...new Set([...eb.tariffSourceIds, ...eb.climate.sourceIds, ...eb.fuelAdjustment.sourceIds, ...eb.vatSourceIds, ...eb.fundSourceIds]),
  ],
  // 사용자가 입력한 값만 계산한다(도구 자체가 인용하는 가격·법령 없음)
  'mvno-plan-cost': [],
};
