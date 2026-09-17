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
  assert.match(html, /내가 고른 답 · 정답/);
  assert.match(html, /escapeHtml\(selectedAnswer\)/);
  assert.match(html, /escapeHtml\(correctAnswer\)/);
  assert.match(html, /role="img" aria-label="퀴즈 점수"/);
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
