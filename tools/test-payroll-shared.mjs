// 급여 계열 공통 엔진(src/lib/payroll/shared) 단위 테스트. 사용: npm run test:tools
// 기대값은 손으로 계산한 정수 값이다(반올림 기대값은 '0.5원 이상 올림, 미만 내림' 규칙으로 따로 구했다).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { kstDate, kstYear } from '../src/lib/payroll/shared/korea-time.ts';
import { add, exact, isWholeWon, lessThan, roundHalfUpWon, times } from '../src/lib/payroll/shared/money.ts';
import { parseScaled, parseWonInt } from '../src/lib/payroll/shared/validation.ts';
import { belowMinimumWage, defaultYear, hasEnded, isStale, minimumWageFor, minimumWages, reviewFrom, reviewNote, validUntil } from '../src/lib/payroll/shared/minimum-wage.ts';

test('한국 날짜: 기기 시간대와 무관하게 Asia/Seoul 기준', () => {
  assert.equal(kstDate(new Date('2026-12-31T14:59:59Z')), '2026-12-31');
  assert.equal(kstDate(new Date('2026-12-31T15:00:00Z')), '2027-01-01');
  assert.equal(kstYear(new Date('2026-12-31T14:59:59Z')), 2026);
  assert.equal(kstYear(new Date('2026-12-31T15:00:00Z')), 2027);
});

test('정확값: 약분·덧셈·정수배', () => {
  assert.deepEqual(exact(206400, 10), { n: 20640, d: 1 });
  assert.deepEqual(exact(319951, 10), { n: 319951, d: 10 });
  assert.deepEqual(add(exact(1, 2), exact(1, 10)), { n: 3, d: 5 });
  assert.deepEqual(times(exact(3, 10), 4), { n: 6, d: 5 });
  assert.ok(isWholeWon(exact(41280)));
  assert.ok(!isWholeWon(exact(319951, 10)));
  assert.ok(lessThan(exact(1, 3), exact(1, 2)));
  assert.throws(() => exact(-1), RangeError);
  assert.throws(() => exact(1, 0), RangeError);
  assert.throws(() => exact(2 ** 53), RangeError);
});

test('표시 반올림: 0.5원 이상 올림·미만 내림(정수부 홀짝과 무관, 짝수 반올림 아님)', () => {
  const cases = [
    [319_954, 10, 31_995], // 31,995.4
    [319_955, 10, 31_996], // 31,995.5 (정수부 홀수)
    [319_956, 10, 31_996], // 31,995.6
    [340_724, 10, 34_072], // 34,072.4
    [340_725, 10, 34_073], // 34,072.5 (정수부 짝수 — 짝수 반올림이면 34,072)
    [340_726, 10, 34_073], // 34,072.6
    [340_725, 2, 170_363], // 170,362.5 (짝수 반올림이면 170,362)
    [319_951, 2, 159_976], // 159,975.5
    [41_280, 1, 41_280], // 원 미만 없음
    [1, 2, 1], // 0.5
    [0, 1, 0],
  ];
  for (const [n, d, expected] of cases) assert.equal(roundHalfUpWon(exact(n, d)), expected, `${n}/${d}`);
});

test('원 정수 파싱: 쉼표 허용, 실수·문자·범위 밖은 코드로', () => {
  const r = { min: 1, max: 1_000_000 };
  assert.deepEqual(parseWonInt('10,320', r), { ok: true, value: 10320 });
  assert.deepEqual(parseWonInt(' 12000 ', r), { ok: true, value: 12000 });
  assert.deepEqual(parseWonInt('1,000,000', r), { ok: true, value: 1_000_000 });
  assert.deepEqual(parseWonInt('', r), { ok: false, code: 'empty' });
  assert.deepEqual(parseWonInt('10.5', r), { ok: false, code: 'format' });
  assert.deepEqual(parseWonInt('만원', r), { ok: false, code: 'format' });
  assert.deepEqual(parseWonInt('-100', r), { ok: false, code: 'format' });
  assert.deepEqual(parseWonInt('0', r), { ok: false, code: 'range' });
  assert.deepEqual(parseWonInt('1,000,001', r), { ok: false, code: 'range' });
  assert.deepEqual(parseWonInt('9'.repeat(30), r), { ok: false, code: 'range' });
});

