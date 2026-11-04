// 중도상환수수료 계산기 엔진. 순수 함수, 정수(BigInt) 연산만 쓴다.
// 은행 공통 산식(KB국민은행·삼성화재 안내): 중도상환수수료 = 수수료 대상 금액 × 수수료율 × (남은 일수 ÷ 부과기간 일수).
//   부과기간 = 대출 실행일부터 3년(대출기간이 3년보다 짧으면 대출기간). 부과기간이 끝난 뒤 갚으면 0원.
//   수수료 대상 금액 = 중도상환금액 − 수수료 없이 갚을 수 있는 금액(면제 한도, 0 이상).
//   원 미만은 버린다. 일수는 달력 날짜 차이(윤년 포함)로 센다. 금융회사마다 1,095일 고정, 절사 방식이 달라 몇 원 차이가 날 수 있다.

export const LIMITS = {
  minAmount: 1,
  maxAmount: 10_000_000_000, // 100억원
  minRateBp: 0,
  maxRateBp: 300, // 3.00%(수수료율 × 100)
  minMonths: 1,
  maxMonths: 600, // 50년
  feeMonths: 36, // 부과기간 상한 3년(금융소비자보호법 제20조)
} as const;

export interface FeeInput {
  amount: number; // 중도상환금액(원)
  freeAmount: number; // 수수료 없이 갚을 수 있는 금액(원, 없으면 0)
  rateBp: number; // 수수료율 × 100 (예: 0.56% → 56)
  start: string; // 대출 실행일 YYYY-MM-DD
  repay: string; // 상환 예정일 YYYY-MM-DD
  loanMonths: number; // 대출기간(개월)
}

export interface FeeResult {
  fee: number;
  base: number; // 수수료 대상 금액
  remainDays: number; // 부과기간 남은 일수
  totalDays: number; // 부과기간 전체 일수
  feeEnd: string; // 부과기간이 끝나는 날(이날부터 수수료 없음)
  expired: boolean; // 부과기간이 지나 수수료 없음
}

export type FeeError = 'amount-invalid' | 'free-invalid' | 'rate-invalid' | 'months-invalid' | 'date-invalid' | 'repay-before-start';

const DAY = 86_400_000;
const parseDate = (s: string): number | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = Date.UTC(y, mo - 1, d);
  const dt = new Date(t);
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return t;
};
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

// 실행일에 n개월을 더한 날. 말일 보정: 1월 31일 + 1개월 = 2월 말일
export function addMonths(start: string, n: number): string {
  const t = parseDate(start);
  if (t === null) throw new Error('date');
  const d = new Date(t);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + n;
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return iso(Date.UTC(y, m, Math.min(d.getUTCDate(), last)));
}

export function calcFee(x: FeeInput): { ok: true; result: FeeResult } | { ok: false; error: FeeError } {
  if (!Number.isSafeInteger(x.amount) || x.amount < LIMITS.minAmount || x.amount > LIMITS.maxAmount) return { ok: false, error: 'amount-invalid' };
  if (!Number.isSafeInteger(x.freeAmount) || x.freeAmount < 0 || x.freeAmount > LIMITS.maxAmount) return { ok: false, error: 'free-invalid' };
  if (!Number.isInteger(x.rateBp) || x.rateBp < LIMITS.minRateBp || x.rateBp > LIMITS.maxRateBp) return { ok: false, error: 'rate-invalid' };
  if (!Number.isInteger(x.loanMonths) || x.loanMonths < LIMITS.minMonths || x.loanMonths > LIMITS.maxMonths) return { ok: false, error: 'months-invalid' };
  const s = parseDate(x.start);
  const r = parseDate(x.repay);
  if (s === null || r === null) return { ok: false, error: 'date-invalid' };
  if (r < s) return { ok: false, error: 'repay-before-start' };
  const feeEnd = addMonths(x.start, Math.min(LIMITS.feeMonths, x.loanMonths));
  const e = parseDate(feeEnd)!;
  const totalDays = Math.round((e - s) / DAY);
  const remainDays = Math.max(0, Math.round((e - r) / DAY));
  const base = Math.max(0, x.amount - x.freeAmount);
  const expired = remainDays === 0;
  const fee = expired ? 0 : Number((BigInt(base) * BigInt(x.rateBp) * BigInt(remainDays)) / (10_000n * BigInt(totalDays)));
  return { ok: true, result: { fee, base, remainDays, totalDays, feeEnd, expired } };
}

// '0.56', '0.56%', '1.2' → 56, 120. 소수 둘째 자리까지
export function parseFeeRateBp(raw: string): number | null {
  const v = raw.trim().replace(/%$/, '').trim();
  const m = /^(\d)(?:\.(\d{1,2}))?$/.exec(v);
  if (!m) return null;
  return Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0'));
}
