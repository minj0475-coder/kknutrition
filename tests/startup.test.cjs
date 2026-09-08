const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/site.js'), 'utf8');
const extract = (start, end) => source.slice(source.indexOf(start), source.indexOf(end));

async function checkMenu(local, remote, expected) {
  let finishRemote;
  const pending = new Promise(resolve => { finishRemote = resolve; });
  const previews = [];
  const context = vm.createContext({
    loadRemoteMenuData: () => pending,
    localStorage: { getItem: () => local },
    sessionStorage: { getItem: () => null },
    loadMenuFromIndexedDB: async () => null,
    parseMenuPayload: value => value,
    MENU_STORAGE_KEY: 'test', MENU_LEGACY_STORAGE_KEYS: [],
    window: { name: null }, console,
    preview: value => previews.push(value)
  });
  vm.runInContext(extract('function chooseNewestMenuPayload', 'async function loadRemoteMenuData'), context);
  vm.runInContext(extract('async function loadSavedMenuData', 'function formatMenuDateVariants'), context);
  const result = vm.runInContext('loadSavedMenuData(preview)', context);
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(previews, local ? [local] : []);
  finishRemote(remote);
  assert.equal(await result, expected);
}

function checkMotion() {
  const events = {};
  const frames = new Map();
  let nextFrame = 0;
  let observerCallback;
  let styleReads = 0;
  const image = { style: { setProperty() {} } };
  const shadow = { style: {} };
  const media = { matches: false, addEventListener: (name, cb) => { events.media = cb; } };
  const context = vm.createContext({
    document: {
      hidden: false,
      querySelector: selector => selector.includes('img.') ? image : selector.includes('shadow') ? shadow : {},
      addEventListener: (name, cb) => { events[name] = cb; }
    },
    window: {
      innerWidth: 1000, matchMedia: () => media,
      requestAnimationFrame: cb => { frames.set(++nextFrame, cb); return nextFrame; },
      cancelAnimationFrame: id => frames.delete(id),
      addEventListener: (name, cb) => { events[name] = cb; }
    },
    getComputedStyle: () => { styleReads++; return { getPropertyValue: () => '1' }; },
    IntersectionObserver: class { constructor(cb) { observerCallback = cb; } observe() {} }
  });
  vm.runInContext(extract('function initHomeHeroKkulMotion()', 'function normalizeVendorGroups'), context);
  vm.runInContext('initHomeHeroKkulMotion()', context);
  assert.equal(frames.size, 0);
  observerCallback([{ isIntersecting: true }]);
  assert.equal(frames.size, 1);
  for (let i = 0; i < 60; i++) {
    const [id, cb] = frames.entries().next().value;
    frames.delete(id); cb(i * 16);
  }
  assert.equal(styleReads, 1, 'Do not recalculate styles on every frame');
  observerCallback([{ isIntersecting: false }]);
  assert.equal(frames.size, 0);
  observerCallback([{ isIntersecting: true }]);
  context.document.hidden = true; events.visibilitychange();
  assert.equal(frames.size, 0);
  context.document.hidden = false; events.visibilitychange();
  assert.equal(frames.size, 1);
  events.pagehide(); assert.equal(frames.size, 0);
  events.pageshow(); assert.equal(frames.size, 1);
  media.matches = true; events.media(); assert.equal(frames.size, 0);
}

(async () => {
  const local = { savedAt: 20, data: ['local'] };
  const newer = { savedAt: 30, data: ['remote'] };
  const older = { savedAt: 10, data: ['remote'] };
  const tied = { savedAt: 20, data: ['remote'] };
  await checkMenu(local, newer, newer);
  await checkMenu(local, older, local);
  await checkMenu(local, tied, tied);
  await checkMenu(local, null, local);
  await checkMenu(null, newer, newer);
  checkMotion();
  console.log('PASS: cached menu preview, newest/tied/offline results, offscreen/background animation pause and resume.');
})().catch(error => { console.error(error); process.exitCode = 1; });
