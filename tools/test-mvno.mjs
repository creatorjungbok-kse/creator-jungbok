// 알뜰폰 요금제 A/B 예상 총비용 비교 단위 테스트. 사용: npm run test:tools
// 숫자는 계산 검증용 가상 값이다(실제 상품 가격 아님).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  comparePlans,
  differenceSentence,
  limits,
  monthlyAverage,
  parseInteger,
  planTotal,
  readPlan,
  subjectParticle,
  vsCurrentText,
} from '../src/tools/mvno-plan-cost/calc.ts';

const A = { kind: 'period', promoPrice: 10000, promoMonths: 6, regularPrice: 25000, oneTime: 8800 };
const B = { kind: 'flat', price: 18000, oneTime: 0 };
const names = { a: '요금제 A', b: '요금제 B' };

test('검증 예시: A(기간 할인) vs B(종료 시점 없음), 12·24개월 동시', () => {
  const [m12, m24] = comparePlans(A, B);
  assert.deepEqual(m12, { months: 12, totalA: 218800, totalB: 216000, averageA: 18233, averageB: 18000, difference: 2800, lower: 'b' });
  assert.deepEqual(m24, { months: 24, totalA: 518800, totalB: 432000, averageA: 21617, averageB: 18000, difference: 86800, lower: 'b' });
  assert.equal(differenceSentence(m12, names), '12개월 기준 요금제 B가 2,800원 적게 듭니다.');
  assert.equal(differenceSentence(m24, names), '24개월 기준 요금제 B가 86,800원 적게 듭니다.');
});

test('할인 개월과 비교 기간', () => {
  const p = (promoMonths) => ({ kind: 'period', promoPrice: 10000, promoMonths, regularPrice: 30000, oneTime: 0 });
  // 할인 개월 > 기간: 기간 전체가 할인 월요금
  assert.equal(planTotal(p(36), 12), 120000);
  assert.equal(planTotal(p(36), 24), 240000);
  // 할인 개월 == 기간
  assert.equal(planTotal(p(12), 12), 120000);
  assert.equal(planTotal(p(12), 24), 120000 + 360000);
  // 1개월 할인
  assert.equal(planTotal(p(1), 12), 10000 + 30000 * 11);
});

test('할인 월요금 0원·10원, 1회 비용 0·있음', () => {
  assert.equal(planTotal({ kind: 'period', promoPrice: 0, promoMonths: 6, regularPrice: 20000, oneTime: 0 }, 12), 120000);
  assert.equal(planTotal({ kind: 'period', promoPrice: 10, promoMonths: 6, regularPrice: 20000, oneTime: 0 }, 12), 120060);
  assert.equal(planTotal({ kind: 'flat', price: 15000, oneTime: 0 }, 24), 360000);
  assert.equal(planTotal({ kind: 'flat', price: 15000, oneTime: 7700 }, 24), 367700);
});

test('두 요금제 총액이 같을 때', () => {
  const [m12] = comparePlans({ kind: 'flat', price: 20000, oneTime: 0 }, { kind: 'period', promoPrice: 10000, promoMonths: 6, regularPrice: 30000, oneTime: 0 });
  assert.equal(m12.difference, 0);
  assert.equal(m12.lower, null);
  assert.equal(differenceSentence(m12, names), '12개월 기준 두 요금제의 예상 총액이 같습니다.');
});

test('월평균: 원 단위 반올림(0.5원 올림)', () => {
  assert.equal(monthlyAverage(218800, 12), 18233); // 18,233.33
  assert.equal(monthlyAverage(518800, 24), 21617); // 21,616.67
  assert.equal(monthlyAverage(18006, 12), 1501); // 1,500.5 → 1,501
  assert.equal(monthlyAverage(18005, 12), 1500); // 1,500.42
  assert.equal(monthlyAverage(0, 12), 0);
});

