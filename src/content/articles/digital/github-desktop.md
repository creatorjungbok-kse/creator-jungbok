---
title: 깃허브 데스크탑 다운로드와 사용법 커밋하는 방법
cardTitle: 깃허브 데스크탑
seoTitle: 깃허브 데스크탑 다운로드와 사용법 커밋하는 방법
description: 깃허브 데스크탑을 무료로 다운로드하고 로그인하는 법, 저장소 만들기, 커밋과 푸시하는 순서를 명령어 없이 정리했어요.
author: operator
ymyl: low
topics: [ai]
datePublished: 2026-11-26
dateModified: 2026-11-26
researchedAt: 2026-11-25
subcategory: software
contentType: guide
contentMode: evergreen
primaryQuery: 깃허브 데스크탑
synonyms:
  - 깃허브 데스크톱
  - GitHub Desktop
  - github desktop 사용방법
  - 깃허브 데스크탑 방법
  - 깃허브 데스크탑 커밋 하는 법
  - 깃허브 사용법
  - 깃허브 다운로드
  - 깃허브 커밋
  - 깃허브 푸시
summary: 깃허브 데스크탑은 명령어 없이 버튼으로 깃허브를 쓰게 해 주는 무료 프로그램이에요. desktop.github.com에서 윈도우 10 이상, 맥 12.0 이상용을 내려받아 설치하고 브라우저로 로그인해요. 바뀐 파일은 Changes에서 체크하고 Summary를 적은 뒤 Commit to main을 누르면 커밋되고, Push origin을 누르면 깃허브에 올라가요.
summaryBold:
  - 무료 프로그램
  - 브라우저로 로그인
  - Commit to main
  - Push origin
thumbnail: /images/thumbnails/github-desktop.webp
ogImage: /images/og/github-desktop.png
quickFacts:
  title: 2026년 11월 25일 기준
  items:
    - label: 가격
      value: 무료(오픈 소스)
    - label: 지원 운영체제
      value: 윈도우 10 이상 64비트, macOS 12.0 이상(리눅스 미지원)
    - label: 로그인
      value: 앱에서 Sign Into GitHub.com → 브라우저로 로그인
    - label: 커밋
      value: Changes 체크 → Summary 입력 → Commit to main
    - label: 올리기
      value: Push origin
checklist:
  title: 깃허브 데스크탑 쓰기 전에 확인할 것
  items:
    - 깃허브 계정을 먼저 만들어 둬요.
    - 컴퓨터가 윈도우 10 64비트나 macOS 12.0 이상인지 봐요.
    - 커밋하기 전에 바뀐 파일 목록을 확인해요.
    - 다른 곳에서 고쳤다면 Pull origin부터 눌러요.
notes:
  - 버튼 위치와 이름은 깃허브 데스크탑 업데이트에 따라 조금씩 달라질 수 있어요.
actionLinks:
  - org: GitHub
    action: info
    purpose: 깃허브 데스크탑 설치 공식 안내 보기
    url: https://docs.github.com/en/desktop/installing-and-authenticating-to-github-desktop/installing-github-desktop
    sourceId: local:gd-install
  - org: GitHub
    action: info
    purpose: 깃허브 데스크탑 커밋 공식 안내 보기
    url: https://docs.github.com/en/desktop/making-changes-in-a-branch/committing-and-reviewing-changes-to-your-project-in-github-desktop
    sourceId: local:gd-commit
faq:
  - question: 깃허브 데스크탑 무료인가요?
    answer: 네. 깃허브 데스크탑은 무료 오픈 소스 프로그램이에요. desktop.github.com에서 윈도우용과 맥용을 내려받아요.
  - question: 깃허브 데스크탑 로그인은 어떻게 하나요?
    answer: 윈도우는 File의 Options, 맥은 GitHub Desktop의 Settings에서 Accounts를 열고 Sign Into GitHub.com을 눌러요. 그다음 브라우저에서 로그인하면 앱으로 돌아와요.
  - question: 깃허브 데스크탑 커밋은 어떻게 하나요?
    answer: 왼쪽 Changes에서 바뀐 파일을 체크하고, 아래 Summary에 무엇을 바꿨는지 적은 뒤 Commit to main을 눌러요. 그다음 Push origin을 눌러야 깃허브에 올라가요.
  - question: 커밋했는데 왜 깃허브에 안 보이나요?
    answer: 커밋은 내 컴퓨터에만 저장한 상태예요. 위쪽 Push origin을 눌러야 깃허브 사이트에 올라가요.
