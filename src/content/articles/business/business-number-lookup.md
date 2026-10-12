---
title: 사업자등록번호 조회｜홈택스에서 휴·폐업·과세유형 확인하는 법
cardTitle: 사업자등록번호 조회
seoTitle: 사업자등록번호 조회｜휴·폐업·과세유형 확인
description: 거래처 사업자등록번호로 홈택스에서 계속·휴업·폐업 상태와 일반·간이과세자 여부를 확인하는 법과, 이 조회로 알 수 없는 것을 정리했습니다.
subcategory: tax
contentType: guide
contentMode: evergreen
primaryQuery: 사업자번호 조회
synonyms:
  - 사업자등록번호 조회
  - 사업자 휴폐업 조회
  - 폐업 사업자 조회
  - 사업자 과세유형 조회
  - 사업자등록상태조회
summary: 사업자등록번호를 알고 있다면 홈택스 '사업자상태 조회(사업자등록번호)'에서 로그인 없이 그 사업자가 계속 사업 중인지, 휴업·폐업했는지, 일반과세자인지 간이과세자인지 확인할 수 있습니다. 상호명만으로 사업자등록번호를 찾아주는 기능은 아니고, 상호·대표자·주소도 나오지 않으며, 조회 결과는 법적 증빙자료가 아닙니다.
thumbnail: /images/thumbnails/business-number-lookup.svg
ogImage: /images/og/business-number-lookup.png
datePublished: 2026-10-12
dateModified: 2026-10-12
researchedAt: 2026-10-12
author: operator
ymyl: low
topics: [small-business, tax]
audience: [sole-proprietor, small-business-owner, corporation]
quickFacts:
  title: 한눈에 보기
  items:
    - label: 어디서
      value: 홈택스 → 증명·등록·신청·사업장현황 → 사업자등록 신청·정정·휴폐업 → 사업자상태 조회(사업자등록번호)
    - label: 로그인
      value: 없이 조회 화면을 쓸 수 있음
    - label: 알 수 있는 것
      value: 계속·휴업·폐업 상태, 폐업일자, 과세유형(일반·간이·면세 등)
    - label: 알 수 없는 것
      value: 상호, 대표자명, 주소 / 상호명으로 번호 찾기
    - label: 주의
      value: 조회 결과는 증빙자료로서 법적 효력이 없음
actionLinks:
  - org: 국세청 홈택스
    action: check
    purpose: 홈택스 사업자등록상태 조회하기
    url: https://hometax.go.kr/websquare/websquare.html?w2xPath=/ui/pp/index_pp.xml&tmIdx=43&tm2lIdx=4306000000&tm3lIdx=4306080000
    sourceId: local:hometax-bizstatus
notes:
  - 세무서에서 신규등록·휴업·폐업 처리를 마친 경우에만 결과에 반영됩니다. 방금 폐업 신고를 한 사업자는 아직 반영되지 않았을 수 있습니다.
  - 사업자단위과세로 바뀐 사업장의 예전 번호는 '사업자단위과세로 전환된 폐업자'로 나옵니다. 실제로 폐업했는지는 거래처에 확인하라고 홈택스가 안내합니다.
  - 홈택스 메뉴 경로는 2026년 10월 12일 화면 기준입니다. 메뉴가 바뀌면 홈택스 검색창에서 '사업자상태'를 검색하세요.
faq:
  - question: 상호명만 알고 있는데 사업자등록번호를 찾을 수 있나요?
    answer: 이 조회는 사업자등록번호를 넣어 상태를 확인하는 기능이라 상호명으로 번호를 찾아주지 않습니다. 거래처에 사업자등록번호를 직접 받거나 세금계산서·영수증에 적힌 번호를 확인하세요.
  - question: 대표자 이름이 맞는지도 확인할 수 있나요?
    answer: 홈택스 상태조회 화면에서는 대표자명이 나오지 않습니다. 국세청은 사업자등록번호·개업일자·대표자성명이 일치하는지만 알려주는 진위확인 기능을 공공데이터포털 오픈 API로 제공하는데, 주로 시스템을 연동하는 기업용입니다.
  - question: 여러 개를 한꺼번에 조회할 수 있나요?
    answer: 홈택스 화면에는 입력칸이 하나라 한 번에 1건씩 조회합니다. 많은 번호를 한꺼번에 확인해야 하는 기업은 공공데이터포털의 국세청 상태조회 오픈 API(1회 최대 100건)를 쓸 수 있습니다.
