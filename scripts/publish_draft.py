#!/usr/bin/env python3
"""
drafts/ 의 승인된 글을 trends/ 로 이동하고 사이트에 게시.

흐름:
  1. drafts/SLUG.html 과 en/drafts/SLUG.html 존재 확인
  2. trends/SLUG.html 과 en/trends/SLUG.html 로 이동
  3. rebuild_trends_index.py 실행 (목록 페이지 재생성)
  4. git add, commit, push (GitHub Pages 자동 배포)

사용:
  python3 scripts/publish_draft.py 2026-04-24-google-veo-3

옵션:
  --no-push      : 로컬만 업데이트, 커밋/푸시 생략 (테스트용)
  --dry-run      : 아무 파일도 건드리지 않고 시뮬레이션만 출력
"""

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def log(msg: str):
    print(f"[publish] {msg}")


def err(msg: str):
    print(f"[publish] ❌ {msg}", file=sys.stderr)


def read_token() -> str:
    env_file = ROOT / ".env"
    if not env_file.exists():
        return ""
    for line in env_file.read_text(encoding="utf-8").splitlines():
        if line.startswith("GITHUB_PAT="):
            return line.split("=", 1)[1].strip()
    return ""


def run_git(args: list, check: bool = True, env: dict = None) -> subprocess.CompletedProcess:
    """git 명령 실행. 토큰 안전하게 사용."""
    return subprocess.run(
        ["git", *args],
        cwd=str(ROOT),
        capture_output=True,
        text=True,
        check=check,
        env=env,
    )


def validate_drafts(slug: str) -> tuple:
    """드래프트 파일 존재 확인. 경로 반환."""
    ko_draft = ROOT / "drafts" / f"{slug}.html"
    en_draft = ROOT / "en" / "drafts" / f"{slug}.html"

    if not ko_draft.exists():
        err(f"KO 드래프트 없음: drafts/{slug}.html")
        return None, None
    if not en_draft.exists():
        err(f"EN 드래프트 없음: en/drafts/{slug}.html")
        return None, None

    return ko_draft, en_draft


def move_drafts(ko_draft: Path, en_draft: Path, slug: str, dry_run: bool) -> tuple:
    """드래프트를 trends/ 로 이동."""
    ko_target = ROOT / "trends" / f"{slug}.html"
    en_target = ROOT / "en" / "trends" / f"{slug}.html"

    if ko_target.exists():
        err(f"이미 존재: trends/{slug}.html — 중복 게시 시도")
        return None, None
    if en_target.exists():
        err(f"이미 존재: en/trends/{slug}.html")
        return None, None

    log(f"이동: drafts/{slug}.html → trends/{slug}.html")
    log(f"이동: en/drafts/{slug}.html → en/trends/{slug}.html")

    if not dry_run:
        shutil.move(str(ko_draft), str(ko_target))
        shutil.move(str(en_draft), str(en_target))

    return ko_target, en_target


def rebuild_indexes(dry_run: bool):
    """목록 페이지 재생성."""
    log("목록 페이지 재생성 중...")
    if dry_run:
        log("(dry-run: 건너뜀)")
        return 0
    rc = subprocess.run(
        ["python3", str(ROOT / "scripts" / "rebuild_trends_index.py")],
        cwd=str(ROOT),
    ).returncode
    if rc != 0:
        err("목록 재생성 실패")
    return rc


def git_commit_and_push(slug: str, dry_run: bool, no_push: bool) -> int:
    """변경사항 커밋 + 푸시."""
    if dry_run:
        log("(dry-run: git 명령 건너뜀)")
        return 0

    log("git 스테이징...")
    r = run_git(["add", "-A"], check=False)
    if r.returncode != 0:
        err(f"git add 실패: {r.stderr}")
        return r.returncode

    commit_msg = f"Publish AI trend article: {slug}"
    log(f"커밋: {commit_msg}")
    r = run_git(["commit", "-m", commit_msg], check=False)
    if r.returncode != 0:
        # 변경사항 없을 수도 있음
        if "nothing to commit" in (r.stdout + r.stderr):
            log("변경사항 없음 — 푸시 생략")
            return 0
        err(f"git commit 실패: {r.stderr}")
        return r.returncode

    if no_push:
        log("(--no-push: 푸시 생략)")
        return 0

    token = read_token()
    if not token:
        err(".env 에 GITHUB_PAT 없음. 푸시 불가.")
        return 1

    push_url = (
        f"https://x-access-token:{token}@github.com/"
        f"creatorjungbok-kse/creator-jungbok.git"
    )
    log("GitHub 원격 푸시 중...")
    r = run_git(["push", push_url, "main"], check=False)
    if r.returncode != 0:
        # 에러 출력에 토큰 포함되지 않도록 필터링
        safe_err = (r.stderr or "").replace(token, "***")
        err(f"git push 실패: {safe_err}")
        return r.returncode

    log("✅ 푸시 완료. GitHub Pages 반영까지 1~3분 대기.")
    return 0


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("slug", help="게시할 글의 slug (예: 2026-04-24-google-veo-3)")
    parser.add_argument(
        "--no-push", action="store_true", help="로컬만 업데이트, 푸시 생략"
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="파일 변경 없이 시뮬레이션"
    )
    args = parser.parse_args()

    log(f"▶ 게시 시작: {args.slug}")
    if args.dry_run:
        log("[모드: DRY RUN]")

    # 1. 드래프트 검증
    ko_draft, en_draft = validate_drafts(args.slug)
    if not ko_draft:
        return 1

    # 2. 이동
    ko_target, en_target = move_drafts(ko_draft, en_draft, args.slug, args.dry_run)
    if not ko_target:
        return 1

    # 3. 목록 재생성
    if rebuild_indexes(args.dry_run) != 0:
        return 1

    # 4. git commit + push
    if git_commit_and_push(args.slug, args.dry_run, args.no_push) != 0:
        return 1

    log(f"🎉 {args.slug} 게시 완료!")
    log(f"   KO: https://creatorjungbok.co.kr/trends/{args.slug}.html")
    log(f"   EN: https://creatorjungbok.co.kr/en/trends/{args.slug}.html")
    return 0


if __name__ == "__main__":
    sys.exit(main())
