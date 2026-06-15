let bookmarkData = [
  // 필수 업무
  { title: "업무포털 메인", url: "https://goe.eduptl.kr/bpm_man_mn00_001.do", category: "필수 업무" },
  { title: "공직자통합메일", url: "https://mail.korea.kr/", category: "필수 업무" },
  
  // 급식·위생
  { title: "SmartHACCP", url: "https://gimpo.haccpcook.or.kr/diet/", category: "급식·위생" },
  { title: "공공급식통합플랫폼", url: "https://ns.eat.co.kr/NeaT/eats/index.html", category: "급식·위생" },
  { title: "학교우유급식 정보시스템", url: "http://dairy.schoolmilk.or.kr/smis/smisweb/auth/login.html?v=1756168663985", category: "급식·위생" },
  { title: "축산물원패스", url: "https://www.ekape.or.kr/kapecp/ui/kapecp/fastLogin.jsp?loginType=02", category: "급식·위생" },
  
  // 식재료·단가 관련
  { title: "블루시스 마켓", url: "https://market.bluesis.com/web/pc/main.php", category: "식재료·단가 관련" },
  { title: "튼튼스쿨", url: "https://www.cjschoolfood.com/", category: "식재료·단가 관련" },
  { title: "풀무원푸드머스 풀스토리", url: "https://pulstory.pulmuone.com/", category: "식재료·단가 관련" },
  
  // 소통·학교
  { title: "School SMS | 교사용", url: "https://www.jtschoolsms.com/alimee/login/loginForm.html", category: "소통·학교" },
  { title: "아이엠스쿨", url: "https://school.iamservice.net/", category: "소통·학교" },
  { title: "청수초등학교", url: "https://www.gpoe.kr/cheongsu-e/main.do", category: "소통·학교" },
  { title: "청수초 도서관", url: "https://read365.edunet.net/PureScreen/SchoolSearch?schoolName=%EC%B2%AD%EC%88%98%EC%B4%88%EB%93%B1%ED%95%99%EA%B5%90&provCode=J10&neisCode=J100006046", category: "소통·학교" },
  { title: "공무원연금공단", url: "https://www.gwp.or.kr/wus/cmmn/lgn/login.jdo", category: "소통·학교" },
  { title: "S2B (학교장터)", url: "https://www.s2b.kr/S2BNCustomer/S2B/", category: "소통·학교" },
  
  // 자료·연수
  { title: "식품안전나라 교육자료", url: "https://www.foodsafetykorea.go.kr/portal/board/boardDetail.do?menu_no=2880&menu_grp=MENU_NEW05&bbs_no=bbs110&ntctxt_no=1104499", category: "자료·연수" },
  { title: "교육급식정보나눔방", url: "https://more.goe.go.kr/schoollunch/index.do", category: "자료·연수" },
  { title: "학교급식 정보마당", url: "https://www.sfic.go.kr/board/view.do?boardId=BBS_0000008&menuCd=DOM_000000105001000000&startPage=1&searchType=DATA_TITLE&keyword=%EC%8B%9D%EC%83%9D%ED%99%9C&dataSid=57497", category: "자료·연수" },
  { title: "영양광장", url: "https://agora-nutrition.com/", category: "자료·연수" },
  { title: "영양사도우미", url: "https://www.kdclub.com/", category: "자료·연수" },
  { title: "지방공기업평가원 사이버연수원", url: "https://ercedu.hunet.co.kr/Home", category: "자료·연수" },
  { title: "참미료 영양소식지", url: "https://chamssaem.com/516573", category: "자료·연수" },
  { title: "학교급식 통합플랫폼", url: "https://www.sfic.go.kr/", category: "자료·연수" },
  { title: "경기교육모아", url: "https://more.goe.go.kr/edup/cmm/mber/myPage/selectMyPageMain.do", category: "자료·연수" },
  
  // 기타
  { title: "ChatGPT", url: "https://chatgpt.com/?openaicom_referred=true", category: "기타" },
  { title: "Google Gemini", url: "https://gemini.google.com/app?hl=ko", category: "기타" },
  { title: "Canva 템플릿", url: "https://www.canva.com/templates", category: "기타" },
  { title: "모아폼", url: "https://www.moaform.com/questionnaires", category: "기타" },
  { title: "영양미내의 자료실", url: "https://padlet.com/minaemi91/at-yamminae-lqfxtvtlwzoti614", category: "기타" },
  { title: "NAVER", url: "https://www.naver.com/", category: "기타" }
];

