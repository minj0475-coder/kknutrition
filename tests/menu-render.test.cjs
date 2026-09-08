const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/site.js'), 'utf8');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/today-menu.json'), 'utf8')).data;
const nodes = new Map();
function node(id) {
  if (!nodes.has(id)) {
    const classes = new Set();
    nodes.set(id, { innerHTML: '', value: '', style: {}, classList: {
      add: (...names) => names.forEach(name => classes.add(name)),
      remove: (...names) => names.forEach(name => classes.delete(name)),
      contains: name => classes.has(name)
    }});
  }
  return nodes.get(id);
}
const context = vm.createContext({
  document: { getElementById: node }, currentMenuData: [],
  menuEsc: value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;'),
  renderHomeTodayMenu: value => { context.homeData = value; },
  formatMenuDateVariants: value => value,
  matchMenuQuery: (text, query) => text.includes(query), data
});
vm.runInContext(source.slice(source.indexOf('let renderPendingMenuSections'), source.indexOf('function getXlsxLib()')), context);
const run = code => vm.runInContext(code, context);
const count = id => (node(id).innerHTML.match(/class="date-section-v2"/g) || []).length;
run('renderTodayMenuV2(data)');
assert.equal(count('todayMenuTodaySection'), 1);
assert.equal(count('todayMenuAllSection'), 0);
assert.equal(context.homeData.length, data.length);
assert.equal(run('typeof renderPendingMenuSections'), 'function');
run('renderPendingMenuSections()');
assert.equal(count('todayMenuAllSection'), data.length - 1);
assert.equal(run('renderPendingMenuSections'), null);
node('menuSearchInput').value = data[0].date;
run('filterTodayMenuListV2()');
assert.ok(node('todayMenuTodaySection').innerHTML.includes(data[0].date));
assert.equal(count('todayMenuAllSection'), 0);
assert.equal(run('renderPendingMenuSections'), null);
node('menuSearchInput').value = '';
run('filterTodayMenuListV2()');
assert.equal(run('typeof renderPendingMenuSections'), 'function');
run('renderTodayMenuV2(data.slice(0, 1))');
assert.equal(run('renderPendingMenuSections'), null);
assert.equal(node('todayMenuShowAllWrap').style.display, 'none');
run('renderTodayMenuV2([])');
assert.equal(count('todayMenuAllSection'), 0);
assert.equal(run('renderPendingMenuSections'), null);
console.log(`PASS: ${data.length} days preserved; initial render 1 day; expand, search, refresh and empty states.`);
