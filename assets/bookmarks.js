const bookmarkData = [
  // 필수 업무
  { title: "업무포털 메인", url: "https://goe.eduptl.kr/bpm_man_mn00_001.do", category: "필수 업무", desc: "경기도교육청 업무포털" },
  { title: "공직자통합메일", url: "https://mail.korea.kr/", category: "필수 업무", desc: "공직자 통합메일 시스템" },
  
  // 급식·위생
  { title: "SmartHACCP", url: "https://gimpo.haccpcook.or.kr/diet/", category: "급식·위생", desc: "스마트 해썹 급식 관리" },
  { title: "공공급식통합플랫폼", url: "https://ns.eat.co.kr/NeaT/eats/index.html", category: "급식·위생", desc: "공공급식 식재료 거래 플랫폼" },
  { title: "학교우유급식 정보시스템", url: "http://dairy.schoolmilk.or.kr/smis/smisweb/auth/login.html?v=1756168663985", category: "급식·위생", desc: "우유급식 관리 시스템" },
  { title: "축산물원패스", url: "https://www.ekape.or.kr/kapecp/ui/kapecp/fastLogin.jsp?loginType=02", category: "급식·위생", desc: "축산물 이력 관리 및 검수" },
  
  // 식재료·단가 관련
  { title: "블루시스 마켓", url: "https://market.bluesis.com/web/pc/main.php", category: "식재료·단가 관련", desc: "식재료 구매 및 단가 확인" },
  { title: "튼튼스쿨", url: "https://www.cjschoolfood.com/", category: "식재료·단가 관련", desc: "CJ프레시웨이 튼튼스쿨" },
  { title: "풀무원푸드머스 풀스토리", url: "https://pulstory.pulmuone.com/", category: "식재료·단가 관련", desc: "풀무원 식재료 발주 및 조회" },
  
  // 소통·학교
  { title: "School SMS | 교사용", url: "https://www.jtschoolsms.com/alimee/login/loginForm.html", category: "소통·학교", desc: "교사용 알림장 발송 시스템" },
  { title: "아이엠스쿨", url: "https://school.iamservice.net/", category: "소통·학교", desc: "교육정보 커뮤니티" },
  { title: "청수초등학교", url: "https://www.gpoe.kr/cheongsu-e/main.do", category: "소통·학교", desc: "청수초 홈페이지" },
  { title: "청수초 도서관", url: "https://read365.edunet.net/PureScreen/SchoolSearch?schoolName=%EC%B2%AD%EC%88%98%EC%B4%88%EB%93%B1%ED%95%99%EA%B5%90&provCode=J10&neisCode=J100006046", category: "소통·학교", desc: "교내 도서관 검색" },
  { title: "공무원연금공단", url: "https://www.gwp.or.kr/wus/cmmn/lgn/login.jdo", category: "소통·학교", desc: "맞춤형 복지시스템" },
  { title: "S2B (학교장터)", url: "https://www.s2b.kr/S2BNCustomer/S2B/", category: "소통·학교", desc: "지정정보처리장치 S2B" },
  
  // 자료·연수
  { title: "식품안전나라 교육자료", url: "https://www.foodsafetykorea.go.kr/portal/board/boardDetail.do?menu_no=2880&menu_grp=MENU_NEW05&bbs_no=bbs110&ntctxt_no=1104499", category: "자료·연수", desc: "식약처 교육 자료" },
  { title: "교육급식정보나눔방", url: "https://more.goe.go.kr/schoollunch/index.do", category: "자료·연수", desc: "급식 정보 공유" },
  { title: "학교급식 정보마당", url: "https://www.sfic.go.kr/board/view.do?boardId=BBS_0000008&menuCd=DOM_000000105001000000&startPage=1&searchType=DATA_TITLE&keyword=%EC%8B%9D%EC%83%9D%ED%99%9C&dataSid=57497", category: "자료·연수", desc: "다양한 급식 관련 정보제공" },
  { title: "영양광장", url: "https://agora-nutrition.com/", category: "자료·연수", desc: "영양교사 커뮤니티" },
  { title: "영양사도우미", url: "https://www.kdclub.com/", category: "자료·연수", desc: "영양사 실무 포털" },
  { title: "지방공기업평가원 사이버연수원", url: "https://ercedu.hunet.co.kr/Home", category: "자료·연수", desc: "사이버 연수원" },
  { title: "참미료 영양소식지", url: "https://chamssaem.com/516573", category: "자료·연수", desc: "참쌤스쿨 영양소식지" },
  { title: "학교급식 통합플랫폼", url: "https://www.sfic.go.kr/", category: "자료·연수", desc: "학교급식 통합포털" },
  { title: "경기교육모아", url: "https://more.goe.go.kr/edup/cmm/mber/myPage/selectMyPageMain.do", category: "자료·연수", desc: "경기도교육청 연수/자료" },
  
  // 기타 (HTML에 포함되어 있던 유용한 도구들)
  { title: "ChatGPT", url: "https://chatgpt.com/?openaicom_referred=true", category: "기타", desc: "AI 챗봇" },
  { title: "Google Gemini", url: "https://gemini.google.com/app?hl=ko", category: "기타", desc: "구글 AI 비서" },
  { title: "Canva 템플릿", url: "https://www.canva.com/templates", category: "기타", desc: "디자인 제작 툴" },
  { title: "모아폼", url: "https://www.moaform.com/questionnaires", category: "기타", desc: "온라인 설문지 제작" },
  { title: "영양미내의 자료실", url: "https://padlet.com/minaemi91/at-yamminae-lqfxtvtlwzoti614", category: "기타", desc: "패들렛 자료실" },
  { title: "NAVER", url: "https://www.naver.com/", category: "기타", desc: "네이버 포털" }
];

document.addEventListener('DOMContentLoaded', () => {
  const bookmarkGrid = document.getElementById('bookmarkGrid');
  const searchInput = document.getElementById('bookmarkSearch');
  const filterChips = document.querySelectorAll('.bookmark-chip');
  
  if(!bookmarkGrid) return; // 북마크 탭이 아니면 실행 안함

  let currentCategory = '전체';
  let currentSearch = '';

  // 카드 렌더링 함수
  function renderBookmarks() {
    bookmarkGrid.innerHTML = '';
    
    const filteredData = bookmarkData.filter(item => {
      const matchCategory = currentCategory === '전체' || item.category === currentCategory;
      const matchSearch = item.title.toLowerCase().includes(currentSearch.toLowerCase()) || 
                          (item.desc && item.desc.toLowerCase().includes(currentSearch.toLowerCase()));
      return matchCategory && matchSearch;
    });

    if(filteredData.length === 0) {
      bookmarkGrid.innerHTML = '<div class="empty-bookmark">검색 결과가 없습니다.</div>';
      return;
    }

    filteredData.forEach(item => {
      const card = document.createElement('a');
      card.className = 'bookmark-card';
      card.href = item.url;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
      card.innerHTML = `
        <div class="bm-header">
          <span class="bm-category">${item.category}</span>
          <svg class="bm-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </div>
        <h3 class="bm-title">${item.title}</h3>
        <p class="bm-desc">${item.desc}</p>
      `;
      bookmarkGrid.appendChild(card);
    });
  }

  // 필터 칩 클릭 이벤트
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentCategory = chip.dataset.category;
      renderBookmarks();
    });
  });

  // 검색 이벤트
  if(searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value;
      renderBookmarks();
    });
  }

  // 초기 렌더링
  renderBookmarks();
});
