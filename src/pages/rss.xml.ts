// /rss.xml(04 9장): 새 글·의미 있게 업데이트된 글을 알리는 보조 피드. 최근 수정일 순 최대 20개.
// 목록은 getAllContent()이므로 fixture는 isShellPreview일 때만 들어간다.
import { site } from '../config/site';
import { getAllContent } from '../lib/content';
import { absoluteUrl, escapeXml, rfc822Kst, xmlResponse } from '../lib/seo';
import { latestModified } from '../lib/select';

const RSS_LIMIT = 20;

export async function GET() {
  const items = latestModified(await getAllContent()).slice(0, RSS_LIMIT);
  const entries = items.map((i) => {
    const { data } = i.entry;
    const url = escapeXml(absoluteUrl(i.url));
    return [
      '    <item>',
      `      <title>${escapeXml(data.title)}</title>`,
      `      <link>${url}</link>`,
      `      <guid isPermaLink="true">${url}</guid>`,
      `      <description>${escapeXml(data.description ?? data.summary)}</description>`,
      `      <pubDate>${rfc822Kst(data.dateModified)}</pubDate>`,
      '    </item>',
    ].join('\n');
  });
  const lastBuild = items[0] ? `\n    <lastBuildDate>${rfc822Kst(items[0].entry.data.dateModified)}</lastBuildDate>` : '';
  const body = [
    '<rss version="2.0">',
    '  <channel>',
    `    <title>${escapeXml(site.name)}</title>`,
    `    <link>${escapeXml(absoluteUrl('/'))}</link>`,
    `    <description>${escapeXml(site.description)}</description>`,
    `    <language>${site.lang}</language>${lastBuild}`,
    ...entries,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
  return xmlResponse(body, 'application/rss+xml');
}