related: [/digital/claude-code/, /digital/python-download/]
sourceIds: [local:gd-install, local:gd-auth, local:gd-commit, local:gd-push, local:gd-sync]
localSources:
  - id: local:gd-install
    title: Installing GitHub Desktop
    publisher: GitHub
    url: https://docs.github.com/en/desktop/installing-and-authenticating-to-github-desktop/installing-github-desktop
    level: S1
    checkedAt: 2026-11-25
  - id: local:gd-auth
    title: Authenticating to GitHub in GitHub Desktop
    publisher: GitHub
    url: https://docs.github.com/en/desktop/installing-and-authenticating-to-github-desktop/authenticating-to-github-in-github-desktop
    level: S1
    checkedAt: 2026-11-25
  - id: local:gd-commit
    title: Committing and reviewing changes to your project in GitHub Desktop
    publisher: GitHub
    url: https://docs.github.com/en/desktop/making-changes-in-a-branch/committing-and-reviewing-changes-to-your-project-in-github-desktop
    level: S1
    checkedAt: 2026-11-25
  - id: local:gd-push
    title: Pushing changes to GitHub from GitHub Desktop
    publisher: GitHub
    url: https://docs.github.com/en/desktop/making-changes-in-a-branch/pushing-changes-to-github-from-github-desktop
    level: S1
    checkedAt: 2026-11-25
  - id: local:gd-sync
    title: Syncing your branch in GitHub Desktop
    publisher: GitHub
    url: https://docs.github.com/en/desktop/working-with-your-remote-repository-on-github-or-github-enterprise/syncing-your-branch-in-github-desktop
    level: S1
    checkedAt: 2026-11-25
---

깃허브를 써야 하는데 검은 창에 명령어를 치는 게 겁나죠. 깃허브 데스크탑을 쓰면 버튼 몇 번으로 파일을 저장하고 올릴 수 있어요.

저도 깃허브 데스크탑으로 깃허브를 써요. 요즘은 클로드와 연결해 두면 알아서 해 줘서, 하라는 대로만 따라 하면 어렵지 않아요. 이 글에는 다운로드부터 로그인, 커밋과 푸시까지 순서대로 담았어요.

## 깃허브 데스크탑 다운로드

<figure class="shot">
  <a href="/images/articles/github-desktop-card-2.webp" class="shot__zoom"><img src="/images/articles/github-desktop-card-2.webp" width="800" height="419" alt="깃허브 데스크탑 다운로드 기준. 무료 오픈 소스 프로그램이고 윈도우는 10 이상 64비트, 맥은 macOS 12.0 이상에서 써요." loading="lazy" decoding="async"></a>
  <figcaption>리눅스는 아직 지원하지 않아요.</figcaption>
</figure>

깃허브 데스크탑은 **무료 오픈 소스** 프로그램이에요. 윈도우는 10 이상 64비트, 맥은 macOS 12.0 이상에서 쓰고 리눅스는 아직 지원하지 않아요.

1. desktop.github.com에 들어가요
2. **Download for Windows**나 **Download for macOS**를 눌러요
3. 윈도우는 내려받은 설치 파일을, 맥은 zip을 풀고 앱을 더블클릭해요
4. 설치가 끝나면 깃허브 데스크탑이 바로 열려요

### 깃허브 데스크탑 로그인하는 법

앱 안에서 아이디와 비밀번호를 치는 방식은 안 되고, **브라우저로 로그인**해요.

1. 윈도우는 File의 **Options**, 맥은 GitHub Desktop의 **Settings**를 열어요
2. **Accounts**에서 Sign Into GitHub.com을 눌러요
3. Continue With Browser를 누르고 브라우저에서 로그인해요
4. 안내에 따라 다시 앱으로 돌아와요

