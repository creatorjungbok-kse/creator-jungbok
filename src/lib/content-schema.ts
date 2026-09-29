// 콘텐츠 frontmatter 스키마(02 9장). 글 한 편 안에서 판단할 수 있는 검증은 여기서 한다.
// 글 사이의 검증(URL 충돌, primaryQuery 중복, 링크 대상 존재, category별 규칙)은 lib/content.ts.
import { z } from 'astro/zod';
import { audiences } from '../data/audiences';
import { people } from '../data/people';
import { sourceLevels } from '../data/sources';
import { topics } from '../data/topics';
import { sourceRefs, sourceResolver } from './sources';

const date = z.coerce.date();
const text = z.string().trim().min(1);
const idsOf = (list: readonly { id: string }[]) => z.enum(list.map((x) => x.id) as [string, ...string[]]);
// 내부 글 경로: /{category}/{slug}/
const internalPath = z.string().regex(/^\/[a-z]+\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/, '내부 글 경로 형식: /category/slug/');

// ── 출처 ─────────────────────────────────────────────
const sourceShape = {
  title: text,
  publisher: text,
  url: z.url(),
  level: z.enum(sourceLevels),
};
export const commonSourceSchema = z.strictObject({ id: z.string().regex(/^[a-z0-9-]+$/), ...sourceShape, checkedAt: date.optional() });
const localSourceSchema = z.strictObject({
  id: z.string().regex(/^local:[a-z0-9-]+$/, "글 전용 출처 id는 'local:' 접두"),
  ...sourceShape,
  checkedAt: date,
});
const sourceId = z.string().min(1);

// ── 가격 ─────────────────────────────────────────────
const confidenceLevels = ['L1', 'L2', 'L3', 'L4', 'L5'] as const;
const priceItemSchema = z
  .strictObject({
    label: text,
    min: z.number().nonnegative().optional(),
    max: z.number().nonnegative().optional(),
    // 숫자로 표현할 수 없는 가격(예: 무료, 별도 문의)
    text: text.optional(),
    unit: z.enum(['원', '%']).default('원'),
    per: z.enum(['회', '월', '년', '평', '건', '대', '시간', '명', '㎡']).optional(),
    vat: z.enum(['included', 'excluded', 'unknown']).optional(),
    condition: text.optional(),
    region: text.optional(),
    sourceIds: z.array(sourceId).default([]),
    confidence: z.enum(confidenceLevels).optional(),
    // 항목별 확인일. 없으면 글의 researchedAt
    date: date.optional(),
    // L5(계산 추정)는 계산식을 적는다
    note: text.optional(),
  })
  .superRefine((p, ctx) => {
    const hasNumber = p.min !== undefined || p.max !== undefined;
    if (hasNumber === (p.text !== undefined)) ctx.addIssue({ code: 'custom', message: 'min/max 숫자와 text 중 하나만 쓴다' });
    if (!hasNumber) return;
    if (p.sourceIds.length === 0) ctx.addIssue({ code: 'custom', path: ['sourceIds'], message: '가격 숫자에는 출처가 필요하다' });
    if (!p.confidence) ctx.addIssue({ code: 'custom', path: ['confidence'], message: '가격 숫자에는 confidence(L1~L5)가 필요하다' });
    if (p.unit === '원' && !p.vat) ctx.addIssue({ code: 'custom', path: ['vat'], message: '원 단위 가격에는 VAT 여부가 필요하다' });
    if (p.min !== undefined && p.max !== undefined && p.min > p.max) ctx.addIssue({ code: 'custom', path: ['max'], message: 'max < min' });
    if (p.confidence === 'L5' && !p.note) ctx.addIssue({ code: 'custom', path: ['note'], message: 'L5는 계산식을 note에 적는다' });
  });

