// 한국시간(Asia/Seoul) 날짜. 방문자 기기 시간대와 상관없이 같은 날짜를 돌려준다.
// 외부 import 없음 — 화면 스크립트·서버 렌더·node 테스트가 같은 함수를 쓴다. '지금'을 인자로 받아 테스트할 수 있다.

const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });

// 한국 날짜 YYYY-MM-DD
export function kstDate(now: Date = new Date()): string {
  const parts = Object.fromEntries(formatter.formatToParts(now).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

// 한국 연도
export const kstYear = (now: Date = new Date()): number => Number(kstDate(now).slice(0, 4));
