// ============================================================
// bookmarks.js — 북마크 관리 스크립트 (완전 재작성 v2)
// ============================================================

let bookmarkData = [
  // 급식·위생 (기존 필수 업무 포함)
  { title: "업무포털 메인", url: "https://goe.eduptl.kr/bpm_man_mn00_001.do", category: "급식·위생" },
  { title: "공직자통합메일", url: "https://mail.korea.kr/", category: "급식·위생" },
  { title: "SmartHACCP", url: "https://gimpo.haccpcook.or.kr/diet/", category: "급식·위생" },
  { title: "공공급식통합플랫폼", url: "https://ns.eat.co.kr/NeaT/eats/index.html", category: "급식·위생" },
  { title: "학교우유급식 정보시스템", url: "http://dairy.schoolmilk.or.kr/smis/smisweb/auth/login.html?v=1756168663985", category: "급식·위생" },
  { title: "축산물원패스", url: "https://www.ekape.or.kr/kapecp/ui/kapecp/fastLogin.jsp?loginType=02", category: "급식·위생" },

  // 식재료·단가
  { title: "블루시스 마켓", url: "https://market.bluesis.com/web/pc/main.php", category: "식재료·단가" },
  { title: "틼틼스쿨", url: "https://www.cjschoolfood.com/", category: "식재료·단가" },
  { title: "풀무원푸드머스 풀스토리", url: "https://pulstory.pulmuone.com/", category: "식재료·단가" },

  // 학교
  { title: "School SMS | 교사용", url: "https://www.jtschoolsms.com/alimee/login/loginForm.html", category: "학교" },
  { title: "아이염스쿨", url: "https://school.iamservice.net/", category: "학교" },
  { title: "청수초등학교", url: "https://www.gpoe.kr/cheongsu-e/main.do", category: "학교" },
  { title: "청수초 도서관", url: "https://read365.edunet.net/PureScreen/SchoolSearch?schoolName=%EC%B2%AD%EC%88%98%EC%B4%88%EB%93%B1%ED%95%99%EA%B5%90&provCode=J10&neisCode=J100006046", category: "학교" },
  { title: "공무원연금공단", url: "https://www.gwp.or.kr/wus/cmmn/lgn/login.jdo", category: "학교" },
  { title: "S2B (학교장터)", url: "https://www.s2b.kr/S2BNCustomer/S2B/", category: "학교" },

  // 자료
  { title: "식품안전나라 교육자료", url: "https://www.foodsafetykorea.go.kr/portal/board/boardDetail.do?menu_no=2880&menu_grp=MENU_NEW05&bbs_no=bbs110&ntctxt_no=1104499", category: "자료" },
  { title: "교육급식정보나누방", url: "https://more.goe.go.kr/schoollunch/index.do", category: "자료" },
  { title: "학교급식 정보마당", url: "https://www.sfic.go.kr/board/view.do?boardId=BBS_0000008&menuCd=DOM_000000105001000000&startPage=1&searchType=DATA_TITLE&keyword=%EC%8B%9D%EC%83%9D%ED%99%9C&dataSid=57497", category: "자료" },
  { title: "영양광장", url: "https://agora-nutrition.com/", category: "자료" },
  { title: "영양사도우미", url: "https://www.kdclub.com/", category: "자료" },
  { title: "지방공기업평가원 사이버연수원", url: "https://ercedu.hunet.co.kr/Home", category: "자료" },
  { title: "참미료 영양소식지", url: "https://chamssaem.com/516573", category: "자료" },
  { title: "학교급식 통합플랫폼", url: "https://www.sfic.go.kr/", category: "자료" },
  { title: "경기교육모아", url: "https://more.goe.go.kr/edup/cmm/mber/myPage/selectMyPageMain.do", category: "자료" },

  // 기타
  { title: "ChatGPT", url: "https://chatgpt.com/?openaicom_referred=true", category: "기타" },
  { title: "Google Gemini", url: "https://gemini.google.com/app?hl=ko", category: "기타" },
  { title: "Canva 템플릿", url: "https://www.canva.com/templates", category: "기타" },
  { title: "모아폼", url: "https://www.moaform.com/questionnaires", category: "기타" },
  { title: "영양미내의 자료실", url: "https://padlet.com/minaemi91/at-yamminae-lqfxtvtlwzoti614", category: "기타" },
  { title: "NAVER", url: "https://www.naver.com/", category: "기타" }
];