// ── 공통 필드 ────────────────────────────────────────
const peopleIds = idsOf(people);
const baseShape = {
  title: text,
  // 없으면 summary를 meta description으로 쓴다
  description: text.optional(),
  contentMode: z.enum(['evergreen', 'timely']),
  primaryQuery: text,
  synonyms: z.array(text).optional(),
  summary: text,
  datePublished: date,
  dateModified: date,
  researchedAt: date,
  author: peopleIds,
  reviewer: peopleIds.optional(),
  topics: z.array(idsOf(topics)).min(1),
  // 수동 지정이 필요할 때만. 기본은 topics·category·audience로 자동 계산
  related: z.array(internalPath).optional(),
  faq: z.array(z.strictObject({ question: text, answer: text })).optional(),
  changelog: z.array(z.strictObject({ date, summary: text })).optional(),
  // 글 전체에서 인용한 공통 출처
  sourceIds: z.array(sourceId).optional(),
  localSources: z.array(localSourceSchema).optional(),
};

const adsSchema = <S extends z.ZodRawShape>(slots: S) =>
  z.strictObject({ enabled: z.boolean().optional(), slots: z.strictObject(slots).optional(), reason: text }).optional();
const slot = z.boolean().optional();

const programSchema = z
  .strictObject({
    officialName: text,
    operator: text,
    programType: z.enum(['recurring', 'one-off']),
    // 반복 제도의 URL 단위(연도별 글을 따로 만들지 않는다)
    seriesKey: z.string().regex(/^[a-z0-9-]+$/).optional(),
    round: text.optional(),
    region: text,
    eligibility: z.array(z.strictObject({ text, sourceId })).min(1),
    exclusions: z.array(z.strictObject({ text, sourceId })).optional(),
    benefit: z.strictObject({
      kind: z.enum(['cash', 'voucher', 'discount', 'refund', 'loan']),
      text,
      min: z.number().nonnegative().optional(),
      max: z.number().nonnegative().optional(),
      unit: z.enum(['원', '%']).optional(),
      sourceId,
    }),
    application: z.strictObject({
      mode: z.enum(['period', 'rolling', 'until-budget']),
      start: date.optional(),
      end: date.optional(),
      methods: z.array(text).optional(),
      documents: z.array(text).optional(),
      officialUrl: z.url(),
    }),
    payoutSchedule: text.optional(),
    // 혜택 효력 기간(신청 기간과 별개)
    validFrom: date.optional(),
    validTo: date.optional(),
    // 상태는 신청 기간에서 계산한다. 조기 마감·연장·예산 소진일 때만 override
    statusOverride: z
      .strictObject({ value: z.enum(['upcoming', 'open', 'closing-soon', 'closed']), reason: text, sourceId })
      .optional(),
    lastStatusCheckedAt: date,
    officialSourceIds: z.array(sourceId).min(1),
    successorUrl: z.union([internalPath, z.url()]).optional(),
  })
  .superRefine((p, ctx) => {
    const a = p.application;
    if (p.programType === 'recurring' && !p.seriesKey) ctx.addIssue({ code: 'custom', path: ['seriesKey'], message: '반복 제도는 seriesKey가 필요하다' });
    if (a.mode === 'period' && (!a.start || !a.end)) ctx.addIssue({ code: 'custom', path: ['application'], message: 'period 모드는 start·end가 필요하다' });
    if (a.mode === 'until-budget' && !a.start) ctx.addIssue({ code: 'custom', path: ['application', 'start'], message: 'until-budget 모드는 start가 필요하다' });
    if (a.start && a.end && a.end < a.start) ctx.addIssue({ code: 'custom', path: ['application', 'end'], message: 'end < start' });
    if (p.validFrom && p.validTo && p.validTo < p.validFrom) ctx.addIssue({ code: 'custom', path: ['validTo'], message: 'validTo < validFrom' });
  });

// ── 글 단위 교차 필드 검증 ────────────────────────────
type Base = z.infer<z.ZodObject<typeof baseShape>>;
type Refs = Parameters<typeof sourceRefs>[0];

