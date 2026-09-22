const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'assets', 'site.js'), 'utf8');
const updateTabsSource = source.slice(
  source.indexOf('function updateTabs()'),
  source.indexOf("window.addEventListener('hashchange', updateTabs)")
);

function createSection(id) {
  const classes = new Set(['page-section']);
  return {
    id,
    classList: {
      add: value => classes.add(value),
      remove: value => classes.delete(value),
      contains: value => classes.has(value)
    },
    isActive: () => classes.has('active')
  };
}

function runNavigation(hash) {
  const home = createSection('home');
  const monthly = createSection('monthly');
  const sections = [home, monthly];
  const byHash = { '#home': home, '#monthly': monthly };
  const recent = [];
  const context = vm.createContext({
    window: { location: { hash }, scrollTo() {} },
    document: {
      querySelector: selector => byHash[selector] || null,
      querySelectorAll: selector => selector === '.page-section' ? sections : [],
      getElementById: () => null
    },
    recordRecentPage: value => recent.push(value),
    setTimeout: callback => callback()
  });
  vm.runInContext(updateTabsSource, context);
  vm.runInContext('updateTabs()', context);
  return { home, monthly, recent };
}

test('a normal first visit always opens the home screen', () => {
  const result = runNavigation('');
  assert.equal(result.home.isActive(), true);
  assert.equal(result.monthly.isActive(), false);
  assert.deepEqual(result.recent, ['#home']);
  assert.doesNotMatch(source, /kkulkkoori_active_hash_v1|getStoredActiveHash|restoreHashBeforeFirstRender/);
});

test('an explicit shared section link still opens its requested screen', () => {
  const result = runNavigation('#monthly');
  assert.equal(result.home.isActive(), false);
  assert.equal(result.monthly.isActive(), true);
  assert.deepEqual(result.recent, ['#monthly']);
});
