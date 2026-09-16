const SPREADSHEET_ID =
  '1rzXMeRr3jqkO8wnYiIIYNa_gLj2nK0vzh2l6hL3x0rI';
const TODAY_MENU_URL =
  'https://minj0475-coder.github.io/kknutrition/data/today-menu.json';
const DAILY_QUIZ_COUNT = 3;

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('오늘의 영양 퀴즈')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

function getTodayQuizzes() {
  const today = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    'yyyy-MM-dd'
  );
  const scheduledQuizzes = getScheduledQuizzes_(today);

  if (scheduledQuizzes.length) return scheduledQuizzes;
  return buildAutomaticQuizzes_(today, getTodayMenuNames_(today));
}

function getScheduledQuizzes_(today) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID)
      .getSheetByName('퀴즈목록');
    if (!sheet) return [];

    return sheet.getDataRange().getValues().slice(1)
      .filter(row => formatQuizDate_(row[0]) === today)
      .map(row => ({
        qNum: row[1],
        question: row[2],
        options: [row[3], row[4], row[5]],
        answer: Number(row[6]),
        explain: row[7]
      }))
      .filter(isValidQuiz_);
  } catch (error) {
    console.warn('등록 퀴즈를 읽지 못해 자동 문항을 사용합니다.', error);
    return [];
  }
}

function formatQuizDate_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(
      value,
      Session.getScriptTimeZone(),
      'yyyy-MM-dd'
    );
  }
  return String(value || '').trim();
}

function isValidQuiz_(quiz) {
  return Boolean(
    quiz.question &&
    quiz.options.length === 3 &&
    quiz.options.every(option => String(option || '').trim()) &&
    quiz.answer >= 1 &&
    quiz.answer <= 3
  );
}

function getTodayMenuNames_(today) {
  const cache = CacheService.getScriptCache();
  const cacheKey = 'today-menu-' + today;
  const cached = cache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  try {
    const response = UrlFetchApp.fetch(TODAY_MENU_URL, {
      muteHttpExceptions: true,
      followRedirects: true
    });
    if (response.getResponseCode() !== 200) return [];

    const menuData = JSON.parse(response.getContentText());
    const todayMenu = Array.isArray(menuData.data)
      ? menuData.data.find(day => day.key === today)
      : null;
    const names = todayMenu && Array.isArray(todayMenu.items)
      ? todayMenu.items
        .filter(item => item && item.muted !== true && item.name)
        .map(item => String(item.name).trim())
      : [];

    cache.put(cacheKey, JSON.stringify(names), 21600);
    return names;
  } catch (error) {
    console.warn('오늘 메뉴를 읽지 못해 일반 영양 문항을 사용합니다.', error);
    return [];
  }
}

function buildAutomaticQuizzes_(today, menuNames) {
  const bank = getNutritionQuizBank_();
  const menuText = menuNames.join(' ').toLowerCase();
  const related = bank.filter(quiz =>
    quiz.keywords.some(keyword => menuText.indexOf(keyword) !== -1)
  );
  const seed = hashString_(today);
  const selected = [];

  takeUnique_(rotate_(related, seed), selected, Math.min(2, related.length));
  takeUnique_(rotate_(bank, seed * 7 + 11), selected, DAILY_QUIZ_COUNT);

  return selected.slice(0, DAILY_QUIZ_COUNT).map((quiz, index) => {
    const optionStart = Math.abs(hashString_(today + quiz.id)) % quiz.options.length;
    return {
      qNum: index + 1,
      question: quiz.question,
      options: rotate_(quiz.options, optionStart),
      answer: ((quiz.answer - 1 - optionStart + quiz.options.length) % quiz.options.length) + 1,
      explain: quiz.explain
    };
  });
}

function takeUnique_(source, target, targetCount) {
  source.some(quiz => {
    if (!target.some(selected => selected.id === quiz.id)) target.push(quiz);
    return target.length >= targetCount;
  });
}

