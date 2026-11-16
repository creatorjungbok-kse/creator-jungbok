---
title: 클로드 코드 요금제 Pro와 Max 차이와 사용량 보고 고르는 법
cardTitle: 클로드 코드 요금제
seoTitle: 클로드 코드 요금제 Pro와 Max 차이와 고르는 법
description: 클로드 코드는 Pro부터 쓸 수 있고 사용량은 채팅과 함께 차감돼요. 요금제별 가격, 구독 로그인과 설치, 운영자가 써 본 추천을 정리했어요.
subcategory: ai
contentType: compare
contentMode: evergreen
primaryQuery: 클로드 코드 요금제
synonyms:
  - 클로드코드요금제
  - 클로드 코드 가격
  - 클로드코드가격
  - Claude Code 요금제
  - Claude Code 가격
  - 클로드 코드 사용량
  - 클로드 코드 Max
  - 클로드 코드 Pro
  - 클로드 코드
summary: 클로드 코드는 무료 플랜에서는 쓸 수 없고 Pro, Max, Team, Enterprise 구독이나 Console(API) 계정이 있어야 해요. 구독으로 쓰면 클로드 채팅과 같은 사용량 한도에서 함께 차감되고, 5시간 세션 한도와 주간 한도가 있어요. 운영자는 클로드 코드가 나온 뒤 Max 20x를 쓰다가 사용량이 남아 Max 5x로 바꿨고, 사업·코딩 작업에는 Max 5x를 추천해요. ANTHROPIC_API_KEY를 설정하고 사용을 승인하면 구독 대신 API 요금이 나갈 수 있어요.
thumbnail: /images/thumbnails/claude-code-pricing.webp
ogImage: /images/og/claude-code-pricing.png
datePublished: 2026-10-28
dateModified: 2026-11-16
researchedAt: 2026-10-28
author: operator
ymyl: low
topics: [ai]
compare:
  caption: 클로드 코드를 쓸 수 있는 개인 요금제(공식 USD 세전, 2026.10.28 확인)
  options: [Pro, Max 5x, Max 20x]
  rows:
    - label: 가격
      values: ["월 $20 또는 연 $200 선결제(월 $17)", "월 $100", "월 $200"]
      sourceIds: [local:claude-pricing]
    - label: 한국 표시 가격(부가세 10% 포함)
      values: ["월 $22 또는 연 $220 선결제(월 $18)", "$110", "약 $220"]
      sourceIds: [local:claude-pricing]
    - label: 사용량(5시간 세션당)
      values: ["Free의 최소 5배", "Pro의 5배", "Pro의 20배"]
      sourceIds: [local:claude-pricing, local:help-max]
    - label: 결제 주기
      values: ["월간 또는 연간", "월간", "월간"]
      sourceIds: [local:claude-pricing]
notes:
  - 한국 표시 가격은 2026년 10월 28일 한국에서 공식 요금 페이지에 접속했을 때 보인 부가세 10% 포함 가격이에요. Max 20x는 세전 $200에 부가세 10%를 더해 계산한 값이에요.
  - 사용량 한도는 메시지 수나 토큰 수로 정해져 있지 않고, 대화 길이·파일·모델·기능에 따라 달라져요.
actionLinks:
  - org: Anthropic
    action: check
    purpose: 클로드 코드 설치 안내 보기
    url: https://code.claude.com/docs/en/setup
    sourceId: local:code-setup
  - org: Anthropic
    action: check
    purpose: 공식 요금 페이지 보기
    url: https://claude.com/pricing
    sourceId: local:claude-pricing
faq:
  - question: 무료 플랜으로 클로드 코드를 쓸 수 있나요?
    answer: 아니요. 클로드 코드는 Pro, Max, Team, Enterprise 구독이나 Console(API) 계정이 필요하고, 무료 claude.ai 플랜에는 포함되지 않아요.
  - question: 클로드 코드와 채팅 사용량은 따로인가요?
    answer: 아니요. 구독 사용량 한도는 claude.ai 채팅, 데스크톱 앱, 클로드 코드가 함께 써요. 클로드 코드를 많이 쓰면 채팅으로 쓸 수 있는 양도 줄어요.
  - question: 사용량을 다 쓰면 어떻게 하나요?
    answer: 5시간 세션이 초기화될 때까지 기다리거나, 상위 요금제로 올리거나, 사용 크레딧을 켜서 표준 API 요금으로 계속 쓸 수 있어요. 사용 크레딧은 설정 > 사용량에서 켜요.
  - question: 구독했는데 API 요금이 나갔어요.
    answer: 컴퓨터에 ANTHROPIC_API_KEY 환경 변수가 설정돼 있고 사용을 승인했다면 클로드 코드가 구독보다 API 키를 먼저 써요. 환경 변수를 지우고 /status로 구독 로그인 상태인지 확인하세요.
