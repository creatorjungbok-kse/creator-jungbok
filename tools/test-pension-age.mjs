// 국민연금 수령나이 계산기 v1 테스트(GPT 10/23 조건부 승인 설계). 사용: npm run test:tools
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculate, deferBonus, earlyRate, firstPayExample, isFirstOfMonth, normalAge, parseYmd, remainLabel, validate, ymLabel } from '../src/lib/pension-age/pension-age.ts';

const d = (s) => {
  const v = parseYmd(s);
  assert.notEqual(v, null, s);
  return v;
};
const TODAY = d('2026-10-23');

test('출생연도 경계: 1952/1953, 1956/1957, 1960/1961, 1964/1965, 1968/1969', () => {
  const cases = [
    [1945, 60], [1952, 60], [1953, 61], [1956, 61], [1957, 62], [1960, 62],
    [1961, 63], [1964, 63], [1965, 64], [1968, 64], [1969, 65], [1990, 65],
  ];
  for (const [y, age] of cases) assert.equal(normalAge(y), age, String(y));
});

test('조기 감액·연기 가산 비율', () => {
  assert.deepEqual([5, 4, 3, 2, 1].map(earlyRate), [70, 76, 82, 88, 94]);
  assert.deepEqual([1, 2, 3, 4, 5].map(deferBonus), [7.2, 14.4, 21.6, 28.8, 36]);
});

test('1969년 이후: 65세, 조기 60~64세, 연기 66~70세', () => {
  const r = calculate(d('1970-05-15'), TODAY);
  assert.equal(r.normalAge, 65);
  assert.equal(ymLabel(r.normalStart), '2035년 6월');
  assert.deepEqual(r.early.map((x) => [x.age, x.percent, ymLabel(x.start)]), [
    [60, 70, '2030년 6월'], [61, 76, '2031년 6월'], [62, 82, '2032년 6월'], [63, 88, '2033년 6월'], [64, 94, '2034년 6월'],
  ]);
  assert.deepEqual(r.defer.map((x) => [x.age, x.percent]), [[66, 7.2], [67, 14.4], [68, 21.6], [69, 28.8], [70, 36]]);
  assert.equal(r.firstOfMonth, false);
});

test('첫 지급월 예시: 12월생은 다음 해 1월, 1일생은 표시(단정하지 않음)', () => {
  assert.equal(ymLabel(firstPayExample(d('1966-12-20'), 64)), '2031년 1월');
  assert.equal(isFirstOfMonth(d('1966-03-01')), true);
  assert.equal(calculate(d('1966-03-01'), TODAY).firstOfMonth, true);
  // 2월 29일생도 월 기준으로 계산
  assert.equal(ymLabel(firstPayExample(d('1964-02-29'), 63)), '2027년 3월');
});

test('남은 기간: 생일 전날·당일·다음 날', () => {
  // 1963-10-24생은 63세 생일이 2026-10-24
  assert.equal(calculate(d('1963-10-24'), d('2026-10-23')).monthsToNormal, 0);
  assert.equal(remainLabel(0), '정상 수령 나이까지 1개월이 안 남았습니다');
  assert.equal(calculate(d('1963-10-24'), d('2026-10-24')).monthsToNormal, null);
  assert.equal(remainLabel(null), '이미 정상 수령 나이가 되었습니다');
  const r = calculate(d('1970-05-15'), TODAY);
  assert.equal(r.monthsToNormal, 102);
  assert.equal(remainLabel(r.monthsToNormal), '정상 수령 나이까지 8년 6개월 남았습니다');
  assert.equal(remainLabel(24), '정상 수령 나이까지 2년 남았습니다');
});

test('입력 검증', () => {
  assert.equal(validate(null, TODAY), 'empty');
  assert.equal(validate(d('1929-12-31'), TODAY), 'range');
  assert.equal(validate(d('2026-10-24'), TODAY), 'range');
  assert.equal(validate(d('1970-01-01'), TODAY), null);
  assert.equal(parseYmd('1970-02-30'), null);
});