## 깃허브 데스크탑 사용법

<figure class="shot">
  <a href="/images/articles/github-desktop-card-1.webp" class="shot__zoom"><img src="/images/articles/github-desktop-card-1.webp" width="800" height="362" alt="깃허브 데스크탑 쓰는 흐름. 설치하고 브라우저로 로그인한 뒤, 저장소를 만들거나 복제하고, 바뀐 내용을 커밋으로 저장하고, 푸시로 깃허브에 올려요." loading="lazy" decoding="async"></a>
  <figcaption>커밋은 저장, 푸시는 업로드라고 생각하면 쉬워요.</figcaption>
</figure>

깃허브는 내 파일의 바뀐 기록을 저장하고 온라인에 보관하는 곳이에요. 작업 폴더 하나를 **저장소**라고 불러요.

처음이라면 저장소를 새로 만들거나, 깃허브에 있는 저장소를 내 컴퓨터로 복제해서 시작해요.

### 새 저장소 만들기

1. File에서 **New repository**를 눌러요
2. 이름과 저장할 폴더 위치를 정해요
3. **Create repository**를 눌러요
4. 깃허브에도 올리려면 위쪽 **Publish repository**를 눌러요

Publish할 때 Keep this code private에 체크하면 나만 보는 비공개 저장소가 돼요.

### 깃허브 저장소 내 컴퓨터로 가져오기

File에서 **Clone Repository**를 누르고 목록에서 저장소를 골라요. Local Path 옆 Choose로 저장할 폴더를 정한 뒤 Clone을 누르면 돼요.

## 깃허브 데스크탑 커밋하는 방법

<figure class="shot">
  <a href="/images/articles/github-desktop-card-3.webp" class="shot__zoom"><img src="/images/articles/github-desktop-card-3.webp" width="800" height="774" alt="깃허브 데스크탑 커밋하는 법. 1 왼쪽 Changes에서 바뀐 파일을 체크해요. 2 아래 Summary에 무엇을 바꿨는지 적어요. 3 Commit to main을 눌러요. 4 위쪽 Push origin을 눌러 깃허브에 올려요." loading="lazy" decoding="async"></a>
  <figcaption>버튼 이름의 main은 지금 브랜치 이름이에요.</figcaption>
</figure>

**커밋**은 지금까지 바꾼 내용을 하나의 기록으로 저장하는 거예요. 게임의 세이브 포인트라고 생각하면 쉬워요.

1. 왼쪽 **Changes**에서 바뀐 파일을 확인하고 체크해요
2. 아래 **Summary**에 무엇을 바꿨는지 짧게 적어요
3. **Commit to main** 버튼을 눌러요
4. 위쪽 **Push origin**을 눌러 깃허브에 올려요

커밋만 하면 내 컴퓨터에만 저장돼요. <mark>Push origin까지 눌러야</mark> 깃허브 사이트에 올라가요.

### 깃허브 데스크탑 버튼 뜻

<figure class="shot">
  <a href="/images/articles/github-desktop-card-4.webp" class="shot__zoom"><img src="/images/articles/github-desktop-card-4.webp" width="800" height="455" alt="깃허브 데스크탑 버튼 뜻. Fetch origin은 깃허브에 새 변경이 있는지 확인하고, Pull origin은 그 변경을 내 컴퓨터로 내려받고, Push origin은 내 커밋을 깃허브로 올려요." loading="lazy" decoding="async"></a>
  <figcaption>다른 컴퓨터에서 고쳤다면 먼저 Pull해요.</figcaption>
</figure>

다른 컴퓨터나 깃허브 사이트에서 고친 게 있다면 **Fetch origin**으로 새 변경이 있는지 먼저 확인해요. 있으면 **Pull origin**으로 내 컴퓨터에 내려받은 뒤 작업하면 꼬이지 않아요.

AI에게 코드 작업을 맡기고 싶다면 [클로드 코드 사용법](/digital/claude-code/) 글을, 코딩 프로그램 설치가 처음이라면 [파이썬 다운로드](/digital/python-download/) 글도 같이 보세요.
