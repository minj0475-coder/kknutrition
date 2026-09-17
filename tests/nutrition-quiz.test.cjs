const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'apps-script', 'nutrition-quiz', 'Code.js'),
  'utf8'
);
const context = { console };
vm.createContext(context);
vm.runInContext(source, context);

test('automatic nutrition quizzes are deterministic and always available', () => {
  const first = context.buildAutomaticQuizzes_('2026-12-25', []);
  const second = context.buildAutomaticQuizzes_('2026-12-25', []);

  assert.deepEqual(first, second);
  assert.equal(first.length, 3);
  first.forEach(quiz => {
    assert.equal(quiz.options.length, 3);
    assert.ok(quiz.answer >= 1 && quiz.answer <= 3);
  });
});

test('daily quiz combinations change automatically across dates', () => {
  const dailySets = Array.from({ length: 7 }, (_, offset) => {
    const day = String(10 + offset).padStart(2, '0');
    return context.buildAutomaticQuizzes_(`2026-10-${day}`, [])
      .map(quiz => quiz.question)
      .join('|');
  });

  assert.ok(new Set(dailySets).size >= 5);
});

test('upper-grade challenge questions make up most of each automatic quiz', () => {
  const quizzes = context.buildAutomaticQuizzes_('2026-10-10', []);
  assert.ok(quizzes.filter(quiz => quiz.difficulty === 'challenge').length >= 2);
});

test('today menu selects relevant education without treating every chicken dish as fried', () => {
  const quizzes = context.buildAutomaticQuizzes_('2026-09-16', [
    '갈릭난&꿀',
    '마크니커리',
    '탄두리치킨',
    '과일샐러드'
  ]);
  const questions = quizzes.map(quiz => quiz.question).join(' ');
  const menuQuizzes = quizzes.filter(quiz => quiz.source === 'today-menu');

  assert.equal(menuQuizzes.length, 1);
  assert.ok([
    '갈릭난&꿀',
    '마크니커리',
    '탄두리치킨',
    '과일샐러드'
  ].some(menuName => menuQuizzes[0].question.includes(menuName)));
  assert.match(questions, /단백질|채소|과일|비타민/);
  assert.doesNotMatch(questions, /튀김 요리/);
});

test('bean sprout soup is not misclassified as a legume protein side dish', () => {
  const quizzes = context.buildAutomaticQuizzes_('2026-09-17', [
    '양념밥',
    '로제떡볶이',
    '맑은콩나물국',
    '김말이'
  ]);
  const menuQuiz = quizzes.find(quiz => quiz.source === 'today-menu');

  assert.ok(menuQuiz);
  assert.doesNotMatch(menuQuiz.question, /단백질 반찬으로 활용/);
});
