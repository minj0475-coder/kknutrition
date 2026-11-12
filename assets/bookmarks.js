// ============================================================
// bookmarks.js — 북마크 관리 스크립트 (완전 재작성 v2)
// ============================================================

let bookmarkData = [
  // 급식 (기존 급식·위생 + 학교 포함)
  { title: "업무포털 메인", url: "https://goe.eduptl.kr/bpm_man_mn00_001.do", category: "급식" },
  { title: "공직자통합메일", url: "https://mail.korea.kr/", category: "급식" },
  { title: "SmartHACCP", url: "https://gimpo.haccpcook.or.kr/diet/", category: "급식" },
  { title: "공공급식통합플랫폼", url: "https://ns.eat.co.kr/NeaT/eats/index.html", category: "급식" },
  { title: "학교우유급식 정보시스템", url: "http://dairy.schoolmilk.or.kr/smis/smisweb/auth/login.html?v=1756168663985", category: "급식" },
  { title: "축산물원패스", url: "https://www.ekape.or.kr/kapecp/ui/kapecp/fastLogin.jsp?loginType=02", category: "급식" },
  { title: "School SMS | 교사용", url: "https://www.jtschoolsms.com/alimee/login/loginForm.html", category: "급식" },
  { title: "아이염스쿨", url: "https://school.iamservice.net/", category: "급식" },
  { title: "청수초등학교", url: "https://www.gpoe.kr/cheongsu-e/main.do", category: "급식" },
  { title: "청수초 도서관", url: "https://read365.edunet.net/PureScreen/SchoolSearch?schoolName=%EC%B2%AD%EC%88%98%EC%B4%88%EB%93%B1%ED%95%99%EA%B5%90&provCode=J10&neisCode=J100006046", category: "급식" },
  { title: "공무원연금공단", url: "https://www.gwp.or.kr/wus/cmmn/lgn/login.jdo", category: "급식" },
  { title: "S2B (학교장터)", url: "https://www.s2b.kr/S2BNCustomer/S2B/", category: "급식" },

  // 자료
  { title: "식품안전나라 교육자료", url: "https://www.foodsafetykorea.go.kr/portal/board/boardDetail.do?menu_no=2880&menu_grp=MENU_NEW05&bbs_no=bbs110&ntctxt_no=1104499", category: "자료" },
  { title: "교육급식정보나눔방", url: "https://more.goe.go.kr/schoollunch/index.do", category: "자료" },
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

const BOOKMARK_STORAGE_KEY = 'kknutrition_bookmarks_v4';
const BOOKMARK_LOCAL_META_KEY = 'kknutrition_bookmarks_v4_meta';
let bookmarkUpdatedAt = 0;
let bookmarkPendingLocalWriteAt = 0;
let bookmarkLoadedFromFallback = true;

function normalizeBookmarkCategory(category) {
  if (category === '공산·단가' || category === '공산, 단가' || category === '공산 단가' || category === '공산·단가 관련') {
    return '자료';
  }
  return category || '기타';
}

function normalizeBookmarkItem(item) {
  return {
    ...item,
    category: normalizeBookmarkCategory(item && item.category)
  };
}

function normalizeBookmarkStoragePayload(value) {
  if (Array.isArray(value)) {
    return { items: value, updatedAt: 0 };
  }
  if (value && Array.isArray(value.items)) {
    return {
      items: value.items,
      updatedAt: Number(value.updatedAt) || 0
    };
  }
  return null;
}

function readBookmarkLocalMeta() {
  try {
    return JSON.parse(localStorage.getItem(BOOKMARK_LOCAL_META_KEY) || '{}');
  } catch (e) {
    return {};
  }
}

function writeBookmarkStorage(items, updatedAt) {
  bookmarkUpdatedAt = Number(updatedAt) || Date.now();
  bookmarkLoadedFromFallback = false;
  localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify({
    items: items.map(normalizeBookmarkItem),
    updatedAt: bookmarkUpdatedAt
  }));
  localStorage.setItem(BOOKMARK_LOCAL_META_KEY, JSON.stringify({
    updatedAt: bookmarkUpdatedAt
  }));
}

function hasMeaningfulBookmarkData(items) {
  return Array.isArray(items) && items.some(function(item) {
    return item && (String(item.title || '').trim() || String(item.url || '').trim());
  });
}

// ---- LocalStorage (v4 only) ----
(function loadFromStorage() {
  try {
    // Read only the current v4 storage key.
    var saved = localStorage.getItem(BOOKMARK_STORAGE_KEY);
    if (!saved) {
      bookmarkLoadedFromFallback = true;
      bookmarkUpdatedAt = 0;
      return;
    }
    var parsed = normalizeBookmarkStoragePayload(JSON.parse(saved));
    if (parsed && hasMeaningfulBookmarkData(parsed.items)) {
      bookmarkData = parsed.items.map(normalizeBookmarkItem);
      bookmarkUpdatedAt = parsed.updatedAt || Number(readBookmarkLocalMeta().updatedAt) || 0;
      bookmarkLoadedFromFallback = false;
    }
  } catch (e) { /* ignore */ }
})();

