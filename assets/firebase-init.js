import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 사용자의 실제 Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyAbn8Lyayv8rIBo-5LD_GNctRduvM_lrvw",
  authDomain: "kknutrition-memo.firebaseapp.com",
  projectId: "kknutrition-memo",
  storageBucket: "kknutrition-memo.firebasestorage.app",
  messagingSenderId: "1094497868885",
  appId: "1:1094497868885:web:8673ea8aabec7bcee5c8dc"
};

let db = null;
const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";

if (isFirebaseConfigured) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} else {
  console.warn("Firebase가 설정되지 않았습니다. localStorage를 사용하여 로컬에만 저장됩니다. 실시간 동기화를 원하시면 assets/firebase-init.js에 Firebase Config를 입력하세요.");
}

const MEMO_DOC_ID = "main-memo";
const LOCAL_STORAGE_KEY = "kknutrition_memo";

const defaultMemos = [
  { text: "식단 확인", checked: false },
  { text: "알레르기 확인", checked: false },
  { text: "전달사항 메모", checked: false }
];

let memos = [];

function loadLocalMemos() {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    try {
      memos = JSON.parse(saved);
    } catch (e) {
      memos = [...defaultMemos];
    }
  } else {
    memos = [...defaultMemos];
  }
}

function saveLocalMemos() {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(memos));
}

async function saveMemos() {
  saveLocalMemos();
  if (db) {
    try {
      await setDoc(doc(db, "memos", MEMO_DOC_ID), { items: memos });
    } catch (error) {
      console.error("Firestore 저장 실패:", error);
    }
  }
}

function renderMemoList(containerId, isHome) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const displayMemos = isHome ? memos.slice(0, 3) : memos;

  // 1. Remove extra items
  while (container.children.length > displayMemos.length) {
    const last = container.lastElementChild;
    if (last) last.remove();
  }

  // 2. Update or Create items
  displayMemos.forEach((memo, index) => {
    let itemDiv = container.children[index];
    let isNew = false;
    if (!itemDiv || itemDiv.classList.contains('memo-add-btn')) {
      if (itemDiv && itemDiv.classList.contains('memo-add-btn')) {
        itemDiv.remove();
      }
      isNew = true;
      itemDiv = document.createElement("div");
      itemDiv.className = "memo-item";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "memo-checkbox";

      const textarea = document.createElement("textarea");
      textarea.className = "memo-input";
      textarea.rows = 1;

      itemDiv.appendChild(checkbox);
      itemDiv.appendChild(textarea);
      container.insertBefore(itemDiv, container.children[index] || null);
    }

    const checkbox = itemDiv.querySelector(".memo-checkbox");
    const textarea = itemDiv.querySelector(".memo-input");

    if (checkbox.checked !== memo.checked) checkbox.checked = memo.checked;

    // Only update textarea value if it's NOT currently focused, to avoid cursor jumping
    // Or if this is a newly created textarea
    if (isNew || (textarea.value !== memo.text && document.activeElement !== textarea)) {
      textarea.value = memo.text;
    }

    // Auto-resize
    const resizeTextarea = () => {
      if (!isHome) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      } else {
        textarea.style.height = ''; // Let css handle max-height
      }
    };

    // Events
    checkbox.onchange = () => {
      memos[index].checked = checkbox.checked;
      saveMemos();
    };

    textarea.oninput = () => {
      memos[index].text = textarea.value;
      resizeTextarea();
      
      clearTimeout(textarea._saveTimeout);
      textarea._saveTimeout = setTimeout(() => {
        saveMemos();
      }, 500);
    };

    textarea.onkeydown = (e) => {
      if (e.key === "Enter" && !e.shiftKey && isHome) {
        e.preventDefault();
        textarea.blur();
      } else if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        if (isHome && memos.length >= 3) {
            openMemoModal();
            return;
        }
        memos.splice(index + 1, 0, { text: "", checked: false });
        saveMemos();
        updateAllMemosDOM();
        setTimeout(() => {
          const nextTextarea = container.children[index + 1]?.querySelector("textarea");
          if (nextTextarea) nextTextarea.focus({ preventScroll: true });
        }, 10);
      } else if (e.key === "Backspace" && textarea.value === "" && memos.length > 1) {
        e.preventDefault();
        memos.splice(index, 1);
        saveMemos();
        updateAllMemosDOM();
        if (index > 0) {
          setTimeout(() => {
            const prevTextarea = container.children[index - 1]?.querySelector("textarea");
            if (prevTextarea) {
              prevTextarea.focus({ preventScroll: true });
              prevTextarea.selectionStart = prevTextarea.value.length;
            }
          }, 10);
        }
      }
    };

    setTimeout(resizeTextarea, 0);
  });

  // 3. Add button
  let addBtn = container.querySelector('.memo-add-btn');
  if (addBtn) addBtn.remove();
  
  if (isHome) {
    if (memos.length < 3) {
      const newAddBtn = document.createElement("button");
      newAddBtn.className = "memo-add-btn";
      newAddBtn.textContent = "+ 항목 추가";
      newAddBtn.type = "button";
      newAddBtn.onclick = () => {
        memos.push({ text: "", checked: false });
        saveMemos();
        updateAllMemosDOM();
        setTimeout(() => {
          const textareas = container.querySelectorAll("textarea");
          if (textareas.length > 0) textareas[textareas.length - 1].focus({ preventScroll: true });
        }, 10);
      };
      container.appendChild(newAddBtn);
    }
  } else {
    const newAddBtn = document.createElement("button");
    newAddBtn.className = "memo-add-btn";
    newAddBtn.textContent = "+ 항목 추가";
    newAddBtn.type = "button";
    newAddBtn.onclick = () => {
      memos.push({ text: "", checked: false });
      saveMemos();
      updateAllMemosDOM();
      setTimeout(() => {
        const textareas = container.querySelectorAll("textarea");
        if (textareas.length > 0) textareas[textareas.length - 1].focus({ preventScroll: true });
      }, 10);
    };
    container.appendChild(newAddBtn);
  }
}

