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

function renderMemos() {
  const memoList = document.getElementById("memoList");
  if (!memoList) return;
  memoList.innerHTML = "";

  memos.forEach((memo, index) => {
    const itemDiv = document.createElement("div");
    itemDiv.className = "memo-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "memo-checkbox";
    checkbox.checked = memo.checked;
    checkbox.addEventListener("change", () => {
      memos[index].checked = checkbox.checked;
      saveMemos();
    });

    const textarea = document.createElement("textarea");
    textarea.className = "memo-input";
    textarea.value = memo.text;
    textarea.rows = 1;
    
    // Auto-resize
    const resizeTextarea = () => {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    };
    
    let saveTimeout = null;
    textarea.addEventListener("input", () => {
      if (textarea.value === "" && memos.length > 1) {
        // Remove item if empty
        memos.splice(index, 1);
        saveMemos();
        renderMemos();
        // focus previous item if exists
        if (index > 0) {
          setTimeout(() => {
            const prevTextarea = memoList.children[index - 1]?.querySelector("textarea");
            if (prevTextarea) {
              prevTextarea.focus();
              prevTextarea.selectionStart = prevTextarea.value.length;
            }
          }, 10);
        }
      } else {
        memos[index].text = textarea.value;
        resizeTextarea();
        
        // Debounce save to prevent rate limits and race conditions
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          saveMemos();
        }, 500);
      }
    });

    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        // Add new item below
        memos.splice(index + 1, 0, { text: "", checked: false });
        saveMemos();
        renderMemos();
        // focus new item
        setTimeout(() => {
          const nextTextarea = memoList.children[index + 1].querySelector("textarea");
          if (nextTextarea) nextTextarea.focus();
        }, 10);
      } else if (e.key === "Backspace" && textarea.value === "" && memos.length > 1) {
        e.preventDefault();
        // Remove item if empty and backspace pressed
        memos.splice(index, 1);
        saveMemos();
        renderMemos();
        // focus previous item
        if (index > 0) {
          setTimeout(() => {
            const prevTextarea = memoList.children[index - 1].querySelector("textarea");
            if (prevTextarea) {
              prevTextarea.focus();
              prevTextarea.selectionStart = prevTextarea.value.length;
            }
          }, 10);
        }
      }
    });

    itemDiv.appendChild(checkbox);
    itemDiv.appendChild(textarea);
    memoList.appendChild(itemDiv);

    // Initial resize
    setTimeout(resizeTextarea, 0);
  });

  const addBtn = document.createElement("button");
  addBtn.className = "memo-add-btn";
  addBtn.textContent = "+ 항목 추가";
  addBtn.type = "button";
  addBtn.addEventListener("click", () => {
    memos.push({ text: "", checked: false });
    saveMemos();
    renderMemos();
    setTimeout(() => {
      const textareas = memoList.querySelectorAll("textarea");
      if (textareas.length > 0) textareas[textareas.length - 1].focus();
    }, 10);
  });
  memoList.appendChild(addBtn);
}

function init() {
  if (db) {
    onSnapshot(doc(db, "memos", MEMO_DOC_ID), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.items) {
          if (JSON.stringify(memos) === JSON.stringify(data.items)) return;
          
          let focusedIndex = -1;
          let selectionStart = 0;
          let localFocusedText = "";

          // 현재 커서가 있는 텍스트박스 상태 기억하기
          if (document.activeElement && document.activeElement.classList.contains('memo-input')) {
            const textareas = Array.from(document.querySelectorAll('.memo-input'));
            focusedIndex = textareas.indexOf(document.activeElement);
            selectionStart = document.activeElement.selectionStart;
            localFocusedText = document.activeElement.value;
          }

          memos = data.items;

          // 타이핑 중이던 텍스트는 서버 데이터 대신 방금 친 로컬 텍스트로 유지 (글씨 날아감 방지)
          if (focusedIndex !== -1 && memos[focusedIndex]) {
            memos[focusedIndex].text = localFocusedText;
          }

          saveLocalMemos();
          renderMemos();

          // 커서 깜빡임 복원하기
          if (focusedIndex !== -1) {
            const newTextareas = document.querySelectorAll('.memo-input');
            if (newTextareas[focusedIndex]) {
              newTextareas[focusedIndex].focus();
              newTextareas[focusedIndex].selectionStart = selectionStart;
            }
          }
        }
      } else {
        // Init firestore with default if not exists
        loadLocalMemos();
        saveMemos();
        renderMemos();
      }
    }, (error) => {
      console.error("Firestore 동기화 오류:", error);
      loadLocalMemos();
      renderMemos();
    });
  } else {
    loadLocalMemos();
    renderMemos();
  }
}

document.addEventListener("DOMContentLoaded", init);