function checkEntry(d: Base & Omit<Refs, 'priceItems'> & { priceItems?: z.infer<typeof priceItemSchema>[] }, ctx: z.RefinementCtx) {
  if (d.dateModified < d.datePublished) ctx.addIssue({ code: 'custom', path: ['dateModified'], message: 'dateModified < datePublished' });
  // 내용이 바뀐 날짜에는 변경 기록이 있어야 한다(날짜만 올리는 가짜 업데이트 방지)
  if (+d.dateModified !== +d.datePublished && !d.changelog?.some((c) => +c.date === +d.dateModified)) {
    ctx.addIssue({ code: 'custom', path: ['changelog'], message: 'dateModified 날짜의 changelog 항목이 필요하다' });
  }
  if (d.reviewer) {
    const r = people.find((p) => p.id === d.reviewer);
    if (!r?.canReview || d.reviewer === d.author) ctx.addIssue({ code: 'custom', path: ['reviewer'], message: '검수 권한이 있는 다른 사람만 reviewer가 될 수 있다' });
  }

  const refs = sourceRefs(d);
  const resolve = sourceResolver(d);
  const used = new Set(refs.map((r) => r.id));
  const seen = new Set<string>();
  d.localSources?.forEach((s, i) => {
    if (seen.has(s.id)) ctx.addIssue({ code: 'custom', path: ['localSources', i, 'id'], message: `중복 출처 id ${s.id}` });
    // 정의만 하고 인용하지 않은 출처는 화면에 나오지 않으므로 남기지 않는다
    if (!used.has(s.id)) ctx.addIssue({ code: 'custom', path: ['localSources', i, 'id'], message: `인용되지 않은 출처 ${s.id} (sourceIds 등에서 참조하거나 삭제)` });
    seen.add(s.id);
  });
  for (const ref of refs) {
    const s = resolve(ref.id);
    if (!s) ctx.addIssue({ code: 'custom', path: ref.path, message: `존재하지 않는 출처 ${ref.id}` });
    else if (ref.mustBeS1 && s.level !== 'S1') ctx.addIssue({ code: 'custom', path: ref.path, message: `${ref.id}: 공식(S1) 출처만 허용` });
  }

  // confidence ↔ 출처 등급(02 8장)
  d.priceItems?.forEach((p, i) => {
    const levels = p.sourceIds.map((id) => resolve(id)?.level);
    const count = (lv: string) => levels.filter((l) => l === lv).length;
    const rule: Record<string, [boolean, string]> = {
      L1: [count('S1') >= 1, 'L1은 S1 출처가 필요하다'],
      L2: [count('S2') >= 1, 'L2는 S2 출처가 필요하다'],
      L3: [count('S2') >= 3, 'L3는 서로 다른 S2 출처 3개 이상이 필요하다'],
      L4: [count('S3') >= 1, 'L4는 S3 출처가 필요하다'],
    };
    const r = p.confidence && rule[p.confidence];
    if (r && !r[0]) ctx.addIssue({ code: 'custom', path: ['priceItems', i, 'confidence'], message: r[1] });
  });
}

// ── articles: cost / compare / guide / change ─────────
export const articleSchema = z
  .strictObject({
    ...baseShape,
    subcategory: z.string(),
    contentType: z.enum(['cost', 'compare', 'guide', 'change']),
    ymyl: z.enum(['low', 'medium', 'high']),
    audience: z.array(idsOf(audiences)).optional(),
    // Supporting 글이 속한 Pillar(02 5장)
    pillar: internalPath.optional(),
    priceItems: z.array(priceItemSchema).optional(),
    change: z
      .strictObject({ effectiveFrom: date, effectiveUntil: date.optional(), officialSourceIds: z.array(sourceId).min(1) })
      .optional(),
    ads: adsSchema({ top: slot, mid: slot, lower: slot, end: slot }),
  })
  .superRefine((d, ctx) => {
    if (d.contentType === 'cost' && !d.priceItems?.length) ctx.addIssue({ code: 'custom', path: ['priceItems'], message: 'cost 글은 priceItems가 필요하다' });
    if ((d.contentType === 'change') !== (d.change !== undefined)) ctx.addIssue({ code: 'custom', path: ['change'], message: 'change 블록은 change 글에만, change 글에는 필수' });
    checkEntry(d, ctx);
  });

// ── benefits: 실제 지원·혜택(benefit) ─────────────────
// category(benefits)·contentType(benefit)은 컬렉션에서 정해지므로 frontmatter에 쓰지 않는다.
export const benefitSchema = z
  .strictObject({
    ...baseShape,
    subcategory: z.string(),
    ymyl: z.enum(['low', 'medium', 'high']).default('medium'),
    audience: z.array(idsOf(audiences)).min(1),
    program: programSchema,
    ads: adsSchema({ mid: slot, end: slot }),
  })
  .superRefine(checkEntry);
