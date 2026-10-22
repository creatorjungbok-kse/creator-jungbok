// 자동차 검사기간 계산기 v1 테스트(GPT 10/22 조건부 승인 설계). 사용: npm run test:tools
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dateLabel, fineBand, fineLine, headline, inspectionWindow, judge, parseYmd, validate, ymd } from '../src/lib/car-inspection/inspection.ts';

const d = (s) => {
  const v = parseYmd(s);
  assert.notEqual(v, null, s);
  return v;
};
const TODAY = d('2026-10-22');

test('검사기간: 만료일 전 90일부터 후 31일까지', () => {
  const w = inspectionWindow(d('2026-12-31'));
  assert.equal(ymd(w.start), '2026-10-02');
  assert.equal(ymd(w.end), '2027-01-31');
  // 월말·윤년
  const leap = inspectionWindow(d('2028-02-29'));
  assert.equal(ymd(leap.start), '2027-12-01');
  assert.equal(ymd(leap.end), '2028-03-31');
  const mar = inspectionWindow(d('2027-03-31'));
  assert.equal(ymd(mar.start), '2026-12-31');
  assert.equal(ymd(mar.end), '2027-05-01');
});

test('상태 경계: 기간 전·첫날·마지막 날·다음 날', () => {
  const ex = d('2026-12-31');
  const early = judge(ex, d('2026-10-01'), TODAY);
  assert.equal(early.status, 'early');
  assert.equal(early.days, 1);
  assert.equal(headline(early), '검사기간 시작까지 1일 남았습니다');
  const first = judge(ex, d('2026-10-02'), TODAY);
  assert.equal(first.status, 'open');
  assert.equal(first.days, 121);
  const last = judge(ex, d('2027-01-31'), TODAY);
  assert.equal(last.status, 'open');
  assert.equal(last.days, 0);
  assert.equal(headline(last), '오늘이 검사기간 마지막 날입니다');
  const late1 = judge(ex, d('2027-02-01'), TODAY);
  assert.equal(late1.status, 'late');
  assert.equal(late1.days, 1);
  assert.equal(late1.fine, 'base');
  assert.equal(headline(late1), '검사기간이 1일 지났습니다');
});

test('과태료 구간: 30·31·114·115일', () => {
  assert.equal(fineBand(0), 'none');
  assert.equal(fineBand(1), 'base');
  assert.equal(fineBand(30), 'base');
  assert.equal(fineBand(31), 'rising');
  assert.equal(fineBand(114), 'rising');
  assert.equal(fineBand(115), 'max');
  assert.equal(fineBand(400), 'max');
  const ex = d('2026-06-30'); // 마감 2026-07-31
  const j30 = judge(ex, d('2026-08-30'), d('2026-08-30'));
  assert.equal(j30.days, 30);
  assert.equal(j30.fine, 'base');
  assert.match(fineLine(j30), /40,000원/);
  const j31 = judge(ex, d('2026-08-31'), d('2026-08-31'));
  assert.equal(j31.fine, 'rising');
  // 31일 이후는 원 단위로 확정하지 않는다(구간만)
  assert.match(fineLine(j31), /3일 초과 시마다 20,000원씩 더해짐\(최대 600,000원\)/);
  assert.doesNotMatch(fineLine(j31), /60,000원/);
  const j115 = judge(ex, d('2026-11-23'), d('2026-11-23'));
  assert.equal(j115.days, 115);
  assert.equal(j115.fine, 'max');
  assert.match(fineLine(j115), /600,000원/);
});

test('미래 날짜는 예상 문구, 기간 안은 과태료 없음', () => {
  const ex = d('2026-08-31'); // 마감 2026-10-01
  const futureLate = judge(ex, d('2026-11-01'), TODAY);
  assert.equal(futureLate.future, true);
  assert.match(fineLine(futureLate), /^그날까지 검사를 받지 않으면 /);
  const nowLate = judge(ex, TODAY, TODAY);
  assert.equal(nowLate.future, false);
  assert.equal(nowLate.days, 21);
  assert.doesNotMatch(fineLine(nowLate), /그날까지/);
  assert.equal(fineLine(judge(d('2026-12-31'), TODAY, TODAY)), '과태료 없음');
});

test('입력 검증', () => {
  assert.deepEqual(validate(null, TODAY), ['expiry-empty']);
  assert.deepEqual(validate(d('1999-12-31'), TODAY), ['expiry-range']);
  assert.deepEqual(validate(d('2026-12-31'), null), ['check-empty']);
  assert.deepEqual(validate(d('2026-12-31'), d('2024-12-31')), ['check-before-rule']);
  assert.deepEqual(validate(d('2026-12-31'), d('2025-01-01')), []);
  assert.equal(parseYmd('2026-02-30'), null);
});

test('날짜 표시', () => {
  assert.equal(dateLabel(d('2026-10-22')), '2026년 10월 22일(목)');
  assert.equal(dateLabel(d('2027-01-31')), '2027년 1월 31일(일)');
});
