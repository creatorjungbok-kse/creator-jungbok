---
title: 전기요금 계산기 주택용 누진제 구간별 예상 요금 계산
seoTitle: 전기요금 계산기 누진제 구간별 요금
cardTitle: 전기요금 계산기
description: 월 사용량(kWh)과 사용 시기만 넣으면 주택용 저압 일반가구의 예상 전기요금을 누진 구간·부가세·기금까지 계산합니다.
subcategory: utilities
contentType: cost
contentMode: evergreen
primaryQuery: 전기 요금 계산기
synonyms:
  - 전기요금 계산기
  - 전기요금 계산
  - 전기세 계산기
  - 주택용 전기요금
  - 가정용 1kWh 전기요금
  - 전기요금 누진제
  - 전기요금 누진제 구간
  - 전기 누진제
  - 누진세 구간
  - 여름 누진제 완화
  - 400kWh 전기요금
  - 슈퍼유저 요금
summary: 월 사용량(kWh)과 사용 시기만 넣으면 주택용 저압 일반가구의 예상 전기요금을 계산합니다. 전력량요금은 사용량 구간이 올라갈수록 단가가 높아지는 누진제이고, 여기에 기후환경요금·연료비조정요금·부가가치세·전력산업기반기금이 더해집니다. 실제 청구액은 한전ON에서 확인하세요.
thumbnail: /images/thumbnails/electricity-bill-calculator.svg
ogImage: /images/og/electricity-bill-calculator.png
datePublished: 2026-10-01
dateModified: 2026-10-15
researchedAt: 2026-10-01
author: operator
ymyl: medium
topics: [energy]
tool: electricity-bill
notes:
  - 아파트는 단일계약·종합계약 방식과 공용전력 배분에 따라 세대별 청구액이 이 계산과 다를 수 있습니다.
  - 검침기간이 7~8월과 다른 달에 걸쳐 있으면 실제 청구액이 이 계산과 다를 수 있습니다.
  - 복지할인, 대가족·다자녀·출산가구 할인, 생명유지장치 할인 등 각종 할인은 반영하지 않았습니다.
  - TV수신료, 미납 금액, 이사 정산 금액은 포함하지 않습니다.
  - 연료비조정요금은 분기마다 바뀔 수 있으므로 계산기 아래의 적용 기간을 확인하세요.
actionLinks:
  - org: 한전ON
    action: check
    purpose: 전기요금 조회하기
    url: https://online.kepco.co.kr
    sourceId: kepco-online
faq:
  - question: 가정용 전기요금은 1kWh당 얼마인가요?
    answer: 주택용 저압은 사용량 구간마다 전력량요금 단가가 달라 1kWh당 요금이 하나로 정해져 있지 않습니다. 요금표의 구간별 단가에 기후환경요금·연료비조정요금이 kWh당 더해지고, 부가가치세와 전력산업기반기금이 붙습니다.
  - question: 400kWh를 넘으면 전체 사용량에 비싼 단가가 붙나요?
    answer: 아닙니다. 전력량요금은 처음 200kWh는 120.0원, 다음 200kWh는 214.6원, 400kWh를 넘는 부분만 307.3원처럼 구간별로 나눠 계산합니다. 다만 기본요금은 사용량이 속한 구간의 금액 하나가 붙어서 3구간에 들어가면 7,300원이 됩니다.
  - question: 여름철 누진 완화는 6월에도 적용되나요?
    answer: 한전 요금표의 하계 구간은 7월 1일부터 8월 31일까지입니다. 6월과 9월은 200kWh·400kWh 기준을 그대로 씁니다.
  - question: 필수사용량 보장공제는 왜 계산에 없나요?
    answer: 일반가구의 필수사용량 보장공제는 2022년 7월에 폐지되어 계산하지 않습니다. 취약계층 할인 등 각종 할인도 이 계산기에는 반영하지 않았습니다.
  - question: 우리 집 실제 전기요금은 어디서 확인하나요?
    answer: 한국전력공사의 한전ON에서 조회할 수 있습니다. 이 계산기 결과는 예상 금액이므로 실제 청구액과 다를 수 있습니다.
related: [/benefits/electricity-welfare-discount/, /benefits/energy-cashback/, /benefits/energy-voucher/]
sourceIds: [kepco-online, local:kepco-residential-tariff, local:easylaw-residential-tariff, local:korea-kr-fuel-cost-linkage, local:kepco-essential-deduction]
changelog:
  - date: 2026-10-15
    summary: 전기요금 누진제 구간 글을 이 글로 합쳐 누진 계산 방식, 400kWh 경계 예시, 슈퍼유저·고압 요금을 추가했습니다.
