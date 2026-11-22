---
title: 클로드 코드 사용법 데스크톱 앱에서 설치 없이 시작하는 법과 개발자 아니어도 쓰는 요령
cardTitle: 클로드 코드
seoTitle: 클로드 코드 사용법 데스크톱 앱에서 설치 없이 시작하기
description: 클로드 코드를 데스크톱 앱 Code 탭에서 바로 시작하는 순서와 권한 모드, 사용량 한도, 개발자가 아니어도 쓰는 요령을 정리했어요.
author: operator
ymyl: low
topics: [ai]
datePublished: 2026-11-22
dateModified: 2026-11-22
researchedAt: 2026-11-22
contentType: guide
contentMode: evergreen
subcategory: ai
primaryQuery: 클로드 코드
synonyms:
  - 클로드코드
  - Claude Code
  - 클로드 코드 사용법
  - 클로드 코드 설치
  - 클로드 코드 시작
  - 클로드 코드 데스크톱
  - 클로드 코드 초보
  - 바이브 코딩
  - AI 코딩
  - 코딩 몰라도 앱 만들기
summary: 클로드 코드는 말로 설명하면 AI가 코드를 직접 짜고 파일을 고쳐 주는 도구예요. 이제는 Claude 데스크톱 앱의 Code 탭에서 터미널 설치 없이 바로 쓸 수 있어요. 쓰려면 Pro 이상 요금제가 필요하고, 사용량은 채팅과 같은 한도를 나눠 써요. 처음엔 Plan이나 Manual 모드로 계획과 수정을 하나씩 확인하며 쓰는 게 안전해요. 코딩을 몰라도 간단한 앱은 만들 수 있지만, 오류를 찾는 건 아직 공부가 필요해요.
summaryBold:
  - 코드를 직접 짜고 파일을 고쳐
  - Code 탭에서 터미널 설치 없이
  - Pro 이상 요금제
  - 채팅과 같은 한도
  - Plan이나 Manual 모드
thumbnail: /images/thumbnails/claude-code.webp
ogImage: /images/og/claude-code.png
quickFacts:
  title: 2026년 11월 22일 기준
  items:
    - label: 시작하는 곳
      value: Claude 데스크톱 앱 Code 탭(터미널 설치 불필요)
    - label: 필요한 요금제
      value: Pro, Max 이상(무료 불가)
    - label: 사용량
      value: 채팅과 같은 한도 공유, 5시간 한도와 주간 한도
    - label: 지원 기기
      value: 맥, 윈도우, 리눅스(베타)
    - label: 권한 모드
      value: Auto, Accept edits, Manual, Plan
checklist:
  title: 클로드 코드 시작 전에 확인할 것
  items:
    - Pro 이상 요금제인지 확인해요.
    - 작업할 폴더를 하나 새로 만들어요.
    - 처음엔 Plan이나 Manual 모드로 시작해요.
    - 중요한 파일은 미리 백업해 둬요.
notes:
  - 메뉴 이름과 요금제는 Claude 업데이트에 따라 바뀔 수 있어요.
actionLinks:
  - org: Anthropic
    action: info
    purpose: 클로드 코드 데스크톱 시작 공식 안내 보기
    url: https://code.claude.com/docs/en/desktop-quickstart
    sourceId: local:cc-desktop
  - org: Anthropic
    action: info
    purpose: 요금제별 클로드 코드 사용 공식 안내 보기
    url: https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan
    sourceId: local:cc-plan
faq:
  - question: 클로드 코드 무료로 쓸 수 있나요?
    answer: 아니요. 클로드 코드는 Pro, Max 같은 유료 요금제가 있어야 써요. 무료 계정에서는 Code 탭에서 업그레이드 안내가 나와요.
  - question: 클로드 코드 설치가 어려운데요.
    answer: 이제는 Claude 데스크톱 앱만 설치하면 Code 탭에서 바로 쓸 수 있어요. 터미널에서 명령어를 입력하거나 Node.js를 따로 설치하지 않아도 돼요.
  - question: 클로드 코드를 쓰면 채팅 한도도 줄어드나요?
    answer: 네. 클로드 코드와 채팅은 같은 사용량 한도를 나눠 써요. Pro와 Max는 5시간 한도와 주간 한도가 있어요.
  - question: 개발자가 아니어도 클로드 코드를 쓸 수 있나요?
    answer: 간단한 앱이나 사이트는 코딩을 몰라도 AI가 만들고 내가 검수하는 방식으로 만들 수 있어요. 다만 중간에 생긴 오류를 찾는 건 아직 어려워서 조금씩 공부하면서 쓰는 게 좋아요.
related: [/digital/claude-code-pricing/, /digital/claude-usage/]
sourceIds: [local:cc-desktop, local:cc-plan, local:cc-first]
localSources:
  - id: local:cc-desktop
    title: Get started with the desktop app
    publisher: Anthropic
    url: https://code.claude.com/docs/en/desktop-quickstart
    level: S1
    checkedAt: 2026-11-22
  - id: local:cc-plan
    title: Use Claude Code with your Pro, Max, or Ultra plan
    publisher: Anthropic
    url: https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan
    level: S1
    checkedAt: 2026-11-22
  - id: local:cc-first
    title: Your first day in Claude Code
    publisher: Anthropic
    url: https://support.claude.com/en/articles/14552382-your-first-day-in-claude-code
    level: S1
    checkedAt: 2026-11-22
---

클로드 코드가 좋다는 얘기는 많이 들리는데, 검은 화면에 명령어부터 쳐야 한다니 시작도 전에 겁이 나죠. 개발자가 아니라면 더 그래요.

