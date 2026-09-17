const SPREADSHEET_ID =
  '1rzXMeRr3jqkO8wnYiIIYNa_gLj2nK0vzh2l6hL3x0rI';
const TODAY_MENU_URL =
  'https://minj0475-coder.github.io/kknutrition/data/today-menu.json';
const DAILY_QUIZ_COUNT = 3;
const QUIZ_TIME_ZONE = 'Asia/Seoul';

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('오늘의 영양 퀴즈')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

function getTodayQuizzes() {
  const today = Utilities.formatDate(
    new Date(),
    QUIZ_TIME_ZONE,
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
      QUIZ_TIME_ZONE,
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
  const related = buildMenuQuizCandidates_(bank, menuNames);
  const challengeBank = bank.filter(quiz => quiz.difficulty === 'challenge');
  const seed = hashString_(today);
  const selected = [];

  takeUnique_(rotate_(related, seed), selected, Math.min(1, related.length));
  takeUnique_(rotate_(challengeBank, seed * 5 + 3), selected, 2);
  takeUnique_(rotate_(bank, seed * 7 + 11), selected, DAILY_QUIZ_COUNT);

  return selected.slice(0, DAILY_QUIZ_COUNT).map((quiz, index) => {
    const optionStart = Math.abs(hashString_(today + quiz.id)) % quiz.options.length;
    return {
      qNum: index + 1,
      question: quiz.menuName && quiz.menuQuestion
        ? quiz.menuQuestion.replace('{menu}', quiz.menuName)
        : quiz.question,
      options: rotate_(quiz.options, optionStart),
      answer: ((quiz.answer - 1 - optionStart + quiz.options.length) % quiz.options.length) + 1,
      explain: quiz.explain,
      source: quiz.menuName ? 'today-menu' : 'nutrition',
      difficulty: quiz.difficulty || 'foundation'
    };
  });
}

function buildMenuQuizCandidates_(bank, menuNames) {
  return bank.reduce((candidates, quiz) => {
    if (!quiz.menuQuestion || !quiz.keywords.length) return candidates;

    const menuName = menuNames.find(name => {
      const normalizedName = String(name || '').toLowerCase();
      return quiz.keywords.some(keyword => normalizedName.indexOf(keyword) !== -1);
    });

    if (menuName) candidates.push(Object.assign({}, quiz, { menuName: menuName }));
    return candidates;
  }, []);
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
      difficulty: 'challenge',
      keywords: ['밥', '쌀', '죽', '면', '국수', '떡', '빵'],
      question: '곡류 반찬만 먹지 않고 단백질 식품과 채소를 함께 먹어야 하는 이유는 무엇일까요?',
      menuQuestion: "오늘 메뉴 '{menu}'에 단백질 반찬·채소를 곁들이면 좋은 이유는 무엇일까요?",
      options: ['서로 다른 영양소를 균형 있게 얻을 수 있어서', '탄수화물이 몸에서 완전히 사라져서', '한 가지 영양소만 더 많이 얻을 수 있어서'],
      answer: 1,
      explain: '곡류는 주로 에너지를 내고, 단백질 식품과 채소는 성장·회복 및 몸의 기능 조절을 도와 함께 먹을 때 균형이 좋아집니다.'
    },
    {
      id: 'whole-grain-fiber',
      difficulty: 'challenge',
      keywords: ['잡곡', '보리', '현미', '콩밥', '흑미'],
      question: '잡곡의 식이섬유가 배변 활동을 돕도록 함께 실천하면 가장 좋은 습관은 무엇일까요?',
      menuQuestion: "오늘 메뉴 '{menu}'에서 얻는 식이섬유가 제 역할을 하도록 함께 실천하면 좋은 것은 무엇일까요?",
      options: ['물을 충분히 마시고 몸을 움직여요', '물을 줄이고 오래 앉아 있어요', '잡곡만 먹고 다른 반찬은 피해야 해요'],
      answer: 1,
      explain: '식이섬유는 물을 머금어 장의 움직임을 돕습니다. 충분한 수분과 신체 활동도 건강한 배변에 중요합니다.'
    },
    {
      id: 'vegetable-color',
      difficulty: 'challenge',
      keywords: ['나물', '샐러드', '채소', '호박', '당근', '시금치', '브로콜리', '양배추', '오이', '버섯'],
      question: '초록색·주황색·보라색 채소를 번갈아 먹는 식습관의 가장 큰 장점은 무엇일까요?',
      menuQuestion: "오늘 메뉴 '{menu}'에 다른 색 채소도 곁들이면 좋은 이유는 무엇일까요?",
      options: ['색에 따라 다른 비타민과 건강 성분을 얻을 수 있어서', '채소의 열량을 고기와 같게 만들 수 있어서', '모든 채소의 영양소가 완전히 같아져서'],
      answer: 1,
      explain: '채소의 색은 서로 다른 색소 성분과 영양소를 나타내기도 하므로 여러 색을 골고루 먹는 것이 좋습니다.'
    },
    {
      id: 'fruit-vitamins',
      difficulty: 'challenge',
      keywords: ['과일', '사과', '배', '귤', '감귤', '포도', '수박', '참외', '딸기', '키위', '바나나'],
      question: '같은 양의 과일과 과일주스를 비교할 때 생과일이 간식으로 더 나은 까닭은 무엇일까요?',
      menuQuestion: "오늘 메뉴 '{menu}'처럼 과일을 주스보다 생과일 형태로 먹을 때의 장점은 무엇일까요?",
      options: ['식이섬유를 섭취하고 천천히 씹어 먹을 수 있어서', '과일 속 당이 모두 없어져서', '비타민이 전혀 흡수되지 않아서'],
      answer: 1,
      explain: '과일에는 비타민, 무기질, 식이섬유가 들어 있습니다. 주스보다 생과일로 먹으면 식이섬유 섭취에 더 도움이 됩니다.'
    },
    {
      id: 'milk-calcium',
      difficulty: 'challenge',
      keywords: ['우유', '치즈', '요거트', '요구르트', '크림'],
      question: '칼슘이 풍부한 식품을 먹는 것과 함께 뼈 건강에 도움이 되는 생활 습관은 무엇일까요?',
      menuQuestion: "오늘 메뉴 '{menu}'로 칼슘을 섭취할 때 함께 실천하면 뼈 건강에 도움이 되는 것은 무엇일까요?",
      options: ['햇빛을 적절히 쬐고 꾸준히 운동하기', '끼니를 자주 거르고 잠을 줄이기', '짠 간식만 자주 먹기'],
      answer: 1,
      explain: '칼슘 섭취와 함께 비타민 D를 얻는 적절한 햇빛 노출, 체중을 싣는 운동은 뼈 건강에 도움을 줍니다.'
    },
    {
      id: 'fish-protein',
      difficulty: 'challenge',
      keywords: ['생선', '고등어', '갈치', '연어', '명태', '대구', '참치', '조기'],
      question: '성장기 어린이에게 생선의 단백질이 필요한 가장 알맞은 이유는 무엇일까요?',
      menuQuestion: "오늘 메뉴 '{menu}'의 단백질이 성장기 어린이에게 필요한 이유는 무엇일까요?",
      options: ['근육과 여러 신체 조직을 만들고 회복하는 재료가 되어서', '단백질이 몸속 수분을 모두 대신해서', '먹는 즉시 키가 크게 늘어나서'],
      answer: 1,
      explain: '단백질은 근육과 여러 신체 조직을 만들고 회복하는 데 필요합니다.'
    },
    {
      id: 'legume-protein',
      difficulty: 'challenge',
      keywords: ['두부', '청국장', '된장', '콩조림', '콩자반', '서리태', '완두콩', '강낭콩'],
      question: '콩과 두부를 고기·생선과 번갈아 단백질 반찬으로 활용할 때의 장점은 무엇일까요?',
      menuQuestion: "오늘 메뉴 '{menu}'가 단백질 반찬으로 활용될 수 있는 까닭은 무엇일까요?",
      options: ['식물성 단백질과 여러 영양소를 다양하게 섭취할 수 있어서', '콩에는 단백질이 전혀 없어서', '다른 식품군을 모두 먹지 않아도 되어서'],
      answer: 1,
      explain: '콩과 두부는 식물성 단백질을 공급하며, 균형 잡힌 식사의 좋은 재료입니다.'
    },
    {
      id: 'meat-protein',
      difficulty: 'challenge',
      keywords: ['닭', '치킨', '돼지', '돈', '소고기', '쇠고기', '한우', '불고기', '갈비', '함박', '고기'],
      question: '단백질 반찬도 채소·곡류와 함께 알맞은 양을 먹어야 하는 이유는 무엇일까요?',
      menuQuestion: "오늘 메뉴 '{menu}'에 채소·곡류를 함께 곁들여야 하는 이유는 무엇일까요?",
      options: ['한 식품만으로 필요한 영양소를 모두 얻을 수 없어서', '단백질은 몸에서 전혀 쓰이지 않아서', '채소와 곡류가 단백질 흡수를 항상 막아서'],
      answer: 1,
      explain: '단백질 식품은 성장에 중요하지만, 곡류·채소 등 다른 식품군도 각기 다른 영양소를 제공하므로 골고루 먹어야 합니다.'
    },
    {
      id: 'egg-safety',
      difficulty: 'challenge',
      keywords: ['달걀', '계란', '메추리알'],
      question: '달걀 껍데기를 만진 뒤 다른 음식을 준비하기 전에 해야 할 일은 무엇일까요?',
      menuQuestion: "오늘 메뉴 '{menu}' 조리 시 교차오염을 막는 방법으로 가장 알맞은 것은 무엇일까요?",
      options: ['손과 사용한 도구를 씻고 다른 식품을 다뤄요', '같은 도마로 익힌 음식부터 잘라요', '껍데기가 닿은 곳을 그대로 사용해요'],
      answer: 1,
      explain: '달걀 껍데기나 날달걀이 닿은 손·도구를 씻고, 달걀은 충분히 가열해야 교차오염과 식중독 위험을 줄일 수 있습니다.'
    },
    {
      id: 'soup-sodium',
      difficulty: 'challenge',
      keywords: ['국', '탕', '찌개', '라면'],
      question: '같은 국을 먹더라도 나트륨 섭취를 가장 효과적으로 줄이는 방법은 무엇일까요?',
      menuQuestion: "오늘 메뉴 '{menu}' 섭취 시 나트륨을 줄이는 방법은 무엇일까요?",
      options: ['건더기 위주로 먹고 국물은 적게 먹어요', '국물을 남기고 김치를 더 많이 먹어요', '국물에 밥을 말아 모두 먹어요'],
      answer: 1,
      explain: '나트륨은 국물에 많이 녹아 있을 수 있습니다. 건더기 위주로 먹고 다른 짠 반찬도 적당히 먹는 것이 좋습니다.'
    },
    {
      id: 'fried-balance',
      difficulty: 'challenge',
      keywords: ['튀김', '돈까스', '너겟', '핫도그'],
      question: '튀김류가 포함된 식사를 더 균형 있게 구성한 것은 무엇일까요?',
      menuQuestion: "오늘 메뉴 '{menu}'에 곁들일 음식으로 가장 알맞은 것은 무엇일까요?",
      options: ['채소 반찬과 물을 곁들이고 튀김은 알맞게 먹어요', '튀김을 더 받고 채소 반찬은 남겨요', '밥 대신 달콤한 음료를 곁들여요'],
      answer: 1,
      explain: '튀김류는 적당량 먹고 채소 반찬과 다른 식품군을 함께 먹으면 더 균형 잡힌 식사가 됩니다.'
    },
    {
      id: 'fermented-food',
      difficulty: 'challenge',
      keywords: ['김치', '깍두기', '된장', '청국장'],
      question: '발효식품이 몸에 좋다는 말만 듣고 많이 먹는 것이 바람직하지 않은 이유는 무엇일까요?',
      menuQuestion: "오늘 메뉴 '{menu}'도 발효식품이라면 적당량 먹어야 하는 까닭은 무엇일까요?",
      options: ['종류에 따라 나트륨이 많을 수 있어서', '발효식품에는 영양소가 전혀 없어서', '발효하면 모든 음식이 반드시 상해서'],
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
      difficulty: 'challenge',
      keywords: ['주스', '쥬스', '음료', '슬러쉬'],
      question: '음료의 영양정보를 비교해 당류 섭취를 줄이려면 무엇을 함께 확인해야 할까요?',
      menuQuestion: "오늘 메뉴 '{menu}' 같은 음료의 당류 섭취량을 제대로 비교하려면 무엇을 확인해야 할까요?",
      options: ['1회 제공량과 당류 함량을 함께 확인해요', '포장 색이 연한지만 확인해요', '제품 이름에 과일이 들어가는지만 확인해요'],
      answer: 1,
      explain: '당류 함량은 표시 기준량과 실제 마시는 양이 다를 수 있으므로 1회 제공량과 총 섭취량을 함께 확인해야 합니다.'
    },
    {
      id: 'food-allergy',
      difficulty: 'challenge',
      keywords: [],
      question: '식품 알레르기가 있는 친구가 처음 보는 가공식품을 먹기 전 가장 먼저 할 일은 무엇일까요?',
      options: ['원재료명과 알레르기 표시를 확인하고 어른에게 알려요', '아주 조금이면 괜찮다고 생각하고 먼저 맛봐요', '겉모양이 비슷한 다른 제품과 성분도 같다고 생각해요'],
      answer: 1,
      explain: '비슷해 보이는 제품도 원재료가 다를 수 있습니다. 알레르기 표시를 확인하고 보호자나 선생님과 안전 여부를 확인해야 합니다.'
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
      difficulty: 'challenge',
      keywords: [],
      question: '조리된 음식을 실온에 오래 두었다가 냄새만 확인하고 먹으면 위험한 이유는 무엇일까요?',
      options: ['해로운 세균이 늘어도 냄새나 맛으로 구별하기 어려울 수 있어서', '실온에서는 모든 음식의 영양소가 즉시 사라져서', '냄새가 괜찮은 음식은 반드시 안전해서'],
      answer: 1,
      explain: '세균은 알맞은 온도와 시간이 주어지면 빠르게 늘 수 있어 음식은 안전한 온도로 보관해야 합니다.'
    },
    {
      id: 'nutrition-label-serving',
      difficulty: 'challenge',
      keywords: [],
      question: '한 봉지에 2회 제공량이 들어 있고 1회당 당류가 8g이라면 한 봉지를 모두 먹을 때 당류는 얼마일까요?',
      options: ['16g', '8g', '4g'],
      answer: 1,
      explain: '전체를 먹으면 1회 제공량의 영양성분에 먹은 제공 횟수를 곱해야 합니다. 8g×2회이므로 당류는 16g입니다.'
    },
    {
      id: 'energy-balance',
      difficulty: 'challenge',
      keywords: [],
      question: '먹은 에너지와 활동으로 쓴 에너지의 균형을 건강하게 맞추는 방법은 무엇일까요?',
      options: ['끼니를 골고루 먹고 매일 몸을 움직여요', '운동한 날에는 채소를 전혀 먹지 않아요', '한 끼를 굶고 다음 끼니에 몰아서 먹어요'],
      answer: 1,
      explain: '성장기에는 규칙적이고 균형 잡힌 식사와 꾸준한 신체 활동을 함께 실천하는 것이 중요합니다.'
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
    QUIZ_TIME_ZONE,
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
