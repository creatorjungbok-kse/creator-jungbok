// 지원사업 상태 계산 경계 테스트. 사용: npm run test:status
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { benefitStatus, CLOSING_SOON_DAYS } from '../src/lib/benefit-status.ts';

// frontmatter 날짜와 같은 형식(UTC 자정)
const d = (ymd) => new Date(`${ymd}T00:00:00Z`);
// 한국 시각으로 기준 시각 만들기
const kst = (ymd, hm = '12:00') => new Date(`${ymd}T${hm}:00+09:00`);
const period = (start, end) => ({ application: { mode: 'period', start: d(start), end: d(end) } });
const check = (program, now, status, detail) => {
  const r = benefitStatus(program, now);
  assert.equal(r.status, status);
  assert.equal(r.detail, detail);
};

const p = period('2026-10-05', '2026-10-31');

test('기간: 시작일 전날 → 신청 예정', () => check(p, kst('2026-10-04'), 'upcoming', '10월 5일부터'));
test('기간: 시작일 → 신청 가능', () => check(p, kst('2026-10-05'), 'open', 'D-26'));
test(`기간: 종료 ${CLOSING_SOON_DAYS + 1}일 전 → 신청 가능`, () => check(p, kst('2026-10-23'), 'open', 'D-8'));
test(`기간: 종료 ${CLOSING_SOON_DAYS}일 전 → 마감 임박`, () => check(p, kst('2026-10-24'), 'closing-soon', 'D-7'));
test('기간: 종료일 → 오늘 마감', () => check(p, kst('2026-10-31'), 'closing-soon', '오늘 마감'));
test('기간: 종료 다음날 → 신청 종료', () => check(p, kst('2026-11-01'), 'closed', undefined));

test('override closed가 날짜보다 우선, 남은 D-day를 보여주지 않음', () =>
  check({ ...p, statusOverride: { value: 'closed' } }, kst('2026-10-10'), 'closed', undefined));
test('override open(연장) + 지난 종료일이면 D-day 없음', () =>
  check({ ...p, statusOverride: { value: 'open' } }, kst('2026-11-03'), 'open', undefined));
test('override 값에 overridden 표시', () => assert.equal(benefitStatus({ ...p, statusOverride: { value: 'upcoming' } }, kst('2026-10-10')).overridden, true));

test('시작일만(예산 소진 시까지): 시작 전 → 예정', () =>
  check({ application: { mode: 'until-budget', start: d('2026-10-05') } }, kst('2026-10-01'), 'upcoming', '10월 5일부터'));
test('시작일만: 시작 후 → 신청 가능, D-day 없음', () =>
  check({ application: { mode: 'until-budget', start: d('2026-10-05') } }, kst('2026-12-01'), 'open', undefined));
test('종료일만: 종료 3일 전 → 마감 임박', () => check({ application: { mode: 'rolling', end: d('2026-10-31') } }, kst('2026-10-28'), 'closing-soon', 'D-3'));
test('상시 신청: 날짜 없음 → 신청 가능', () => check({ application: { mode: 'rolling' } }, kst('2026-10-28'), 'open', undefined));

// 서버 시간대와 무관하게 한국 날짜 경계를 쓴다
test('시간대 경계: 한국 0시 30분(UTC 전날) → 시작일로 판단', () => check(p, kst('2026-10-05', '00:30'), 'open', 'D-26'));
test('시간대 경계: 한국 23시 59분 종료일 → 오늘 마감', () => check(p, kst('2026-10-31', '23:59'), 'closing-soon', '오늘 마감'));
test('시간대 경계: 한국 다음날 0시 → 종료', () => check(p, kst('2026-11-01', '00:00'), 'closed', undefined));
