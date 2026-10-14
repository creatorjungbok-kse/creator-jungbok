// 4대보험 계산기 도구 설정(등록되는 도구). 계산 로직·상수는 src/lib/social-insurance/에 있다.
// 확정 문서: docs/ready/social-insurance-calculator/{fact-table,spec}.md
import { reviewFrom, reviewNote, validUntil } from '../../lib/social-insurance/rules.ts';

export const socialInsuranceCalculator = {
  id: 'social-insurance-calculator',
  checkedAt: '2026-10-14',
  // 계산 근거(공통 출처 registry id) — 글 출처 목록·S1 검증에 자동 포함된다
  sourceIds: [
    'nps-premium-rate',
    'mohw-nhi-rate-2026',
    'mohw-ltc-rate-2026',
    'law-ei-premium-act',
    'law-ei-premium-decree',
    'law-nhi-decree',
    '4insure-premium-calc',
  ],
  // 2026년 요율 기한: reviewFrom부터 빌드 경고, validUntil 지나면 빌드 실패
  reviewFrom,
  reviewNote,
  validUntil,
} as const;
