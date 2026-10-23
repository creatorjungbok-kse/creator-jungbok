// 국민연금 수령나이 계산기 v1 — 설계(GPT 10/23 조건부 승인). 판정은 여기에만 있고 화면은 그리기만 한다.
// 외부 import 없음 — 화면 스크립트·node 테스트가 같은 함수를 쓴다.
// 근거
//   노령연금: 가입기간 10년 이상, 60세(국민연금법 제61조①) + 출생연도별 가산(법률 제8541호 부칙 제8조)
//     1952년 이전 60 / 1953~56 61 / 1957~60 62 / 1961~64 63 / 1965~68 64 / 1969 이후 65
//   조기: 최대 5년 일찍, 1년마다 6%씩 감액(70·76·82·88·94%, 제63조②). 실제 청구가 늦으면 1개월마다 0.5%p 더함
//   연기: 최대 5년, 1개월 0.6%(1년 7.2%) 가산(제62조), 전부 또는 일부(50~90%) 연기 가능
//   지급: 사유가 생긴 날이 속하는 달의 다음 달부터, 매월 25일(제54조)
//   첫 지급월은 '생일 다음 달'을 예시로 보여 주고, 1일생은 생일이 속한 달일 수 있어 단정하지 않는다(GPT 결정)

const DAY_MS = 86_400_000;

export function parseYmd(s: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = Date.UTC(y, mo - 1, d);
  const back = new Date(t);
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d) return null;
  return t / DAY_MS;
}

const seoulFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });
export function seoulTodayDay(now: Date = new Date()): number {
  const p = Object.fromEntries(seoulFormatter.formatToParts(now).map((x) => [x.type, x.value]));
  return parseYmd(`${p.year}-${p.month}-${p.day}`)!;
}

const parts = (day: number) => {
  const d = new Date(day * DAY_MS);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() };
};

// 출생연도별 정상 수령 나이
export function normalAge(birthYear: number): number {
  if (birthYear <= 1952) return 60;
  if (birthYear <= 1956) return 61;
  if (birthYear <= 1960) return 62;
  if (birthYear <= 1964) return 63;
  if (birthYear <= 1968) return 64;
  return 65;
}

export const EARLY_MAX_YEARS = 5;
export const DEFER_MAX_YEARS = 5;
export const earlyRate = (yearsEarly: number): number => 100 - 6 * yearsEarly; // %
export const deferBonus = (yearsLater: number): number => Math.round(7.2 * yearsLater * 10) / 10; // %

export interface YearMonth {
  y: number;
  m: number;
}
const addMonths = (ym: YearMonth, n: number): YearMonth => {
  const t = ym.y * 12 + (ym.m - 1) + n;
  return { y: Math.floor(t / 12), m: (t % 12) + 1 };
};
export const ymLabel = (ym: YearMonth): string => `${ym.y}년 ${ym.m}월`;

// 그 나이가 되는 해의 생일이 있는 달
export const birthdayMonth = (birth: number, age: number): YearMonth => {
  const p = parts(birth);
  return { y: p.y + age, m: p.m };
};
// 첫 지급월 예시: 생일 다음 달
export const firstPayExample = (birth: number, age: number): YearMonth => addMonths(birthdayMonth(birth, age), 1);
export const isFirstOfMonth = (birth: number): boolean => parts(birth).d === 1;

export interface Row {
  age: number;
  start: YearMonth; // 그 나이에 바로 신청할 때의 첫 지급월 예시
  percent: number; // 받는 비율(조기) 또는 더해지는 비율(연기)
}

export interface Result {
  birthYear: number;
  normalAge: number;
  normalStart: YearMonth;
  firstOfMonth: boolean;
  early: Row[]; // 5년 일찍부터 1년 일찍까지
  defer: Row[]; // 1년부터 5년 늦게까지
  // 오늘 기준: 정상 수령 나이 생일까지 남은 개월 수(이미 지났으면 null)
  monthsToNormal: number | null;
}

// 정상 수령 나이가 되는 생일 날짜(2월 29일생은 평년에 3월 1일로 계산)
export const birthdayDay = (birth: number, age: number): number => {
  const b = parts(birth);
  return Date.UTC(b.y + age, b.m - 1, b.d) / DAY_MS;
};

// 그 생일까지 남은 개월 수(일 단위는 버림). 이미 지났거나 오늘이면 null
function monthsUntil(today: number, birth: number, age: number): number | null {
  const target = birthdayDay(birth, age);
  if (target <= today) return null;
  const t = parts(today);
  const g = parts(target);
  let months = (g.y - t.y) * 12 + (g.m - t.m);
  if (g.d < t.d) months -= 1;
  return months;
}

export function calculate(birth: number, today: number): Result {
  const birthYear = parts(birth).y;
  const age = normalAge(birthYear);
  const early: Row[] = [];
  for (let k = EARLY_MAX_YEARS; k >= 1; k--) early.push({ age: age - k, start: firstPayExample(birth, age - k), percent: earlyRate(k) });
  const defer: Row[] = [];
  for (let k = 1; k <= DEFER_MAX_YEARS; k++) defer.push({ age: age + k, start: firstPayExample(birth, age + k), percent: deferBonus(k) });
  return {
    birthYear,
    normalAge: age,
    normalStart: firstPayExample(birth, age),
    firstOfMonth: isFirstOfMonth(birth),
    early,
    defer,
    monthsToNormal: monthsUntil(today, birth, age),
  };
}

export const MIN_BIRTH = parseYmd('1930-01-01')!;
export type InputError = 'empty' | 'range';
export function validate(birth: number | null, today: number): InputError | null {
  if (birth === null) return 'empty';
  if (birth < MIN_BIRTH || birth > today) return 'range';
  return null;
}

export function remainLabel(months: number | null): string {
  if (months === null) return '이미 정상 수령 나이가 되었습니다';
  if (months === 0) return '정상 수령 나이까지 1개월이 안 남았습니다';
  const y = Math.floor(months / 12);
  const m = months % 12;
  return `정상 수령 나이까지 ${[y ? `${y}년` : '', m ? `${m}개월` : ''].filter(Boolean).join(' ')} 남았습니다`;
}
