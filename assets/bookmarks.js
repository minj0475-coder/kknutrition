// ============================================================
// bookmarks.js — 북마크 관리 스크립트 (완전 재작성 v2)
// ============================================================

let bookmarkData = [
  // 필수 업무
  { title: "\uC5C5\uBB34\uD3EC\uD138 \uBA54\uC778", url: "https://goe.eduptl.kr/bpm_man_mn00_001.do", category: "\uD544\uC218 \uC5C5\uBB34" },
  { title: "\uACF5\uC9C1\uC790\uD1B5\uD569\uBA54\uC77C", url: "https://mail.korea.kr/", category: "\uD544\uC218 \uC5C5\uBB34" },

  // 급식·위생
  { title: "SmartHACCP", url: "https://gimpo.haccpcook.or.kr/diet/", category: "\uAE09\uC2DD\u00B7\uC704\uC0DD" },
  { title: "\uACF5\uACF5\uAE09\uC2DD\uD1B5\uD569\uD50C\uB7AB\uD3FC", url: "https://ns.eat.co.kr/NeaT/eats/index.html", category: "\uAE09\uC2DD\u00B7\uC704\uC0DD" },
  { title: "\uD559\uAD50\uC6B0\uC720\uAE09\uC2DD \uC815\uBCF4\uC2DC\uC2A4\uD15C", url: "http://dairy.schoolmilk.or.kr/smis/smisweb/auth/login.html?v=1756168663985", category: "\uAE09\uC2DD\u00B7\uC704\uC0DD" },
  { title: "\uCD95\uC0B0\uBB3C\uC6D0\uD328\uC2A4", url: "https://www.ekape.or.kr/kapecp/ui/kapecp/fastLogin.jsp?loginType=02", category: "\uAE09\uC2DD\u00B7\uC704\uC0DD" },

  // 식재료·단가 관련
  { title: "\uBE14\uB8E8\uC2DC\uC2A4 \uB9C8\uCF13", url: "https://market.bluesis.com/web/pc/main.php", category: "\uC2DD\uC7AC\uB8CC\u00B7\uB2E8\uAC00 \uAD00\uB828" },
  { title: "\uD2FC\uD2FC\uC2A4\uCFE8", url: "https://www.cjschoolfood.com/", category: "\uC2DD\uC7AC\uB8CC\u00B7\uB2E8\uAC00 \uAD00\uB828" },
  { title: "\uD480\uBB34\uC6D0\uD478\uB4DC\uBA38\uC2A4 \uD480\uC2A4\uD1A0\uB9AC", url: "https://pulstory.pulmuone.com/", category: "\uC2DD\uC7AC\uB8CC\u00B7\uB2E8\uAC00 \uAD00\uB828" },

  // 소통·학교
  { title: "School SMS | \uAD50\uC0AC\uC6A9", url: "https://www.jtschoolsms.com/alimee/login/loginForm.html", category: "\uC18C\uD1B5\u00B7\uD559\uAD50" },
  { title: "\uC544\uC774\uC5FC\uC2A4\uCFE8", url: "https://school.iamservice.net/", category: "\uC18C\uD1B5\u00B7\uD559\uAD50" },
  { title: "\uCCAD\uC218\uCD08\uB4F1\uD559\uAD50", url: "https://www.gpoe.kr/cheongsu-e/main.do", category: "\uC18C\uD1B5\u00B7\uD559\uAD50" },
  { title: "\uCCAD\uC218\uCD08 \uB3C4\uC11C\uAD00", url: "https://read365.edunet.net/PureScreen/SchoolSearch?schoolName=%EC%B2%AD%EC%88%98%EC%B4%88%EB%93%B1%ED%95%99%EA%B5%90&provCode=J10&neisCode=J100006046", category: "\uC18C\uD1B5\u00B7\uD559\uAD50" },
  { title: "\uACF5\uBB34\uC6D0\uC5F0\uAE08\uACF5\uB2E8", url: "https://www.gwp.or.kr/wus/cmmn/lgn/login.jdo", category: "\uC18C\uD1B5\u00B7\uD559\uAD50" },
  { title: "S2B (\uD559\uAD50\uC7A5\uD130)", url: "https://www.s2b.kr/S2BNCustomer/S2B/", category: "\uC18C\uD1B5\u00B7\uD559\uAD50" },

  // 자료·연수
  { title: "\uC2DD\uD488\uC548\uC804\uB098\uB77C \uAD50\uC721\uC790\uB8CC", url: "https://www.foodsafetykorea.go.kr/portal/board/boardDetail.do?menu_no=2880&menu_grp=MENU_NEW05&bbs_no=bbs110&ntctxt_no=1104499", category: "\uC790\uB8CC\u00B7\uC5F0\uC218" },
  { title: "\uAD50\uC721\uAE09\uC2DD\uC815\uBCF4\uB098\uB204\uBC29", url: "https://more.goe.go.kr/schoollunch/index.do", category: "\uC790\uB8CC\u00B7\uC5F0\uC218" },
  { title: "\uD559\uAD50\uAE09\uC2DD \uC815\uBCF4\uB9C8\uB2F9", url: "https://www.sfic.go.kr/board/view.do?boardId=BBS_0000008&menuCd=DOM_000000105001000000&startPage=1&searchType=DATA_TITLE&keyword=%EC%8B%9D%EC%83%9D%ED%99%9C&dataSid=57497", category: "\uC790\uB8CC\u00B7\uC5F0\uC218" },
  { title: "\uC601\uC591\uAD11\uC7A5", url: "https://agora-nutrition.com/", category: "\uC790\uB8CC\u00B7\uC5F0\uC218" },
  { title: "\uC601\uC591\uC0AC\uB3C4\uC6B0\uBBF8", url: "https://www.kdclub.com/", category: "\uC790\uB8CC\u00B7\uC5F0\uC218" },
  { title: "\uC9C0\uBC29\uACF5\uAE30\uC5C5\uD3C9\uAC00\uC6D0 \uC0AC\uC774\uBC84\uC5F0\uC218\uC6D0", url: "https://ercedu.hunet.co.kr/Home", category: "\uC790\uB8CC\u00B7\uC5F0\uC218" },
  { title: "\uCC38\uBBF8\uB8CC \uC601\uC591\uC18C\uC2DD\uC9C0", url: "https://chamssaem.com/516573", category: "\uC790\uB8CC\u00B7\uC5F0\uC218" },
  { title: "\uD559\uAD50\uAE09\uC2DD \uD1B5\uD569\uD50C\uB7AB\uD3FC", url: "https://www.sfic.go.kr/", category: "\uC790\uB8CC\u00B7\uC5F0\uC218" },
  { title: "\uACBD\uAE30\uAD50\uC721\uBAA8\uC544", url: "https://more.goe.go.kr/edup/cmm/mber/myPage/selectMyPageMain.do", category: "\uC790\uB8CC\u00B7\uC5F0\uC218" },

  // 기타
  { title: "ChatGPT", url: "https://chatgpt.com/?openaicom_referred=true", category: "\uAE30\uD0C0" },
  { title: "Google Gemini", url: "https://gemini.google.com/app?hl=ko", category: "\uAE30\uD0C0" },
  { title: "Canva \uD15C\uD50C\uB9BF", url: "https://www.canva.com/templates", category: "\uAE30\uD0C0" },
  { title: "\uBAA8\uC544\uD3FC", url: "https://www.moaform.com/questionnaires", category: "\uAE30\uD0C0" },
  { title: "\uC601\uC591\uBBF8\uB0B4\uC758 \uC790\uB8CC\uC2E4", url: "https://padlet.com/minaemi91/at-yamminae-lqfxtvtlwzoti614", category: "\uAE30\uD0C0" },
  { title: "NAVER", url: "https://www.naver.com/", category: "\uAE30\uD0C0" }
];

