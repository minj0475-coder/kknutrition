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

  // '퀴즈목록' 시트에 오늘 날짜로 등록된 문항이 없으면 메뉴 기반으로 자동 생성합니다.
  // 여러 학생이 동시에 접속해도 문항이 중복 저장되지 않도록 잠금을 건 뒤,
  // 생성한 문항을 '퀴즈목록' 시트에 그대로 기록해서 눈으로 확인하고 수동으로 고칠 수 있게 합니다.
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);
    const recheckedQuizzes = getScheduledQuizzes_(today);
    if (recheckedQuizzes.length) return recheckedQuizzes;

    const autoQuizzes = buildAutomaticQuizzes_(today, getTodayMenuNames_(today));
    saveAutoQuizzesToSheet_(today, autoQuizzes);
    return autoQuizzes;
  } catch (error) {
    console.warn('퀴즈 생성 잠금 처리 중 문제가 발생해 시트 저장 없이 진행합니다.', error);
    return buildAutomaticQuizzes_(today, getTodayMenuNames_(today));
  } finally {
    lock.releaseLock();
  }
}

function saveAutoQuizzesToSheet_(today, quizzes) {
  try {
    const sheet = ensureQuizListSheet_();
    quizzes.forEach(quiz => {
      sheet.appendRow([
        today,
        quiz.qNum,
        quiz.question,
        quiz.options[0],
        quiz.options[1],
        quiz.options[2],
        quiz.answer,
        quiz.explain
      ]);
    });
  } catch (error) {
    console.warn('자동 생성 퀴즈를 퀴즈목록 시트에 저장하지 못했습니다.', error);
  }
}

function ensureQuizListSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('퀴즈목록');
  if (!sheet) {
    sheet = ss.insertSheet('퀴즈목록');
    sheet.appendRow(['날짜', '문항번호', '질문', '보기1', '보기2', '보기3', '정답(1~3)', '해설']);
  }
  return sheet;
}

/**
 * today-menu.json에 올라와 있는 모든 날짜(현재는 9월 급식표)에 대해
 * 메뉴 기반 퀴즈를 미리 만들어 '퀴즈목록' 시트에 채워 넣습니다.
 * 이미 '퀴즈목록'에 등록되어 있는 날짜는 건드리지 않고 건너뜁니다
 * (직접 수정해 둔 문제를 덮어쓰지 않기 위해서입니다).
 *
 * 사용법: Apps Script 편집기 상단에서 이 함수(generateAllMenuQuizzes)를
 * 선택한 뒤 ▶ 실행 버튼을 누르면 됩니다. 실행 후 '퀴즈목록' 시트를 열어
 * 문제를 확인하고, 마음에 안 드는 문항은 자유롭게 고치면 됩니다.
 */