function saveToStorage(options) {
  options = options || {};
  writeBookmarkStorage(bookmarkData, Date.now());
  if (options.sync === false) return;
  if (typeof window.syncBookmarksToFirebase === 'function') {
    bookmarkPendingLocalWriteAt = bookmarkUpdatedAt;
    return window.syncBookmarksToFirebase(bookmarkData, { updatedAt: bookmarkUpdatedAt })
      .catch(function(error) { console.error('Firestore bookmark save failed:', error); });
  }
  return Promise.resolve();
}

// Firebase에서 외부 업데이트를 받을 때 호출되는 함수
window.updateBookmarkData = function(newData, remoteMeta) {
  if (!Array.isArray(newData)) return;
  if (isEditMode) return;
  var remoteUpdatedAt = Number(remoteMeta && remoteMeta.updatedAt) || 0;
  var localUpdatedAt = bookmarkUpdatedAt || Number(readBookmarkLocalMeta().updatedAt) || 0;
  if (bookmarkPendingLocalWriteAt && remoteUpdatedAt >= bookmarkPendingLocalWriteAt) {
    bookmarkPendingLocalWriteAt = 0;
  }
  if (bookmarkPendingLocalWriteAt && bookmarkPendingLocalWriteAt > remoteUpdatedAt) {
    if (typeof window.syncBookmarksToFirebase === 'function') {
      window.syncBookmarksToFirebase(bookmarkData, { updatedAt: bookmarkPendingLocalWriteAt })
        .catch(function(error) { console.error('Firestore bookmark pending save failed:', error); });
    }
    return;
  }
  if (bookmarkLoadedFromFallback && !localUpdatedAt) {
    if (hasMeaningfulBookmarkData(newData)) {
      bookmarkData = newData.map(normalizeBookmarkItem);
      writeBookmarkStorage(bookmarkData, remoteUpdatedAt || Date.now());
      if (typeof window.renderBookmarks === 'function') {
        window.renderBookmarks();
      }
    }
    return;
  }
  if (!localUpdatedAt && !bookmarkLoadedFromFallback && hasMeaningfulBookmarkData(bookmarkData)) {
    localUpdatedAt = Date.now();
    writeBookmarkStorage(bookmarkData, localUpdatedAt);
    if (typeof window.syncBookmarksToFirebase === 'function') {
      window.syncBookmarksToFirebase(bookmarkData, { updatedAt: localUpdatedAt });
    }
    return;
  }
  if (localUpdatedAt && remoteUpdatedAt && remoteUpdatedAt < localUpdatedAt) {
    if (typeof window.syncBookmarksToFirebase === 'function') {
      window.syncBookmarksToFirebase(bookmarkData, { updatedAt: localUpdatedAt });
    }
    return;
  }
  if (localUpdatedAt && !remoteUpdatedAt) {
    if (typeof window.syncBookmarksToFirebase === 'function') {
      window.syncBookmarksToFirebase(bookmarkData, { updatedAt: localUpdatedAt });
    }
    return;
  }
  bookmarkData = newData.map(normalizeBookmarkItem);
  writeBookmarkStorage(bookmarkData, remoteUpdatedAt || Date.now());
  if (typeof window.renderBookmarks === 'function') {
    window.renderBookmarks();
  }
};

window.getBookmarkData = function() {
  return bookmarkData;
};

window.getBookmarkSyncMeta = function() {
  return { updatedAt: bookmarkUpdatedAt || Number(readBookmarkLocalMeta().updatedAt) || 0 };
};

window.hasStoredBookmarkData = function() {
  return !bookmarkLoadedFromFallback && hasMeaningfulBookmarkData(bookmarkData);
};

// ---- State ----
var currentCategory = '\uC804\uCCB4';
var isEditMode = false;
var editingIdx = -1;

window.isBookmarkEditMode = function() {
  return isEditMode;
};

