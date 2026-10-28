---
title: 클로드 사용법 처음 시작부터 프로젝트와 MD 지침서 활용까지
cardTitle: 클로드 사용법
seoTitle: 클로드 사용법 프로젝트와 MD 지침서 활용
description: 클로드는 웹·앱·데스크톱에서 무료로 시작할 수 있어요. 프로젝트로 작업을 정리하고 MD 지침서로 작업을 잊지 않게 하는 법을 정리했어요.
subcategory: ai
contentType: guide
contentMode: evergreen
primaryQuery: 클로드 사용법
synonyms:
  - 클로드사용법
  - Claude 사용법
  - 클로드 프로젝트
  - 클로드프로젝트
  - 클로드 md 파일
  - 클로드 마크다운
  - 클로드 지침
  - CLAUDE.md
  - 클로드 시작하기
summary: 클로드는 claude.ai 웹, Mac·Windows 데스크톱 앱, iOS·Android 앱에서 무료로 시작할 수 있어요. 작업이 많아지면 프로젝트를 만들어 지침과 자료를 넣어 두면, 그 안의 모든 대화가 같은 지침을 참고해요. 나와 회사, 지금 하는 작업을 적은 MD 지침서 폴더를 만들어 두면 클로드가 작업을 잊지 않게 할 수 있고, 클로드 코드에서는 CLAUDE.md 파일을 시작할 때 자동으로 읽어요. 운영자는 개발자가 아닌데도 클로드 코드로 앱을 만들고 있지만, AI에게 모두 맡기지 말고 사람이 직접 지시하고 아이디어를 넣는 게 중요하다고 생각해요.
thumbnail: /images/thumbnails/claude-usage.webp
ogImage: /images/og/claude-usage.png
datePublished: 2026-10-28
dateModified: 2026-10-28
researchedAt: 2026-10-28
author: operator
ymyl: low
topics: [ai]
quickFacts:
  title: 한눈에 보기
  items:
    - label: 쓸 수 있는 곳
      value: claude.ai 웹, Mac·Windows 데스크톱 앱, iOS·Android 앱
    - label: 무료 플랜
      value: 5시간마다 초기화되는 사용량 한도, 프로젝트 최대 5개
    - label: 프로젝트
      value: 지침과 자료를 넣어 두면 그 안의 모든 대화가 참고
    - label: 클로드 코드 지침서
      value: CLAUDE.md, 세션을 시작할 때 자동으로 읽음
actionLinks:
  - org: Anthropic
    action: check
    purpose: 클로드 시작 안내 보기
    url: https://support.claude.com/en/articles/8114491-get-started-with-claude
    sourceId: local:help-start
  - org: Anthropic
    action: check
    purpose: 프로젝트 만드는 법 보기
    url: https://support.claude.com/en/articles/9519177-how-can-i-create-and-manage-projects
    sourceId: local:help-projects
faq:
  - question: 클로드에 MD 파일을 바로 올릴 수 있나요?
    answer: 공식 안내에 나온 업로드 형식은 PDF, DOCX, CSV, TXT, HTML, JSON 등이에요. MD 파일은 목록에 따로 나와 있지 않으니, 내용을 복사해 프로젝트 지침에 붙여 넣는 방법이 가장 확실해요.
  - question: 무료로도 프로젝트를 쓸 수 있나요?
    answer: 네. 프로젝트는 무료 계정도 쓸 수 있고, 무료는 최대 5개까지 만들 수 있어요.
  - question: CLAUDE.md는 어디에 두나요?
    answer: 작업하는 폴더(프로젝트 폴더)에 ./CLAUDE.md로 두면 그 프로젝트에서, 내 홈 폴더 안 .claude 폴더에 CLAUDE.md로 두면 모든 프로젝트에서 읽어요. 클로드 코드에서 /init을 입력하면 처음 파일을 자동으로 만들어 줘요.
  - question: 클로드가 지난 대화를 기억하나요?
    answer: 메모리 기능이 있어서 대화를 바탕으로 기억을 만들 수 있어요. 지난 대화를 검색해 참고하는 기능은 Pro, Max, Team, Enterprise 같은 유료 플랜에서 돼요.
