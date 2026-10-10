// 콘텐츠 frontmatter 스키마(02 9장). 글 한 편 안에서 판단할 수 있는 검증은 여기서 한다.
// 글 사이의 검증(URL 충돌, primaryQuery 중복, 링크 대상 존재, category별 규칙)은 lib/content.ts.
import { z } from 'astro/zod';
import { audiences } from '../data/audiences';
import { people } from '../data/people';
import { sourceLevels } from '../data/sources';
import { topics } from '../data/topics';
import { actionUrlProblem, hostExceptionProblem, linkActions } from './action-links';
import { toolContentTypes, toolIds } from '../tools/registry';
import { sourceRefs, sourceResolver } from './sources';

const date = z.coerce.date();
const text = z.string().trim().min(1);
const idsOf = (list: readonly { id: string }[]) => z.enum(list.map((x) => x.id) as [string, ...string[]]);
// 내부 글 경로: /{category}/{slug}/
const internalPath = z.string().regex(/^\/[a-z]+\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/, '내부 글 경로 형식: /category/slug/');
// 대표 이미지: public/images/thumbnails/의 로컬 파일만(원격 이미지 금지). 16:9로 만든다. 파일 존재는 check-build가 검사한다
// 공유 미리보기(og:image) 이미지: public/images/og/의 1200x630 PNG만. 없으면 사이트 기본 이미지를 쓴다. 크기·존재는 check-build가 검사한다
const ogImagePath = z.string().regex(/^\/images\/og\/[a-z0-9]+(?:-[a-z0-9]+)*\.png$/, '공유 이미지 경로 형식: /images/og/{kebab-case}.png');
const thumbnailPath = z.string().regex(/^\/images\/thumbnails\/[a-z0-9]+(?:-[a-z0-9]+)*\.(?:svg|webp|avif|png|jpg)$/, '대표 이미지 경로 형식: /images/thumbnails/{kebab-case}.svg|webp|avif|png|jpg');

// ── 출처 ─────────────────────────────────────────────
const sourceShape = {
  title: text,
  publisher: text,
  url: z.url(),
  level: z.enum(sourceLevels),
  // 행동 링크용 예외 호스트(공식 S1 출처만, 정확한 호스트 이름만)
  actionHosts: z
    .array(z.string().superRefine((h, ctx) => {
      const problem = hostExceptionProblem(h);
      if (problem) ctx.addIssue({ code: 'custom', message: problem });
    }))
    .min(1)
    .optional(),
};
const actionHostsOnlyS1 = (s: { level: string; actionHosts?: string[] }, ctx: z.RefinementCtx) => {
  if (s.actionHosts && s.level !== 'S1') ctx.addIssue({ code: 'custom', path: ['actionHosts'], message: 'actionHosts는 공식(S1) 출처에만 둘 수 있다' });
};
export const commonSourceSchema = z
  .strictObject({ id: z.string().regex(/^[a-z0-9-]+$/), ...sourceShape, checkedAt: date.optional() })
  .superRefine(actionHostsOnlyS1);
const localSourceSchema = z
  .strictObject({
    id: z.string().regex(/^local:[a-z0-9-]+$/, "글 전용 출처 id는 'local:' 접두"),
    ...sourceShape,
    checkedAt: date,
  })
  .superRefine(actionHostsOnlyS1);
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

// ── 정리 블록(꿀팁정복 자체의 정리 가치) ─────────────
// 공식 행동 링크: 버튼 문구는 org + action으로 만든다(lib/action-links.ts). 출처는 S1(공공기관·공식 사업자의 자기 페이지 포함),
// URL은 그 출처의 공식 도메인이어야 한다. action: application(신청 관련 공식 페이지, 지원·혜택 글 전용)·info·check
// purpose(선택): 버튼 목적 문구('사업자등록 상태 확인하기'처럼 '하기'·'보기'로 끝남). 문구 = '{org}에서 {purpose}'. application에는 쓸 수 없다(상태별 문구)
const actionLinkSchema = z
  .strictObject({ org: text, action: z.enum(linkActions), purpose: text.regex(/(하기|보기)$/, "purpose는 '하기'·'보기'로 끝나는 목적 문구").optional(), url: z.url(), sourceId })
  .superRefine((l, ctx) => {
    if (l.purpose && l.action === 'application') ctx.addIssue({ code: 'custom', path: ['purpose'], message: 'application 링크는 상태별 문구를 쓰므로 purpose를 둘 수 없다' });
  });
