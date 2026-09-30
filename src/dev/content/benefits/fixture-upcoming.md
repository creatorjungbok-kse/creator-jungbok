---
# UI 검수용 예시(화면에 자연스러운 날짜·문구). 상태 계산 경계 검증은 tools/test-benefit-status.mjs가 맡는다.
# 신청 예정 상태는 시작일(2027-03-02) 전까지만 유지된다. 그 뒤에는 날짜를 다음 해로 옮긴다.
title: 예시 · 곧 시작하는 주거 지원
subcategory: housing
contentMode: timely
primaryQuery: fixture 곧 시작하는 주거 지원
summary: 화면 확인용 예시 지원사업입니다. 대상, 혜택, 신청 기간을 공식 공고 기준으로 요약하는 자리입니다.
datePublished: 2026-09-01
dateModified: 2026-09-01
researchedAt: 2026-09-01
author: operator
topics: [housing]
audience: [low-income, household]
program:
  officialName: 예시 곧 시작하는 주거 지원
  operator: 예시 기관
  programType: one-off
  region: 전국
  eligibility:
    - text: 예시 조건 · 기준 중위소득 이하 가구
      sourceId: gov24
    - text: 예시 조건 · 신청일 현재 국내 거주
      sourceId: gov24
  exclusions:
    - text: 예시 · 같은 목적의 다른 지원을 받는 경우
      sourceId: gov24
  benefit:
    kind: cash
    text: 가구당 최대 20만 원(예시)
    sourceId: gov24
  application:
    mode: period
    start: 2027-03-02
    end: 2027-03-31
    methods: [예시 · 온라인 신청, 예시 · 주민센터 방문]
    officialUrl: https://www.gov.kr/
  payoutSchedule: 예시 · 신청 후 약 한 달 안에 지급
  lastStatusCheckedAt: 2026-09-01
  officialSourceIds: [gov24]
---

예시 문단입니다. 지원사업 상세는 공식 공고에 있는 정보만 씁니다.

## 신청 전에 확인할 것

예시 문단입니다.

## 자주 틀리는 부분

예시 문단입니다.