function updateAllMemosDOM() {
  renderMemoList("memoList", true);
  const overlay = document.getElementById("memoModalOverlay");
  if (overlay && overlay.classList.contains("active")) {
    renderMemoList("memoModalList", false);
  }
}

function openMemoModal() {
  const overlay = document.getElementById("memoModalOverlay");
  if (overlay) {
    overlay.style.display = "flex";
    // For transition to work, wait a frame
    requestAnimationFrame(() => {
      overlay.classList.add("active");
    });
    renderMemoList("memoModalList", false);
  }
}

function closeMemoModal() {
  const overlay = document.getElementById("memoModalOverlay");
  if (overlay) {
    overlay.classList.remove("active");
    setTimeout(() => {
      overlay.style.display = "none";
    }, 200); // match css transition
  }
  updateAllMemosDOM();
}

function init() {
  // Setup modal buttons
  const openBtn = document.getElementById("openMemoModalBtn");
  if (openBtn) openBtn.addEventListener("click", openMemoModal);
  
  const closeBtn = document.getElementById("closeMemoModalBtn");
  if (closeBtn) closeBtn.addEventListener("click", closeMemoModal);
  
  const overlay = document.getElementById("memoModalOverlay");
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeMemoModal();
    });
  }

  if (db) {
    onSnapshot(doc(db, "memos", MEMO_DOC_ID), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.items) {
          // If totally equal, skip
          if (JSON.stringify(memos) === JSON.stringify(data.items)) return;
          
          memos = data.items;
          saveLocalMemos();
          updateAllMemosDOM();
        }
      } else {
        loadLocalMemos();
        saveMemos();
        updateAllMemosDOM();
      }
    }, (error) => {
      console.error("Firestore 동기화 오류:", error);
      loadLocalMemos();
      updateAllMemosDOM();
    });
  } else {
    loadLocalMemos();
    updateAllMemosDOM();
  }
}

document.addEventListener("DOMContentLoaded", init);
