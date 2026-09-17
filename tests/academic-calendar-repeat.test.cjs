const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const source = fs.readFileSync(path.join(root, 'assets', 'site.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets', 'site_v2.css'), 'utf8');

const helperStart = source.indexOf('function padAcademicDate');
const helperEnd = source.indexOf('function saveAcademicEvents');
assert.ok(helperStart >= 0 && helperEnd > helperStart);

const context = {};
vm.createContext(context);
vm.runInContext(source.slice(helperStart, helperEnd), context);

test('academic editor exposes mutually exclusive monthly and yearly repeat choices', () => {
  assert.match(html, /id="academicRepeatMonthly"[^>]+value="monthly"/);
  assert.match(html, /id="academicRepeatYearly"[^>]+value="yearly"/);
  assert.match(source, /if \(other !== input\) other\.checked = false/);
  assert.match(css, /\.academic-repeat-option:has\(input:checked\)/);
  assert.match(css, /\.academic-apply-scope\[hidden\][^{]*\{\s*display: none !important/);
});

test('monthly academic events recur on the same valid day', () => {
  const events = {
    '2026-01-15': [{ title: '급식소위원회', repeat: 'monthly', includeWeekends: true }]
  };

  assert.equal(context.getUserAcademicEventOccurrencesForKey(events, '2026-04-15').length, 1);
  assert.equal(context.getUserAcademicEventOccurrencesForKey(events, '2026-04-16').length, 0);
});

test('yearly academic events recur annually and respect skipped dates', () => {
  const events = {
    '2026-03-10': [{
      title: '영양교육 주간',
      repeat: 'yearly',
      includeWeekends: true,
      skipDates: ['2027-03-10']
    }]
  };

  assert.equal(context.getUserAcademicEventOccurrencesForKey(events, '2027-03-10').length, 0);
  assert.equal(context.getUserAcademicEventOccurrencesForKey(events, '2028-03-10').length, 1);
});

test('monthly recurrence skips months that do not contain the selected day', () => {
  const events = {
    '2026-01-31': [{ title: '월말 점검', repeat: 'monthly', includeWeekends: true }]
  };

  assert.equal(context.getUserAcademicEventOccurrencesForKey(events, '2026-04-30').length, 0);
  assert.equal(context.getUserAcademicEventOccurrencesForKey(events, '2026-05-31').length, 1);
});
