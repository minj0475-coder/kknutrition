# 오늘의 영양 퀴즈 Apps Script

운영 중인 Google Apps Script 원본을 GitHub에서 함께 관리합니다.

- 웹 앱: https://script.google.com/macros/s/AKfycbxZaIRsof1Lp1Fu3f-xEL3HE9gADGUHEMt4sVu1FyHzV7lgP6TdhjQC7ox3nlRxMpM3/exec
- 스프레드시트: https://docs.google.com/spreadsheets/d/1rzXMeRr3jqkO8wnYiIIYNa_gLj2nK0vzh2l6hL3x0rI/edit
- Apps Script 프로젝트 ID: `1Tn0-Lrc1mul-mU2YPqV0NukqeLywOY2i8jEOgfE3GlD9Y0pMhFJh8VLP`

저장소 루트의 `.clasp.json`이 이 폴더를 운영 프로젝트에 연결합니다. 인증 정보는 저장소에 올리지 않습니다.

## 문항 제공 방식

1. 스프레드시트 `퀴즈목록`에 오늘 날짜의 문항이 있으면 등록된 문항을 우선 제공합니다.
2. 등록 문항이 없으면 배포 사이트의 `data/today-menu.json`에서 오늘 메뉴를 읽고, 가능하면 메뉴명을 직접 활용한 영양교육 문항 1개를 포함합니다.
3. 나머지는 고학년에게도 학습 효과가 있도록 영양표시, 균형 식사, 식품안전 등을 생각해 푸는 응용 문항으로 구성합니다.
4. 메뉴 데이터가 없거나 연결할 주제가 부족해도 날짜별 일반 영양교육 문항을 보충하여 매일 3문항을 제공합니다.
5. 같은 날짜에는 같은 문항이 제공되고 날짜가 바뀌면 자동으로 문항 구성이 바뀝니다.
