let bookmarkData = [
  // 필수 업무
  { title: "업무포털 메인", url: "https://goe.eduptl.kr/bpm_man_mn00_001.do", category: "필수 업무" },
  { title: "공직자통합메일", url: "https://mail.korea.kr/", category: "필수 업무" },
  { title: "K-에듀파인", url: "https://klef.goe.go.kr/", category: "필수 업무" },
  { title: "나이스(NEIS)", url: "https://ken.goe.go.kr/sts_a/sso/login.do", category: "필수 업무" },
  { title: "경기도교육청", url: "https://www.goe.go.kr/", category: "필수 업무" },
  { title: "전자민원센터", url: "https://eduro.goe.go.kr/edms/min/home.do", category: "필수 업무" },

  // 급식·위생
  { title: "한국농수산식품유통공사", url: "https://www.at.or.kr/home/apko000000/index.action", category: "급식·위생" },
  { title: "SmartHACCP", url: "https://smarthaccp.korea.kr/", category: "급식·위생" },
  { title: "축산물원패스", url: "https://www.ekape.or.kr/ekapepia/", category: "급식·위생" },

  // 식재료·단가 관련
  { title: "급식정보나눔방", url: "https://ggmeal.goe.go.kr/", category: "식재료·단가 관련" },
  { title: "학교급식 정보마당", url: "https://www.schoolmeal.kr/", category: "식재료·단가 관련" },

  // 소통·학교
  { title: "청수초 홈페이지", url: "https://cheongsu-e.goesw.kr/cheongsu-e/main.do", category: "소통·학교" },
  { title: "청수초 도서관", url: "https://cheongsu-e.goesw.kr/cheongsu-e/na/ntt/selectNttList.do?mi=10557&bbsId=4378", category: "소통·학교" },
  { title: "아이엠스쿨", url: "https://www.iamschool.net/", category: "소통·학교" },
  { title: "School SMS | 교사용", url: "https://www.jtschoolsms.com/alimee/login/loginForm.html", category: "소통·학교" },

  // 자료·연수
  { title: "경기교육모아", url: "https://moa.goe.go.kr/", category: "자료·연수" },
  { title: "경기도교육연수원", url: "https://www.gtie.go.kr/", category: "자료·연수" },
  { title: "영양사도우미", url: "https://www.dietitian.or.kr/", category: "자료·연수" },
  { title: "ChatGPT", url: "https://chatgpt.com/", category: "자료·연수" },
  { title: "Gemini", url: "https://gemini.google.com/app", category: "자료·연수" },
  { title: "영양교사 게시판", url: "https://cafe.daum.net/nutritions", category: "자료·연수" },
  { title: "영양교사 자료실", url: "https://cafe.naver.com/nutritions", category: "자료·연수" },

  // 기타
  { title: "모아폼", url: "https://www.moaform.com/", category: "기타" },
  { title: "Padlet", url: "https://padlet.com/", category: "기타" },
  { title: "[영양소식지] 참미료", url: "https://www.jtschoolsms.com/alimee/notice/commonFormDL.html", category: "기타" }
];

// Load from LocalStorage
const savedBookmarks = localStorage.getItem('kknutrition_bookmarks');
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
      <div class="bm-header">
        <img src="${getFaviconUrl(item.url)}" class="bm-favicon" alt="${item.title} 로고" loading="lazy">
        <span class="bm-category">${item.category}</span>
        <h3 class="bm-title">${item.title}</h3>
      </div>
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
    const rows = tbody.querySelectorAll("tr");
    rows.forEach(row => {
      const title = row.querySelector(".edit-title").value.trim();
      const url = row.querySelector(".edit-url").value.trim();
      const category = row.querySelector(".edit-category").value;
      
      if (title && url) {
        newBookmarks.push({ title, url, category });
      }
    });

    bookmarkData = newBookmarks;
    localStorage.setItem('kknutrition_bookmarks', JSON.stringify(bookmarkData));
    
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
    <tr>
      <td>
        <select class="edit-category input-field">
          ${options}
        </select>
      </td>
      <td>
        <input type="text" class="edit-title input-field" placeholder="사이트명" value="${item.title.replace(/"/g, '&quot;')}">
      </td>
      <td>
        <input type="text" class="edit-url input-field" placeholder="URL (https://...)" value="${item.url.replace(/"/g, '&quot;')}">
      </td>
      <td style="text-align: center; width: 60px;">
        <button type="button" class="edit-delete-btn btn light small-btn" style="padding: 6px 10px;">삭제</button>
      </td>
    </tr>
  `;
}
