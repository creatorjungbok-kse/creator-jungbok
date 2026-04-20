/* AI 유튜브 실전 — 롱폼 사이드바 아코디언 네비게이션 */

const PRACTICE_NAV = [
  {
    label: '채널 준비',
    items: [
      { title: '주제 정하기',        file: '주제정하기.html' },
      { title: '알고리즘 세팅',      file: '알고리즘세팅.html' },
      { title: '벤치마킹',           file: '벤치마킹.html' },
      { title: 'AI 툴 소개',         file: 'AI툴소개.html' },
      { title: '시작 전 체크리스트', file: '시작전체크리스트.html' },
    ]
  },
  {
    label: '영상 제작',
    sub: [
      {
        label: 'AI 건강 채널',
        items: [
          { title: '대본 작성하기', file: '대본작성하기-건강.html' },
          { title: '이미지 만들기',               file: '이미지만들기-건강.html' },
          { title: 'HeyGen으로 동영상 만들기', file: 'heygen-건강.html' },
          { title: '이미지 → 동영상 변환하기',       file: '동영상변환-건강.html' },
          { title: '편집하기 (Vrew)',               file: '편집하기-건강.html' },
        ]
      }
    ]
  },
  {
    label: '업로드하기',
    sub: [
      {
        label: '썸네일 만들기',
        items: [
          { title: 'AI 건강 채널 썸네일 만들기', file: '썸네일-건강.html' },
        ]
      }
    ],
    items: [
      { title: '제목 · 설명 · 태그 작성하기', file: '제목설명태그.html' },
      { title: '업로드하기', file: '업로드하기.html' },
    ]
  }
];

function buildPracticeNav() {
  var el = document.getElementById('practice-nav-list');
  if (!el) return;

  var cur = decodeURIComponent(location.pathname.split('/').filter(Boolean).pop() || '');

  function subHasCurrent(sub) {
    return sub.items.some(function(item) { return item.file === cur; });
  }

  function sectionHasCurrent(section) {
    if (section.items && section.items.some(function(i) { return i.file === cur; })) return true;
    if (section.sub && section.sub.some(subHasCurrent)) return true;
    return false;
  }

  var html = '';

  PRACTICE_NAV.forEach(function(section) {
    var isOpen = sectionHasCurrent(section);
    html += '<li class="snav-section' + (isOpen ? ' snav-open' : '') + '">';
    html += '<button class="snav-btn" onclick="snavToggle(this)">'
          + section.label
          + '<span class="snav-arrow">›</span>'
          + '</button>';
    html += '<ul class="snav-body">';

    if (section.sub) {
      section.sub.forEach(function(sub) {
        var subOpen = subHasCurrent(sub);
        html += '<li class="snav-sub-section' + (subOpen ? ' snav-sub-open' : '') + '">';
        html += '<button class="snav-sub-btn" onclick="snavSubToggle(this)">'
              + sub.label
              + '<span class="snav-arrow">›</span>'
              + '</button>';
        html += '<ul class="snav-sub-body">';
        sub.items.forEach(function(item) {
          var active = item.file === cur ? ' active' : '';
          html += '<li><a href="' + item.file + '" class="snav-sub-item' + active + '">' + item.title + '</a></li>';
        });
        html += '</ul></li>';
      });
    }

    if (section.items) {
      section.items.forEach(function(item) {
        var active = item.file === cur ? ' active' : '';
        html += '<li><a href="' + item.file + '" class="' + active + '">' + item.title + '</a></li>';
      });
    }

    html += '</ul></li>';
  });

  el.innerHTML = html;
}

function snavToggle(btn) {
  btn.closest('.snav-section').classList.toggle('snav-open');
}

function snavSubToggle(btn) {
  btn.closest('.snav-sub-section').classList.toggle('snav-sub-open');
}

document.addEventListener('DOMContentLoaded', buildPracticeNav);
