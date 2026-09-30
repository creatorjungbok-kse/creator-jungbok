// Web App Manifest. 이름은 config/site.ts에서 읽는다(브랜드 문자열을 파일에 따로 적지 않음).
// 아이콘은 꿀팁정복 최종 아이콘(원본 1:1)을 리사이즈한 파일. 모서리까지 그림이 있어 maskable이 아닌 any로 쓴다.
import { site } from '../config/site';

const manifest = {
  name: site.name,
  short_name: site.name,
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
  theme_color: '#F4B400',
  background_color: '#FFFFFF',
  display: 'standalone',
};

export function GET() {
  return new Response(JSON.stringify(manifest, null, 2), { headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' } });
}