function rotate_(items, seed) {
  if (!items.length) return [];
  const start = Math.abs(seed) % items.length;
  return items.slice(start).concat(items.slice(0, start));
}

function hashString_(value) {
  return String(value).split('').reduce(
    (hash, character) => ((hash * 31) + character.charCodeAt(0)) | 0,
    0
  );
}

function getNutritionQuizBank_() {
  return [
    {
      id: 'grain-energy',
      keywords: ['밥', '쌀', '죽', '면', '국수', '떡', '빵'],
      question: '밥이나 면처럼 곡류가 우리 몸에서 주로 하는 일은 무엇일까요?',
      options: ['활동할 에너지를 줘요', '이를 파랗게 만들어요', '잠을 없애 줘요'],
      answer: 1,
      explain: '곡류에는 탄수화물이 들어 있어 공부하고 뛰어놀 때 필요한 에너지를 냅니다.'
    },
    {
      id: 'whole-grain-fiber',
      keywords: ['잡곡', '보리', '현미', '콩밥', '흑미'],
      question: '잡곡밥에 들어 있는 식이섬유의 좋은 점은 무엇일까요?',
      options: ['배변 활동을 도와요', '키를 하루에 10cm 키워요', '물을 마시지 않아도 되게 해요'],
      answer: 1,
      explain: '잡곡의 식이섬유는 장의 움직임과 건강한 배변 활동에 도움을 줍니다.'
    },
    {
      id: 'vegetable-color',
      keywords: ['나물', '샐러드', '채소', '호박', '당근', '시금치', '브로콜리', '양배추', '오이', '버섯'],
      question: '여러 색깔의 채소를 골고루 먹는 것이 좋은 까닭은 무엇일까요?',
      options: ['색마다 다양한 영양소가 있기 때문', '모든 채소의 맛이 같기 때문', '채소에는 물이 전혀 없기 때문'],
      answer: 1,
      explain: '채소의 색에 따라 들어 있는 비타민과 건강 성분이 달라 다양하게 먹는 것이 좋습니다.'
    },
    {
      id: 'fruit-vitamins',
      keywords: ['과일', '사과', '배', '귤', '감귤', '포도', '수박', '참외', '딸기', '키위', '바나나'],
      question: '과일을 간식으로 적당량 먹으면 얻을 수 있는 것은 무엇일까요?',
      options: ['비타민과 식이섬유', '소금만', '카페인만'],
      answer: 1,
      explain: '과일에는 비타민, 무기질, 식이섬유가 들어 있습니다. 주스보다 생과일로 먹으면 식이섬유 섭취에 더 도움이 됩니다.'
    },
    {
      id: 'milk-calcium',
      keywords: ['우유', '치즈', '요거트', '요구르트', '크림'],
      question: '우유와 유제품에 풍부해 뼈와 치아 건강을 돕는 영양소는 무엇일까요?',
      options: ['칼슘', '나트륨', '카페인'],
      answer: 1,
      explain: '칼슘은 뼈와 치아를 튼튼하게 유지하는 데 필요한 영양소입니다.'
    },
    {
      id: 'fish-protein',
      keywords: ['생선', '고등어', '갈치', '연어', '명태', '대구', '참치', '조기'],
      question: '생선에 들어 있는 단백질은 우리 몸에서 어떤 일을 할까요?',
      options: ['몸의 성장과 회복을 도와요', '체온을 얼음처럼 낮춰요', '물을 대신해요'],
      answer: 1,
      explain: '단백질은 근육과 여러 신체 조직을 만들고 회복하는 데 필요합니다.'
    },
    {
      id: 'legume-protein',
      keywords: ['콩', '두부', '청국장', '된장'],
      question: '콩과 두부에서 얻을 수 있는 대표적인 영양소는 무엇일까요?',
      options: ['단백질', '알코올', '카페인'],
      answer: 1,
      explain: '콩과 두부는 식물성 단백질을 공급하며, 균형 잡힌 식사의 좋은 재료입니다.'
    },
    {
      id: 'meat-protein',
      keywords: ['닭', '치킨', '돼지', '돈', '소고기', '쇠고기', '한우', '불고기', '갈비', '함박', '고기'],
      question: '고기·생선·달걀·콩류를 알맞게 먹어야 하는 주된 이유는 무엇일까요?',
      options: ['성장에 필요한 단백질을 얻기 위해', '단맛만 느끼기 위해', '식사를 거르기 위해'],
      answer: 1,
      explain: '이 식품군은 성장과 신체 조직 유지에 필요한 단백질의 주요 급원입니다.'
    },
    {
      id: 'egg-safety',
      keywords: ['달걀', '계란', '메추리알'],
      question: '달걀 요리를 안전하게 먹는 방법으로 알맞은 것은 무엇일까요?',
      options: ['속까지 충분히 익혀 먹어요', '상온에 오래 두어요', '껍데기를 만진 손으로 바로 먹어요'],
      answer: 1,
      explain: '달걀은 충분히 가열하고, 껍데기를 만진 뒤에는 손을 씻어 교차오염을 막아야 합니다.'
    },
    {
      id: 'soup-sodium',
      keywords: ['국', '탕', '찌개', '라면'],
      question: '국이나 찌개를 먹을 때 나트륨 섭취를 줄이는 방법은 무엇일까요?',
      options: ['건더기 위주로 먹고 국물은 적게 먹어요', '국물을 여러 번 더 받아요', '소금을 더 넣어요'],
      answer: 1,
      explain: '국물에는 나트륨이 많이 녹아 있을 수 있어 건더기 위주로 먹는 습관이 도움이 됩니다.'
    },
    {
      id: 'fried-balance',
      keywords: ['튀김', '돈까스', '너겟', '핫도그'],
      question: '튀김 요리가 나온 날 균형 있게 먹는 방법은 무엇일까요?',
      options: ['채소 반찬도 함께 먹어요', '튀김만 계속 먹어요', '물 대신 탄산음료만 마셔요'],
      answer: 1,
      explain: '튀김류는 적당량 먹고 채소 반찬과 다른 식품군을 함께 먹으면 더 균형 잡힌 식사가 됩니다.'
    },
    {
      id: 'fermented-food',
      keywords: ['김치', '깍두기', '된장', '청국장'],
      question: '김치나 된장 같은 발효식품을 먹을 때 기억하면 좋은 점은 무엇일까요?',
      options: ['좋은 점이 있어도 짜지 않게 적당량 먹어요', '많이 먹을수록 항상 좋아요', '물에 씻지 않은 손으로 집어 먹어요'],
      answer: 1,
      explain: '발효식품에는 유익한 성분이 있지만 나트륨이 많을 수 있으므로 적당량 먹는 것이 좋습니다.'
    },
    {
      id: 'hand-washing',
      keywords: [],
      question: '식사 전에 손을 씻어야 하는 가장 중요한 이유는 무엇일까요?',
      options: ['손의 세균과 오염을 줄이기 위해', '손을 차갑게 만들기 위해', '배고픔을 없애기 위해'],
      answer: 1,
      explain: '흐르는 물과 비누로 손을 꼼꼼히 씻으면 식중독과 감염 예방에 도움이 됩니다.'
    },
    {
      id: 'balanced-meal',
      keywords: [],
      question: '건강한 급식 식사 방법으로 가장 알맞은 것은 무엇일까요?',
      options: ['여러 식품군을 골고루 먹어요', '좋아하는 반찬 하나만 먹어요', '매일 밥을 남겨요'],
      answer: 1,
      explain: '곡류, 단백질 식품, 채소, 과일, 유제품 등을 골고루 먹어야 다양한 영양소를 얻을 수 있습니다.'
    },
    {
      id: 'water',
      keywords: [],
      question: '갈증이 날 때 가장 좋은 기본 음료는 무엇일까요?',
      options: ['물', '탄산음료', '에너지음료'],
      answer: 1,
      explain: '물은 당류나 카페인 부담 없이 몸에 필요한 수분을 보충하는 가장 좋은 기본 음료입니다.'
    },
    {
      id: 'slow-eating',
      keywords: [],
      question: '음식을 천천히 꼭꼭 씹어 먹으면 어떤 점이 좋을까요?',
      options: ['소화를 돕고 알맞은 양을 먹기 쉬워요', '영양소가 모두 사라져요', '음식이 더 짜져요'],
      answer: 1,
      explain: '천천히 씹으면 소화에 도움이 되고 배부름을 알아차릴 시간이 생깁니다.'
    },
    {
      id: 'breakfast',
      keywords: [],
      question: '아침 식사를 하면 기대할 수 있는 좋은 점은 무엇일까요?',
      options: ['오전 활동에 필요한 에너지를 얻어요', '점심을 먹지 않아도 돼요', '잠을 전혀 자지 않아도 돼요'],
      answer: 1,
      explain: '아침 식사는 밤사이 비어 있던 몸에 에너지를 공급해 오전 활동과 집중을 돕습니다.'
    },
    {
      id: 'less-sugar',
      keywords: ['주스', '쥬스', '음료', '슬러쉬'],
      question: '당류를 줄이는 음료 선택으로 가장 알맞은 것은 무엇일까요?',
      options: ['평소에는 물을 마셔요', '달콤한 음료를 물처럼 마셔요', '음료에 설탕을 더 넣어요'],
      answer: 1,
      explain: '달콤한 음료를 자주 마시면 당류 섭취가 늘 수 있어 평소 수분 보충은 물로 하는 것이 좋습니다.'
    },
    {
      id: 'food-allergy',
      keywords: [],
      question: '식품 알레르기가 있는 친구가 급식을 먹을 때 가장 중요한 것은 무엇일까요?',
      options: ['알레르기 표시를 확인하고 선생님께 알려요', '친구 음식을 먼저 맛봐요', '증상이 있어도 숨겨요'],
      answer: 1,
      explain: '알레르기 유발 식품을 미리 확인하고 보호자와 학교에 알려 안전한 식사를 해야 합니다.'
    },
    {
      id: 'food-waste',
      keywords: [],
      question: '음식물 쓰레기를 줄이는 급식 습관은 무엇일까요?',
      options: ['먹을 만큼 받고 부족하면 더 받아요', '처음부터 아주 많이 받아요', '먹을 수 있는 음식도 모두 버려요'],
      answer: 1,
      explain: '자신이 먹을 수 있는 양만 받고 골고루 먹으면 음식물 쓰레기를 줄일 수 있습니다.'
    },
    {
      id: 'safe-temperature',
      keywords: [],
      question: '조리된 음식을 실온에 오래 두면 안 되는 이유는 무엇일까요?',
      options: ['세균이 늘어날 수 있기 때문', '음식의 무게가 사라지기 때문', '그릇의 색이 바뀌기 때문'],
      answer: 1,
      explain: '세균은 알맞은 온도와 시간이 주어지면 빠르게 늘 수 있어 음식은 안전한 온도로 보관해야 합니다.'
    }
  ];
}

function saveQuizResult(resultData) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('응답 결과');

  if (!sheet) {
    sheet = ss.insertSheet('응답 결과');
    sheet.appendRow([
      '제출시간',
      '구분',
      '사용자정보',
      '맞힌개수',
      '제출답안'
    ]);
  }

  const now = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    'yyyy-MM-dd HH:mm:ss'
  );

  sheet.appendRow([
    now,
    resultData.userType === 'student' ? '학생' : '교직원',
    resultData.userInfoText,
    resultData.scoreText,
    resultData.answersText
  ]);

  return { success: true };
}