function generateAllMenuQuizzes() {
  const response = UrlFetchApp.fetch(TODAY_MENU_URL, {
    muteHttpExceptions: true,
    followRedirects: true
  });
  if (response.getResponseCode() !== 200) {
    throw new Error('메뉴 데이터를 불러오지 못했습니다. (HTTP ' + response.getResponseCode() + ')');
  }

  const menuData = JSON.parse(response.getContentText());
  const days = Array.isArray(menuData.data) ? menuData.data : [];

  const sheet = ensureQuizListSheet_();
  const existingDates = new Set(
    sheet.getDataRange().getValues().slice(1).map(row => formatQuizDate_(row[0]))
  );

  const generated = [];
  const skipped = [];

  days.forEach(day => {
    const dateKey = String(day && day.key || '').trim();
    if (!dateKey) return;
    if (existingDates.has(dateKey)) { skipped.push(dateKey); return; }

    const menuNames = Array.isArray(day.items)
      ? day.items
        .filter(item => item && item.muted !== true && item.name)
        .map(item => String(item.name).trim())
      : [];

    const quizzes = buildAutomaticQuizzes_(dateKey, menuNames);
    saveAutoQuizzesToSheet_(dateKey, quizzes);
    generated.push(dateKey);
  });

  const summary = '새로 생성: ' + generated.length + '일 (' + generated.join(', ') + ')' +
    (skipped.length ? ' / 이미 있어서 건너뜀: ' + skipped.length + '일 (' + skipped.join(', ') + ')' : '');
  Logger.log(summary);
  return summary;
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
      question: '밥이나 면 같은 곡류 식품만 먹지 않고 단백질 식품과 채소도 함께 먹어야 하는 이유는 무엇일까요?',
      menuQuestion: '오늘 메뉴 ‘{menu}’에 단백질 반찬과 채소를 곁들이면 어떤 점이 좋을까요?',
      options: ['우리 몸에 필요한 여러 영양소를 골고루 얻을 수 있어요', '탄수화물이 몸에서 완전히 사라져요', '한 가지 영양소만 더 많이 얻을 수 있어요'],
      answer: 1,
      explain: '곡류는 활동할 힘을 내는 데 도움을 주고, 단백질 식품과 채소는 성장과 몸의 기능 조절을 돕습니다. 여러 식품을 함께 먹으면 영양 균형을 맞출 수 있어요.'
    },
    {
      id: 'whole-grain-fiber',
      difficulty: 'challenge',
      keywords: ['잡곡', '보리', '현미', '콩밥', '흑미'],
      question: '잡곡의 식이섬유가 장운동을 잘 돕게 하려면 어떤 습관을 함께 실천하는 것이 좋을까요?',
      menuQuestion: '오늘 메뉴 ‘{menu}’에서 얻은 식이섬유가 장운동을 잘 돕게 하려면 무엇을 함께 해야 할까요?',
      options: ['물을 충분히 마시고 몸을 움직여요', '물을 줄이고 오래 앉아 있어요', '잡곡만 먹고 다른 반찬은 피해야 해요'],
      answer: 1,
      explain: '식이섬유는 물을 머금어 장이 잘 움직이도록 돕습니다. 물을 충분히 마시고 몸을 움직이는 습관도 중요해요.'
    },
    {
      id: 'vegetable-color',
      difficulty: 'challenge',
      keywords: ['나물', '샐러드', '채소', '호박', '당근', '시금치', '브로콜리', '양배추', '오이', '버섯'],
      question: '초록색, 주황색, 보라색처럼 여러 색의 채소를 골고루 먹으면 어떤 점이 좋을까요?',
      menuQuestion: '오늘 메뉴의 ‘{menu}’처럼 채소가 들어간 음식은 여러 색으로 골고루 먹는 것이 왜 좋을까요?',
      options: ['색깔에 따라 다양한 비타민과 건강 성분을 얻을 수 있어요', '채소의 열량이 고기와 똑같아져요', '모든 채소의 영양소가 완전히 같아져요'],
      answer: 1,
      explain: '채소는 색깔에 따라 들어 있는 영양소와 건강 성분이 조금씩 다릅니다. 여러 색의 채소를 골고루 먹어 보세요.'
    },
    {
      id: 'fruit-vitamins',
      difficulty: 'challenge',
      keywords: ['과일', '사과', '배', '귤', '감귤', '포도', '수박', '참외', '딸기', '키위', '바나나'],
      question: '과일주스보다 생과일을 간식으로 먹으면 어떤 점이 좋을까요?',
      options: ['식이섬유를 섭취하고 천천히 씹어 먹을 수 있어요', '과일 속 당이 모두 없어져요', '비타민이 전혀 흡수되지 않아요'],
      answer: 1,
      explain: '과일에는 비타민과 무기질, 식이섬유가 들어 있습니다. 주스보다 생과일로 먹으면 식이섬유를 섭취하는 데 더 도움이 돼요.'
    },
    {
      id: 'milk-calcium',
      difficulty: 'challenge',
      keywords: ['우유', '치즈', '요거트', '요구르트', '크림'],
      question: '칼슘이 풍부한 음식을 먹으면서 어떤 생활 습관을 함께 실천하면 뼈 건강에 도움이 될까요?',
      menuQuestion: '오늘 메뉴 ‘{menu}’로 칼슘을 섭취하면서 어떤 습관을 함께 실천하면 뼈 건강에 도움이 될까요?',
      options: ['햇빛을 적절히 쬐고 꾸준히 운동하기', '끼니를 자주 거르고 잠을 줄이기', '짠 간식만 자주 먹기'],
      answer: 1,
      explain: '칼슘을 충분히 먹고 햇빛을 적당히 쬐며 꾸준히 운동하면 튼튼한 뼈를 만드는 데 도움이 됩니다.'
    },
    {
      id: 'fish-protein',
      difficulty: 'challenge',
      keywords: ['생선', '고등어', '갈치', '연어', '명태', '대구', '참치', '조기'],
      question: '성장기 어린이에게 생선의 단백질이 필요한 이유는 무엇일까요?',
      menuQuestion: '오늘 메뉴 ‘{menu}’에 들어 있는 단백질은 우리 몸에서 어떤 일을 할까요?',
      options: ['근육과 몸의 여러 조직을 만들고 회복하는 데 쓰여요', '몸속 수분을 모두 대신해요', '먹는 즉시 키가 크게 자라게 해요'],
      answer: 1,
      explain: '단백질은 근육과 몸의 여러 조직을 만들고 회복하는 데 꼭 필요한 영양소예요.'
    },
    {
      id: 'legume-protein',
      difficulty: 'challenge',
      keywords: ['두부', '청국장', '된장', '콩조림', '콩자반', '서리태', '완두콩', '강낭콩'],
      question: '콩과 두부를 고기나 생선과 번갈아 단백질 반찬으로 먹으면 어떤 점이 좋을까요?',
      menuQuestion: '오늘 메뉴의 ‘{menu}’처럼 콩이나 두부로 만든 반찬을 먹으면 어떤 점이 좋을까요?',
      options: ['식물성 단백질과 여러 영양소를 다양하게 먹을 수 있어요', '콩에는 단백질이 전혀 없어요', '다른 식품군은 모두 먹지 않아도 돼요'],
      answer: 1,
      explain: '콩과 두부에는 식물성 단백질이 들어 있어 균형 잡힌 식사를 만드는 좋은 재료가 됩니다.'
    },
    {
      id: 'meat-protein',
      difficulty: 'challenge',
      keywords: ['닭', '치킨', '돼지', '돈', '소고기', '쇠고기', '한우', '불고기', '갈비', '함박', '고기'],
      question: '단백질 반찬도 밥과 채소를 곁들여 알맞게 먹어야 하는 이유는 무엇일까요?',
      menuQuestion: '오늘 메뉴 ‘{menu}’에 밥과 채소를 함께 곁들이면 어떤 점이 좋을까요?',
      options: ['한 가지 식품만으로는 필요한 영양소를 모두 얻기 어려워요', '단백질은 우리 몸에서 전혀 쓰이지 않아요', '밥과 채소는 단백질 흡수를 항상 막아요'],
      answer: 1,
      explain: '단백질 식품은 성장에 중요하지만, 밥과 채소도 서로 다른 영양소를 줍니다. 여러 식품을 골고루 먹는 것이 좋아요.'
    },
    {
      id: 'egg-safety',
      difficulty: 'challenge',
      keywords: ['달걀', '계란', '메추리알'],
      question: '달걀 껍데기를 만진 뒤 다른 음식을 준비하기 전에 해야 할 일은 무엇일까요?',
      menuQuestion: '오늘 메뉴에 ‘{menu}’처럼 달걀을 사용한 음식이 있을 때, 조리 중 교차 오염을 막으려면 어떻게 해야 할까요?',
      options: ['손과 사용한 도구를 씻고 다른 식품을 다뤄요', '같은 도마로 익힌 음식부터 잘라요', '껍데기가 닿은 곳을 그대로 사용해요'],
      answer: 1,
      explain: '달걀 껍데기나 날달걀이 닿은 손과 도구는 깨끗이 씻어야 합니다. 달걀을 충분히 익히는 것도 식중독 예방에 도움이 돼요.'
    },
    {
      id: 'soup-sodium',
      difficulty: 'challenge',
      keywords: ['국', '탕', '찌개', '라면'],
      question: '국을 먹을 때 나트륨을 줄이려면 어떻게 먹는 것이 좋을까요?',
      menuQuestion: '오늘 메뉴 ‘{menu}’의 나트륨을 줄이려면 어떻게 먹는 것이 좋을까요?',
      options: ['건더기 위주로 먹고 국물은 적게 먹어요', '국물을 남기고 김치를 더 많이 먹어요', '국물에 밥을 말아 모두 먹어요'],
      answer: 1,
      explain: '나트륨은 국물에 많이 녹아 있을 수 있습니다. 건더기 위주로 먹고 국물과 짠 반찬은 적게 먹는 것이 좋아요.'
    },
    {
      id: 'fried-balance',
      difficulty: 'challenge',
      keywords: ['튀김', '돈까스', '너겟', '핫도그'],
      question: '튀김이 나오는 날, 더 균형 있게 먹는 방법은 무엇일까요?',
      menuQuestion: '오늘 메뉴에 ‘{menu}’처럼 튀긴 음식이 나오는 날, 더 균형 있게 먹는 방법은 무엇일까요?',
      options: ['채소 반찬과 물을 곁들이고 튀김은 알맞게 먹어요', '튀김을 더 받고 채소 반찬은 남겨요', '밥 대신 달콤한 음료를 곁들여요'],
      answer: 1,
      explain: '튀김은 알맞은 양만 먹고 채소 반찬과 다른 식품군을 함께 먹으면 더 균형 잡힌 식사가 됩니다.'
    },
    {
      id: 'fermented-food',
      difficulty: 'challenge',
      keywords: ['김치', '깍두기', '된장', '청국장'],
      question: '발효 식품도 너무 많이 먹지 않고 적당량 먹어야 하는 이유는 무엇일까요?',
      menuQuestion: '오늘 메뉴 ‘{menu}’처럼 발효 식품도 적당량 먹어야 하는 이유는 무엇일까요?',
      options: ['종류에 따라 나트륨이 많을 수 있어서', '발효식품에는 영양소가 전혀 없어서', '발효하면 모든 음식이 반드시 상해서'],
      answer: 1,
      explain: '발효 식품에는 몸에 이로운 성분이 있지만 나트륨이 많을 수도 있어 적당량 먹는 것이 좋아요.'
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
      question: '학교 급식을 건강하게 먹는 방법은 무엇일까요?',
      options: ['여러 식품군을 골고루 먹어요', '좋아하는 반찬 하나만 먹어요', '매일 밥을 남겨요'],
      answer: 1,
      explain: '곡류, 단백질 식품, 채소, 과일, 유제품 등을 골고루 먹으면 다양한 영양소를 얻을 수 있어요.'
    },
    {
      id: 'water',
      keywords: [],
      question: '목이 마를 때 가장 먼저 마시기 좋은 음료는 무엇일까요?',
      options: ['물', '탄산음료', '에너지음료'],
      answer: 1,
      explain: '물은 당류나 카페인 걱정 없이 몸에 필요한 수분을 채울 수 있는 가장 좋은 음료예요.'
    },
    {
      id: 'slow-eating',
      keywords: [],
      question: '음식을 천천히 꼭꼭 씹어 먹으면 어떤 점이 좋을까요?',
      options: ['소화를 돕고 알맞은 양을 먹기 쉬워요', '영양소가 모두 사라져요', '음식이 더 짜져요'],
      answer: 1,
      explain: '천천히 꼭꼭 씹으면 소화를 돕고, 배가 부르다는 신호를 알아차릴 시간도 생겨요.'
    },
    {
      id: 'breakfast',
      keywords: [],
      question: '아침 식사를 하면 어떤 점이 좋을까요?',
      options: ['오전 활동에 필요한 에너지를 얻어요', '점심을 먹지 않아도 돼요', '잠을 전혀 자지 않아도 돼요'],
      answer: 1,
      explain: '아침 식사는 밤새 비어 있던 몸에 에너지를 채워 주어 오전 활동과 집중에 도움을 줍니다.'
    },
    {
      id: 'less-sugar',
      difficulty: 'challenge',
      keywords: ['주스', '쥬스', '음료', '슬러쉬'],
      question: '음료에 들어 있는 당류의 양을 제대로 비교하려면 무엇을 함께 확인해야 할까요?',
      menuQuestion: '오늘 메뉴 ‘{menu}’처럼 음료를 고를 때 당류의 양을 제대로 비교하려면 무엇을 확인해야 할까요?',
      options: ['1회 제공량과 당류 함량을 함께 확인해요', '포장 색이 연한지만 확인해요', '제품 이름에 과일이 들어가는지만 확인해요'],
      answer: 1,
      explain: '영양정보에 적힌 기준량과 실제로 마시는 양은 다를 수 있습니다. 1회 제공량과 내가 마실 양을 함께 확인하세요.'
    },
    {
      id: 'food-allergy',
      difficulty: 'challenge',
      keywords: [],
      question: '식품 알레르기가 있는 친구가 처음 보는 가공식품을 먹기 전에 가장 먼저 해야 할 일은 무엇일까요?',
      options: ['원재료명과 알레르기 표시를 확인하고 어른에게 알려요', '아주 조금이면 괜찮다고 생각하고 먼저 맛봐요', '겉모양이 비슷한 다른 제품과 성분도 같다고 생각해요'],
      answer: 1,
      explain: '비슷해 보이는 제품도 원재료가 다를 수 있습니다. 알레르기 표시를 보고 보호자나 선생님과 함께 안전한지 확인해야 해요.'
    },
    {
      id: 'food-waste',
      keywords: [],
      question: '음식물 쓰레기를 줄이는 급식 습관은 무엇일까요?',
      options: ['먹을 만큼 받고 부족하면 더 받아요', '처음부터 아주 많이 받아요', '먹을 수 있는 음식도 모두 버려요'],
      answer: 1,
      explain: '내가 먹을 수 있는 만큼만 받고 골고루 먹으면 음식물 쓰레기를 줄일 수 있어요.'
    },
    {
      id: 'safe-temperature',
      difficulty: 'challenge',
      keywords: [],
      question: '조리한 음식을 실온에 오래 둔 뒤 냄새만 맡아 보고 먹으면 왜 위험할까요?',
      options: ['해로운 세균이 늘어도 냄새나 맛으로 구별하기 어려울 수 있어서', '실온에서는 모든 음식의 영양소가 즉시 사라져서', '냄새가 괜찮은 음식은 반드시 안전해서'],
      answer: 1,
      explain: '해로운 세균이 늘어나도 냄새나 맛이 달라지지 않을 수 있습니다. 조리한 음식은 안전한 온도에 보관해야 해요.'
    },
    {
      id: 'nutrition-label-serving',
      difficulty: 'challenge',
      keywords: [],
      question: '과자 한 봉지가 2회 제공량이고 1회 제공량의 당류가 8g이라면, 한 봉지를 모두 먹었을 때 당류는 몇 g일까요?',
      options: ['16g', '8g', '4g'],
      answer: 1,
      explain: '한 봉지를 모두 먹으면 1회 제공량의 영양성분에 제공 횟수를 곱해야 합니다. 8g을 2번 먹는 셈이므로 당류는 16g이에요.'
    },
    {
      id: 'energy-balance',
      difficulty: 'challenge',
      keywords: [],
      question: '음식으로 얻은 에너지와 활동으로 쓰는 에너지의 균형을 맞추려면 어떻게 해야 할까요?',
      options: ['끼니를 골고루 먹고 매일 몸을 움직여요', '운동한 날에는 채소를 전혀 먹지 않아요', '한 끼를 굶고 다음 끼니에 몰아서 먹어요'],
      answer: 1,
      explain: '성장기에는 규칙적으로 골고루 먹고 꾸준히 몸을 움직이는 습관이 중요해요.'
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