저도 예전엔 PowerShell을 켜고 명령어로 써야 해서 꽤 어려웠어요. 그런데 지금은 데스크톱 앱 대화창 안에 아예 들어가 있어서, 초보자도 쉽게 시작할 수 있게 됐어요. 요즘 저는 클로드 코드로 앱을 만들고, 게임을 만들고, 이것저것 꽤 다양하게 굴려 보는 중이에요.

## 클로드 코드 데스크톱 앱에서 시작하는 법

<figure class="shot">
  <a href="/images/articles/claude-code-card-1.webp" class="shot__zoom"><img src="/images/articles/claude-code-card-1.webp" width="800" height="774" alt="클로드 코드 시작하는 법. 1 Claude 데스크톱 앱을 설치하고 로그인해요. 2 사이드바 맨 위 Code 탭을 눌러요. 3 Local을 고르고 Open folder로 작업 폴더를 열어요. 4 원하는 걸 말하고 권한 모드를 확인해요." loading="lazy" decoding="async"></a>
  <figcaption>Node.js나 터미널 설치 없이 바로 쓸 수 있어요.</figcaption>
</figure>

1. **Claude 데스크톱 앱**을 설치하고 로그인해요
2. 사이드바 맨 위의 **Code** 탭을 눌러요
3. 입력창 아래에서 **Local**을 고르고, 옆의 폴더 버튼에서 **Open folder**로 작업할 폴더를 열어요
4. 오른쪽에서 모델을 고르고, 만들고 싶은 걸 말로 설명해요

이 방법은 **Node.js나 터미널 설치가 필요 없어요.** 맥, 윈도우에서 다 되고 리눅스는 베타로 지원해요.

### 클로드 코드 권한 모드 고르는 법

<figure class="shot">
  <a href="/images/articles/claude-code-card-4.webp" class="shot__zoom"><img src="/images/articles/claude-code-card-4.webp" width="800" height="570" alt="권한 모드 고르는 법. Plan은 계획만 먼저 보여 주고, Manual은 하나씩 허락을 받고, Accept edits는 파일 수정을 자동으로 하고, Auto는 알아서 진행해요." loading="lazy" decoding="async"></a>
  <figcaption>처음엔 Plan이나 Manual로 시작하면 안전해요.</figcaption>
</figure>

입력창 아래에서 클로드가 얼마나 알아서 움직일지 고를 수 있어요.

- **Plan:** 바로 고치지 않고 계획부터 보여 줘요
- **Manual:** 파일을 바꿀 때마다 하나씩 허락을 받아요
- **Accept edits:** 파일 수정은 자동으로 해요
- **Auto:** 알아서 쭉 진행해요

처음엔 **Plan**이나 **Manual**로 시작하는 게 안전해요. 뭘 바꾸는지 보면서 익숙해진 다음에 자동으로 넘어가면 돼요.

## 클로드 코드 요금제와 사용량

<figure class="shot">
  <a href="/images/articles/claude-code-card-2.webp" class="shot__zoom"><img src="/images/articles/claude-code-card-2.webp" width="800" height="419" alt="클로드 코드 쓰려면. Pro 이상 요금제가 필요하고 무료로는 안 돼요. 채팅과 사용량 한도를 같이 써요." loading="lazy" decoding="async"></a>
  <figcaption>Pro와 Max는 5시간 한도와 주간 한도가 있어요.</figcaption>
</figure>

클로드 코드는 <mark>Pro 이상 유료 요금제</mark>가 있어야 써요. 무료 계정으로는 안 돼요.

그리고 클로드 코드와 채팅은 **같은 사용량 한도**를 나눠 써요. Pro와 Max는 5시간마다 쓰는 한도와 주간 한도가 있어서, 채팅을 많이 한 날은 클로드 코드로 쓸 양도 줄어요. 요금제별 차이는 [클로드 코드 요금제](/digital/claude-code-pricing/) 글에 정리해 뒀어요.

## 클로드 코드 개발자 아니어도 쓰는 요령

<figure class="shot">
  <a href="/images/articles/claude-code-card-3.webp" class="shot__zoom"><img src="/images/articles/claude-code-card-3.webp" width="800" height="496" alt="개발자 아니어도 되는 것. 코딩을 몰라도 시작할 수 있고 간단한 앱과 사이트는 AI가 쓰고 내가 검수하면 돼요. 다만 중간 오류를 찾거나 어디서 코드가 꼬였는지 알기는 아직 어려워서 개발자만큼은 안 돼요." loading="lazy" decoding="async"></a>
  <figcaption>간단한 것부터 하나씩 만들어 보세요.</figcaption>
</figure>

이제는 코딩을 몰라도 AI가 코드를 써 주고 **내가 검수만 하면** 돼서 진입장벽이 확 낮아졌어요. 간단한 것들은 클로드 코드로 쉽게 만들 수 있어요.

다만 아직 어려운 부분도 많아요. 중간에 오류가 생기면 잡아내기 어렵고, 어디서 코드가 꼬였는지 모를 때가 있어요. 그래서 개발자만큼은 못 따라가고, 저도 계속 공부하면서 쓰고 있어요.

- 처음엔 **작은 것 하나**부터 만들어 보세요. 할 일 목록, 간단한 계산기 같은 것들이요
- 원하는 걸 **구체적으로** 말할수록 결과가 좋아요
- 중요한 파일은 미리 **백업**해 두고 시작하세요
- 프로젝트마다 지침서를 만들어 두면 클로드가 맥락을 덜 잃어요. 방법은 [클로드 사용법](/digital/claude-usage/) 글에 있어요

오늘 빈 폴더 하나 만들고 Code 탭에서 작은 것부터 만들어 보세요!
