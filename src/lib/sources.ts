// 글이 인용한 출처 목록. 검증(content-schema)과 화면(SourceList)이 같은 목록을 쓴다.
import { commonSources, type Source } from '../data/sources';
import { toolSourceIds, type ToolId } from '../tools/registry';

interface SourceRef {
  path: (string | number)[];
  id: string;
  // 공식(S1) 출처만 허용되는 위치
  mustBeS1?: boolean;
}

interface SourceFields {
  sourceIds?: string[];
  localSources?: Source[];
  priceItems?: { sourceIds: string[] }[];
  compare?: { rows: { sourceIds?: string[] }[] };
  actionLinks?: { sourceId: string }[];
  tool?: ToolId;
  change?: { officialSourceIds: string[] };
  program?: {
    officialSourceIds: string[];
    eligibility: { sourceId: string }[];
    exclusions?: { sourceId: string }[];
    benefit: { sourceId: string };
    statusOverride?: { sourceId: string };
    statusNote?: { sourceId: string };
    application?: { pauses?: { sourceId: string }[] };
  };
}

// 글 안에서 출처 id가 쓰인 모든 위치
export function sourceRefs(d: SourceFields): SourceRef[] {
  const p = d.program;
  const s1 = (path: (string | number)[], id: string) => ({ path, id, mustBeS1: true });
  return [
    ...(d.sourceIds ?? []).map((id, i) => ({ path: ['sourceIds', i], id })),
    ...(d.priceItems ?? []).flatMap((item, i) => item.sourceIds.map((id, j) => ({ path: ['priceItems', i, 'sourceIds', j], id }))),
    ...(d.compare?.rows ?? []).flatMap((row, i) => (row.sourceIds ?? []).map((id, j) => ({ path: ['compare', 'rows', i, 'sourceIds', j], id }))),
    ...(d.actionLinks ?? []).map((link, i) => s1(['actionLinks', i, 'sourceId'], link.sourceId)),
    // 도구 상수의 근거(공통 출처). 도구 숫자는 공식 출처만
    ...(d.tool ? toolSourceIds[d.tool].map((id) => s1(['tool'], id)) : []),
    ...(d.change?.officialSourceIds ?? []).map((id, i) => s1(['change', 'officialSourceIds', i], id)),
    ...(p
      ? [
          ...p.officialSourceIds.map((id, i) => s1(['program', 'officialSourceIds', i], id)),
          ...p.eligibility.map((e, i) => s1(['program', 'eligibility', i, 'sourceId'], e.sourceId)),
          ...(p.exclusions ?? []).map((e, i) => s1(['program', 'exclusions', i, 'sourceId'], e.sourceId)),
          s1(['program', 'benefit', 'sourceId'], p.benefit.sourceId),
          ...(p.statusOverride ? [s1(['program', 'statusOverride', 'sourceId'], p.statusOverride.sourceId)] : []),
          ...(p.statusNote ? [s1(['program', 'statusNote', 'sourceId'], p.statusNote.sourceId)] : []),
          ...(p.application?.pauses ?? []).map((x, i) => s1(['program', 'application', 'pauses', i, 'sourceId'], x.sourceId)),
        ]
      : []),
  ];
}

const commonById = new Map(commonSources.map((s) => [s.id, s]));

export const sourceResolver = (d: SourceFields) => {
  const local = new Map((d.localSources ?? []).map((s) => [s.id, s]));
  return (id: string) => (id.startsWith('local:') ? local.get(id) : commonById.get(id));
};

// 화면에 보여줄 출처: 실제로 인용된 것만, 처음 인용된 순서로, 중복 없이
export function citedSources(d: SourceFields): Source[] {
  const resolve = sourceResolver(d);
  const ids = [...new Set(sourceRefs(d).map((r) => r.id))];
  return ids.map(resolve).filter((s): s is Source => s !== undefined);
}