window.exitBookmarkEditMode = function() {
  if (!isEditMode) return;
  isEditMode = false;
  var section = document.getElementById('bookmarks');
  if (section) section.classList.remove('is-page-editing');
  var editBtn = document.getElementById('editBtnBookmarks');
  if (editBtn) {
    editBtn.innerHTML = '\uC218\uC815'; // '수정'
    editBtn.classList.remove('saving');
  }
  if (typeof renderBookmarks === 'function') {
    renderBookmarks();
  }
};

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
    + '<option value="\uae09\uc2dd">\uae09\uc2dd</option>'
    + '<option value="\uc790\ub8cc">\uc790\ub8cc</option>'
    + '<option value="\uae30\ud0c0">\uae30\ud0c0</option>'
    + '</select>'
    + '<label style="font-size:13px;font-weight:700;color:var(--muted);display:block;margin-bottom:6px;">\uC0AC\uC774\uD2B8\uBA85</label>'
    + '<input id="bmName" type="text" placeholder="\uC608: \uAD6C\uAE00" autocomplete="off" style="width:100%;padding:11px 14px;border-radius:12px;border:1.5px solid var(--line);background:var(--bg);color:var(--heading);font-size:14px;box-sizing:border-box;margin-bottom:14px;">'
    + '<label style="font-size:13px;font-weight:700;color:var(--muted);display:block;margin-bottom:6px;">URL \uC8FC\uC18C</label>'
    + '<input id="bmUrl" type="text" placeholder="https://..." autocomplete="off" style="width:100%;padding:11px 14px;border-radius:12px;border:1.5px solid var(--line);background:var(--bg);color:var(--heading);font-size:14px;box-sizing:border-box;margin-bottom:20px;">'
    + '<button id="bmSave" type="button" style="width:100%;padding:14px;border-radius:12px;border:none;background:var(--primary);color:#ffffff !important;font-size:15px;font-weight:700;cursor:pointer;">\uC644\uB8CC</button>'
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
    document.getElementById('bmCat').value = normalizeBookmarkCategory(item.category || '\uAE30\uD0C0');
    document.getElementById('bmName').value = item.title || '';
    document.getElementById('bmUrl').value = item.url || '';
  } else {
    document.getElementById('bmCat').value = (currentCategory === '\uC804\uCCB4') ? '\uae09\uc2dd' : normalizeBookmarkCategory(currentCategory);
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
  var category = normalizeBookmarkCategory(document.getElementById('bmCat').value);

  if (!title || !url) {
    alert('\uC0AC\uC774\uD2B8\uBA85\uACFC URL \uC8FC\uC18C\uB97C \uBAA8\uB450 \uC785\uB825\uD574\uC8FC\uC138\uC694.');
    return;
  }
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  var newItem = { title: title, url: url, category: category };
  if (editingIdx >= 0) {
    newItem = Object.assign({}, bookmarkData[editingIdx], newItem);
    bookmarkData[editingIdx] = newItem;
  } else {
    bookmarkData.push(newItem);
  }
  saveToStorage(isEditMode ? { sync: false } : undefined);
  closeModal();
  renderBookmarks();
}