related: [/digital/claude-pricing/, /digital/gemini-pricing/]
sourceIds: [local:claude-pricing, local:help-max, local:help-code, local:help-limits, local:help-credits-usage, local:code-setup, local:code-auth, local:code-costs]
localSources:
  - id: local:claude-pricing
    title: Plans & pricing(플랜 및 요금제)
    publisher: Anthropic
    url: https://claude.com/pricing
    level: S1
    checkedAt: 2026-10-28
  - id: local:help-max
    title: What is the Max plan?
    publisher: Anthropic
    url: https://support.claude.com/en/articles/11049741-what-is-the-max-plan
    level: S1
    checkedAt: 2026-10-28
  - id: local:help-code
    title: Use Claude Code with your Pro or Max plan
    publisher: Anthropic
    url: https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan
    level: S1
    checkedAt: 2026-10-28
  - id: local:help-limits
    title: How do usage and length limits work?
    publisher: Anthropic
    url: https://support.claude.com/en/articles/11647753-how-do-usage-and-length-limits-work
    level: S1
    checkedAt: 2026-10-28
  - id: local:help-credits-usage
    title: Manage usage credits for paid Claude plans
    publisher: Anthropic
    url: https://support.claude.com/en/articles/12429409-manage-usage-credits-for-paid-claude-plans
    level: S1
    checkedAt: 2026-10-28
  - id: local:code-setup
    title: Claude Code 설치(Set up Claude Code)
    publisher: Anthropic
    url: https://code.claude.com/docs/en/setup
    level: S1
    checkedAt: 2026-10-28
  - id: local:code-auth
    title: Claude Code 인증(Authentication)
    publisher: Anthropic
    url: https://code.claude.com/docs/en/authentication
    level: S1
    checkedAt: 2026-10-28
  - id: local:code-costs
    title: Claude Code 비용 관리(Manage costs)
    publisher: Anthropic
    url: https://code.claude.com/docs/en/costs
    level: S1
    checkedAt: 2026-10-28
changelog:
  - date: 2026-11-16
    summary: 읽기 쉽게 다시 썼어요. 그림 설명을 카드 이미지로 바꾸고 문단을 짧게 나눴어요.
---
저는 클로드 코드를 쓰려고 요금제를 Max로 올렸어요. AI를 사업에 활용하면 굉장히 도움이 돼요.

24시간 일하는 직원이 생긴 셈이니까요. 물론 처음에는 엄청 어려워요!

이 글에서는 클로드 코드에 필요한 요금제와 사용량이 빠지는 방식, 실제로 써 보니 어떤 요금제가 맞았는지까지 정리했어요. 가격과 기능은 2026년 10월 28일 공식 안내 기준이에요.

## 클로드 코드 쓸 수 있는 요금제

<figure class="shot">
  <a href="/images/articles/claude-code-pricing-card-1.webp" class="shot__zoom"><img src="/images/articles/claude-code-pricing-card-1.webp" width="800" height="528" alt="클로드 코드를 쓸 수 있는 요금제. Free 무료 플랜은 안 되고, Pro와 Max 5x, Max 20x 개인 구독과 Team, Enterprise 구독에는 포함돼 있어요. Console(API) 계정은 사용한 만큼 API 요금이 나가요." loading="lazy" decoding="async"></a>
  <figcaption>무료 플랜에는 클로드 코드가 없어요.</figcaption>
</figure>

클로드 코드는 무료 플랜에서는 안 돼요. Pro, Max, Team, Enterprise 구독이나 Console(API) 계정 중 하나는 있어야 해요.

개인이라면 Pro부터 시작하면 돼요. 요금제 전체 가격과 차이는 [클로드 요금제](/digital/claude-pricing/) 글에 따로 정리했어요.

## 클로드 코드 요금제 가격

| 요금제 | 공식 가격(세전) | 한국 표시 가격(부가세 포함) |
|---|---|---|
| Pro | 월 $20, 연간 구독 시 월 $17(선불 $200) | 월 $22, 연간 구독 시 월 $18(선불 $220) |
| Max 5x | 월 $100 | $110 |
| Max 20x | 월 $200 | 약 $220(세전 $200에 부가세 10%) |

Max는 월간 결제만 있어요. 원화로 실제 빠져나가는 돈은 카드사 환율이랑 해외 결제 수수료에 따라 조금씩 달라져요.

## 클로드 코드 사용량은 채팅과 함께 차감

<figure class="shot">
  <a href="/images/articles/claude-code-pricing-card-2.webp" class="shot__zoom"><img src="/images/articles/claude-code-pricing-card-2.webp" width="800" height="570" alt="클로드 코드 사용량 규칙 체크리스트. claude.ai 채팅, 데스크톱 앱, 클로드 코드가 같은 사용량 한도를 나눠 쓰고, 5시간마다 세션 한도가 다시 채워져요. Pro와 Max에는 모든 모델에 걸친 주간 한도도 있고, Max 5x와 20x는 5시간 세션당 Pro의 5배, 20배를 써요." loading="lazy" decoding="async"></a>
  <figcaption>클로드 코드를 많이 쓰면 채팅으로 쓸 양도 같이 줄어요.</figcaption>
</figure>

