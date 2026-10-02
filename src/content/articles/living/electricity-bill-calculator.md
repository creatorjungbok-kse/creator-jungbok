---
title: 전기요금 계산기｜주택용 월 사용량별 예상 요금 계산
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
summary: 월 사용량(kWh)과 사용 시기만 넣으면 주택용 저압 일반가구의 예상 전기요금을 계산합니다. 전력량요금은 사용량 구간이 올라갈수록 단가가 높아지는 누진제이고, 여기에 기후환경요금·연료비조정요금·부가가치세·전력산업기반기금이 더해집니다. 실제 청구액은 한전ON에서 확인하세요.
thumbnail: /images/thumbnails/electricity-bill-calculator.svg
ogImage: /images/og/electricity-bill-calculator.png
datePublished: 2026-10-01
dateModified: 2026-10-01
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
  - question: 필수사용량 보장공제는 왜 계산에 없나요?
    answer: 일반가구의 필수사용량 보장공제는 2022년 7월에 폐지되어 계산하지 않습니다. 취약계층 할인 등 각종 할인도 이 계산기에는 반영하지 않았습니다.
  - question: 우리 집 실제 전기요금은 어디서 확인하나요?
    answer: 한국전력공사의 한전ON에서 조회할 수 있습니다. 이 계산기 결과는 예상 금액이므로 실제 청구액과 다를 수 있습니다.
sourceIds: [kepco-online, local:korea-kr-fuel-cost-linkage, local:kepco-essential-deduction]
localSources:
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

## 이 계산기의 범위

주택용 저압 일반가구의 한 달 사용량 1~1,000kWh를 계산합니다. 아래 경우는 계산하지 않으니 한전ON에서 확인하세요.

- 1,000kWh를 넘는 사용량
- 주택용 고압, 일반용·산업용·교육용·농사용 등 다른 계약종별
- 검침기간이 7~8월과 다른 달에 걸친 경우의 날짜별 나눠 계산
