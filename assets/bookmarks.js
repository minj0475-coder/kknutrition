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

  // 연결: 모달 로직
  setupBookmarkEditorModal();
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
  
  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-bookmark">조건에 맞는 북마크가 없습니다.</div>`;
    return;
  }
  
  container.innerHTML = filtered.map(item => `
    <a href="${item.url}" target="_blank" rel="noopener" class="bookmark-card">
      <img src="${getFaviconUrl(item.url)}" class="bm-favicon" alt="" loading="lazy">
      <span class="bm-title">${item.title}</span>
    </a>
  `).join("");
}

// ============================================
// 북마크 편집 모달 로직
// ============================================
function setupBookmarkEditorModal() {
  const editBtn = document.getElementById("editBtnBookmarks");
  const modalOverlay = document.getElementById("bookmarkEditorOverlay");
  const closeBtn = document.getElementById("bookmarkEditorClose");
  const addBtn = document.getElementById("bookmarkEditorAddRow");
  const saveBtn = document.getElementById("bookmarkEditorSave");
  const tbody = document.getElementById("bookmarkEditorTbody");

  if (!editBtn || !modalOverlay || !tbody) return;

  // 기존 텍스트 수정 기능 무력화 (클래스 변경)
  editBtn.classList.remove("fab-edit-btn");
  editBtn.classList.add("fab-bookmark-edit-btn");
  editBtn.innerHTML = "관리";

  editBtn.addEventListener("click", () => {
    renderEditorRows();
    modalOverlay.style.display = "flex";
    setTimeout(() => modalOverlay.classList.add("active"), 10);
  });

  closeBtn.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", (e) => {
    if(e.target === modalOverlay) closeModal();
  });

  function closeModal() {
    modalOverlay.classList.remove("active");
    setTimeout(() => modalOverlay.style.display = "none", 200);
  }

  addBtn.addEventListener("click", () => {
    const tr = createRowHTML({ title: "", url: "", category: "필수 업무" });
    tbody.insertAdjacentHTML('beforeend', tr);
  });

  saveBtn.addEventListener("click", () => {
    const newBookmarks = [];
    const rows = tbody.querySelectorAll(".editor-row");
    rows.forEach(row => {
      const title = row.querySelector(".edit-title").value.trim();
      const url = row.querySelector(".edit-url").value.trim();
      const category = row.querySelector(".edit-category").value;
      
      if (title && url) {
        newBookmarks.push({ title, url, category });
      }
    });

    bookmarkData = newBookmarks;
    localStorage.setItem('kknutrition_bookmarks_v2', JSON.stringify(bookmarkData));
    
    // 카테고리 필터가 바뀔 수 있으니 재렌더링
    renderFilterChips();
    renderBookmarks();
    closeModal();
  });

  function renderEditorRows() {
    tbody.innerHTML = bookmarkData.map(item => createRowHTML(item)).join("");
  }

  // 삭제 버튼 이벤트 위임
  tbody.addEventListener("click", (e) => {
    if (e.target.closest(".edit-delete-btn")) {
      e.target.closest("tr").remove();
    }
  });
}

function createRowHTML(item) {
  const categories = ["필수 업무", "급식·위생", "식재료·단가 관련", "소통·학교", "자료·연수", "기타"];
  const options = categories.map(cat => 
    `<option value="${cat}" ${cat === item.category ? 'selected' : ''}>${cat}</option>`
  ).join("");

  return `
    <div class="editor-row" style="display: flex; flex-direction: column; gap: 8px; background: #fff; padding: 16px; border-radius: 12px; border: 1px solid var(--line); position: relative;">
      <button type="button" class="edit-delete-btn" style="position: absolute; top: 16px; right: 16px; background: none; border: none; color: var(--muted); cursor: pointer; padding: 4px; border-radius: 4px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
      </button>
      
      <div style="display: flex; gap: 12px; margin-right: 32px;">
        <div style="flex: 1;">
          <label style="font-size: 12px; font-weight: 700; color: var(--muted); margin-bottom: 4px; display: block;">카테고리</label>
          <select class="edit-category input-field" style="width: 100%; border-radius: 8px; border: 1px solid var(--line); padding: 10px;">
            ${options}
          </select>
        </div>
        <div style="flex: 2;">
          <label style="font-size: 12px; font-weight: 700; color: var(--muted); margin-bottom: 4px; display: block;">사이트명</label>
          <input type="text" class="edit-title input-field" placeholder="사이트명" value="${item.title.replace(/"/g, '&quot;')}" style="width: 100%; border-radius: 8px; border: 1px solid var(--line); padding: 10px; box-sizing: border-box;">
        </div>
      </div>
      
      <div>
        <label style="font-size: 12px; font-weight: 700; color: var(--muted); margin-bottom: 4px; display: block;">URL 주소</label>
        <input type="text" class="edit-url input-field" placeholder="https://..." value="${item.url.replace(/"/g, '&quot;')}" style="width: 100%; border-radius: 8px; border: 1px solid var(--line); padding: 10px; box-sizing: border-box; background: var(--bg);">
      </div>
    </div>
  `;
}
