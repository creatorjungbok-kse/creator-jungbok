// 주휴수당 계산기 도구 설정(등록되는 도구). 계산 로직은 src/lib/payroll/에 있다.
// 확정 문서: docs/ready/weekly-holiday-pay/{fact-table,spec,toolshell-reuse-plan}.md
import { minimumWages, reviewFrom, reviewNote, validUntil } from '../../lib/payroll/shared/minimum-wage.ts';

export const weeklyHolidayPay = {
  id: 'weekly-holiday-pay',
  checkedAt: '2026-10-09',
  // 계산 근거(공통 출처 registry id) — 글 출처 목록·S1 검증에 자동 포함된다
  sourceIds: [
    'law-labor-standards-act',
    'law-labor-standards-decree',
    'moel-1350-weekly-holiday-normal-day',
    'moel-1350-weekly-holiday-leave',
    'moel-1350-weekly-holiday-resign',
    ...new Set(minimumWages.flatMap((m) => m.sourceIds)),
  ],
  // 최저임금 상수 기한: reviewFrom부터 빌드 경고, validUntil 지나면 빌드 실패
  reviewFrom,
  reviewNote,
  validUntil,
} as const;
