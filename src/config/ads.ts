// 광고 설정 단일 출처(03-ad-layout.md). false면 모든 환경에서 광고 슬롯을 출력하지 않는다(빈 공간·CLS 없음).
// 광고 스크립트(AdSense)·광고 단위 코드는 아직 없다. 켜는 것은 AdSense 승인·운영 결정 이후 별도 단계에서 한다.
export const adsEnabled: boolean = false;

// 수동 슬롯 위치(03 3~6장). Phase A는 보수적으로 이 5곳만. 검색·정책·404 광고 없음
export type AdSlotId = 'home-1' | 'article-top' | 'article-mid' | 'article-lower' | 'benefit-mid';
