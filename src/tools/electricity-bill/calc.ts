// 전기요금 계산(순수 함수). 외부 import 없음 — 화면 스크립트·서버 렌더·node 테스트가 같은 함수를 쓴다.
import type { ElectricityBillConstants, Season } from './constants';

export interface ElectricityBill {
  basic: number;
  energy: number;
  climate: number;
  fuelAdjustment: number;
  subtotal: number;
  vat: number;
  fund: number;
  total: number;
}

// 비율(0.1, 0.027)을 1,000분율 정수로 바꿔 정수 연산만 한다
const perMille = (rate: number) => Math.round(rate * 1000);

export function calcElectricityBill(kWh: number, season: Season, c: ElectricityBillConstants): ElectricityBill {
  const tiers = c.seasons[season].tiers;
  // 기본요금: 총 사용량이 든 구간의 기본요금 1회
  const basic = tiers.find((t) => t.upTo === null || kWh <= t.upTo)!.basic;
  // 전력량요금: 구간별 사용량 × 단가 합계(0.1원 단위) → 원 미만 절사
  let energy10 = 0;
  let prev = 0;
  for (const t of tiers) {
    const top = t.upTo === null ? kWh : Math.min(kWh, t.upTo);
    if (top > prev) energy10 += (top - prev) * t.rate10;
    if (t.upTo === null || kWh <= t.upTo) break;
    prev = t.upTo;
  }
  const energy = Math.floor(energy10 / 10);
  const climate = Math.floor((kWh * c.climate.rate10) / 10);
  const fuelAdjustment = Math.floor((kWh * c.fuelAdjustment.rate10) / 10);
  const subtotal = basic + energy + climate + fuelAdjustment;
  // 부가가치세: 원 미만 4사5입
  const vat = Math.floor((2 * subtotal * perMille(c.vatRate) + 1000) / 2000);
  // 전력산업기반기금: 10원 미만 절사
  const fund = Math.floor((subtotal * perMille(c.fundRate)) / 10000) * 10;
  // 청구금액: 10원 미만 절사
  const total = Math.floor((subtotal + vat + fund) / 10) * 10;
  return { basic, energy, climate, fuelAdjustment, subtotal, vat, fund, total };
}

// 입력 검증: 공백 제거 후 숫자만, 정수, 범위 안
export type KwhInput = { ok: true; value: number } | { ok: false; error: string };
export function parseKwh(raw: string, c: Pick<ElectricityBillConstants, 'minKwh' | 'maxKwh'>): KwhInput {
  const s = raw.trim().replace(/,/g, '');
  const range = `${c.minKwh}~${c.maxKwh.toLocaleString('ko-KR')}kWh 사이의 정수로 입력하세요.`;
  if (s === '') return { ok: false, error: `월 사용량을 입력하세요. ${range}` };
  if (!/^\d+$/.test(s)) return { ok: false, error: range };
  const value = Number(s);
  if (value < c.minKwh || value > c.maxKwh) return { ok: false, error: range };
  return { ok: true, value };
}

// 기간이 있는 상수 중 가장 먼저 끝나는 날(YYYY-MM-DD)
export const validUntil = (c: ElectricityBillConstants) => c.fuelAdjustment.effectiveTo;

// ── 화면 표시(서버 렌더와 브라우저 스크립트가 같은 함수를 쓴다) ──
export const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;
// 0.1원 단위 정수 → '120.0원'
export const perKwh = (rate10: number) => `${(rate10 / 10).toFixed(1)}원`;
// 비율 → '10%', '2.7%'
export const percent = (rate: number) => `${perMille(rate) / 10}%`;
// 누진 구간 이름: '200kWh 이하' / '201~400kWh' / '400kWh 초과'
export function tierLabels(tiers: readonly { upTo: number | null }[]): string[] {
  return tiers.map((t, i) => {
    const prev = i === 0 ? 0 : tiers[i - 1].upTo!;
    if (t.upTo === null) return `${prev.toLocaleString('ko-KR')}kWh 초과`;
    return i === 0 ? `${t.upTo.toLocaleString('ko-KR')}kWh 이하` : `${(prev + 1).toLocaleString('ko-KR')}~${t.upTo.toLocaleString('ko-KR')}kWh`;
  });
}