localSources:
  - id: local:kepco-residential-tariff
    title: 한글 전기요금표(주택용-저압/고압)
    publisher: 한국전력공사
    url: https://cyber.kepco.co.kr/ckepco/front/jsp/CY/E/E/CYEEHP00101.jsp
    level: S1
    checkedAt: 2026-10-08
  - id: local:easylaw-residential-tariff
    title: 주택용 전기요금(찾기쉬운 생활법령정보, 한국전력 기본공급약관 근거)
    publisher: 법제처
    url: https://m.easylaw.go.kr/MOB/IssueQnaRetrieve.laf?issueqaSeq=407&sch=&targetRow=1&type=TTL
    level: S1
    checkedAt: 2026-10-08
  - id: local:korea-kr-fuel-cost-linkage
    title: 내년부터 전기요금 유가따라 달라진다…연료비 연동제 도입
    publisher: 산업통상자원부(대한민국 정책브리핑)
    url: https://www.korea.kr/news/policyNewsView.do?newsId=148881345
    level: S1
    checkedAt: 2026-10-01
  - id: local:kepco-essential-deduction
    title: 전기요금체계 개편, 효율적인 전기소비로 이끈다!
    publisher: 한국전력공사
    url: https://home.kepco.co.kr/kepco/front/html/WZ/2021_1_2/sub02_02.html
    level: S1
    checkedAt: 2026-10-01
---

## 누진제는 이렇게 계산됩니다

주택용 저압 전기요금은 한 달 사용량이 200kWh, 400kWh를 넘을 때마다 다음 구간 단가가 적용되는 3단계 누진제입니다(한국전력공사 전기요금표, 2023년 11월 9일 적용). 7월 1일부터 8월 31일까지는 구간 기준이 300kWh·450kWh로 넓어지고 단가는 같습니다. 전기요금 복지할인의 '여름철 한도'(6~8월)와는 기간이 다르니 헷갈리지 마세요.

- **전력량요금**: 사용량을 구간별로 나눠 각 단가를 곱합니다. 7~8월이 아닌 달에 300kWh를 쓰면 처음 200kWh는 120.0원, 나머지 100kWh는 214.6원입니다.
- **기본요금**: 총 사용량이 속한 구간의 금액 **하나만** 붙습니다. 300kWh면 1,600원입니다.
- 여기에 기후환경요금과 연료비조정요금(사용량 × 단가), 부가가치세, 전력산업기반기금이 더해져 청구액이 됩니다.

## 400kWh에서 1kWh만 넘어도 오르는 이유

7~8월이 아닌 달에 400kWh와 401kWh를 비교하면 이렇습니다.

<div class="table-cards">

| 사용량 | 기본요금 | 전력량요금 | 기본+전력량요금 |
|---|---|---|---|
| 400kWh | 1,600원 | 66,920원 | 68,520원 |
| 401kWh | 7,300원 | 67,227원 | 74,527원 |

</div>

1kWh 차이지만 기본요금이 5,700원 오르면서 기본요금과 전력량요금 합계는 6,007원 늘어납니다(전력량요금 원 미만 절사). 같은 이유로 200kWh에서 201kWh로 넘어갈 때도 기본요금이 910원에서 1,600원으로 오릅니다. 위 계산기에 400과 401을 차례로 넣어 보면 부가세·기금까지 붙은 차이를 확인할 수 있습니다.

## 1,000kWh를 넘으면: 슈퍼유저 요금

하계(7월부터 8월까지)와 동계(12월부터 2월 말일까지)에 한 달 1,000kWh를 넘게 쓰면, 넘는 부분의 전력량요금은 kWh당 **736.2원**이 적용됩니다. 이 계산기는 1,000kWh까지만 계산합니다.

## 고압으로 공급받는 집이라면

고압으로 전기를 공급받는 가정은 구간 기준은 같고 단가가 낮습니다. 기본요금은 730원·1,260원·6,060원, 전력량요금은 kWh당 105.0원·174.0원·242.3원이며, 슈퍼유저 요금은 593.3원입니다. 우리 집이 저압인지 고압인지 헷갈리면 한전 고객센터(국번 없이 123)에 확인하세요.

## 이 계산기의 범위

주택용 저압 일반가구의 한 달 사용량 1~1,000kWh를 계산합니다. 아래 경우는 계산하지 않으니 한전ON에서 확인하세요.

- 1,000kWh를 넘는 사용량
- 주택용 고압, 일반용·산업용·교육용·농사용 등 다른 계약종별
- 검침기간이 7~8월과 다른 달에 걸친 경우의 날짜별 나눠 계산

복지할인·대가족·출산가구 할인 등도 반영하지 않습니다. 할인 대상과 월 한도는 [전기요금 복지할인](/benefits/electricity-welfare-discount/)에서 확인하세요.