// ---- LocalStorage (v3: new category names) ----
(function loadFromStorage() {
  try {
    // v3 키로 먼저 시도
    var saved = localStorage.getItem('kknutrition_bookmarks_v3');
    if (!saved) {
      // v2 데이터가 있으면 마이그레이션
      var old = localStorage.getItem('kknutrition_bookmarks_v2');
      if (old) {
        var parsed = JSON.parse(old);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // 카테고리명 매핑
          var catMap = {
            '필수 업무': '급식·위생',
            '식재료·단가 관련': '식재료·단가',
            '소통·학교': '학교',
            '자료·연수': '자료'
          };
          bookmarkData = parsed.map(function(b) {
            return { title: b.title, url: b.url, category: catMap[b.category] || b.category, clickCount: b.clickCount || 0 };
          });
          // v3 키로 저장 후 v2 삭제
          localStorage.setItem('kknutrition_bookmarks_v3', JSON.stringify(bookmarkData));
          localStorage.removeItem('kknutrition_bookmarks_v2');
        }
      }
      return;
    }
    var parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length > 0) bookmarkData = parsed;
  } catch (e) { /* ignore */ }
})();

function saveToStorage() {
  localStorage.setItem('kknutrition_bookmarks_v3', JSON.stringify(bookmarkData));
}

// ---- State ----
var currentCategory = '\uC804\uCCB4';
var currentSearch = '';
var isEditMode = false;
var editingIdx = -1;

// ---- Modal (created once) ----
var _modal = null;

// ---- Global Functions (must be on window for onclick= attributes) ----
// These are set after function definitions below - see bottom of file

function getModal() {
  if (_modal) return _modal;

  // Always create modal via JS (no HTML dependency)
  var el = document.createElement('div');
  el.id = 'bookmarkSingleEditorModal';
  el.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.55);z-index:10001;align-items:center;justify-content:center;backdrop-filter:blur(6px);';
  el.innerHTML = '<div style="background:var(--card);max-width:400px;width:90%;border-radius:20px;box-shadow:0 20px 50px rgba(0,0,0,.2);padding:28px 28px 24px;position:relative;">'
    + '<h3 id="bmModalTitle" style="margin:0 0 20px;font-size:20px;font-weight:800;color:var(--heading);">\uC0C8 \uBD81\uB9C8\uD06C \uCD94\uAC00</h3>'
    + '<label style="font-size:13px;font-weight:700;color:var(--muted);display:block;margin-bottom:6px;">\uCE74\uD14C\uACE0\uB9AC</label>'
    + '<select id="bmCat" style="width:100%;padding:11px 14px;border-radius:12px;border:1.5px solid var(--line);background:var(--bg);color:var(--heading);font-size:14px;box-sizing:border-box;margin-bottom:14px;">'
    + '<option value="\uae09\uc2dd\u00b7\uc704\uc0dd">\uae09\uc2dd\u00b7\uc704\uc0dd</option>'
    + '<option value="\uc2dd\uc7ac\ub8cc\u00b7\ub2e8\uac00">\uc2dd\uc7ac\ub8cc\u00b7\ub2e8\uac00</option>'
    + '<option value="\ud559\uad50">\ud559\uad50</option>'
    + '<option value="\uc790\ub8cc">\uc790\ub8cc</option>'
    + '<option value="\uae30\ud0c0">\uae30\ud0c0</option>'
    + '</select>'
    + '<label style="font-size:13px;font-weight:700;color:var(--muted);display:block;margin-bottom:6px;">\uC0AC\uC774\uD2B8\uBA85</label>'
    + '<input id="bmName" type="text" placeholder="\uC608: \uAD6C\uAE00" autocomplete="off" style="width:100%;padding:11px 14px;border-radius:12px;border:1.5px solid var(--line);background:var(--bg);color:var(--heading);font-size:14px;box-sizing:border-box;margin-bottom:14px;">'
    + '<label style="font-size:13px;font-weight:700;color:var(--muted);display:block;margin-bottom:6px;">URL \uC8FC\uC18C</label>'
    + '<input id="bmUrl" type="text" placeholder="https://..." autocomplete="off" style="width:100%;padding:11px 14px;border-radius:12px;border:1.5px solid var(--line);background:var(--bg);color:var(--heading);font-size:14px;box-sizing:border-box;margin-bottom:20px;">'
    + '<button id="bmSave" type="button" style="width:100%;padding:14px;border-radius:12px;border:none;background:var(--primary);color:#fff;font-size:15px;font-weight:700;cursor:pointer;">\uC644\uB8CC</button>'
    + '<button id="bmClose" type="button" style="position:absolute;top:18px;right:18px;background:var(--card-soft);border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;">&times;</button>'
    + '</div>';

  document.body.appendChild(el);
  _modal = el;

  document.getElementById('bmClose').addEventListener('click', function() { closeModal(); });
  _modal.addEventListener('click', function(e) { if (e.target === _modal) closeModal(); });
  document.getElementById('bmSave').addEventListener('click', function() { handleSave(); });

  return _modal;
}