test('소수 한 자리 스케일 파싱: 실수 연산 없이 0.1 단위 정수, 0.5 단위·범위 검사', () => {
  const o = { decimals: 1, step: 5, min: 5, max: 400 };
  assert.deepEqual(parseScaled('17.5', o), { ok: true, value: 175 });
  assert.deepEqual(parseScaled('20', o), { ok: true, value: 200 });
  assert.deepEqual(parseScaled('0.5', o), { ok: true, value: 5 });
  assert.deepEqual(parseScaled('40', o), { ok: true, value: 400 });
  assert.deepEqual(parseScaled('39.50', o), { ok: true, value: 395 });
  assert.deepEqual(parseScaled('17.3', o), { ok: false, code: 'step' });
  assert.deepEqual(parseScaled('17.55', o), { ok: false, code: 'step' });
  assert.deepEqual(parseScaled('0', o), { ok: false, code: 'range' });
  assert.deepEqual(parseScaled('40.5', o), { ok: false, code: 'range' });
  assert.deepEqual(parseScaled('41', o), { ok: false, code: 'range' });
  assert.deepEqual(parseScaled('', o), { ok: false, code: 'empty' });
  assert.deepEqual(parseScaled('스무', o), { ok: false, code: 'format' });
  assert.deepEqual(parseScaled('1e1', o), { ok: false, code: 'format' });
  assert.deepEqual(parseScaled('.5', o), { ok: false, code: 'format' });
});

test('최저임금 상수: 최저임금위원회 결정현황 값', () => {
  assert.deepEqual(
    minimumWages.map((m) => [m.year, m.hourly, m.daily8h, m.monthly209h, m.from, m.to]),
    [
      [2026, 10_320, 82_560, 2_156_880, '2026-01-01', '2026-12-31'],
      [2027, 10_700, 85_600, 2_236_300, '2027-01-01', '2027-12-31'],
    ],
  );
  // 일급 = 시급 × 8, 월 = 시급 × 209
  for (const m of minimumWages) {
    assert.equal(m.daily8h, m.hourly * 8);
    assert.equal(m.monthly209h, m.hourly * 209);
  }
  assert.equal(reviewFrom, '2027-08-31');
  assert.equal(reviewNote, '2028년 최저임금 확인 필요');
  assert.equal(validUntil, '2027-12-31');
});

test('기본 연도·stale: 그 해 상수가 없으면 자동 선택하지 않는다', () => {
  assert.equal(defaultYear('2026-10-09'), 2026);
  assert.equal(defaultYear('2026-12-31'), 2026);
  assert.equal(defaultYear('2027-01-01'), 2027);
  assert.equal(defaultYear('2028-01-05'), null);
  assert.equal(isStale('2027-12-31'), false);
  assert.equal(isStale('2028-01-01'), true);
  assert.equal(hasEnded(2026, '2027-01-01'), true);
  assert.equal(hasEnded(2027, '2027-01-01'), false);
  assert.equal(minimumWageFor(2028), undefined);
  assert.equal(belowMinimumWage(10_000, 2026), true);
  assert.equal(belowMinimumWage(10_320, 2026), false);
  assert.equal(belowMinimumWage(10_320, 2027), true);
  assert.equal(belowMinimumWage(1, 2028), false);
});

test('hard guard: 오늘(한국 날짜) 적용되는 최저임금이 상수에 있어야 한다 — 새해에 갱신하지 않으면 실패', () => {
  const today = kstDate();
  assert.ok(!isStale(today), `${today.slice(0, 4)}년 최저임금이 src/lib/payroll/shared/minimum-wage.ts에 없음: 최저임금위원회 고시를 확인해 추가하세요`);
});
