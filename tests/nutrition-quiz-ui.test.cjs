const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(
  path.join(__dirname, '..', 'apps-script', 'nutrition-quiz', 'index.html'),
  'utf8'
);

test('quiz result screen exposes readable score and answer details', () => {
  assert.match(html, /id="score-value"/);
  assert.match(html, /id="score-message"/);
  assert.match(html, /id="score-progress-bar"/);
  assert.match(html, /오늘의 학습 완료/);
  assert.match(html, /맞힌 문제/);
  assert.match(html, /내가 고른 답 · 정답/);
  assert.match(html, /escapeHtml\(selectedAnswer\)/);
  assert.match(html, /escapeHtml\(correctAnswer\)/);
  assert.match(html, /role="img" aria-label="퀴즈 점수"/);
});

test('quiz result styling follows the portal icon and neutral card system', () => {
  assert.match(html, /\.result-complete-icon[\s\S]*width: 34px;/);
  assert.match(html, /\.result-complete-icon svg[\s\S]*width: 18px;/);
  assert.match(html, /\.score-progress-bar[\s\S]*background: #10a37f;/);
  assert.match(html, /<span class="result-number">문제 /);
  assert.doesNotMatch(html, /QUIZ COMPLETE/);
  assert.doesNotMatch(html, /QUESTION ' \+/);
});

test('quiz result reading time is extended to thirty seconds', () => {
  assert.match(html, /let timeLeft = 30;/);
  assert.match(html, /}, 30000\);/);
});

test('grade selector uses an inset custom arrow', () => {
  assert.match(html, /\.input-group select \{/);
  assert.match(html, /appearance: none;/);
  assert.match(html, /background-position: right 17px center;/);
  assert.match(html, /padding-right: 48px;/);
});
