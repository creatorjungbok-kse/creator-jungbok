// 사업자 세금 달력 v1 — 설계 문서(docs/ready/tax-calendar/design.md) 테스트. 사용: npm run test:tools
// 날짜 계산보다 '잘못된 신고 의무를 안내하지 않는지'를 먼저 고정한다.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { board, pastVisible, eventsFor, eventStatus, dDay, monthlyInvoiceDue, nextMonthlyInvoice, seoulToday, taxEvents, validateData, mainDeadline } from '../src/lib/tax-calendar/calendar.ts';

const ids = (list) => list.map((e) => e.id);
const byId = (id) => taxEvents.find((e) => e.id === id);

test('데이터 점검: 날짜·대상·출처 누락 없음', () => {
  assert.deepEqual(validateData(), []);
});

test('개인 일반과세자에게 10월 26일 법인 예정신고를 안내하지 않음', () => {
  const b = board('individual', '2026-10-16');
  assert.ok(!ids(eventsFor('individual')).includes('vat-2026-2-pre-return'));
  assert.deepEqual(ids(b.now), ['vat-2026-2-pre-notice']);
  assert.equal(dDay(b.now[0], '2026-10-16'), 'D-17');
});

test('소규모 법인을 예정신고 대상 법인과 구분', () => {
  assert.deepEqual(ids(board('corp-return', '2026-10-16').now), ['vat-2026-2-pre-return']);
  assert.deepEqual(ids(board('corp-notice', '2026-10-16').now), ['vat-2026-2-pre-notice']);
  // 모르는 법인은 두 경우를 모두(조건과 함께) 보여준다
  assert.deepEqual(ids(board('corp-unknown', '2026-10-16').now), ['vat-2026-2-pre-return', 'vat-2026-2-pre-notice']);
});

test('12월 28일 연장은 납부기한만, 직권연장 대상자에게만', () => {
  const ret = byId('vat-2026-2-pre-return');
  // 신고기한은 그대로 10.26, 연장은 납부에만 붙은 예외
  assert.equal(ret.fileDeadline, '2026-10-26');
  assert.equal(ret.payDeadline, '2026-10-26');
  assert.equal(ret.paymentExtension.deadline, '2026-12-28');
  assert.match(ret.paymentExtension.text, /예정신고 의무 자체가 없어지는 것은 아닙니다/);
  assert.match(ret.paymentExtension.who, /직권연장 대상자/);
  // 연장일이 일반 기한으로 쓰이지 않음: 10.27이면 예정신고는 '기한 지남'
  assert.equal(eventStatus(ret, '2026-10-27'), 'past');
  // 확정신고·간이과세자 일정에는 연장이 없음
  for (const id of ['vat-2026-2-final', 'vat-2026-simplified']) assert.equal(byId(id).paymentExtension, undefined);
});

test('간이과세자 7월은 세금계산서 발급 여부에 따라 신고/고지 납부를 나눠 안내', () => {
  const e = byId('vat-2027-simplified-interim');
  assert.deepEqual(e.audiences, ['simplified']);
  assert.match(e.condition, /세금계산서를 발급한 간이과세자는 1~6월분을 신고·납부/);
  assert.match(e.condition, /그 밖의 간이과세자는 세무서가 고지한 세액/);
  assert.match(e.title, /세금계산서 발급 여부에 따라 예정신고 또는 예정부과 납부 확인/);
  assert.match(e.todo, /모든 간이과세자가 신고·납부해야 하는 일정은 아닙니다/);
  // 간이과세자에게 일반과세자 1기 확정신고를 안내하지 않음
  assert.ok(!ids(eventsFor('simplified')).includes('vat-2027-1-final'));
  // 2026년 10월에 간이과세자가 할 일은 없음
  assert.deepEqual(ids(board('simplified', '2026-10-16').now), []);
});

test('기한이 지나도 기한 후 신고·납부 확인 경로가 남음', () => {
  const b = board('corp-return', '2026-10-27');
  assert.deepEqual(ids(b.past), ['vat-2026-2-pre-return']);
  assert.match(b.past[0].afterDeadline, /기한 후 신고/);
  assert.ok(b.past[0].articleUrl);
  // 납부기한 연장(12.28)이 유효한 동안은 연장 안내가 붙은 채 남고, 그 뒤에 내려감
  assert.deepEqual(ids(board('corp-return', '2026-11-26').past), ['vat-2026-2-pre-return']);
  assert.deepEqual(ids(board('individual', '2026-12-28').past), ['vat-2026-2-pre-notice']);
  assert.deepEqual(ids(board('corp-return', '2026-12-29').past), []);
  // 연장이 없는 일정은 30일 뒤 내려감
  assert.equal(pastVisible(byId('vat-2026-2-final'), '2027-02-24'), true);
  assert.equal(pastVisible(byId('vat-2026-2-final'), '2027-02-25'), false);
  assert.match(byId('vat-2026-2-pre-notice').afterDeadline, /미납 세액/);
});