// Load from LocalStorage (v2 to ignore previous corrupted cache)
const savedBookmarks = localStorage.getItem('kknutrition_bookmarks_v2');
if (savedBookmarks) {
  try {
    const parsed = JSON.parse(savedBookmarks);
    if (Array.isArray(parsed) && parsed.length > 0) {
      bookmarkData = parsed;
    }
  } catch (e) {
    console.error("북마크 데이터 로드 실패", e);
  }
}

let currentCategory = "전체";
let currentSearch = "";
let isBookmarkEditMode = false;

document.addEventListener("DOMContentLoaded", () => {
  renderFilterChips();
  renderBookmarks();
  
  const searchInput = document.getElementById("bookmarkSearch");
  if(searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearch = e.target.value;
      renderBookmarks();
    });
  }

  // Edit Mode Toggle Button
  const editBtn = document.getElementById("editBtnBookmarks");
  if (editBtn) {
    editBtn.classList.remove("fab-edit-btn");
    editBtn.classList.add("fab-bookmark-edit-btn");
    editBtn.innerHTML = "수정";
    
    editBtn.addEventListener("click", () => {
      isBookmarkEditMode = !isBookmarkEditMode;
      if (isBookmarkEditMode) {
        editBtn.innerHTML = "저장";
        editBtn.classList.add("saving"); // use saving style for active state
      } else {
        editBtn.innerHTML = "수정";
        editBtn.classList.remove("saving");
      }
      renderBookmarks();
    });
  }

  // Single Editor Modal Setup
  setupBookmarkSingleEditor();
});

function renderFilterChips() {
  const categories = ["전체", "필수 업무", "급식·위생", "식재료·단가 관련", "소통·학교", "자료·연수", "기타"];
  const container = document.getElementById("bookmarkFilterChips");
  if(!container) return;
  
  container.innerHTML = categories.map((cat, idx) => `
    <button class="bookmark-chip ${idx === 0 ? 'active' : ''}" data-category="${cat}">
      ${cat}
    </button>
  `).join("");
  
  container.querySelectorAll(".bookmark-chip").forEach(chip => {
    chip.addEventListener("click", (e) => {
      container.querySelectorAll(".bookmark-chip").forEach(c => c.classList.remove("active"));
      e.target.classList.add("active");
      currentCategory = e.target.dataset.category;
      renderBookmarks();
    });
  });
}

function getFaviconUrl(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch(e) {
    return 'assets/app-icon-192.png';
  }
}