function openModal(index) {
  var modal = getModal();
  editingIdx = parseInt(index);
  document.getElementById('bmModalTitle').textContent = (editingIdx >= 0) ? '\uBD81\uB9C8\uD06C \uC218\uC815' : '\uC0C8 \uBD81\uB9C8\uD06C \uCD94\uAC00';
  if (editingIdx >= 0) {
    var item = bookmarkData[editingIdx];
    document.getElementById('bmCat').value = item.category || '\uAE30\uD0C0';
    document.getElementById('bmName').value = item.title || '';
    document.getElementById('bmUrl').value = item.url || '';
  } else {
    document.getElementById('bmCat').value = (currentCategory === '\uC804\uCCB4') ? '\uD544\uC218 \uC5C5\uBB34' : currentCategory;
    document.getElementById('bmName').value = '';
    document.getElementById('bmUrl').value = '';
  }
  modal.style.display = 'flex';
  setTimeout(function() { document.getElementById('bmName').focus(); }, 100);
}

function closeModal() {
  var modal = getModal();
  modal.style.display = 'none';
}

function handleSave() {
  var title = document.getElementById('bmName').value.trim();
  var url = document.getElementById('bmUrl').value.trim();
  var category = document.getElementById('bmCat').value;

  if (!title || !url) {
    alert('\uC0AC\uC774\uD2B8\uBA85\uACFC URL \uC8FC\uC18C\uB97C \uBAA8\uB450 \uC785\uB825\uD574\uC8FC\uC138\uC694.');
    return;
  }
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  var newItem = { title: title, url: url, category: category };
  if (editingIdx >= 0) {
    bookmarkData[editingIdx] = newItem;
  } else {
    bookmarkData.push(newItem);
  }
  saveToStorage();
  closeModal();
  renderBookmarks();
}

// ---- Filter Chips ----
function renderFilterChips() {
  var cats = ['전체', '급식·위생', '식재료·단가', '학교', '자료', '기타'];
  var container = document.getElementById('bookmarkFilterChips');
  if (!container) return;
  container.innerHTML = cats.map(function(cat, i) {
    return '<button class="bookmark-chip' + (i === 0 ? ' active' : '') + '" data-cat="' + cat + '">' + cat + '</button>';
  }).join('');
  container.querySelectorAll('.bookmark-chip').forEach(function(btn) {
    btn.addEventListener('click', function() {
      container.querySelectorAll('.bookmark-chip').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      currentCategory = btn.dataset.cat;
      renderBookmarks();
    });
  });
}

// ---- Favicon ----
function favicon(url) {
  try {
    var domain = new URL(url).hostname;
    // Google의 안정적인 favicon API 사용 (sz=32로 더 호환성 높음)
    return 'https://www.google.com/s2/favicons?domain=' + domain + '&sz=32';
  } catch(e) {
    return 'assets/app-icon-192.png';
  }
}

function faviconImg(url) {
  try {
    var domain = new URL(url).hostname;
    // 1순위: DuckDuckGo (가장 최신/다양한 파비콘 지원)
    var dd = 'https://icons.duckduckgo.com/ip3/' + domain + '.ico';
    // 2순위: 사이트 직접 조회
    var direct = 'https://' + domain + '/favicon.ico';
    
    // onerror chain: DuckDuckGo → Direct → Local Fallback
    return '<img src="' + dd + '" class="bm-favicon" alt="" loading="lazy"'
      + ' onerror="this.onerror=function(){this.onerror=null;this.src=\'assets/app-icon-192.png\';};this.src=\'' + direct + '\';">';
  } catch(e) {
    return '<img src="assets/app-icon-192.png" class="bm-favicon" alt="">';
  }
}

