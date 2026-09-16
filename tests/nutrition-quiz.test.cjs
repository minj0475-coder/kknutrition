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

test('today menu selects relevant education without treating every chicken dish as fried', () => {
  const quizzes = context.buildAutomaticQuizzes_('2026-09-16', [
    '갈릭난&꿀',
    '마크니커리',
    '탄두리치킨',
    '과일샐러드'
  ]);
  const questions = quizzes.map(quiz => quiz.question).join(' ');

  assert.match(questions, /단백질|채소|과일|비타민/);
  assert.doesNotMatch(questions, /튀김 요리/);
});