test('현재 통신비: 없음 / 적게 듦 / 더 듦 / 같음', () => {
  const [none] = comparePlans(A, B);
  assert.equal('vsCurrentA' in none, false);
  const [m12, m24] = comparePlans(A, B, 20000);
  assert.equal(m12.vsCurrentA, 240000 - 218800);
  assert.equal(m12.vsCurrentB, 240000 - 216000);
  assert.equal(m24.vsCurrentA, 480000 - 518800);
  assert.equal(vsCurrentText(m12.vsCurrentA), '현재 요금보다 21,200원 적게 듭니다.');
  assert.equal(vsCurrentText(m24.vsCurrentA), '현재 요금보다 38,800원 더 듭니다.');
  assert.equal(vsCurrentText(0), '현재 요금과 같습니다.');
  // 더 드는 경우에 '절약'을 쓰지 않는다
  assert.doesNotMatch(vsCurrentText(-1), /절약/);
  // 현재 통신비 0원도 비교한다
  assert.equal(comparePlans(B, B, 0)[0].vsCurrentA, -216000);
});

test('이름: 입력한 이름으로 문구, 조사 이/가', () => {
  const [m12] = comparePlans(A, B);
  assert.equal(differenceSentence(m12, { a: '요금제 A', b: '우리집 요금' }), '12개월 기준 우리집 요금이 2,800원 적게 듭니다.');
  assert.equal(differenceSentence(m12, { a: 'x', b: 'LTE 유심 (10GB+/통화맘껏)' }), '12개월 기준 LTE 유심 (10GB+/통화맘껏)이 2,800원 적게 듭니다.');
  for (const [name, p] of [['요금제 B', '가'], ['요금제 A', '가'], ['데이터 10GB', '가'], ['통화맘껏', '이'], ['플랜 L', '이'], ['요금 7', '이'], ['요금 2', '가'], ['', '가']]) {
    assert.equal(subjectParticle(name), p, name);
  }
});

test('입력 검증: 정수·범위·필수', () => {
  const ok = (raw, limit, value) => assert.deepEqual(parseInteger(raw, limit, '값'), { ok: true, value }, raw);
  const bad = (raw, limit, part) => {
    const r = parseInteger(raw, limit, '월요금');
    assert.equal(r.ok, false, raw);
    assert.match(r.error, new RegExp(part), raw);
  };
  ok('0', limits.price, 0);
  ok('200,000', limits.price, 200000);
  ok(' 18000 ', limits.price, 18000);
  bad('', limits.price, '월요금을 입력하세요');
  bad('-1', limits.price, '0~200,000원 사이의 정수');
  bad('1.5', limits.price, '0~200,000원 사이의 정수');
  bad('200001', limits.price, '0~200,000원 사이의 정수');
  bad('0', limits.promoMonths, '1~60개월 사이의 정수');
  bad('61', limits.promoMonths, '1~60개월 사이의 정수');
  bad('300001', limits.current, '0~300,000원 사이의 정수');
  // 선택 입력은 비면 undefined
  assert.deepEqual(parseInteger('', limits.current, false), { ok: true, value: undefined });
});

test('요금제 입력 읽기: 할인 방식별 필수 칸', () => {
  const period = { kind: 'period', price: '10,000', promoMonths: '6', regularPrice: '25000', oneTime: '' };
  assert.deepEqual(readPlan(period), { ok: true, plan: { kind: 'period', promoPrice: 10000, promoMonths: 6, regularPrice: 25000, oneTime: 0 } });
  // 기간 할인: 할인 개월·종료 후 요금 필수
  const missing = readPlan({ ...period, promoMonths: '', regularPrice: '' });
  assert.equal(missing.ok, false);
  assert.deepEqual(Object.keys(missing.errors).sort(), ['promoMonths', 'regularPrice']);
  assert.match(missing.errors.promoMonths, /할인 개월 수를 입력하세요/);
  // 종료 시점 없음: 기간 칸은 무시
  assert.deepEqual(readPlan({ kind: 'flat', price: '18000', promoMonths: 'abc', regularPrice: '-1', oneTime: '0' }), { ok: true, plan: { kind: 'flat', price: 18000, oneTime: 0 } });
  // 여러 칸 오류를 한 번에
  const many = readPlan({ kind: 'period', price: '-5', promoMonths: '0.5', regularPrice: '999999', oneTime: '1e3' });
  assert.deepEqual(Object.keys(many.errors).sort(), ['oneTime', 'price', 'promoMonths', 'regularPrice']);
  assert.match(readPlan({ ...period, price: '' }).errors.price, /할인 월요금을 입력하세요/);
  assert.match(readPlan({ kind: 'flat', price: '', promoMonths: '', regularPrice: '', oneTime: '' }).errors.price, /^월요금을 입력하세요/);
});