related: [/digital/claude-pricing/, /digital/claude-code-pricing/, /digital/claude-discount/]
sourceIds: [local:help-start, local:help-signin, local:code-setup, local:help-projects, local:help-upload, local:help-memory, local:help-instructions, local:code-memory]
localSources:
  - id: local:help-signin
    title: Claude 로그인 방법(구글·이메일)
    publisher: Anthropic
    url: https://support.claude.com/en/articles/13189465
    level: S1
    checkedAt: 2026-10-28
  - id: local:code-setup
    title: Claude Code 설치(Set up Claude Code)
    publisher: Anthropic
    url: https://code.claude.com/docs/en/setup
    level: S1
    checkedAt: 2026-10-28
  - id: local:help-start
    title: Get started with Claude
    publisher: Anthropic
    url: https://support.claude.com/en/articles/8114491-get-started-with-claude
    level: S1
    checkedAt: 2026-10-28
  - id: local:help-projects
    title: How can I create and manage projects?
    publisher: Anthropic
    url: https://support.claude.com/en/articles/9519177-how-can-i-create-and-manage-projects
    level: S1
    checkedAt: 2026-10-28
  - id: local:help-upload
    title: Uploading files to Claude(지원 파일 형식과 크기)
    publisher: Anthropic
    url: https://support.claude.com/en/articles/8241126
    level: S1
    checkedAt: 2026-10-28
  - id: local:help-memory
    title: Use Claude's chat search and memory
    publisher: Anthropic
    url: https://support.claude.com/en/articles/11817273
    level: S1
    checkedAt: 2026-10-28
  - id: local:help-instructions
    title: Understanding Claude's personalization features(지침)
    publisher: Anthropic
    url: https://support.claude.com/en/articles/10185728
    level: S1
    checkedAt: 2026-10-28
  - id: local:code-memory
    title: Claude Code 메모리(CLAUDE.md)
    publisher: Anthropic
    url: https://code.claude.com/docs/en/memory
    level: S1
    checkedAt: 2026-10-28
---

저는 1년 넘게 꾸준히 클로드를 써 왔어요. 지금은 개발자가 아닌데도 클로드로 앱까지 만들고 있어요.

이 글에는 클로드를 처음 시작하는 법, 작업을 정리하는 프로젝트, 그리고 제가 꼭 추천하는 'MD 지침서' 만드는 법을 핵심만 담았어요. 기능 설명은 2026년 10월 28일 공식 도움말 기준이에요.

## 클로드 시작하기

클로드는 세 곳에서 쓸 수 있어요. 어디서 쓰든 같은 계정으로 이어져요.

| 어디서 | 방법 |
|---|---|
| 웹 | 브라우저에서 claude.ai 접속 |
| 데스크톱 앱 | Mac, Windows용 앱 설치 |
| 모바일 앱 | iOS, Android 앱 설치 |

가입은 구글 계정으로 하거나 이메일로 받은 로그인 링크로 할 수 있어요. 처음엔 무료로 써 보고, 부족하면 그때 유료로 바꿔도 돼요.

무료 플랜은 5시간마다 초기화되는 사용량 한도가 있어요. 요금제별 차이는 [클로드 요금제](/digital/claude-pricing/) 글에 정리해 두었어요.

## 클로드 프로젝트로 작업 정리하기

대화가 쌓이면 매번 "나는 이런 일을 하고 있어"라고 다시 설명하기 번거롭죠. 이럴 때 프로젝트를 쓰면 편해요.

프로젝트에 지침과 자료를 넣어 두면, 그 프로젝트 안의 모든 대화가 같은 지침과 자료를 참고해요. 무료 계정도 쓸 수 있고, 무료는 최대 5개까지 만들 수 있어요.

<figure class="shot">
  <a href="/images/articles/claude-usage-project.svg" class="shot__zoom"><img src="/images/articles/claude-usage-project.svg" width="800" height="920" alt="claude.ai 웹·데스크톱 기준 클로드 프로젝트 만드는 법. 1 왼쪽 사이드바에서 Projects를 클릭한다. 2 오른쪽 위 + New Project로 새 프로젝트를 만든다. 3 Set project instructions에 기초 지침을 붙여 넣는다. 4 프로젝트 지식에 PDF, DOCX, TXT 같은 자료를 올린다. 5 그 안에서 대화하면 모든 대화가 지침과 자료를 함께 참고한다." loading="lazy" decoding="async"></a>
  <figcaption>프로젝트를 하나 만들어 지침과 자료를 넣어 두세요.</figcaption>
</figure>

| 넣는 곳 | 무엇을 |
|---|---|
| 프로젝트 지침 | 이 프로젝트에서 클로드가 지킬 규칙, 나와 작업 소개 |
| 프로젝트 지식 | 참고 자료 파일(PDF, DOCX, CSV, TXT 등) |

프로젝트에 올리는 파일은 한 개에 30MB까지예요. 파일 수는 정해져 있지 않지만, 전체 내용이 클로드가 한 번에 볼 수 있는 양 안에 들어가야 해요.

## MD 지침서 폴더 만들기

