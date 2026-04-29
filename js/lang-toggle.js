/* ============================================================
   Language Toggle + Auto-Routing
   2026-04-28 — 첫 방문 시 navigator.language 감지 → /en/ 또는 /
   토글 클릭 시 localStorage 저장 + 짝꿍 페이지로 이동
   ============================================================ */

(function() {
  'use strict';

  var STORAGE_KEY = 'cj-lang-pref';
  var path = location.pathname;
  var isEnPage = path.indexOf('/en/') === 0 || path === '/en';

  // === 1. 첫 방문 자동 라우팅 (localStorage 없을 때만) ===
  function autoRoute() {
    var saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch(e) {}

    // 저장된 선택 있으면 그대로 (자동 라우팅 X)
    if (saved) return;

    // 브라우저 언어 감지
    var lang = (navigator.language || navigator.userLanguage || 'ko').toLowerCase();
    var prefersEn = lang.indexOf('en') === 0;

    // 영어권 사용자 + KO 페이지 진입 → /en/ 으로 자동 리다이렉트
    if (prefersEn && !isEnPage) {
      try { localStorage.setItem(STORAGE_KEY, 'en'); } catch(e) {}
      var enUrl = '/en' + (path === '/' ? '/' : path);
      location.replace(enUrl);
      return;
    }

    // 한국어 사용자 + EN 페이지 진입 → KO로 자동 리다이렉트는 X (사용자가 의도적 영문 진입일 수 있음)
    // 단 첫 방문 한국어 기록만 저장
    if (!prefersEn) {
      try { localStorage.setItem(STORAGE_KEY, 'ko'); } catch(e) {}
    }
  }

  // === 2. 토글 클릭 핸들러 ===
  function setupToggle() {
    var toggleLinks = document.querySelectorAll('.lang-toggle a[data-lang], .lang-toggle-mobile a[data-lang], .lang-switch a[data-lang]');
    if (!toggleLinks.length) return;

    toggleLinks.forEach(function(link) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        var targetLang = this.getAttribute('data-lang');

        // 저장
        try { localStorage.setItem(STORAGE_KEY, targetLang); } catch(e) {}

        // 짝꿍 페이지로 이동
        var newPath;
        if (targetLang === 'en' && !isEnPage) {
          // KO → EN: /trends/ → /en/trends/
          newPath = '/en' + (path === '/' ? '/' : path);
        } else if (targetLang === 'ko' && isEnPage) {
          // EN → KO: /en/trends/ → /trends/
          newPath = path.replace(/^\/en/, '') || '/';
        } else {
          // 같은 언어 — 그대로
          return;
        }
        location.href = newPath;
      });
    });

    // 현재 언어에 active 클래스
    toggleLinks.forEach(function(link) {
      var linkLang = link.getAttribute('data-lang');
      if ((isEnPage && linkLang === 'en') || (!isEnPage && linkLang === 'ko')) {
        link.classList.add('lang-active');
      } else {
        link.classList.remove('lang-active');
      }
    });
  }

  // === 실행 ===
  autoRoute();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupToggle);
  } else {
    setupToggle();
  }
})();
