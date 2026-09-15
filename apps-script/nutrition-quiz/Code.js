const SPREADSHEET_ID =
  '1rzXMeRr3jqkO8wnYiIIYNa_gLj2nK0vzh2l6hL3x0rI';

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('오늘의 영양 퀴즈')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}
function getTodayQuizzes() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('퀴즈목록');
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  const today = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    'yyyy-MM-dd'
  );

  return data.slice(1)
    .filter(row => {
      let date = row[0];
      if (date instanceof Date) {
        date = Utilities.formatDate(
          date,
          Session.getScriptTimeZone(),
          'yyyy-MM-dd'
        );
      }
      return String(date).trim() === today;
    })
    .map(row => ({
      qNum: row[1],
      question: row[2],
      options: [row[3], row[4], row[5]],
      answer: Number(row[6]),
      explain: row[7]
    }));
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