// ---- Render ----
function renderBookmarks() {
  var container = document.getElementById('bookmarkGrid');
  if (!container) return;

  var filtered = bookmarkData.slice();
  if (currentCategory === '\uC804\uCCB4') {
    filtered.sort(function(a, b) { return (b.clickCount || 0) - (a.clickCount || 0); });
  } else {
    filtered = filtered.filter(function(item) { return item.category === currentCategory; });
  }
  if (currentSearch.trim()) {
    var q = currentSearch.toLowerCase();
    filtered = filtered.filter(function(item) { return item.title.toLowerCase().indexOf(q) !== -1; });
  }

  var html = '';
  if (filtered.length === 0 && !isEditMode) {
    html = '<div class="empty-bookmark">\uC870\uAC74\uC5D0 \uB9DE\uB294 \uBD81\uB9C8\uD06C\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.</div>';
  } else {
    html = filtered.map(function(item) {
      var origIdx = bookmarkData.findIndex(function(b) { return b.title === item.title && b.url === item.url; });
      var validUrl = /^https?:\/\//i.test(item.url) ? item.url : 'https://' + item.url;
      if (isEditMode) {
        return '<div class="bookmark-card edit-mode-card" onclick="bmOpenModal(' + origIdx + ')" style="cursor:pointer;position:relative;">'
          + faviconImg(validUrl)
          + '<span class="bm-title">' + item.title + '</span>'
          + '<button class="bm-delete-btn" title="\uC0AD\uC81C" onclick="event.stopPropagation();bmDelete(' + origIdx + ');">'
          + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
          + '</button></div>';
      } else {
        return '<a href="' + validUrl + '" target="_blank" rel="noopener" class="bookmark-card" data-url="' + validUrl + '">'
          + faviconImg(validUrl)
          + '<span class="bm-title">' + item.title + '</span>'
          + '</a>';
      }
    }).join('');
  }

  if (isEditMode) {
    html += '<div class="bookmark-card add-new-card" onclick="bmOpenModal(-1)" style="cursor:pointer;border:1.5px dashed var(--muted);background:transparent;justify-content:center;gap:8px;">'
      + '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>'
      + '<span class="bm-title" style="color:var(--muted);">\uC0C8 \uBD81\uB9C8\uD06C \uCD94\uAC00</span>'
      + '</div>';
  }

  container.innerHTML = html;

  if (!isEditMode) {
    // click tracking for sort
    container.querySelectorAll('a.bookmark-card').forEach(function(a) {
      a.addEventListener('click', function() {
        var url = a.dataset.url;
        var item = bookmarkData.find(function(b) {
          var v = /^https?:\/\//i.test(b.url) ? b.url : 'https://' + b.url;
          return v === url;
        });
        if (item) {
          item.clickCount = (item.clickCount || 0) + 1;
          saveToStorage();
        }
      });
    });
  }
}

// (bmDelete and bmOpenModal are defined above near getModal)

// Register globals after all functions defined
window.bmOpenModal = openModal;
window.bmDelete = function(idx) {
  if (confirm('\uC774 \uBD81\uB9C8\uD06C\uB97C \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?')) {
    bookmarkData.splice(idx, 1);
    saveToStorage();
    renderBookmarks();
  }
};

// ---- Init ----
document.addEventListener('DOMContentLoaded', function() {
  renderFilterChips();
  renderBookmarks();

  var searchInput = document.getElementById('bookmarkSearch');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      currentSearch = e.target.value;
      renderBookmarks();
    });
  }

  var editBtn = document.getElementById('editBtnBookmarks');
  if (editBtn) {
    editBtn.innerHTML = '\uC218\uC815';
    editBtn.addEventListener('click', function() {
      isEditMode = !isEditMode;
      editBtn.innerHTML = isEditMode ? '\uC800\uC7A5' : '\uC218\uC815';
      editBtn.classList.toggle('saving', isEditMode);
      renderBookmarks();
    });
  }

  // ensure modal exists at startup (warm up)
  getModal();
});
