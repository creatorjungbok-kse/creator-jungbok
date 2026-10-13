// 부가세 계산기 도구 설정(등록되는 도구). 계산 로직·상수는 src/lib/vat/에 있다.
// 확정 문서: docs/ready/vat-calculator/{fact-table,spec,article-plan}.md
import { reviewFrom, reviewNote, validUntil } from '../../lib/vat/rules.ts';

export const vatCalculator = {
  id: 'vat-calculator',
  checkedAt: '2026-10-12',
  // 계산 근거(공통 출처 registry id) — 글 출처 목록·S1 검증에 자동 포함된다
  sourceIds: ['law-vat-rate', 'law-vat-act', 'law-vat-decree'],
  // 카드·현금영수증 발행세액공제 상수 기한: reviewFrom부터 빌드 경고, validUntil 지나면 빌드 실패
  reviewFrom,
  reviewNote,
  validUntil,
} as const;
