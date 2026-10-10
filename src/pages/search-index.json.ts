// /search-index.json: 빌드 시점 검색 인덱스(01 G, 05 8장). 지원 상태는 빌드 시점 값을 넣고 브라우저에서 다시 계산하지 않는다.
// 콘텐츠 목록은 getAllContent()와 같으므로 fixture는 isShellPreview일 때만 들어간다.
import { categories } from '../data/categories';
import { getAllContent } from '../lib/content';
import { applicationPeriod, formatDate, formatPrice } from '../lib/format';
import { normalize, type SearchDoc } from '../lib/search';
import { statusOf } from '../lib/select';
import { statusLabelFor, statusLabels } from '../lib/benefit-status';

export async function GET() {
  const docs: SearchDoc[] = (await getAllContent()).map((item) => {
    const { data } = item.entry;
    const category = categories.find((c) => c.slug === item.category)!;
    const subcategory = category.subcategories.find((s) => s.slug === data.subcategory)!;
    const program = item.kind === 'benefit' ? item.entry.data.program : undefined;
    const price = item.kind === 'article' ? item.entry.data.priceItems?.[0] : undefined;
    const detail = program
      ? `${applicationPeriod(program.application)} · ${program.benefit.text}`
      : price && `${price.label} ${formatPrice(price)}`;
    return {
      url: item.url,
      title: data.title,
      category: item.category,
      categoryName: category.name,
      type: item.kind === 'benefit' ? 'benefit' : item.entry.data.contentType,
      summary: data.summary,
      status: statusOf(item),
      statusLabel: (() => {
        const st = statusOf(item);
        const label = st && program ? statusLabelFor(st, program) : undefined;
        return label && label !== statusLabels[st!] ? label : undefined;
      })(),
      detail,
      updated: formatDate(data.dateModified),
      t: normalize(data.title),
      s: normalize([data.primaryQuery, ...(data.synonyms ?? []), subcategory.name, program?.officialName ?? ''].join(' ')),
      m: normalize([data.summary, program?.benefit.text ?? '', program?.region ?? ''].join(' ')),
    };
  });
  return new Response(JSON.stringify(docs), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