const checklistSchema = z.strictObject({ title: text.optional(), items: z.array(text).min(1) });
// 꼭 알아둘 것: 헷갈리기 쉬운 핵심만(최대 5개)
const notesSchema = z.array(text).min(1).max(5);
const compareSchema = z
  .strictObject({
    caption: text,
    options: z.array(text).min(2).max(4),
    rows: z.array(z.strictObject({ label: text, values: z.array(text), sourceIds: z.array(sourceId).optional() })).min(1),
  })
  .superRefine((c, ctx) => {
    c.rows.forEach((r, i) => {
      if (r.values.length !== c.options.length) ctx.addIssue({ code: 'custom', path: ['rows', i, 'values'], message: `값 ${r.values.length}개 ≠ 선택지 ${c.options.length}개` });
    });
  });

// ── 공통 필드 ────────────────────────────────────────
const peopleIds = idsOf(people);
const baseShape = {
  // 화면 H1·Article headline
  title: text,
  // <title>·OG 제목이 H1과 달라야 할 때만(없으면 title)
  seoTitle: text.optional(),
  // 카드형 UI용 짧은 표시 제목(홈 카드·관련 글 카드). 없으면 title.
  // H1·<title>·meta·구조화 데이터·검색·카테고리 목록·사이드바는 항상 title을 쓴다
  cardTitle: text.refine((v) => [...v].length <= 22, '카드 제목은 22자 이하').optional(),
  // 없으면 summary를 meta description으로 쓴다
  description: text.optional(),
  contentMode: z.enum(['evergreen', 'timely']),
  primaryQuery: text,
  synonyms: z.array(text).optional(),
  summary: text,
  // 목록 카드·글 머리의 대표 이미지(없으면 대분류 색 칸으로 대신 표시)
  thumbnail: thumbnailPath.optional(),
  // 카카오톡·SNS 공유 미리보기·Article.image 이미지(없으면 사이트 기본 이미지)
  ogImage: ogImagePath.optional(),
  datePublished: date,
  dateModified: date,
  researchedAt: date,
  author: peopleIds,
  reviewer: peopleIds.optional(),
  topics: z.array(idsOf(topics)).min(1),
  // 수동 지정이 필요할 때만. 기본은 topics·category·audience로 자동 계산
  related: z.array(internalPath).optional(),
  // false면 관련 글을 related에 직접 적은 것만 쓴다(pillar·같은 주제 자동 채움 안 함, 비어 있으면 영역 숨김). 없거나 true면 기존 자동 채움
  relatedAuto: z.boolean().optional(),
  faq: z.array(z.strictObject({ question: text, answer: text })).optional(),
  changelog: z.array(z.strictObject({ date, summary: text })).optional(),
  // 글 전체에서 인용한 공통 출처
  sourceIds: z.array(sourceId).optional(),
  localSources: z.array(localSourceSchema).optional(),
  actionLinks: z.array(actionLinkSchema).min(1).optional(),
  checklist: checklistSchema.optional(),
  notes: notesSchema.optional(),
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
      // 신청 기간 안의 공식 일시 중단 기간(그 날짜에만 상태가 '신청 일시 중단', 공식 S1 근거 필수)
      pauses: z.array(z.strictObject({ start: date, end: date, reason: text, sourceId })).optional(),
    }),
    payoutSchedule: text.optional(),
    // 혜택 효력 기간(신청 기간과 별개)
    validFrom: date.optional(),
    validTo: date.optional(),
    // 상태는 신청 기간에서 계산한다. 조기 마감·연장·예산 소진일 때만 override
    statusOverride: z
      .strictObject({ value: z.enum(['upcoming', 'open', 'closing-soon', 'closed']), reason: text, sourceId })
      .optional(),
    // 전국 신청기간은 열려 있지만 지역·예산별로 먼저 닫힐 수 있는 제도(공식 S1 근거 필수).
    // 있으면 '신청 가능' 대신 '신청기간 중'으로 표시하고, 상태 배너에 이 문구를 함께 보여준다
    statusNote: z.strictObject({ text, sourceId }).optional(),
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
    a.pauses?.forEach((x, i) => {
      if (x.end < x.start) ctx.addIssue({ code: 'custom', path: ['application', 'pauses', i, 'end'], message: '일시 중단 end < start' });
      if ((a.start && x.start < a.start) || (a.end && x.end > a.end)) ctx.addIssue({ code: 'custom', path: ['application', 'pauses', i], message: '일시 중단 기간은 신청 기간 안에 있어야 한다' });
    });
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
  // 모든 글은 출처를 1개 이상 인용한다(editorial-policy: 참고한 출처를 글 아래에 함께 적는다)
  if (refs.length === 0) ctx.addIssue({ code: 'custom', path: ['sourceIds'], message: '출처가 1개 이상 필요하다(sourceIds 등)' });
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

  // 공식 행동 링크: 출처는 S1(sourceRefs의 mustBeS1), 기관명은 출처 이름과 같고, URL은 그 출처의 공식 도메인
  d.actionLinks?.forEach((link, i) => {
    const s = resolve(link.sourceId);
    if (!s) return;
    if (link.org !== s.title && link.org !== s.publisher) {
      ctx.addIssue({ code: 'custom', path: ['actionLinks', i, 'org'], message: `기관명 '${link.org}'이 출처 이름(${s.title}·${s.publisher})과 다르다` });
    }
    const problem = actionUrlProblem(link.url, s);
    if (problem) ctx.addIssue({ code: 'custom', path: ['actionLinks', i, 'url'], message: `행동 링크 URL: ${problem}` });
  });

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
    // 사이트 도구(계산기 등). 도구의 요금표·상수는 src/tools에만 두고 priceItems에 중복으로 쓰지 않는다
    tool: z.enum(toolIds).optional(),
    // 계산하러 온 검색자가 바로 쓰도록 도구를 목차보다 먼저 둔다(선택). tool이 있을 때만
    toolBeforeToc: z.boolean().optional(),
    // 한눈에 보기(결론 바로 아래): 상황·항목별 핵심 답
    quickFacts: z.strictObject({ title: text, items: z.array(z.strictObject({ label: text, value: text })).min(1) }).optional(),
    compare: compareSchema.optional(),
    change: z
      .strictObject({ effectiveFrom: date, effectiveUntil: date.optional(), officialSourceIds: z.array(sourceId).min(1) })
      .optional(),
    ads: adsSchema({ top: slot, mid: slot, lower: slot }),
  })
  .superRefine((d, ctx) => {
    if (d.contentType === 'cost' && !d.priceItems?.length && !d.tool) ctx.addIssue({ code: 'custom', path: ['priceItems'], message: 'cost 글은 priceItems 또는 tool이 필요하다' });
    if (d.toolBeforeToc && !d.tool) ctx.addIssue({ code: 'custom', path: ['toolBeforeToc'], message: 'toolBeforeToc는 tool이 있는 글에만 둔다' });
    if (d.tool && toolContentTypes[d.tool] !== d.contentType) ctx.addIssue({ code: 'custom', path: ['tool'], message: `tool ${d.tool}은 ${toolContentTypes[d.tool]} 글에만 둔다` });
    if ((d.contentType === 'change') !== (d.change !== undefined)) ctx.addIssue({ code: 'custom', path: ['change'], message: 'change 블록은 change 글에만, change 글에는 필수' });
    // compare 글: 고정 비교표(compare) 또는 비교 도구(tool) 중 하나만(v1)
    if (d.compare && d.contentType !== 'compare') ctx.addIssue({ code: 'custom', path: ['compare'], message: 'compare 표는 compare 글에만 둔다' });
    if (d.contentType === 'compare' && !d.compare && !d.tool) ctx.addIssue({ code: 'custom', path: ['compare'], message: 'compare 글은 compare 표 또는 tool이 필요하다' });
    if (d.contentType === 'compare' && d.compare && d.tool) ctx.addIssue({ code: 'custom', path: ['tool'], message: 'compare 글에는 compare 표와 tool 중 하나만 둔다' });
    // '신청하기'는 상태를 계산하는 지원·혜택 글에서만 쓴다
    d.actionLinks?.forEach((l, i) => {
      if (l.action === 'application') ctx.addIssue({ code: 'custom', path: ['actionLinks', i, 'action'], message: 'application 링크는 지원·혜택(benefit) 글에서만 쓴다(info·check 사용)' });
    });
    // 정리 가치: 제목·공식 링크·출처만 있는 페이지를 막는다(글자 수 기준은 두지 않는다)
    if (!d.priceItems?.length && !d.compare && !d.checklist && !d.notes && !d.quickFacts && !d.tool) {
      ctx.addIssue({ code: 'custom', path: ['notes'], message: '정리 블록이 1개 이상 필요하다(priceItems·compare·quickFacts·checklist·notes·tool 중)' });
    }
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
    // 지원·혜택 글은 공식 행동 링크가 필수. 첫 링크 = 공식 신청 링크(program.application.officialUrl, action application)
    actionLinks: z.array(actionLinkSchema).min(1),
    ads: adsSchema({ mid: slot }),
  })
  .superRefine((d, ctx) => {
    const [first] = d.actionLinks;
    if (first.action !== 'application' || first.url !== d.program.application.officialUrl) {
      ctx.addIssue({ code: 'custom', path: ['actionLinks', 0], message: '첫 행동 링크는 action application + program.application.officialUrl과 같은 URL이어야 한다' });
    }
    // 준비물은 program.application.documents 한 곳에 쓴다
    if (d.checklist) ctx.addIssue({ code: 'custom', path: ['checklist'], message: '지원·혜택 글의 준비물은 program.application.documents에 쓴다' });
    // 정리 가치는 program(조건·혜택·기간)이 스키마로 보장한다
    checkEntry(d, ctx);
  });
