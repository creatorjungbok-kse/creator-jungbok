---
title: Claude 요금제 비교｜무료·Pro·Max 가격과 나에게 맞는 플랜
cardTitle: Claude 요금제 비교
seoTitle: Claude 요금제 비교｜무료·Pro·Max 가격과 차이
description: Claude 무료·Pro·Max 요금제의 공식 가격과 기능 차이, 사용량 한도, 결제 전 확인할 API 별도 결제·앱 결제·세금을 정리했습니다.
subcategory: ai
contentType: compare
contentMode: evergreen
primaryQuery: 클로드 요금제
synonyms:
  - Claude 요금제
  - 클로드 가격
  - Claude 가격
  - 클로드 Pro
  - 클로드 Max
  - Claude Pro 가격
summary: Claude 개인 요금제는 무료(Free) $0, Pro 월 $20(연간 구독 시 $200 선결제로 월 $17), Max 월 $100(5x)·$200(20x)입니다. Claude Code·Research·Opus 모델과 무제한 프로젝트가 필요하면 Pro부터, Pro 사용량을 자주 다 쓰면 Max가 해당됩니다. 공식 가격은 달러 기준이며 실제 결제 금액은 결제 화면의 현지 통화로 확인하세요.
ogImage: /images/og/claude-pricing.png
datePublished: 2026-10-10
dateModified: 2026-10-10
researchedAt: 2026-10-10
author: operator
ymyl: low
topics: [ai]
compare:
  caption: 개인 요금제(공식 USD, 2026.10.10 확인)
  options: [Free, Pro, Max]
  rows:
    - label: 가격
      values: ["$0", "월 $20 또는 연 $200 선결제(월 $17)", "월 $100(5x) 또는 $200(20x)"]
      sourceIds: [local:claude-pricing]
    - label: 사용량
      values: ["기본", "Free보다 많음", "Pro의 5배 또는 20배(세션 기준)"]
      sourceIds: [local:claude-pricing, local:help-max]
    - label: Claude Code
      values: ["없음", "포함", "포함"]
      sourceIds: [local:claude-pricing]
    - label: Opus 모델·Research
      values: ["없음", "포함", "포함"]
      sourceIds: [local:claude-pricing]
    - label: 프로젝트
      values: ["최대 5개", "무제한", "무제한"]
      sourceIds: [local:claude-pricing]
    - label: 결제 주기
      values: ["-", "월간 또는 연간", "월간만"]
      sourceIds: [local:claude-pricing, local:help-max]
    - label: 그 밖에
      values: ["웹 검색·파일 생성·메모리·커넥터 등", "Claude in Chrome·Research 등 추가", "피크 시간 우선 접근·월간 API 크레딧 제공*"]
      sourceIds: [local:claude-pricing]
notes:
  - 공식 USD 가격표는 세금이 별도이며, 현지 통화 결제에서는 지역에 따라 세금 표시 방식이 달라질 수 있습니다. 최종 금액은 결제 화면에서 확인하세요.
  - 유료 구독에는 Claude API(Console) 이용이 포함되지 않습니다. API는 따로 설정하고 따로 결제합니다.
  - 앱(iOS·Google Play)에서 구독하면 결제는 Apple·Google이 처리하고, 모바일 가격은 앱 플랫폼에 따라 다를 수 있습니다.
  - 사용량 한도는 메시지 수로 정해져 있지 않고 대화 길이·첨부 파일·모델 등에 따라 달라집니다.
actionLinks:
  - org: Anthropic
    action: check
    purpose: 공식 요금 페이지 보기
    url: https://claude.com/pricing
    sourceId: local:claude-pricing
faq:
  - question: Claude Pro를 결제하면 API도 쓸 수 있나요?
    answer: 아닙니다. Claude 유료 구독은 채팅 이용을 위한 상품이고 Claude API·Console 이용은 포함하지 않아 따로 설정하고 결제해야 합니다. Max·Team 플랜에는 월간 API 크레딧이 제공되지만 별도 연결과 자격 조건이 있습니다.
  - question: 한국에서는 원화로 얼마인가요?
    answer: 공식 페이지는 미국 기준 달러 가격을 안내하고, 지원되는 지역에서는 현지 통화 가격을 제공하며 지역마다 가격이 다를 수 있다고 밝힙니다. 꿀팁정복은 환율로 임의 환산하지 않으니 실제 금액은 결제 화면에서 확인하세요.
  - question: 할인 코드나 학생 할인이 있나요?
    answer: 공식 안내에 따르면 유료 플랜에 대한 표준 할인은 없고, 요청에 따른 할인도 제공하지 않습니다. 한시 프로모션이 있으면 공식 채널로 안내됩니다.