여기서 많이들 헷갈려요. 클로드 코드 사용량이 따로 있는 게 아니라, claude.ai 채팅이랑 데스크톱 앱과 **같은 한도**에서 빠져요.

한도는 5시간마다 다시 채워지고, Pro와 Max에는 모든 모델에 걸친 주간 한도도 붙어요. Max 5x와 20x는 5시간 세션당 Pro의 5배, 20배를 쓰는 구조예요.

그래서 클로드 코드로 하루 종일 작업하면 채팅으로 쓸 양도 같이 줄어요. 다 써 버렸다면 초기화를 기다리거나 상위 요금제로 올리면 돼요. 사용 크레딧을 켜서 표준 API 요금으로 이어 쓰는 방법도 있어요.

사용 크레딧은 설정 > 사용량에서 켜요. 클로드 코드 안에서 /usage를 입력하면 지금까지 쓴 양이 바로 보여요.

## 클로드 코드 요금제 추천

<figure class="shot">
  <a href="/images/articles/claude-code-pricing-card-4.webp" class="shot__zoom"><img src="/images/articles/claude-code-pricing-card-4.webp" width="800" height="456" alt="운영자가 써 본 클로드 코드 요금제 추천. Pro 월 20달러는 클로드 코드가 포함돼 있지만 사업·코딩 작업에는 부족했어요. Max 5x 월 100달러는 사업, 코딩 작업에 적당하고 운영자가 지금 쓰는 요금제예요. Max 20x 월 200달러는 써 봤지만 사용량이 남았고, 웬만큼 방대한 작업이 아니라면 Max 5x부터 추천해요." loading="lazy" decoding="async"></a>
  <figcaption>제가 직접 써 보고 정리한 기준이에요.</figcaption>
</figure>

클로드 코드가 나온 뒤 200달러짜리를 썼는데, 중간에 토큰(사용량)이 너무 남더라고요. 그래서 100달러짜리로 바꿨고 지금도 100달러짜리를 쓰고 있어요.

사업이나 코딩 작업, 클로드 코드에 적용하려면 20달러짜리는 부족했어요. 100달러짜리가 적당하다고 느꼈어요.

200달러짜리도 써 봤지만, 웬만큼 방대한 양의 작업이 아니라면 100달러짜리를 먼저 써 보는 걸 추천해요. 공식 안내에서도 한도에 자주 걸리면 그때 20x로 올리라고 해요.

- 클로드 코드를 가볍게 맛보는 정도라면 **Pro**예요(제 경우엔 부족했어요)
- 사업, 코딩 작업에 꾸준히 쓴다면 **Max 5x**가 맞아요
- Max 5x 한도에 자주 걸릴 만큼 방대한 작업이라면 그때 **Max 20x**로 가요

## 구독으로 클로드 코드 시작하기

<figure class="shot">
  <a href="/images/articles/claude-code-pricing-card-3.webp" class="shot__zoom"><img src="/images/articles/claude-code-pricing-card-3.webp" width="800" height="774" alt="Pro·Max 구독으로 클로드 코드를 시작하는 4단계. 1단계 터미널에 공식 설치 명령 한 줄을 입력해 설치해요. 2단계 터미널에서 claude를 입력해 실행해요. 3단계 브라우저 창에서 Pro나 Max 구독 계정으로 로그인해요. 4단계 /status로 로그인 상태를, /usage로 사용량을 확인해요." loading="lazy" decoding="async"></a>
  <figcaption>설치, 실행, 로그인, 확인 네 단계예요.</figcaption>
</figure>

공식 문서에 나온 설치 명령은 이래요.

| 운영체제 | 설치 명령 |
|---|---|
| macOS, Linux, WSL | curl -fsSL https://claude.ai/install.sh \| bash |
| Windows PowerShell | irm https://claude.ai/install.ps1 \| iex |

1. 운영체제에 맞는 명령을 터미널에 붙여 넣어 설치해요
2. 터미널에서 claude를 입력하면 브라우저 로그인 창이 떠요
3. Pro나 Max 구독 계정으로 로그인하면 끝이에요

터미널이 어렵다면 데스크톱 앱(macOS, Windows, Linux는 베타)이나 웹(claude.ai/code)에서도 클로드 코드가 돼요. 이쪽도 유료 구독이 필요해요.

### API 요금이 나가지 않게 주의

컴퓨터에 ANTHROPIC_API_KEY라는 환경 변수가 있으면 클로드 코드가 이 키를 쓸지 물어봐요. 여기서 승인하면 구독보다 API 키를 먼저 써서, 구독료와 별도로 API 요금이 나가요.

구독으로만 쓰고 싶다면 이 환경 변수를 지우고 /status로 구독 로그인 상태인지 보세요. 예전에 API 키로 로그인했다면 /login으로 구독 계정에 다시 로그인하면 돼요.

요금제를 바꾸는 방법과 해지할 때 주의할 점은 [클로드 요금제](/digital/claude-pricing/) 글에 정리해 뒀으니 결제 전에 한 번 보고 오세요!
