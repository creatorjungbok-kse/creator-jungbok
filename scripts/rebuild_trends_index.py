#!/usr/bin/env python3
"""
trends/index.html 과 en/trends/index.html 의 글 목록을 자동 재생성.

동작:
  1. trends/ 폴더의 YYYY-MM-DD-slug.html 파일들을 스캔
  2. 각 파일에서 제목, 설명, 카테고리, 날짜 추출
  3. 날짜 역순 정렬 (최신이 맨 위)
  4. 최신 글에 NEW 배지
  5. index.html 의 <ul class="trend-list">...</ul> 블록을 재작성

사용:
  python3 scripts/rebuild_trends_index.py
  python3 scripts/rebuild_trends_index.py --lang en
"""

import argparse
import glob
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def extract_article_meta(fpath: Path, lang: str = "ko") -> dict:
    """HTML 파일에서 메타 정보 추출. lang 에 따라 읽기시간 계산 속도 조정."""
    with fpath.open(encoding="utf-8") as f:
        content = f.read()

    # 제목
    title_match = re.search(r"<title>(.+?)\s*\|", content)
    title = title_match.group(1).strip() if title_match else fpath.stem

    # meta description
    desc_match = re.search(
        r'<meta\s+name="description"\s+content="([^"]+)"', content
    )
    desc = desc_match.group(1) if desc_match else ""

    # article:section (카테고리)
    cat_match = re.search(
        r'<meta\s+property="article:section"\s+content="([^"]+)"', content
    )
    category = cat_match.group(1) if cat_match else ""

    # 파일명에서 날짜 추출
    date_match = re.match(r"(\d{4}-\d{2}-\d{2})", fpath.name)
    date = date_match.group(1) if date_match else ""

    # 본문 텍스트 길이로 읽기시간 추정
    # 한국어: 400자/분 (CJK 읽기 속도)
    # 영어: 1000자/분 (영문 평균 200wpm × 5char)
    body_match = re.search(
        r'<div class="post-body">([\s\S]*?)</div>\s*</article>', content
    )
    body_text = body_match.group(1) if body_match else content
    body_text = re.sub(r"<[^>]+>", "", body_text)
    body_text = re.sub(r"\s+", "", body_text)
    chars_per_min = 400 if lang == "ko" else 1000
    read_min = max(1, len(body_text) // chars_per_min)

    return {
        "filename": fpath.name,
        "title": title,
        "desc": desc,
        "category": category,
        "date": date,
        "read_min": read_min,
    }


def format_date_ko(date_str: str) -> str:
    """2026-04-23 → 2026-04-23 (그대로 사용)"""
    return date_str


def format_date_en(date_str: str) -> str:
    """2026-04-23 → Apr 23, 2026"""
    try:
        from datetime import datetime
        d = datetime.strptime(date_str, "%Y-%m-%d")
        return d.strftime("%b %d, %Y")
    except Exception:
        return date_str


def build_list_items_ko(articles: list) -> str:
    """한국어 목록 아이템 HTML 생성."""
    items = []
    for i, art in enumerate(articles):
        new_badge = (
            '<span class="trend-badge-new">NEW</span>' if i == 0 else ""
        )
        cat_display = f'🏷️ {art["category"]}' if art["category"] else "🏷️ AI 트렌드"
        item = f"""
      <li>
        <a href="{art['filename']}" class="trend-item">
          <h2 class="trend-title">
            {new_badge}{art['title']}
          </h2>
          <p class="trend-excerpt">{art['desc']}</p>
          <div class="trend-meta">
            <span>📅 {format_date_ko(art['date'])}</span>
            <span class="sep">·</span>
            <span>⏱ 약 {art['read_min']}분 읽기</span>
            <span class="sep">·</span>
            <span>{cat_display}</span>
          </div>
        </a>
      </li>"""
        items.append(item)
    return "\n".join(items) + "\n\n      <!-- 자동 생성되는 글이 여기에 최신순으로 추가됩니다 -->\n\n    "


def build_list_items_en(articles: list) -> str:
    """영어 목록 아이템 HTML 생성."""
    items = []
    for i, art in enumerate(articles):
        new_badge = (
            '<span class="trend-badge-new">NEW</span>' if i == 0 else ""
        )
        # 영어 카테고리 매핑
        cat_map = {
            "AI 트렌드": "AI Trends",
            "AI 툴": "AI Tools",
            "알고리즘": "Algorithms",
            "수익화": "Monetization",
        }
        cat = cat_map.get(art["category"], art["category"] or "AI Trends")
        item = f"""
      <li>
        <a href="{art['filename']}" class="trend-item">
          <h2 class="trend-title">
            {new_badge}{art['title']}
          </h2>
          <p class="trend-excerpt">{art['desc']}</p>
          <div class="trend-meta">
            <span>📅 {format_date_en(art['date'])}</span>
            <span class="sep">·</span>
            <span>⏱ {art['read_min']} min read</span>
            <span class="sep">·</span>
            <span>🏷️ {cat}</span>
          </div>
        </a>
      </li>"""
        items.append(item)
    return "\n".join(items) + "\n\n    "


def rebuild_index(lang: str) -> int:
    """lang: 'ko' 또는 'en'"""
    if lang == "ko":
        trends_dir = ROOT / "trends"
    else:
        trends_dir = ROOT / "en" / "trends"

    index_file = trends_dir / "index.html"

    if not index_file.exists():
        print(f"❌ {index_file} 없음")
        return 1

    # 글 파일 스캔 (YYYY-MM-DD 로 시작하는 HTML, index.html 제외)
    article_files = sorted(
        [p for p in trends_dir.glob("2*.html") if p.name != "index.html"],
        key=lambda p: p.name,
        reverse=True,  # 최신이 맨 위
    )

    articles = [extract_article_meta(fp, lang=lang) for fp in article_files]

    # 목록 HTML 생성
    if lang == "ko":
        new_list = build_list_items_ko(articles)
    else:
        new_list = build_list_items_en(articles)

    # index.html 읽기 + <ul class="trend-list">...</ul> 블록 교체
    with index_file.open(encoding="utf-8") as f:
        content = f.read()

    pattern = re.compile(
        r'(<ul class="trend-list">)[\s\S]*?(</ul>)',
        re.MULTILINE,
    )

    if not pattern.search(content):
        print(f"❌ {index_file} 에서 <ul class=\"trend-list\"> 블록 못 찾음")
        return 1

    new_content = pattern.sub(
        lambda m: f"{m.group(1)}{new_list}{m.group(2)}",
        content,
        count=1,
    )

    with index_file.open("w", encoding="utf-8") as f:
        f.write(new_content)

    print(f"✅ [{lang}] {index_file.name} 재생성 완료 — 글 {len(articles)}개")
    for a in articles[:5]:
        print(f"   · {a['date']} {a['title'][:50]}")
    return 0


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--lang", choices=["ko", "en", "both"], default="both")
    args = parser.parse_args()

    rc = 0
    if args.lang in ("ko", "both"):
        rc |= rebuild_index("ko")
    if args.lang in ("en", "both"):
        rc |= rebuild_index("en")
    sys.exit(rc)


if __name__ == "__main__":
    main()