related: [/business/business-registration-certificate/, /business/simplified-taxpayer/]
sourceIds: [local:hometax-bizstatus, local:datago-nts-biz, local:nts-closure]
localSources:
  - id: local:hometax-bizstatus
    title: 사업자등록상태조회
    publisher: 국세청 홈택스
    url: https://hometax.go.kr/websquare/websquare.html?w2xPath=/ui/pp/index_pp.xml&tmIdx=43&tm2lIdx=4306000000&tm3lIdx=4306080000
    level: S1
    checkedAt: 2026-10-12
  - id: local:datago-nts-biz
    title: 국세청_사업자등록정보 진위확인 및 상태조회 서비스
    publisher: 공공데이터포털
    url: https://www.data.go.kr/data/15081808/openapi.do
    level: S1
    checkedAt: 2026-10-12
  - id: local:nts-closure
    title: 사업자등록 안내 - 휴·폐업
    publisher: 국세청
    url: https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7780&mi=2447
    level: S1
    checkedAt: 2026-10-12
---

사업자등록번호를 알고 있다면 홈택스에서 현재 사업 상태를 확인할 수 있습니다. 상호명만으로 사업자등록번호를 찾아주는 기능은 아닙니다.

## 어디서 조회하나

1. 홈택스(hometax.go.kr)에 들어갑니다. 로그인하지 않아도 됩니다.
2. **증명·등록·신청·사업장현황 → 사업자등록 신청·정정·휴폐업 → 사업자상태 조회(사업자등록번호)** 로 들어갑니다. **상담·불복·제보 → 기타 → 사업자상태** 메뉴로도 같은 화면에 갈 수 있습니다.
3. 사업자등록번호 10자리를 넣고 **조회**를 누릅니다.

## 결과 읽는 법

결과 표에는 사업자등록번호, 사업자등록상태, 조회기준일자가 나옵니다. 홈택스가 안내하는 결과 예시는 이렇습니다.

| 결과 문구 | 뜻 |
|---|---|
| 부가가치세 일반과세자입니다. | 계속 사업 중인 일반과세자 |
| 폐업자 (과세유형 : 부가가치세 면세사업자, 폐업일자 : 2020-01-01)입니다. | 폐업한 사업자, 폐업 전 과세유형과 폐업일자 |
| 국세청에 등록되지 않은 사업자등록번호입니다. | 국세청에 없는 번호(번호를 잘못 입력했는지 먼저 확인) |

과세유형은 일반과세자, 간이과세자, 면세사업자, 고유번호가 부여된 단체 등으로 나뉩니다. 세금계산서를 받아야 하는 거래라면 상대방이 일반과세자인지, 세금계산서를 발급하는 간이과세자인지 확인하는 데 쓸 수 있습니다.

## 이 조회로는 알 수 없는 것

- **상호, 대표자명, 주소**는 나오지 않습니다.
- **상호명으로 사업자등록번호를 찾을 수 없습니다.** 번호는 거래처에서 직접 받아야 합니다.
- **법적 증빙이 아닙니다.** 홈택스는 사업자 간 거래에서 피해를 막기 위한 최소한의 정보이며 증빙자료로서 법적 효력이 없다고 안내합니다.
- **처리 전 변경은 반영되지 않습니다.** 세무서가 신규등록·휴업·폐업 처리를 마친 뒤에만 반영됩니다.

대표자명과 개업일자가 맞는지까지 확인해야 한다면, 국세청이 공공데이터포털 오픈 API로 진위확인 기능을 제공합니다. 일치 여부만 알려주고 대표자명을 보여주지는 않습니다.

내 사업자등록증이 필요하다면 [사업자등록증 발급·재발급 방법](/business/business-registration-certificate/)을, 일반과세자와 간이과세자의 차이는 [간이과세자 vs 일반과세자](/business/simplified-taxpayer/)를 참고하세요.

꿀팁정복은 사업자등록번호를 받거나 대신 조회하지 않습니다. 조회는 홈택스에서 직접 하세요.
