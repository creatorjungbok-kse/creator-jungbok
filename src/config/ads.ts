// 광고 슬롯 식별자(03-ad-layout.md). 실제 광고 코드는 Phase A 승인 전까지 넣지 않는다.
export const adSlots = {
  'home-1': '홈 · 많이 찾는 정보 뒤',
  'article-top': '글 · 결론·핵심 비용표 뒤',
  'article-lower': '글 · FAQ 앞',
} as const;

export type AdSlotId = keyof typeof adSlots;