// ---- Filter Chips ----
function renderFilterChips() {
  var cats = ['전체', '급식', '자료', '기타'];
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

const LOCAL_ICONS = {
  "goe.eduptl.kr": "assets/images/bookmarks/goe.eduptl.kr.svg",
  "mail.korea.kr": "assets/images/bookmarks/mail.korea.kr.ico",
  "gimpo.haccpcook.or.kr": "assets/images/bookmarks/gimpo.haccpcook.or.kr.png",
  "dairy.schoolmilk.or.kr": "assets/images/bookmarks/dairy.schoolmilk.or.kr.svg",
  "www.gwp.or.kr": "assets/images/bookmarks/www.gwp.or.kr.png",
  "www.ekape.or.kr": "assets/images/bookmarks/www.ekape.or.kr.svg",
  "www.s2b.kr": "assets/images/bookmarks/www.s2b.kr.ico",
  "www.moaform.com": "assets/images/bookmarks/www.moaform.com.svg",
  "cheongsu-e.gpoe.kr": "assets/images/bookmarks/cheongsu-e.gpoe.kr.png",
  "ercedu.hunet.co.kr": "assets/images/bookmarks/ercedu.hunet.co.kr.png",
  "www.foodsafetykorea.go.kr": "assets/images/bookmarks/www.foodsafetykorea.go.kr.png"
};

function extractDomain(url) {
  try {
    return new URL(url).hostname;
  } catch(e) {
    return '';
  }
}

function bookmarkIconForUrl(url) {
  try {
    var parsed = new URL(url);
    var domain = parsed.hostname;
    var path = parsed.pathname || '/';
    if (domain === 'minj0475-coder.github.io' && path.startsWith('/ggulggul-budget/')) {
      return 'https://minj0475-coder.github.io/ggulggul-budget/favicon-32x32.png';
    }
    if (domain === 'www.gpoe.kr' && path.startsWith('/cheongsu-e/')) {
      return 'assets/images/bookmarks/cheongsu-e.gpoe.kr.png';
    }
    if (domain === 'www.gpoe.kr' && path.startsWith('/gpoe/')) {
      return 'https://www.gpoe.kr/favicon.ico';
    }
    return LOCAL_ICONS[domain] || '';
  } catch(e) {
    return '';
  }
}

function faviconImg(url) {
  try {
    var domain = extractDomain(url);
    var matchedIcon = bookmarkIconForUrl(url);
    if (matchedIcon) {
      return '<span class="bm-favicon-frame" aria-hidden="true"><img src="' + matchedIcon + '" class="bm-favicon" alt="" loading="lazy"'
        + ' onerror="this.onerror=null;this.src=\'assets/app-icon-192.png\';"></span>';
    }

    var g = 'https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://' + domain + '&size=64';
    
    // 로딩 시 지연 방지
    return '<span class="bm-favicon-frame" aria-hidden="true"><img src="' + g + '" class="bm-favicon" alt="" loading="lazy"'
      + ' onerror="this.onerror=null;this.src=\'assets/app-icon-192.png\';"></span>';
  } catch(e) {
    return '<span class="bm-favicon-frame" aria-hidden="true"><img src="assets/app-icon-192.png" class="bm-favicon" alt=""></span>';
  }
}

// ---- Render ----
function renderBookmarks() {
  var container = document.getElementById('bookmarkGrid');
  if (!container) return;

  var filtered = bookmarkData.slice();
  var sortFn = function(a, b) {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    if (a.isFavorite && b.isFavorite) {
      return (a.favoriteTime || 0) - (b.favoriteTime || 0);
    }
    return (b.clickCount || 0) - (a.clickCount || 0);
  };
  
  if (currentCategory === '\uC804\uCCB4') {
    filtered.sort(sortFn);
  } else {
    filtered = filtered.filter(function(item) { return item.category === currentCategory; });
    filtered.sort(sortFn);
  }
  var html = '';
  if (filtered.length === 0 && !isEditMode) {
    html = '<div class="empty-bookmark">\uC870\uAC74\uC5D0 \uB9DE\uB294 \uBD81\uB9C8\uD06C\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.</div>';
  } else {
    html = filtered.map(function(item) {
      var origIdx = bookmarkData.findIndex(function(b) { return b.title === item.title && b.url === item.url; });
      var validUrl = /^https?:\/\//i.test(item.url) ? item.url : 'https://' + item.url;
      
      var starSvg = item.isFavorite 
        ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="#ffd700" stroke="#ffd700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>'
        : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
      var favBtnHtml = isEditMode
        ? '<button class="bm-favorite-btn" type="button" data-bookmark-index="' + origIdx + '" aria-label="\uC990\uACA8\uCC3E\uAE30" aria-pressed="' + (item.isFavorite ? 'true' : 'false') + '" title="\uC990\uACA8\uCC3E\uAE30" style="margin-left:auto; margin-right:32px; background:transparent; border:none; color:var(--muted); cursor:pointer; padding:4px; display:flex; align-items:center;">' + starSvg + '</button>'
        : (item.isFavorite ? '<span class="bm-favorite-status" aria-label="\uC990\uACA8\uCC3E\uAE30 \uB4F1\uB85D\uB428" title="\uC990\uACA8\uCC3E\uAE30 \uB4F1\uB85D\uB428">' + starSvg + '</span>' : '');

      if (isEditMode) {
        return '<div class="bookmark-card edit-mode-card" onclick="bmOpenModal(' + origIdx + ')" style="cursor:pointer;position:relative;">'
          + faviconImg(validUrl)
          + '<span class="bm-title">' + item.title + '</span>'
          + favBtnHtml
          + '<button class="bm-delete-btn" type="button" aria-label="\uBD81\uB9C8\uD06C \uC0AD\uC81C" title="\uC0AD\uC81C" onclick="event.stopPropagation();bmDelete(' + origIdx + ');">'
          + '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="m19 6-1 14H6L5 6"></path><path d="M10 11v5M14 11v5"></path></svg>'
          + '</button></div>';
      } else {
        return '<a href="' + validUrl + '" target="_blank" rel="noopener" class="bookmark-card" data-url="' + validUrl + '">'
          + faviconImg(validUrl)
          + '<span class="bm-title">' + item.title + '</span>'
          + favBtnHtml
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

  container.querySelectorAll('.bm-favorite-btn').forEach(function(button) {
    button.addEventListener('click', function(event) {
      event.preventDefault();
      event.stopPropagation();
      window.bmToggleFavorite(Number(button.dataset.bookmarkIndex));
    });
  });

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
          saveToStorage({ sync: false });
        }
      });
    });
  }

  if (typeof window.refreshPortalLinkHub === 'function') {
    window.refreshPortalLinkHub();
  }
}

// (bmDelete and bmOpenModal are defined above near getModal)

// Register globals after all functions defined
window.bmOpenModal = openModal;
window.bmDelete = function(idx) {
  if (confirm('\uC774 \uBD81\uB9C8\uD06C\uB97C \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?')) {
    bookmarkData.splice(idx, 1);
    saveToStorage(isEditMode ? { sync: false } : undefined);
    renderBookmarks();
  }
};

window.bmToggleFavorite = function(idx) {
  if (bookmarkData[idx]) {
    bookmarkData[idx].isFavorite = !bookmarkData[idx].isFavorite;
    if (bookmarkData[idx].isFavorite) {
      bookmarkData[idx].favoriteTime = Date.now();
    }
    saveToStorage();
    renderBookmarks();
  }
};