function renderBookmarks() {
  const container = document.getElementById("bookmarkGrid");
  if(!container) return;
  
  let filtered = bookmarkData;
  
  if (currentCategory !== "전체") {
    filtered = filtered.filter(item => item.category === currentCategory);
  }
  
  if (currentSearch.trim()) {
    const lower = currentSearch.toLowerCase();
    filtered = filtered.filter(item => 
      item.title.toLowerCase().includes(lower) || 
      (item.desc && item.desc.toLowerCase().includes(lower))
    );
  }
  
  let html = '';

  if (filtered.length === 0 && !isBookmarkEditMode) {
    html = `<div class="empty-bookmark">조건에 맞는 북마크가 없습니다.</div>`;
  } else {
    html = filtered.map((item) => {
      // Find original index to allow direct editing
      const originalIndex = bookmarkData.findIndex(b => b.title === item.title && b.url === item.url);
      
      if (isBookmarkEditMode) {
        return `
          <div class="bookmark-card edit-mode-card" data-index="${originalIndex}" style="cursor: pointer; position: relative;">
            <img src="${getFaviconUrl(item.url)}" class="bm-favicon" alt="" loading="lazy">
            <span class="bm-title">${item.title}</span>
            <button class="bm-delete-btn" data-index="${originalIndex}" title="삭제">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        `;
      } else {
        return `
          <a href="${item.url}" target="_blank" rel="noopener" class="bookmark-card">
            <img src="${getFaviconUrl(item.url)}" class="bm-favicon" alt="" loading="lazy">
            <span class="bm-title">${item.title}</span>
          </a>
        `;
      }
    }).join("");
  }

  if (isBookmarkEditMode) {
    // Add the "+ 새 북마크 추가" card
    html += `
      <div class="bookmark-card add-new-card" style="cursor: pointer; border: 1px dashed var(--muted); background: transparent; justify-content: center;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        <span class="bm-title" style="color: var(--muted);">새 북마크 추가</span>
      </div>
    `;
  }

  container.innerHTML = html;

  // Attach event listeners for Edit Mode
  if (isBookmarkEditMode) {
    container.querySelectorAll('.edit-mode-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // Prevent opening if delete button was clicked
        if (e.target.closest('.bm-delete-btn')) return;
        const idx = card.dataset.index;
        window.openBookmarkEditor(idx);
      });
    });

    container.querySelectorAll('.bm-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = btn.dataset.index;
        if (confirm("정말로 이 북마크를 삭제하시겠습니까?")) {
          bookmarkData.splice(idx, 1);
          localStorage.setItem('kknutrition_bookmarks_v2', JSON.stringify(bookmarkData));
          renderBookmarks();
        }
      });
    });

    const addCard = container.querySelector('.add-new-card');
    if (addCard) {
      addCard.addEventListener('click', () => {
        window.openBookmarkEditor(-1); // -1 means new
      });
    }
  }
}

// ============================================
// 북마크 단일 편집 (인라인) 모달 로직
// ============================================
let editingIndex = -1;

function setupBookmarkSingleEditor() {
  const modal = document.getElementById("bookmarkSingleEditorModal");
  const closeBtn = document.getElementById("bookmarkSingleClose");
  const saveBtn = document.getElementById("bookmarkSingleSave");
  
  if(!modal) return;

  const catInput = document.getElementById("bSingleCat");
  const nameInput = document.getElementById("bSingleName");
  const urlInput = document.getElementById("bSingleUrl");
  const titleEl = document.getElementById("bookmarkSingleTitle");

  closeBtn.addEventListener("click", () => modal.style.display = "none");
  modal.addEventListener("click", (e) => {
    if(e.target === modal) modal.style.display = "none";
  });

  window.openBookmarkEditor = function(index) {
    editingIndex = parseInt(index);
    if (editingIndex >= 0) {
      // Edit existing
      titleEl.innerText = "북마크 수정";
      const item = bookmarkData[editingIndex];
      catInput.value = item.category || "기타";
      nameInput.value = item.title || "";
      urlInput.value = item.url || "";
    } else {
      // Add new
      titleEl.innerText = "새 북마크 추가";
      catInput.value = currentCategory === "전체" ? "필수 업무" : currentCategory;
      nameInput.value = "";
      urlInput.value = "";
    }
    modal.style.display = "flex";
  };

  saveBtn.addEventListener("click", () => {
    const title = nameInput.value.trim();
    const url = urlInput.value.trim();
    const category = catInput.value;

    if (!title || !url) {
      alert("사이트명과 URL 주소를 모두 입력해주세요.");
      return;
    }

    const newItem = { title, url, category };

    if (editingIndex >= 0) {
      bookmarkData[editingIndex] = newItem;
    } else {
      bookmarkData.push(newItem);
    }

    localStorage.setItem('kknutrition_bookmarks_v2', JSON.stringify(bookmarkData));
    modal.style.display = "none";
    renderBookmarks();
  });
}
