/* ============================================================
   AI 유튜브 완전정복 — main.js
   ============================================================ */

const CHAPTERS = [
  { num: '•',  title: 'AI 유튜브란?',        file: '00-AI유튜브란.html',   desc: 'AI 유튜브 개요, 쇼츠 vs 롱폼, 수익화' },
  { num: '01', title: '구글 계정 만들기',    file: '01-계정만들기.html',   desc: 'Google 계정부터 유튜브 채널 개설까지' },
  { num: '02', title: '내 채널 만들기',       file: '02-채널완성.html',     desc: '채널명과 핸들 설정 — 내 채널 개설' },
  { num: '03', title: '채널 꾸미기',          file: '03-채널꾸미기.html',   desc: '채널 사진과 배너 이미지 만들고 등록하기' },
  { num: '04', title: '채널 세팅하기',        file: '04-채널세팅.html',     desc: '기본 설정부터 기능 자격 요건까지' },
  { num: '05', title: '유튜브 스튜디오 둘러보기', file: '05-스튜디오둘러보기.html', desc: '대시보드부터 오디오 보관함까지 전체 메뉴 파악' },
  { num: '끝', title: '마무리',                  file: '마무리.html',            desc: '유튜브 기초 완료. 다음은 진짜 실전.' },
];

/* ---- 챕터 목록 반환 ---- */
function flatChapters() {
  return CHAPTERS;
}

/* ---- 현재 파일명 ---- */
function currentFile() {
  const parts = location.pathname.split('/').filter(Boolean);
  return decodeURIComponent(parts[parts.length - 1] || '');
}

/* ---- 링크 경로 보정 ---- */
function resolveHref(file) {
  return file;
}

/* ---- 사이드바 빌드 ---- */
function buildSidebar() {
  const el = document.getElementById('sidebar-list');
  if (!el) return;
  const cur = currentFile();

  let html = '';
  CHAPTERS.forEach(ch => {
    const isActive = ch.file === cur;
    html += `
      <li>
        <a href="${resolveHref(ch.file)}" class="${isActive ? 'active' : ''}">
          <span class="sidebar-num">${ch.num === '•' || ch.num === '끝' ? '' : '챕터 ' + ch.num}</span>
          ${ch.title}
        </a>
      </li>
    `;
  });
  el.innerHTML = html;
}

/* ---- 진행 바 ---- */
function buildProgress() {
  const cur = currentFile();
  const flat = flatChapters();
  const idx = flat.findIndex(ch => ch.file === cur || ch.file.endsWith('/' + cur));
  if (idx < 0) return;
  const pct = Math.round(((idx + 1) / flat.length) * 100);
  const fill = document.getElementById('progress-fill');
  const label = document.getElementById('progress-label');
  if (fill) fill.style.width = pct + '%';
  if (label) label.textContent = `${flat.length}개 중 ${idx + 1}번째`;
}

/* ---- 이전/다음 내비 ---- */
function buildNav() {
  const cur = currentFile();
  const flat = flatChapters();
  const idx = flat.findIndex(ch => ch.file === cur || ch.file.endsWith('/' + cur));
  if (idx < 0) return;
  const prev = idx > 0 ? flat[idx - 1] : null;
  const next = idx < flat.length - 1 ? flat[idx + 1] : null;

  const navEl = document.getElementById('post-nav');
  if (!navEl) return;
  navEl.innerHTML = `
    ${prev ? `<a href="${resolveHref(prev.file)}" class="prev">
      <span class="nav-dir">← 이전</span>
      <span class="nav-title">${prev.title}</span>
    </a>` : ''}
    ${next ? `<a href="${resolveHref(next.file)}" class="next">
      <span class="nav-dir">다음 →</span>
      <span class="nav-title">${next.title}</span>
    </a>` : ''}
  `;
}

/* ---- 홈 최신글 캐러셀 ---- */
(function () {
  var cur = 0;

  function update() {
    var pages = document.querySelectorAll('#postTrack .carousel-page');
    var total = pages.length;
    if (!total) return;
    var track = document.getElementById('postTrack');
    var counter = document.getElementById('carouselCounter');
    var prevBtn = document.getElementById('carouselPrev');
    var nextBtn = document.getElementById('carouselNext');
    if (track)   track.style.transform = 'translateX(-' + (cur * 100) + '%)';
    if (counter) counter.textContent = (cur + 1) + ' / ' + total;
    if (prevBtn) prevBtn.disabled = cur === 0;
    if (nextBtn) nextBtn.disabled = cur === total - 1;
  }

  window.carouselMove = function (dir) {
    var pages = document.querySelectorAll('#postTrack .carousel-page');
    cur = Math.max(0, Math.min(pages.length - 1, cur + dir));
    update();
  };

  function buildLatestPosts() {
    var track = document.getElementById('postTrack');
    if (!track) return;

    var PER_PAGE = 4;
    var html = '';
    for (var i = 0; i < CHAPTERS.length; i += PER_PAGE) {
      var page = CHAPTERS.slice(i, i + PER_PAGE);
      html += '<div class="carousel-page">';
      page.forEach(function (ch) {
        var numDisplay = (ch.num === '•' || ch.num === '끝') ? ch.num : ch.num;
        html += '<a href="posts/' + ch.file + '" class="quick-card">'
          + '<span class="quick-num">' + numDisplay + '</span>'
          + '<div class="quick-info">'
          + '<div class="quick-name">' + ch.title + '</div>'
          + '<p class="quick-desc">' + ch.desc + '</p>'
          + '</div>'
          + '</a>';
      });
      html += '</div>';
    }
    track.innerHTML = html;
    cur = 0;
    update();
  }

  document.addEventListener('DOMContentLoaded', buildLatestPosts);
})();

/* ---- 초기화 ---- */
document.addEventListener('DOMContentLoaded', () => {
  buildSidebar();
  buildProgress();
  buildNav();
});