// ---- Portal link hub ----
var PORTAL_LINK_FILTERS = ['전체', '문자내용', '일정', '업체·전자단가', '구글 드라이브', '급식업무 사이트', '기타 자료'];
var PORTAL_LINK_TITLE_OVERRIDES = {
  '1FAIpQLScpbf-a8wOidVc0VAVz25Dg7lVqHI4SqnLQMZn9eM7GRajAAA': '[청수초등학교] 급식 메뉴 아이디어 공모전',
  '1TrzDxsxtQCNC1NwifOj79y52aCn033az': '오늘의 영양퀴즈 포스터',
  '1nOmyocicNMYiGxpSrxOT7oqD7ptJkXUh': '오늘의 영양퀴즈 A2 포스터',
  '1QekrFgI7Y6F8es6-8XkPQEHYZavXDeF1': '응시원서 및 자기소개서',
  'AKfycbxGQK0VIkSy8PdkseVyoR6p848BP7HU8pfmpcOTbY_uldLJ_XLqFE_hHqd3wC97eXlg': '식생활 습관 개선 영양교육 성장일지',
  'AKfycbxZaIRsof1Lp1Fu3f-xEL3HE9gADGUHEMt4sVu1FyHzV7lgP6TdhjQC7ox3nlRxMpM3': '오늘의 영양퀴즈'
};
var PORTAL_LINK_SOURCE_OVERRIDES = {
  '1l_Eo4vlMdeQzFI12w6Dw536ayA4ZSxoaUxoPQSoV4M8': '구글 드라이브'
};
var portalLinkHubState = { category: '전체' };
var portalLinkHubItems = [];

function escapePortalLinkHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function(char) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
  });
}

function readPortalLinkStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch (e) {
    return null;
  }
}

function normalizePortalLinkUrl(value, options) {
  var raw = String(value || '').trim();
  if (!raw) return '';
  raw = raw.replace(/[\s\u00a0]+$/g, '').replace(/[),.;\]}]+$/g, '');
  if (/^www\./i.test(raw)) raw = 'https://' + raw;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(raw) && options && options.allowBareDomain && /^[^\s/]+\.[^\s]+/.test(raw)) {
    raw = 'https://' + raw;
  }
  try {
    var url = new URL(raw, location.href);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    if (url.username || url.password) return '';
    var hasSensitiveParameter = false;
    url.searchParams.forEach(function(_value, key) {
      if (/(password|passwd|token|auth|api.?key|secret|credential)/i.test(key)) hasSensitiveParameter = true;
    });
    if (hasSensitiveParameter || /(?:^|[&#])(access_token|password|secret|credential)=/i.test(url.hash)) return '';
    return url.href;
  } catch (e) {
    return '';
  }
}

function canonicalPortalLinkUrl(value) {
  try {
    var url = new URL(value);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'].forEach(function(key) {
      url.searchParams.delete(key);
    });
    url.hostname = url.hostname.toLowerCase();
    return url.href;
  } catch (e) {
    return value;
  }
}

function portalLinkDomain(value) {
  try {
    return new URL(value).hostname.replace(/^www\./i, '');
  } catch (e) {
    return '';
  }
}

function isGoogleDrivePortalLink(value) {
  try {
    var hostname = new URL(value).hostname.toLowerCase();
    return [
      'docs.google.com',
      'drive.google.com',
      'script.google.com',
      'sheets.google.com',
      'slides.google.com',
      'forms.google.com',
      'forms.gle',
      'docs.googleusercontent.com',
      'drive.googleusercontent.com',
      'drive.usercontent.google.com'
    ].indexOf(hostname) >= 0;
  } catch (e) {
    return false;
  }
}

function extractPortalUrlsFromText(value) {
  var text = String(value || '');
  var matches = text.match(/(?:https?:\/\/|www\.)[^\s<>"'`\\]+/gi) || [];
  return matches.map(function(url) {
    return normalizePortalLinkUrl(url);
  }).filter(Boolean);
}

function getPortalListItems(value) {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.items)) return value.items;
  return [];
}

function getPortalLinkSourceForElement(anchor, url) {
  if (anchor.closest('#messageTemplates')) return '문자내용';
  if (anchor.matches('[data-annual-sheet-open], .annual-sheet-open-btn')) return '구글 드라이브';
  if (anchor.closest('#monthly, #annual')) return '일정';
  if (anchor.closest('#promo-contacts')) return '업체·전자단가';
  if (anchor.closest('#bookmarks')) return '급식업무 사이트';
  return '급식업무 사이트';
}