제가 꼭 추천하고 싶은 방법이에요. 작업을 잊어버리지 않게 하려고 폴더를 하나 만들고, 그 안에 기초 지침서를 MD 파일로 정리해 둬요.

MD(마크다운) 파일은 제목과 목록 정도만 쓰는 아주 단순한 글 파일이에요. 메모장으로도 만들 수 있어요.

### MD 파일 저장하는 법

1. 메모장을 열고 지침 내용을 적어요.
2. 파일 > 다른 이름으로 저장을 눌러요.
3. 파일 형식을 '모든 파일'로 바꾸고, 파일 이름을 about-me.md처럼 끝에 .md를 붙여 적어요.
4. 인코딩은 UTF-8로 두고 저장해요. 한글이 깨지지 않아요.

<figure class="shot">
  <a href="/images/articles/claude-usage-folder.svg" class="shot__zoom"><img src="/images/articles/claude-usage-folder.svg" width="800" height="842" alt="클로드가 작업을 잊지 않게 하는 기초 지침서 폴더 예시. about-me.md에는 나는 누구인지와 원하는 답변 방식, company.md에는 우리 회사와 브랜드 소개와 하는 일, current-work.md에는 지금 하고 있는 작업과 진행 상황을 적는다. 클로드 앱에서는 프로젝트 지침에 붙여 넣고, 클로드 코드에서는 CLAUDE.md로 두면 자동으로 읽는다." loading="lazy" decoding="async"></a>
  <figcaption>파일 이름은 예시예요. 나에게 맞게 바꿔도 돼요.</figcaption>
</figure>

이 폴더에 적어 두는 건 크게 세 가지예요.

- **나에 대해**: 어떤 일을 하는 사람인지, 어떤 말투와 형식으로 답해 주면 좋은지
- **우리 회사에 대해**: 회사나 브랜드가 하는 일, 지켜야 할 원칙
- **지금 하는 작업**: 어떤 작업인지, 어디까지 했고 다음에 무엇을 할지

이렇게 해 두면 새 대화를 열 때마다 처음부터 설명할 필요가 없어요. 작업이 바뀌면 지금 하는 작업 파일만 고쳐 주면 되고요!

### 클로드 앱에서 쓰는 법

MD 파일 내용을 복사해서 프로젝트 지침에 붙여 넣으면 돼요. 공식 안내의 업로드 형식 목록에는 MD가 따로 나와 있지 않아서, 붙여 넣는 방법이 가장 확실해요.

모든 대화에 똑같이 적용하고 싶은 내용은 설정 > Your Claude > 지침(Instructions)에 넣어 둘 수도 있어요. 여기에 넣은 내용은 모든 대화에 적용돼요.

### 클로드 코드에서 쓰는 법

클로드 코드는 CLAUDE.md라는 지침서를 세션을 시작할 때 자동으로 읽어요. 따로 붙여 넣을 필요가 없어요.

| 위치 | 적용 범위 |
|---|---|
| 작업 폴더의 ./CLAUDE.md 또는 ./.claude/CLAUDE.md | 그 프로젝트에서 |
| 내 홈 폴더 안 .claude 폴더의 CLAUDE.md | 내 컴퓨터의 모든 프로젝트에서 |

처음이라면 클로드 코드에서 /init을 입력해 보세요. 기본 CLAUDE.md를 자동으로 만들어 주고, 이미 있으면 덮어쓰지 않고 고칠 점을 제안해요. /memory를 입력하면 지침서 파일을 열어서 고칠 수 있어요.

공식 문서는 파일 하나를 200줄 이하로 짧게 유지하라고 권해요. 길게 쓰기보다 핵심만 적는 게 좋아요.

## 클로드 코드로 앱 만들기

저는 개발자가 아닌데도 클로드 코드로 앱을 만들고 있어요. 클로드 코드가 알아서 해 주는 거죠.

처음에는 뭐가 뭔지 하나도 몰랐어요. 그래도 하다 보니까 익숙해지더라고요.

클로드 코드는 무료 플랜에서는 쓸 수 없고 Pro부터 쓸 수 있어요. 어떤 요금제가 맞는지는 [클로드 코드 요금제](/digital/claude-code-pricing/) 글에 제 경험과 함께 정리해 두었어요.

## AI에게 모두 맡기지 마세요

이건 꼭 말하고 싶어요. 모든 것을 AI에게 맡기면 안 돼요.

무조건 사람이 개입해서 명령을 내리고, 내 아이디어를 반영하는 게 중요해요. 앞에서 말한 지침서도 내 아이디어를 AI에게 전하는 방법 중 하나예요.