// ---- LocalStorage ----
(function loadFromStorage() {
  try {
    var saved = localStorage.getItem('kknutrition_bookmarks_v2');
    if (saved) {
      var parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) bookmarkData = parsed;
    }
  } catch (e) { /* ignore */ }
})();

function saveToStorage() {
  localStorage.setItem('kknutrition_bookmarks_v2', JSON.stringify(bookmarkData));
}

// ---- State ----
var currentCategory = '\uC804\uCCB4';
var currentSearch = '';
var isEditMode = false;
var editingIdx = -1;

// ---- Modal (created once) ----
var _modal = null;

function getModal() {
  if (_modal) return _modal;
  _modal = document.getElementById('bookmarkSingleEditorModal');
  if (!_modal) {
    var div = document.createElement('div');
    div.innerHTML = '<div id="bookmarkSingleEditorModal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.55);z-index:10001;align-items:center;justify-content:center;backdrop-filter:blur(6px);">'
      + '<div style="background:var(--card);max-width:400px;width:90%;border-radius:20px;box-shadow:0 20px 50px rgba(0,0,0,.2);padding:28px 28px 24px;position:relative;">'
      + '<h3 id="bmModalTitle" style="margin:0 0 20px;font-size:20px;font-weight:800;color:var(--heading);">\uC0C8 \uBD81\uB9C8\uD06C \uCD94\uAC00</h3>'
      + '<label style="font-size:13px;font-weight:700;color:var(--muted);display:block;margin-bottom:6px;">\uCE74\uD14C\uACE0\uB9AC</label>'
      + '<select id="bmCat" style="width:100%;padding:11px 14px;border-radius:12px;border:1.5px solid var(--line);background:var(--bg);color:var(--heading);font-size:14px;box-sizing:border-box;margin-bottom:14px;">'
      + '<option value="\uD544\uC218 \uC5C5\uBB34">\uD544\uC218 \uC5C5\uBB34</option>'
      + '<option value="\uAE09\uC2DD\u00B7\uC704\uC0DD">\uAE09\uC2DD\u00B7\uC704\uC0DD</option>'
      + '<option value="\uC2DD\uC7AC\uB8CC\u00B7\uB2E8\uAC00 \uAD00\uB828">\uC2DD\uC7AC\uB8CC\u00B7\uB2E8\uAC00 \uAD00\uB828</option>'
      + '<option value="\uC18C\uD1B5\u00B7\uD559\uAD50">\uC18C\uD1B5\u00B7\uD559\uAD50</option>'
      + '<option value="\uC790\uB8CC\u00B7\uC5F0\uC218">\uC790\uB8CC\u00B7\uC5F0\uC218</option>'
      + '<option value="\uAE30\uD0C0">\uAE30\uD0C0</option>'
      + '</select>'
      + '<label style="font-size:13px;font-weight:700;color:var(--muted);display:block;margin-bottom:6px;">\uC0AC\uC774\uD2B8\uBA85</label>'
      + '<input id="bmName" type="text" placeholder="\uC608: \uAD6C\uAE00" autocomplete="off" style="width:100%;padding:11px 14px;border-radius:12px;border:1.5px solid var(--line);background:var(--bg);color:var(--heading);font-size:14px;box-sizing:border-box;margin-bottom:14px;">'
      + '<label style="font-size:13px;font-weight:700;color:var(--muted);display:block;margin-bottom:6px;">URL \uC8FC\uC18C</label>'
      + '<input id="bmUrl" type="text" placeholder="https://..." autocomplete="off" style="width:100%;padding:11px 14px;border-radius:12px;border:1.5px solid var(--line);background:var(--bg);color:var(--heading);font-size:14px;box-sizing:border-box;margin-bottom:20px;">'
      + '<button id="bmSave" type="button" style="width:100%;padding:14px;border-radius:12px;border:none;background:var(--primary);color:#fff;font-size:15px;font-weight:700;cursor:pointer;">\uC644\uB8CC</button>'
      + '<button id="bmClose" type="button" style="position:absolute;top:18px;right:18px;background:var(--card-soft);border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;">&times;</button>'
      + '</div></div>';
    document.body.appendChild(div.firstChild);
    _modal = document.getElementById('bookmarkSingleEditorModal');
    // close button
    document.getElementById('bmClose').addEventListener('click', function() { closeModal(); });
    _modal.addEventListener('click', function(e) { if (e.target === _modal) closeModal(); });
    // save button
    document.getElementById('bmSave').addEventListener('click', function() { handleSave(); });
  }
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
  var cats = ['\uC804\uCCB4', '\uD544\uC218 \uC5C5\uBB34', '\uAE09\uC2DD\u00B7\uC704\uC0DD', '\uC2DD\uC7AC\uB8CC\u00B7\uB2E8\uAC00 \uAD00\uB828', '\uC18C\uD1B5\u00B7\uD559\uAD50', '\uC790\uB8CC\u00B7\uC5F0\uC218', '\uAE30\uD0C0'];
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
    return 'https://www.google.com/s2/favicons?domain=' + new URL(url).hostname + '&sz=64';
  } catch(e) {
    return 'assets/app-icon-192.png';
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
        return '<div class="bookmark-card edit-mode-card" data-index="' + origIdx + '" style="cursor:pointer;position:relative;">'
          + '<img src="' + favicon(validUrl) + '" class="bm-favicon" alt="" loading="lazy">'
          + '<span class="bm-title">' + item.title + '</span>'
          + '<button class="bm-delete-btn" data-index="' + origIdx + '" title="\uC0AD\uC81C" onclick="event.stopPropagation();bmDelete(' + origIdx + ');">'
          + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
          + '</button></div>';
      } else {
        return '<a href="' + validUrl + '" target="_blank" rel="noopener" class="bookmark-card" data-url="' + validUrl + '">'
          + '<img src="' + favicon(validUrl) + '" class="bm-favicon" alt="" loading="lazy">'
          + '<span class="bm-title">' + item.title + '</span>'
          + '</a>';
      }
    }).join('');
  }

  if (isEditMode) {
    html += '<div class="bookmark-card add-new-card" id="bmAddCard" style="cursor:pointer;border:1.5px dashed var(--muted);background:transparent;justify-content:center;gap:8px;">'
      + '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>'
      + '<span class="bm-title" style="color:var(--muted);">\uC0C8 \uBD81\uB9C8\uD06C \uCD94\uAC00</span>'
      + '</div>';
  }

  container.innerHTML = html;

  if (isEditMode) {
    // edit-mode-card click to edit
    container.querySelectorAll('.edit-mode-card').forEach(function(card) {
      card.addEventListener('click', function(e) {
        if (e.target.closest('.bm-delete-btn')) return;
        openModal(card.dataset.index);
      });
    });
    // add card click
    var addCard = document.getElementById('bmAddCard');
    if (addCard) {
      addCard.addEventListener('click', function() { openModal(-1); });
    }
  } else {
    // click tracking
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

// global delete (called from onclick attribute)
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
