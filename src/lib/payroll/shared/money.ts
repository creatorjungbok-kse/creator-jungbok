// 정확한 금액(정수 분자·분모). JavaScript 부동소수점을 쓰지 않는다.
// 이 모듈에는 기본 반올림이 없다. 끝수 처리는 이름으로 규칙이 드러나는 함수를 호출하는 쪽이 고른다.
// 외부 import 없음 — 화면 스크립트·서버 렌더·node 테스트가 같은 함수를 쓴다.

// 값 = n / d (n ≥ 0 정수, d > 0 정수, 약분된 상태)
export interface Exact {
  readonly n: number;
  readonly d: number;
}

const assertSafe = (x: number, what: string) => {
  if (!Number.isSafeInteger(x)) throw new RangeError(`정수 안전 범위를 벗어난 ${what}: ${x}`);
};

const gcd = (a: number, b: number): number => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x || 1;
};

export function exact(n: number, d = 1): Exact {
  assertSafe(n, '분자');
  assertSafe(d, '분모');
  if (n < 0) throw new RangeError(`음수 금액은 다루지 않는다: ${n}`);
  if (d <= 0) throw new RangeError(`분모는 양수: ${d}`);
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}

export const add = (a: Exact, b: Exact): Exact => exact(a.n * b.d + b.n * a.d, a.d * b.d);

// 정수 배
export const times = (a: Exact, k: number): Exact => exact(a.n * k, a.d);

// 원 미만이 없는가
export const isWholeWon = (a: Exact): boolean => a.n % a.d === 0;

// 표시용 반올림: 원 미만이 0.5원 이상이면 다음 원으로 올리고, 0.5원 미만이면 내린다.
// 정수 연산 floor((2n + d) / 2d) — 언어 기본 반올림(짝수 반올림·toFixed)을 쓰지 않는다. 내부값은 바꾸지 않는다.
export function roundHalfUpWon(a: Exact): number {
  const num = 2 * a.n + a.d;
  const den = 2 * a.d;
  assertSafe(num, '반올림 중간값');
  return (num - (num % den)) / den;
}

// 비교: a < b
export const lessThan = (a: Exact, b: Exact): boolean => a.n * b.d < b.n * a.d;