sourceIds: [local:help-pro, local:help-api, local:help-bill, local:help-code, local:help-credits]
localSources:
  - id: local:claude-pricing
    title: Plans & pricing
    publisher: Anthropic
    url: https://claude.com/pricing
    level: S1
    checkedAt: 2026-10-10
  - id: local:help-pro
    title: What is the Pro plan?
    publisher: Anthropic
    url: https://support.claude.com/en/articles/8325606-what-is-the-pro-plan
    level: S1
    checkedAt: 2026-10-10
  - id: local:help-max
    title: What is the Max plan?
    publisher: Anthropic
    url: https://support.claude.com/en/articles/11049741-what-is-the-max-plan
    level: S1
    checkedAt: 2026-10-10
  - id: local:help-api
    title: Why do I have to pay separately to use the Claude API and Console?
    publisher: Anthropic
    url: https://support.claude.com/en/articles/9876003-i-have-a-paid-claude-subscription-pro-max-team-or-enterprise-plans-why-do-i-have-to-pay-separately-to-use-the-claude-api-and-console
    level: S1
    checkedAt: 2026-10-10
  - id: local:help-bill
    title: Paid plan billing FAQs
    publisher: Anthropic
    url: https://support.claude.com/en/articles/8325618-paid-plan-billing-faqs
    level: S1
    checkedAt: 2026-10-10
  - id: local:help-credits
    title: Monthly API credits for Max and Team plans
    publisher: Anthropic
    url: https://support.claude.com/en/articles/17154008-monthly-api-credits-for-max-and-team-plans
    level: S1
    checkedAt: 2026-10-10
  - id: local:help-code
    title: Use Claude Code with your Pro or Max plan
    publisher: Anthropic
    url: https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan
    level: S1
    checkedAt: 2026-10-10
---

\* Max의 월간 API 크레딧: 2026년 10월 확인 기준. Max 5x $100, Max 20x $200 상당의 Claude Platform 크레딧을 받을 수 있으며, 별도 연결·자격 조건이 있습니다. Claude 채팅·Claude Code 사용량에는 적용되지 않습니다.

가격·기능은 2026년 10월 10일 Anthropic 공식 페이지 확인 기준이며, 변경될 수 있습니다.

## 어떤 경우에 어떤 플랜이 해당되나

| 이런 경우라면 | 해당 플랜 |
|---|---|
| 가끔 질문하고 문서 작성·웹 검색을 하며, Claude Code나 Opus 모델이 필요 없다 | Free |
| 프로젝트를 5개보다 많이 만들어야 한다 | Pro 이상 |
| Claude Code, Research, Opus 모델, Claude in Chrome이 필요하다 | Pro 이상 |
| Pro의 사용량 한도에 자주 걸려 더 긴 작업량이 필요하다 | Max |

무료 플랜에서도 채팅, 웹 검색, 파일 생성, 코드 실행, 메모리, 커넥터를 쓸 수 있습니다. 위 기능이 필요하지 않다면 무료로 먼저 써 보고 판단해도 됩니다.

## Pro와 Max의 차이

- **가격**: Pro는 월 $20이고, 연간 구독으로 $200을 한 번에 내면 월 $17입니다. Max는 월 $100(5x)과 $200(20x) 두 가지이며 지금은 월간 구독만 있습니다.
- **사용량**: Max 5x와 20x는 Pro의 세션 사용량의 각각 5배, 20배입니다.
- **그 밖에**: Max는 출력 한도가 더 높고, 새 기능을 먼저 쓸 수 있으며, 사용자가 몰리는 시간에 우선 접근합니다.
- **올릴 때**: 낮은 등급에서 높은 등급으로 올리면 남은 결제 기간만큼 일할 계산해 청구됩니다. Google Play로 구독했다면 새 플랜 전체 가격이 청구되고 남은 금액은 추가 이용일로 바뀝니다.

## 사용량 한도는 어떻게 정해지나

- 모든 플랜에 **5시간 단위 세션 한도**가 있고, 유료 플랜에는 **주간 한도**도 있습니다.
- 한도는 메시지 몇 개처럼 정해져 있지 않습니다. 메시지 길이, 첨부 파일, 대화 길이, 쓰는 모델과 기능에 따라 달라집니다.
- 웹·앱·데스크톱 채팅과 **Claude Code가 같은 한도를 함께 씁니다.**
- Pro나 Max에서 한도에 걸리면 상위 플랜으로 올리거나, 사용량 크레딧을 켜거나, API 크레딧을 사거나, 한도가 초기화될 때까지 기다릴 수 있습니다.

## 결제 전에 확인할 것

- **API는 따로입니다.** 유료 구독은 채팅 이용 상품이라 Claude API·Console은 포함되지 않습니다. 개발용 API는 따로 설정하고 결제합니다.
- **Claude Code에서 API 키를 설정해 두었다면** 구독 대신 API 요금이 청구될 수 있습니다. ANTHROPIC_API_KEY 환경 변수가 있는지 확인하세요.
- **앱에서 결제하면** Apple App Store나 Google Play가 결제를 처리하고, 결제 수단과 영수증도 앱스토어 계정에서 관리합니다. 모바일 가격은 앱 플랫폼에 따라 다를 수 있습니다.
- **웹 결제**는 신용카드나 체크카드로 합니다.
- **가격과 세금**: 공식 기준 가격은 Pro 월 $20, 연 $200이며, 실제 결제금액은 결제 화면의 현지 통화 가격을 확인하세요. 공식 USD 가격표는 세금이 별도이며, 현지 통화 결제에서는 지역에 따라 세금 표시 방식이 달라질 수 있습니다.
- **할인**: 표준 할인은 없고, 한시 프로모션이 있을 때만 공식 채널로 안내됩니다.

## 회사·팀에서 쓴다면

Team은 2명부터 150명까지의 조직용이며 Standard와 Premium 좌석이 있습니다. Standard는 연간 결제 시 좌석당 월 $20(월 결제 $25), Premium은 $100(월 결제 $125)이고 Premium은 Standard의 5배 사용량입니다. Enterprise는 좌석비(연간 결제 시 좌석당 월 $20)와 API 요금 기준 사용량 비용이 결합됩니다.
