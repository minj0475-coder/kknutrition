import re
path = 'C:/Users/jryoo/.gemini/antigravity/scratch/kknutrition/assets/site.css'
with open(path, 'r', encoding='utf-8') as f:
    css = f.read()

unwanted_colors = ['#FFF9E6', '#FFF7D6', '#FDF3C7', '#EAF6FF', '#F3F8FC', '#E8F3FA', '#D7ECF8', '#CFE8F3']
for c in unwanted_colors:
    css = re.sub(re.escape(c), 'var(--card-soft)', css, flags=re.IGNORECASE)

new_block = '''
/* ==============================================================
전체 박스/버튼/입력창 디자인 통일 (Gravity 4차 긴급 수정)
============================================================== */

/* 1. 큰 카드 / 섹션 박스 통일 */
.card,
.page-section .card,
.daily-kkul-card,
.today-card,
.staff-accordion-card,
.weekly-check-card,
.today-menu-card,
#home .card,
#daily .card,
#monthly .card,
#annual .card,
#menu .card,
#staff .card {
  background: var(--card) !important;
  border: 1px solid var(--line) !important;
  box-shadow: var(--shadow) !important;
  color: var(--text) !important;
}

/* 2. 보조 안내 박스 통일 */
.info-box,
.notice-box,
.sync-box,
.checklist-box,
.attendance-box,
.summary-box,
.staff-link-box,
.sheet-link-card,
.checklist,
.materials-detail {
  background: var(--card-soft) !important;
  border: 1px solid var(--line) !important;
  border-radius: 14px !important;
  color: var(--text) !important;
}

/* 박스 내부 구분선 통일 */
.sheet-link-head,
.summary-box hr,
.info-box hr,
.attendance-box table th,
.attendance-box table td {
  border-color: var(--line) !important;
}

/* 3. 보조 버튼 공통 스타일 */
.btn.light,
.copy-btn,
.copy-btn-inline,
.download-btn,
.sync-btn,
.add-btn,
.plus-btn,
.materials-btn,
.today-menu-show-all-btn,
.small-btn,
button.secondary {
  background: #FFFFFF !important;
  color: var(--text) !important;
  border: 1px solid var(--line) !important;
  border-radius: 12px !important;
  font-weight: 700 !important;
  transition: all 0.18s ease-in-out !important;
  box-shadow: none !important;
}

.btn.light:hover,
.copy-btn:hover,
.copy-btn-inline:hover,
.download-btn:hover,
.sync-btn:hover,
.add-btn:hover,
.plus-btn:hover,
.materials-btn:hover,
.today-menu-show-all-btn:hover,
.small-btn:hover,
button.secondary:hover {
  background: var(--hover-soft) !important;
  color: var(--primary-dark) !important;
  border-color: var(--primary) !important;
  transform: translateY(-1px) !important;
}

/* 4. 주요 버튼 통일 */
.btn.primary,
.upload-btn,
#excelUploadBtn {
  background: var(--primary) !important;
  color: #FFFFFF !important;
  border: 1px solid var(--primary) !important;
  border-radius: 12px !important;
  font-weight: 800 !important;
  transition: all 0.18s ease-in-out !important;
}

.btn.primary:hover,
.upload-btn:hover,
#excelUploadBtn:hover {
  background: var(--primary-dark) !important;
  border-color: var(--primary-dark) !important;
  color: #FFFFFF !important;
  transform: translateY(-1px) !important;
}

/* 5. 입력창 / 검색창 통일 */
input[type="text"],
input[type="url"],
input[type="search"],
input[type="number"],
.sheet-link-input,
.search-input {
  background: #FFFFFF !important;
  border: 1px solid var(--line) !important;
  color: var(--text) !important;
  border-radius: 12px !important;
  padding: 10px 14px !important;
  transition: all 0.2s ease !important;
}

input[type="text"]:focus,
input[type="url"]:focus,
input[type="search"]:focus,
input[type="number"]:focus,
.sheet-link-input:focus,
.search-input:focus {
  border-color: var(--primary) !important;
  box-shadow: 0 0 0 3px rgba(169, 111, 104, 0.12) !important;
  outline: none !important;
}

input::placeholder {
  color: var(--muted) !important;
}

/* 8. 식단 메뉴 카드 통일 */
.menu-card-v2 {
  background: var(--card) !important;
  border: 1px solid var(--line) !important;
  border-left: 5px solid var(--primary) !important;
  border-radius: 16px !important;
  box-shadow: var(--shadow) !important;
}
'''

css = css + new_block
with open(path, 'w', encoding='utf-8') as f:
    f.write(css)
print('Global box unification applied.')