test('2027년 미확정 일정에는 D-day·진행 상태가 나오지 않음', () => {
  for (const id of ['vat-2027-1-pre-return', 'vat-2027-1-pre-notice', 'vat-2027-1-final', 'vat-2027-simplified-interim']) {
    const e = byId(id);
    assert.equal(e.verification, 'expected');
    // 기한 당일·직전이어도 'expected' 그대로
    for (const today of ['2027-04-20', mainDeadline(e)]) {
      assert.equal(eventStatus(e, today), 'expected');
      assert.equal(dDay(e, today), undefined);
    }
  }
  // '지금 할 일'에는 들어가지 않고 '이후 일정'에만
  const b = board('individual', '2027-04-20');
  assert.ok(!ids(b.now).some((id) => id.startsWith('vat-2027')));
  assert.ok(ids(b.later).includes('vat-2027-1-pre-notice'));
});

test('간이과세자 1월 25일은 법정 기한 기준으로 표시', () => {
  const e = byId('vat-2026-simplified');
  assert.equal(e.verification, 'statutory');
  assert.match(e.verificationNote, /법정 신고기한 기준/);
  assert.equal(dDay(e, '2027-01-20'), 'D-5');
});

test('상태 경계: 시작 전·진행·임박·당일·지남', () => {
  const e = byId('vat-2026-2-final'); // 1.1 ~ 1.25
  assert.equal(eventStatus(e, '2026-12-31'), 'upcoming');
  assert.equal(eventStatus(e, '2027-01-01'), 'open');
  assert.equal(eventStatus(e, '2027-01-17'), 'open');
  assert.equal(eventStatus(e, '2027-01-18'), 'closing');
  assert.equal(eventStatus(e, '2027-01-25'), 'today');
  assert.equal(dDay(e, '2027-01-25'), '오늘 마감');
  assert.equal(eventStatus(e, '2027-01-26'), 'past');
});

test('한국시간 기준 날짜: 기기 시간대와 무관', () => {
  // 한국 10.26 23:59 = UTC 14:59 → 아직 10.26 / 한국 10.27 00:00 = UTC 10.26 15:00 → 10.27
  assert.equal(seoulToday(new Date('2026-10-26T14:59:00Z')), '2026-10-26');
  assert.equal(seoulToday(new Date('2026-10-26T15:00:00Z')), '2026-10-27');
  const ret = byId('vat-2026-2-pre-return');
  assert.equal(eventStatus(ret, seoulToday(new Date('2026-10-26T14:59:00Z'))), 'today');
  assert.equal(eventStatus(ret, seoulToday(new Date('2026-10-26T15:00:00Z'))), 'past');
});

test('월합계 세금계산서 발급기한: 다음 달 10일, 토요일·공휴일이면 다음 영업일', () => {
  assert.equal(monthlyInvoiceDue('2026-10'), '2026-11-10'); // 화
  assert.equal(monthlyInvoiceDue('2026-12'), '2027-01-11'); // 1.10 일요일
  assert.equal(monthlyInvoiceDue('2027-03'), '2027-04-12'); // 4.10 토요일
  assert.equal(monthlyInvoiceDue('2027-06'), '2027-07-12'); // 7.10 토요일
  assert.equal(monthlyInvoiceDue('2027-01'), '2027-02-10'); // 설 연휴(2.6~2.9) 뒤 수요일
  assert.equal(monthlyInvoiceDue('2027-12'), null); // 공휴일 목록 범위 밖은 단정하지 않음
  assert.deepEqual(nextMonthlyInvoice('2026-10-16'), { month: '2026-10', due: '2026-11-10' });
  assert.deepEqual(nextMonthlyInvoice('2026-11-05'), { month: '2026-10', due: '2026-11-10' });
  assert.deepEqual(nextMonthlyInvoice('2026-11-11'), { month: '2026-11', due: '2026-12-10' });
});

test('확정·법정 일정이 모두 지나면 최신 일정 확인 안내', () => {
  assert.equal(board('individual', '2026-10-16').stale, false);
  assert.equal(board('individual', '2027-01-26').stale, true);
  assert.equal(board('simplified', '2027-01-26').stale, true);
});

test('예상 기한이 지나면 이후 일정에서 빠지고 재확인 안내', () => {
  const before = board('corp-return', '2027-04-26');
  assert.ok(ids(before.later).includes('vat-2027-1-pre-return'));
  assert.deepEqual(ids(before.expiredExpected), []);
  const after = board('corp-return', '2027-04-27');
  assert.ok(!ids(after.later).includes('vat-2027-1-pre-return'));
  assert.ok(!ids(after.past).includes('vat-2027-1-pre-return'));
  assert.deepEqual(ids(after.expiredExpected), ['vat-2027-1-pre-return']);
});
