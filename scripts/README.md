# scripts/ — 자동화 스크립트

creatorjungbok.co.kr AI 트렌드 섹션 자동 게시 시스템.

## 파일

| 파일 | 역할 |
|------|------|
| `rebuild_trends_index.py` | `trends/index.html` + `en/trends/index.html` 목록 자동 재생성 |
| `publish_draft.py` | `drafts/` 승인된 글을 `trends/` 로 이동 + 목록 재생성 + git push |

## 워크플로

```
밤 03:00 (자동):
  Claude가 새 글 생성 → drafts/YYYY-MM-DD-slug.html (KO)
                      → en/drafts/YYYY-MM-DD-slug.html (EN)

아침 (CEO 승인):
  python3 scripts/publish_draft.py YYYY-MM-DD-slug
    ├─ drafts/ → trends/ 이동
    ├─ 목록 페이지 자동 재생성
    └─ git commit + push
```

## 수동 실행 (테스트)

```bash
# 목록만 재생성 (기존 글 기준)
python3 scripts/rebuild_trends_index.py
python3 scripts/rebuild_trends_index.py --lang ko
python3 scripts/rebuild_trends_index.py --lang en

# 드래프트 게시 (실제 푸시)
python3 scripts/publish_draft.py 2026-04-24-example

# 드래프트 게시 (로컬만, 푸시 안 함 — 테스트용)
python3 scripts/publish_draft.py 2026-04-24-example --no-push

# 완전 dry-run (아무것도 안 건드림, 흐름만 확인)
python3 scripts/publish_draft.py 2026-04-24-example --dry-run
```

## 주의사항

- `drafts/` 는 `.gitignore` 에 포함 — GitHub에 업로드 안 됨
- `publish_draft.py` 는 `.env` 의 `GITHUB_PAT` 으로 인증
- 토큰은 절대 stdout/stderr 에 노출되지 않도록 필터링됨
- 같은 slug 이미 trends/ 에 있으면 게시 중단 (중복 방지)
