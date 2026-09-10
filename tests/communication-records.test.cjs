const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/site.js'), 'utf8');
const saved = new Map();
const context = vm.createContext({
  localStorage: { getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value) },
  makeNoteItemId: () => 'new-record',
  extractVersionedItems: value => value && value.items,
  makeVersionedList: items => ({ items, updatedAt: 123 }),
  notifyNoteDataChanged() {},
  console
});
vm.runInContext(source.slice(source.indexOf('const COMPLAINT_RECORDS_KEY'), source.indexOf('function writeComplaintText')), context);
const legacy = {
  id: 'legacy', title: '기존 기록', school: '학교', date: '2026-09-09',
  audience: '학부모', category: '기존 자유 분류', caseText: '상황',
  response: '기존 대응', phrase: '기존 문구', result: '기존 결과',
  createdAt: 100, updatedAt: 200
};
context.legacy = legacy;
const normalized = vm.runInContext('normalizeComplaintRecord(legacy)', context);
for (const [key, value] of Object.entries(legacy)) assert.equal(normalized[key], value);
assert.equal(normalized.recordType, '', 'Do not guess a classification for old records');
for (const recordType of ['의견·문의', '민원 대응', '영양교육']) {
  context.record = { ...legacy, recordType };
  vm.runInContext('saveComplaintRecords([record])', context);
  const restored = vm.runInContext('readComplaintRecords()[0]', context);
  assert.equal(restored.recordType, recordType);
  assert.equal(restored.category, legacy.category);
  const copied = vm.runInContext('getComplaintCopyText(readComplaintRecords()[0])', context);
  for (const label of [recordType, '주제·상황', '진행 내용', '안내·교육 문구', '결과·기록']) assert.ok(copied.includes(label));
}
assert.equal(vm.runInContext('COMPLAINT_FIELDS.includes("recordType")', context), true);
console.log('Communication records: legacy preservation, classification round-trip and copy labels passed');