function getPortalLinkTitleForElement(anchor, url) {
  var nearbyTitle = '';
  var sheetCard = anchor.closest('.sheet-link-card');
  if (sheetCard) nearbyTitle = String(sheetCard.querySelector('strong')?.textContent || '').trim();
  var title = nearbyTitle
    || String(anchor.dataset.linkTitle || '').trim()
    || String(anchor.getAttribute('aria-label') || '').trim()
    || String(anchor.getAttribute('title') || '').trim()
    || String(anchor.textContent || '').replace(/\s+/g, ' ').trim();
  title = title.replace(/\s*(링크|사이트|스프레드시트)?\s*열기$/g, '').trim();
  if (!title || /^(열기|바로가기|스프레드시트)$/i.test(title)) return portalLinkDomain(url) || '바로가기';
  return title;
}

function buildPortalLinkHubItems() {
  var itemMap = new Map();
  var blockedFieldPattern = /(password|passwd|token|auth|api.?key|secret|credential|비밀번호)/i;

  function addLink(rawUrl, title, source, detail, options) {
    var url = normalizePortalLinkUrl(rawUrl, options);
    if (!url) return;
    if (url === 'https://litt.ly/cha0yang') return;
    var canonical = canonicalPortalLinkUrl(url);
    var cleanTitle = String(title || '').replace(/[*_`#]/g, '').replace(/\s+/g, ' ').trim() || portalLinkDomain(url) || '바로가기';
    if (cleanTitle === '구글 드라이브 자료' || url.indexOf('1U554SSpIIjIbD7ALQB9vK_mbbUZkm8UF') >= 0) return;
    Object.keys(PORTAL_LINK_TITLE_OVERRIDES).some(function(linkId) {
      if (url.indexOf(linkId) < 0) return false;
      cleanTitle = PORTAL_LINK_TITLE_OVERRIDES[linkId];
      return true;
    });
    if (/(작업\s*시작\s*전|가장\s*중요한\s*조건|원격\s*main|비밀번호|password|아이디\s*:)/i.test(cleanTitle)) {
      cleanTitle = (source || '기타 자료') + ' 링크';
    }
    if ((cleanTitle === '기타 자료 링크' || cleanTitle === '생각서랍') && new URL(url).origin === location.origin) return;
    if (cleanTitle.length > 54) cleanTitle = cleanTitle.slice(0, 51).trim() + '…';
    var cleanSource = PORTAL_LINK_FILTERS.indexOf(source) >= 0 && source !== '전체' ? source : '기타 자료';
    var existing = itemMap.get(canonical);
    if (!existing) {
      existing = {
        url: url,
        title: cleanTitle,
        domain: portalLinkDomain(url),
        sources: [],
        details: []
      };
      itemMap.set(canonical, existing);
    }
    var existingIsGeneric = /^(전자\s*단가|링크|바로가기|사이트|자료)$/i.test(existing.title);
    var nextIsGeneric = /^(전자\s*단가|링크|바로가기|사이트|자료)$/i.test(cleanTitle);
    if (existing.title === existing.domain || existingIsGeneric && !nextIsGeneric || existing.title.length < cleanTitle.length && existing.title.length < 8) {
      existing.title = cleanTitle;
    }
    if (PORTAL_LINK_TITLE_OVERRIDES[Object.keys(PORTAL_LINK_TITLE_OVERRIDES).find(function(linkId) { return url.indexOf(linkId) >= 0; })]) {
      existing.title = cleanTitle;
    }
    if (existing.sources.indexOf(cleanSource) < 0) existing.sources.push(cleanSource);
    if (isGoogleDrivePortalLink(url) && existing.sources.indexOf('구글 드라이브') < 0) {
      existing.sources.push('구글 드라이브');
    }
    var cleanDetail = String(detail || '').replace(/\s+/g, ' ').trim();
    if (cleanDetail && existing.details.indexOf(cleanDetail) < 0) existing.details.push(cleanDetail);
  }

  function addTextLinks(text, title, source, detail) {
    extractPortalUrlsFromText(text).forEach(function(url) {
      addLink(url, title, source, detail);
    });
  }

  function collectTextLinks(value, source, context, depth) {
    if (value == null || depth > 4) return;
    if (typeof value === 'string') {
      addTextLinks(value, context || source + ' 링크', source, context);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(function(item) {
        var nextContext = item && typeof item === 'object'
          ? String(item.title || item.name || item.company || item.date || context || '').trim()
          : context;
        collectTextLinks(item, source, nextContext, depth + 1);
      });
      return;
    }
    if (typeof value === 'object') {
      var objectContext = String(value.title || value.name || value.company || value.date || context || '').trim();
      Object.keys(value).forEach(function(key) {
        if (blockedFieldPattern.test(key)) return;
        collectTextLinks(value[key], source, objectContext, depth + 1);
      });
    }
  }

  document.querySelectorAll('a[href]').forEach(function(anchor) {
    if (anchor.closest('#portalLinkHubGrid, #portalLinkHubFilters, #bookmarkGrid')) return;
    if (anchor.id === 'substituteQrDownloadBtn') return;
    if (anchor.matches('.promo-open-link')) return;
    var rawHref = String(anchor.getAttribute('href') || '').trim();
    if (/school-lunch-tv\.html|신규대체조리종사원_안내\.html/i.test(rawHref)) return;
    if (!rawHref || rawHref.charAt(0) === '#' || /^(javascript:|mailto:|tel:)/i.test(rawHref)) return;
    var url = normalizePortalLinkUrl(rawHref);
    if (!url) return;
    var title = getPortalLinkTitleForElement(anchor, url);
    var source = getPortalLinkSourceForElement(anchor, url);
    addLink(url, title, source, '포털 화면');
  });

  getPortalListItems(readPortalLinkStorage('kkulkkoori_message_templates_v1')).forEach(function(item) {
    var title = String(item && item.title || '문자내용 링크').trim();
    addTextLinks(item && item.body, title, '문자내용', title);
  });

  var academicEvents = readPortalLinkStorage('kkulkkoori_academic_events_v1');
  if (academicEvents && typeof academicEvents === 'object' && !Array.isArray(academicEvents)) {
    Object.keys(academicEvents).forEach(function(date) {
      var events = Array.isArray(academicEvents[date]) ? academicEvents[date] : [academicEvents[date]];
      events.forEach(function(event) {
        if (!event || typeof event !== 'object') return;
        var title = String(event.title || '학사일정 링크').trim();
        addLink(event.url, title, '일정', date);
        addTextLinks(event.memo, title, '일정', date);
      });
    });
  }

  var annualLabels = {
    allergy: '알레르기 학생 조사',
    milk: '우유 수요 조사',
    parents: '학부모 봉사·모니터링 명단 및 일정'
  };
  var annualLinks = readPortalLinkStorage('kkulkkoori_annual_sheet_links_v1');
  if (annualLinks && typeof annualLinks === 'object' && !Array.isArray(annualLinks)) {
    Object.keys(annualLinks).forEach(function(key) {
      addLink(annualLinks[key], annualLabels[key] || '연간 일정 스프레드시트', '구글 드라이브', '연간 일정', { allowBareDomain: true });
    });
  }

  var promoContacts = readPortalLinkStorage('kkulkkoori_promo_contacts_v1');
  if (Array.isArray(promoContacts)) {
    promoContacts.forEach(function(item) {
      var company = String(item && item.company || '업체 전자단가').trim();
      addLink(item && item.link, company, '업체·전자단가', '전자단가', { allowBareDomain: true });
      addTextLinks(item && item.memo, company, '업체·전자단가', '업체 메모');
    });
  }

  var serviceSheet = localStorage.getItem('kkulkkoori_service_sheet_link') || '';
  if (serviceSheet) {
    var parsedServiceSheet = readPortalLinkStorage('kkulkkoori_service_sheet_link');
    addLink(typeof parsedServiceSheet === 'string' ? parsedServiceSheet : serviceSheet, '복무 사용 현황표', '기타 자료', '조리종사원', { allowBareDomain: true });
  }

  collectTextLinks(readPortalLinkStorage('kkulkkoori_work_notes_v1'), '기타 자료', '생각서랍', 0);
  collectTextLinks(readPortalLinkStorage('kkulkkoori_staff_notices_v1'), '기타 자료', '조리종사원 전달사항', 0);
  collectTextLinks(readPortalLinkStorage('kkulkkoori_cheongsu_recipes_v3'), '기타 자료', '급식노트', 0);

  document.querySelectorAll('input[type="url"], textarea').forEach(function(field) {
    extractPortalUrlsFromText(field.value).forEach(function(url) {
      if (!isGoogleDrivePortalLink(url)) return;
      var title = String(field.getAttribute('aria-label') || field.getAttribute('title') || field.placeholder || '구글 드라이브 자료').trim();
      addLink(url, title, '구글 드라이브', '포털 입력 자료');
    });
  });

  function collectGoogleDriveLinksFromStorage(storage, detail) {
    if (!storage) return;
    try {
      for (var storageIndex = 0; storageIndex < storage.length; storageIndex += 1) {
        var storageKey = String(storage.key(storageIndex) || '');
        if (!storageKey || /bookmark/i.test(storageKey)) continue;
        extractPortalUrlsFromText(storage.getItem(storageKey) || '').forEach(function(url) {
          if (isGoogleDrivePortalLink(url)) {
            addLink(url, '구글 드라이브 자료', '구글 드라이브', detail);
          }
        });
      }
    } catch (e) { /* storage may be unavailable in restricted browsing modes */ }
  }

  collectGoogleDriveLinksFromStorage(localStorage, '포털 저장 자료');
  collectGoogleDriveLinksFromStorage(sessionStorage, '포털 임시 저장 자료');

  itemMap.forEach(function(item) {
    var sourceOverride = '';
    Object.keys(PORTAL_LINK_SOURCE_OVERRIDES).some(function(linkId) {
      if (item.url.indexOf(linkId) < 0) return false;
      sourceOverride = PORTAL_LINK_SOURCE_OVERRIDES[linkId];
      return true;
    });
    if (sourceOverride) {
      item.sources = [sourceOverride];
    } else if (item.sources.indexOf('업체·전자단가') >= 0) {
      item.sources = ['업체·전자단가'];
    } else if (isGoogleDrivePortalLink(item.url) || item.sources.indexOf('구글 드라이브') >= 0) {
      item.sources = ['구글 드라이브'];
    }
  });

  return Array.from(itemMap.values()).sort(function(a, b) {
    var sourceA = Math.min.apply(null, a.sources.map(function(source) { return PORTAL_LINK_FILTERS.indexOf(source); }));
    var sourceB = Math.min.apply(null, b.sources.map(function(source) { return PORTAL_LINK_FILTERS.indexOf(source); }));
    if (sourceA !== sourceB) return sourceA - sourceB;
    return a.title.localeCompare(b.title, 'ko');
  });
}

function renderPortalLinkHubFilters() {
  var container = document.getElementById('portalLinkHubFilters');
  if (!container) return;
  var available = PORTAL_LINK_FILTERS.filter(function(category) {
    return category === '전체' || portalLinkHubItems.some(function(item) {
      return item.sources.indexOf(category) >= 0;
    });
  });
  if (available.indexOf(portalLinkHubState.category) < 0) portalLinkHubState.category = '전체';
  container.innerHTML = available.map(function(category) {
    var active = category === portalLinkHubState.category;
    return '<button class="portal-link-filter' + (active ? ' active' : '') + '" type="button" data-portal-link-filter="' + escapePortalLinkHtml(category) + '" aria-pressed="' + (active ? 'true' : 'false') + '">' + escapePortalLinkHtml(category) + '</button>';
  }).join('');
  container.querySelectorAll('[data-portal-link-filter]').forEach(function(button) {
    button.addEventListener('click', function() {
      portalLinkHubState.category = button.dataset.portalLinkFilter || '전체';
      renderPortalLinkHubFilters();
      renderPortalLinkHubGrid();
    });
  });
}

function renderPortalLinkHubGrid() {
  var grid = document.getElementById('portalLinkHubGrid');
  var status = document.getElementById('portalLinkHubStatus');
  if (!grid) return;
  var filtered = portalLinkHubItems.filter(function(item) {
    return portalLinkHubState.category === '전체' || item.sources.indexOf(portalLinkHubState.category) >= 0;
  });
  if (status) status.textContent = filtered.length ? '' : '조건에 맞는 링크가 없습니다.';
  grid.innerHTML = filtered.map(function(item) {
    var sourceBadges = item.sources.slice(0, 2).map(function(source) {
      return '<span class="portal-link-source">' + escapePortalLinkHtml(source) + '</span>';
    }).join('');
    return '<a class="portal-link-card" href="' + escapePortalLinkHtml(item.url) + '" target="_blank" rel="noopener noreferrer">'
      + faviconImg(item.url)
      + '<span class="portal-link-copy">'
      + '<strong>' + escapePortalLinkHtml(item.title) + '</strong>'
      + '<span class="portal-link-meta"><span class="portal-link-domain">' + escapePortalLinkHtml(item.domain) + '</span>' + sourceBadges + '</span>'
      + '</span>'
      + '<span class="portal-link-open">바로가기<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5M19 5l-8 8M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>'
      + '</a>';
  }).join('');
}

function refreshPortalLinkHub() {
  if (!document.getElementById('portalLinkHubGrid')) return;
  portalLinkHubItems = buildPortalLinkHubItems();
  renderPortalLinkHubFilters();
  renderPortalLinkHubGrid();
}

function setupPortalLinkHub() {
  if (!document.getElementById('portalLinkHubGrid')) return;
  window.refreshPortalLinkHub = refreshPortalLinkHub;
  refreshPortalLinkHub();
  window.addEventListener('storage', refreshPortalLinkHub);
  window.addEventListener('kknutrition:cloud-data-applied', refreshPortalLinkHub);
  window.addEventListener('hashchange', function() {
    if (location.hash === '#bookmarks') refreshPortalLinkHub();
  });
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', function() {
  renderFilterChips();
  renderBookmarks();
  setupPortalLinkHub();

  var editBtn = document.getElementById('editBtnBookmarks');
  if (editBtn) {
    editBtn.innerHTML = '\uC218\uC815';
    editBtn.addEventListener('click', async function() {
      if (isEditMode) {
        await saveToStorage();
        isEditMode = false;
      } else {
        isEditMode = true;
      }
      var section = document.getElementById('bookmarks');
      if (section) section.classList.toggle('is-page-editing', isEditMode);
      editBtn.innerHTML = isEditMode ? '\uC800\uC7A5' : '\uC218\uC815';
      editBtn.classList.toggle('saving', isEditMode);
      renderBookmarks();
    });
  }

  // ensure modal exists at startup (warm up)
  getModal();
});

