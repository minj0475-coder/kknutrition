import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
const BOOKMARK_DOC_ID = "main-bookmarks";
const LOCAL_STORAGE_KEY = "kknutrition_memo";
const LOCAL_MEMO_META_KEY = "kknutrition_memo_meta";
const LOCAL_MEMO_BACKUP_KEY = "kknutrition_memo_lastBackup";

window.syncBookmarksToFirebase = async function(data, meta = {}) {
  if (db) {
    try {
      await setDoc(doc(db, "bookmarks", BOOKMARK_DOC_ID), {
        items: data,
        updatedAt: Number(meta.updatedAt) || Date.now()
      });
    } catch (error) {
      console.error("Firestore 북마크 저장 실패:", error);
      alert("북마크 연동 실패: " + error.message + "\n(Firebase 보안 규칙 기간이 만료되었을 수 있습니다.)");
    }
  }
};

const CLOUD_DATA_COLLECTION = "appData";
const CLOUD_SYNC_META_KEY = "kkulkkoori_cloud_sync_meta_v1";
const CLOUD_SYNC_KEYS = [
  "kkulkkoori_service_sheet_link",
  "kkulkkoori_work_notes_v1",
  "kkulkkoori_message_templates_v1",
  "kkulkkoori_annual_sheet_links_v1",
  "kkulkkoori_vendor_network_v1",
  "kkulkkoori_vendor_groups_v1",
  "kkulkkoori_promo_contacts_v1",
  "kkulkkoori_academic_events_v1",
  "kkulkkoori_cheongsu_recipes_v3"
];
const CLOUD_SYNC_MAX_BYTES = 900000;
let cloudApplyingRemote = false;
let cloudSyncReady = false;
const cloudPendingLocalWrites = new Map();
let memoPendingLocalWriteAt = 0;

function readCloudSyncMeta() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CLOUD_SYNC_META_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

function writeCloudSyncMeta(meta) {
  try {
    localStorage.setItem(CLOUD_SYNC_META_KEY, JSON.stringify(meta || {}));
  } catch (error) {}
}

function getCloudLocalUpdatedAt(key) {
  const meta = readCloudSyncMeta();
  return Number(meta[key]) || 0;
}

function getStructuredCloudValueUpdatedAt(value) {
  const parsed = parseCloudJsonValue(value);
  return parsed ? Number(parsed.updatedAt) || 0 : 0;
}

function getEffectiveCloudLocalUpdatedAt(key, value) {
  const valueUpdatedAt = getStructuredCloudValueUpdatedAt(value);
  if (key === "kkulkkoori_work_notes_v1" || key === "kkulkkoori_message_templates_v1") {
    return valueUpdatedAt;
  }
  return Math.max(getCloudLocalUpdatedAt(key), valueUpdatedAt);
}

function setCloudLocalUpdatedAt(key, updatedAt) {
  const meta = readCloudSyncMeta();
  meta[key] = Number(updatedAt) || Date.now();
  writeCloudSyncMeta(meta);
}

function getCloudStringSize(value) {
  try {
    return new Blob([String(value || "")]).size;
  } catch (error) {
    return String(value || "").length;
  }
}

function hasMeaningfulLocalValue(value) {
  return value != null && String(value).trim() !== "";
}

function parseCloudJsonValue(value) {
  try {
    const parsed = JSON.parse(String(value || "null"));
    if (Array.isArray(parsed)) return { items: parsed, updatedAt: 0, deletedIds: [], deletedKeys: [] };
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.items)) {
      return {
        items: parsed.items,
        updatedAt: Number(parsed.updatedAt) || 0,
        deletedIds: Array.isArray(parsed.deletedIds) ? parsed.deletedIds.map(String).filter(Boolean) : [],
        deletedKeys: Array.isArray(parsed.deletedKeys) ? parsed.deletedKeys.map(String).filter(Boolean) : []
      };
    }
  } catch (error) {}
  return null;
}

function stableCloudItemKey(item) {
  if (!item || typeof item !== "object") return "";
  if (item.id) return `id:${String(item.id)}`;
  return stableCloudBodyKey(item);
}

function stableCloudBodyKey(item) {
  if (!item || typeof item !== "object") return "";
  return `body:${String(item.title || "").trim()}\n${String(item.body || "").trim()}`;
}

function stableCloudTemplateKey(item) {
  if (!item || typeof item !== "object") return "";
  const title = String(item.title || "").trim();
  if (title && title !== "새 문자") return `title:${title}`;
  return stableCloudBodyKey(item);
}

function mergeCloudListValues(key, localValue, remoteValue, remoteUpdatedAt) {
  if (key !== "kkulkkoori_work_notes_v1" && key !== "kkulkkoori_message_templates_v1") return null;
  const local = parseCloudJsonValue(localValue);
  const remote = parseCloudJsonValue(remoteValue);
  if (!local || !remote) return null;

  const deletedIds = new Set([...(remote.deletedIds || []), ...(local.deletedIds || [])].map(String).filter(Boolean));
  const deletedKeys = new Set([...(remote.deletedKeys || []), ...(local.deletedKeys || [])].map(String).filter(Boolean));
  const mergedMap = new Map();
  const addItem = item => {
    if (!item || typeof item !== "object") return;
    const itemKey = key === "kkulkkoori_message_templates_v1"
      ? stableCloudTemplateKey(item)
      : stableCloudItemKey(item);
    if (!itemKey) return;
    if (
      (item.id && deletedIds.has(String(item.id)))
      || deletedKeys.has(itemKey)
      || deletedKeys.has(stableCloudBodyKey(item))
    ) return;
    const current = mergedMap.get(itemKey);
    const itemUpdatedAt = Number(item.updatedAt) || 0;
    const currentUpdatedAt = current ? Number(current.updatedAt) || 0 : -1;
    if (!current || itemUpdatedAt >= currentUpdatedAt) mergedMap.set(itemKey, item);
  };

  remote.items.forEach(addItem);
  local.items.forEach(addItem);
  const items = Array.from(mergedMap.values());
  if (!items.length) return null;
  return JSON.stringify({
    version: 2,
    updatedAt: Math.max(Date.now(), Number(local.updatedAt) || 0, Number(remote.updatedAt) || remoteUpdatedAt || 0),
    items,
    deletedIds: Array.from(deletedIds),
    deletedKeys: Array.from(deletedKeys)
  });
}

async function uploadCloudDataKey(key, value, updatedAt = Date.now(), deleted = false) {
  if (!db || !CLOUD_SYNC_KEYS.includes(key)) return false;
  const textValue = String(value || "");
  if (!deleted && getCloudStringSize(textValue) > CLOUD_SYNC_MAX_BYTES) {
    console.warn("Cloud sync skipped because data is too large:", key);
    return false;
  }
  await setDoc(doc(db, CLOUD_DATA_COLLECTION, key), {
    key,
    value: deleted ? "" : textValue,
    deleted: Boolean(deleted),
    updatedAt: Number(updatedAt) || Date.now()
  });
  return true;
}

async function uploadLocalCloudChange(key, value, updatedAt, deleted) {
  return uploadCloudDataKey(key, value, updatedAt, deleted);
}

function applyCloudDataLocally(key, value, updatedAt, deleted) {
  cloudApplyingRemote = true;
  try {
    if (deleted) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, String(value || ""));
    }
    setCloudLocalUpdatedAt(key, updatedAt);
  } finally {
    cloudApplyingRemote = false;
  }
  try {
    window.dispatchEvent(new CustomEvent("kknutrition:cloud-data-applied", {
      detail: { key, value: String(value || ""), deleted: Boolean(deleted), updatedAt }
    }));
  } catch (error) {}
}

function setupCloudDataSync() {
  if (!db || cloudSyncReady) return;
  cloudSyncReady = true;

  window.addEventListener("kknutrition:local-data-changed", event => {
    const detail = event.detail || {};
    const key = String(detail.key || "");
    if (cloudApplyingRemote || !CLOUD_SYNC_KEYS.includes(key)) return;
    const updatedAt = Number(detail.updatedAt) || Date.now();
    cloudPendingLocalWrites.set(key, {
      value: String(detail.value || ""),
      updatedAt,
      deleted: Boolean(detail.deleted)
    });
    setCloudLocalUpdatedAt(key, updatedAt);
    uploadLocalCloudChange(key, detail.value || "", updatedAt, Boolean(detail.deleted))
      .catch(error => console.error("공용 데이터 동기화 실패:", key, error));
  });

  CLOUD_SYNC_KEYS.forEach(key => {
    onSnapshot(doc(db, CLOUD_DATA_COLLECTION, key), snapshot => {
      const localValue = localStorage.getItem(key);
      const localUpdatedAt = getEffectiveCloudLocalUpdatedAt(key, localValue);

      if (!snapshot.exists()) {
        if (hasMeaningfulLocalValue(localValue)) {
          const seedUpdatedAt = localUpdatedAt || Date.now();
          setCloudLocalUpdatedAt(key, seedUpdatedAt);
          uploadCloudDataKey(key, localValue, seedUpdatedAt, false)
            .catch(error => console.error("공용 데이터 초기 업로드 실패:", key, error));
        }
        return;
      }

      const data = snapshot.data() || {};
      const remoteUpdatedAt = Number(data.updatedAt) || 0;
      const shouldUseLatestWholeValue = key === "kkulkkoori_work_notes_v1" || key === "kkulkkoori_message_templates_v1";

      if (shouldUseLatestWholeValue) {
        const pending = cloudPendingLocalWrites.get(key);
        if (pending && remoteUpdatedAt >= pending.updatedAt) {
          cloudPendingLocalWrites.delete(key);
        }
        if (pending && pending.updatedAt > remoteUpdatedAt) {
          uploadCloudDataKey(key, pending.value, pending.updatedAt, pending.deleted)
            .catch(error => console.error("공용 데이터 최신 로컬 업로드 대기 실패:", key, error));
          return;
        }
        if (String(data.value || "") !== String(localValue || "") || Boolean(data.deleted)) {
          applyCloudDataLocally(key, data.value || "", remoteUpdatedAt || Date.now(), Boolean(data.deleted));
        } else if (remoteUpdatedAt) {
          setCloudLocalUpdatedAt(key, remoteUpdatedAt);
        }
        return;
      }

      if (hasMeaningfulLocalValue(localValue) && !localUpdatedAt) {
        if (shouldUseLatestWholeValue) {
          if (remoteUpdatedAt) {
            applyCloudDataLocally(key, data.value || "", remoteUpdatedAt, Boolean(data.deleted));
            return;
          }
          const seedUpdatedAt = Date.now();
          setCloudLocalUpdatedAt(key, seedUpdatedAt);
          uploadCloudDataKey(key, localValue, seedUpdatedAt, false)
            .catch(error => console.error("공용 데이터 로컬 우선 보존 실패:", key, error));
          return;
        }
        const mergedValue = mergeCloudListValues(key, localValue || "", data.value || "", remoteUpdatedAt);
        const seedUpdatedAt = Date.now();
        const seedValue = mergedValue || localValue;
        if (mergedValue && String(mergedValue) !== String(localValue || "")) {
          applyCloudDataLocally(key, mergedValue, seedUpdatedAt, false);
        }
        setCloudLocalUpdatedAt(key, seedUpdatedAt);
        uploadCloudDataKey(key, seedValue, seedUpdatedAt, false)
          .catch(error => console.error("공용 데이터 로컬 우선 보존 실패:", key, error));
        return;
      }

      if (localUpdatedAt && localUpdatedAt > remoteUpdatedAt) {
        if (shouldUseLatestWholeValue) {
          uploadCloudDataKey(key, localValue || "", localUpdatedAt, !localValue)
            .catch(error => console.error("공용 데이터 최신 로컬 복구 실패:", key, error));
          return;
        }
        const mergedValue = mergeCloudListValues(key, localValue || "", data.value || "", remoteUpdatedAt);
        const uploadValue = mergedValue || localValue || "";
        const uploadTime = mergedValue ? Date.now() : localUpdatedAt;
        if (mergedValue && String(mergedValue) !== String(localValue || "")) {
          applyCloudDataLocally(key, mergedValue, uploadTime, false);
        }
        uploadCloudDataKey(key, uploadValue, uploadTime, !uploadValue)
          .catch(error => console.error("공용 데이터 최신 로컬 복구 실패:", key, error));
        return;
      }

      if (remoteUpdatedAt >= localUpdatedAt && String(data.value || "") !== String(localValue || "")) {
        if (shouldUseLatestWholeValue) {
          applyCloudDataLocally(key, data.value || "", remoteUpdatedAt || Date.now(), Boolean(data.deleted));
          return;
        }
        const mergedValue = hasMeaningfulLocalValue(localValue)
          ? mergeCloudListValues(key, localValue || "", data.value || "", remoteUpdatedAt)
          : null;
        if (mergedValue && String(mergedValue) !== String(data.value || "")) {
          const mergedAt = Date.now();
          applyCloudDataLocally(key, mergedValue, mergedAt, false);
          uploadCloudDataKey(key, mergedValue, mergedAt, false)
            .catch(error => console.error("Cloud merge upload failed:", key, error));
        } else {
          applyCloudDataLocally(key, data.value || "", remoteUpdatedAt || Date.now(), Boolean(data.deleted));
        }
      } else if (remoteUpdatedAt > localUpdatedAt) {
        setCloudLocalUpdatedAt(key, remoteUpdatedAt);
      }
    }, error => {
      console.error("공용 데이터 수신 실패:", key, error);
    });
  });
}

window.KKNutritionCloudSync = {
  syncNow: () => {
    CLOUD_SYNC_KEYS.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        const updatedAt = Date.now();
        setCloudLocalUpdatedAt(key, updatedAt);
        uploadCloudDataKey(key, value, updatedAt, false)
          .catch(error => console.error("수동 공용 데이터 동기화 실패:", key, error));
      }
    });
  }
};

window.KKNutritionCloudSync.saveKey = async (key, value, updatedAt = Date.now(), deleted = false) => {
  if (!CLOUD_SYNC_KEYS.includes(key)) {
    throw new Error("Unsupported shared data key");
  }
  const savedAt = Number(updatedAt) || Date.now();
  setCloudLocalUpdatedAt(key, savedAt);
  cloudPendingLocalWrites.set(key, {
    value: String(value || ""),
    updatedAt: savedAt,
    deleted: Boolean(deleted)
  });
  return uploadCloudDataKey(key, value || "", savedAt, Boolean(deleted));
};

window.KKNutritionCloudSync.syncNow = () => {
  const uploads = [];
  CLOUD_SYNC_KEYS.forEach(key => {
    const value = localStorage.getItem(key);
    if (!value) return;
    const updatedAt = Date.now();
    setCloudLocalUpdatedAt(key, updatedAt);
    uploads.push(uploadCloudDataKey(key, value, updatedAt, false));
  });
  return Promise.all(uploads);
};

const defaultMemos = [
  { text: "식단 확인", checked: false },
  { text: "알레르기 확인", checked: false },
  { text: "전달사항 메모", checked: false }
];

let memos = [];
let isFirebaseLoaded = false;
let memoUpdatedAt = 0;

function normalizeMemoPayload(value) {
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

function readMemoLocalMeta() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_MEMO_META_KEY) || "{}");
  } catch (e) {
    return {};
  }
}

function readSavedMemoUpdatedAt() {
  try {
    const parsed = normalizeMemoPayload(JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "null"));
    return parsed ? Number(parsed.updatedAt) || 0 : 0;
  } catch (e) {
    return 0;
  }
}

function writeLocalMemos(updatedAt, options = {}) {
  const nextUpdatedAt = Number(updatedAt) || Date.now();
  const nextHasUserMemos = hasUserMemos(memos);
  const existing = getRecoverableMemoPayload();
  if (!options.allowEmpty && !nextHasUserMemos && existing) {
    memos = existing.items;
    memoUpdatedAt = Number(existing.updatedAt) || nextUpdatedAt;
    return false;
  }

  if (!options.skipBackup && nextHasUserMemos) {
    writeMemoBackup(memos, nextUpdatedAt);
  }

  memoUpdatedAt = Number(updatedAt) || Date.now();
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
    items: memos,
    updatedAt: memoUpdatedAt
  }));
  localStorage.setItem(LOCAL_MEMO_META_KEY, JSON.stringify({
    updatedAt: memoUpdatedAt
  }));
  return true;
}

function loadLocalMemos() {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = normalizeMemoPayload(JSON.parse(saved));
      if (parsed) {
        if (hasMeaningfulMemos(parsed.items) || !restoreMemosFromBackupIfUseful()) {
          memos = parsed.items;
          memoUpdatedAt = parsed.updatedAt || Number(readMemoLocalMeta().updatedAt) || 0;
          writeMemoBackup(memos, memoUpdatedAt);
        }
      } else {
        if (!restoreMemosFromBackupIfUseful()) {
          memos = [...defaultMemos];
          memoUpdatedAt = 0;
        }
      }
    } catch (e) {
      if (!restoreMemosFromBackupIfUseful()) {
        memos = [...defaultMemos];
        memoUpdatedAt = 0;
      }
    }
  } else {
    if (!restoreMemosFromBackupIfUseful()) {
      memos = [...defaultMemos];
      memoUpdatedAt = 0;
    }
  }
}

function hasMeaningfulMemos(items) {
  return Array.isArray(items) && items.some(item => item && String(item.text || "").trim());
}

function isDefaultMemoList(items) {
  return Array.isArray(items)
    && items.length === defaultMemos.length
    && items.every((item, index) => (
      item
      && String(item.text || "") === defaultMemos[index].text
      && Boolean(item.checked) === Boolean(defaultMemos[index].checked)
    ));
}

function hasUserMemos(items) {
  return hasMeaningfulMemos(items) && !isDefaultMemoList(items);
}

function readMemoBackup() {
  try {
    const parsed = normalizeMemoPayload(JSON.parse(localStorage.getItem(LOCAL_MEMO_BACKUP_KEY) || "null"));
    if (parsed && hasUserMemos(parsed.items)) return parsed;
  } catch (error) {}
  return null;
}

function writeMemoBackup(items, updatedAt = Date.now()) {
  if (!hasUserMemos(items)) return false;
  try {
    localStorage.setItem(LOCAL_MEMO_BACKUP_KEY, JSON.stringify({
      items,
      updatedAt: Number(updatedAt) || Date.now(),
      backedUpAt: Date.now()
    }));
    return true;
  } catch (error) {
    return false;
  }
}

function getRecoverableMemoPayload() {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = normalizeMemoPayload(JSON.parse(saved));
      if (parsed && hasUserMemos(parsed.items)) return parsed;
    } catch (error) {}
  }
  return readMemoBackup();
}

function restoreMemosFromBackupIfUseful() {
  const backup = readMemoBackup();
  if (!backup) return false;
  memos = backup.items;
  writeLocalMemos(backup.updatedAt || Date.now(), { skipBackup: true, allowEmpty: false });
  return true;
}

function saveLocalMemos() {
  return writeLocalMemos(Date.now());
}

async function saveMemos() {
  if (saveLocalMemos() === false) {
    updateAllMemosDOM();
    return;
  }
  if (db && isFirebaseLoaded) {
    try {
      memoPendingLocalWriteAt = memoUpdatedAt || Date.now();
      await setDoc(doc(db, "memos", MEMO_DOC_ID), {
        items: memos,
        updatedAt: memoUpdatedAt
      });
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
      saveLocalMemos();
      
      clearTimeout(textarea._saveTimeout);
      textarea._saveTimeout = setTimeout(() => {
        saveMemos();
      }, 500);
    };

    textarea.onkeydown = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (index < memos.length - 1) {
          if (isHome && index + 1 >= 3) {
            textarea.blur();
            openMemoModal();
            setTimeout(() => {
                const modalList = document.getElementById("memoModalList");
                const nextTextarea = modalList.children[index + 1]?.querySelector("textarea");
                if (nextTextarea) {
                    nextTextarea.focus({ preventScroll: true });
                    const len = nextTextarea.value.length;
                    nextTextarea.setSelectionRange(len, len);
                }
            }, 100);
            return;
          }
          const nextTextarea = container.children[index + 1]?.querySelector("textarea");
          if (nextTextarea) {
            nextTextarea.focus({ preventScroll: true });
            const len = nextTextarea.value.length;
            nextTextarea.setSelectionRange(len, len);
          }
        } else {
          textarea.blur();
          memos.splice(index + 1, 0, { text: "", checked: false });
          saveMemos();
          if (isHome && index + 1 >= 3) {
              updateAllMemosDOM();
              openMemoModal();
              setTimeout(() => {
                  const modalList = document.getElementById("memoModalList");
                  const nextTextarea = modalList.children[index + 1]?.querySelector("textarea");
                  if (nextTextarea) {
                      nextTextarea.focus({ preventScroll: true });
                      nextTextarea.parentElement.scrollIntoView({ behavior: "smooth", block: "center" });
                  }
              }, 100);
              return;
          }
          updateAllMemosDOM();
          setTimeout(() => {
            const nextTextarea = container.children[index + 1]?.querySelector("textarea");
            if (nextTextarea) {
                nextTextarea.focus({ preventScroll: true });
                nextTextarea.parentElement.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }, 10);
        }
      } else if (e.key === "ArrowUp") {
        if (textarea.selectionStart === 0 && textarea.selectionEnd === 0) {
          e.preventDefault();
          if (textarea.value === "" && memos.length > 1) {
            memos.splice(index, 1);
            textarea.blur();
            saveMemos();
            updateAllMemosDOM();
            const targetIndex = index > 0 ? index - 1 : 0;
            setTimeout(() => {
              const targetTextarea = container.children[targetIndex]?.querySelector("textarea");
              if (targetTextarea) {
                targetTextarea.focus({ preventScroll: true });
                const len = targetTextarea.value.length;
                targetTextarea.setSelectionRange(len, len);
              }
            }, 10);
          } else if (index > 0) {
            const prevTextarea = container.children[index - 1]?.querySelector("textarea");
            if (prevTextarea) {
              prevTextarea.focus({ preventScroll: true });
              const len = prevTextarea.value.length;
              prevTextarea.setSelectionRange(len, len);
            }
          }
        }
      } else if (e.key === "ArrowDown") {
        const len = textarea.value.length;
        if (textarea.selectionStart === len && textarea.selectionEnd === len) {
          e.preventDefault();
          if (textarea.value === "" && memos.length > 1) {
            memos.splice(index, 1);
            textarea.blur();
            saveMemos();
            updateAllMemosDOM();
            const targetIndex = index < memos.length ? index : memos.length - 1;
            setTimeout(() => {
              const targetTextarea = container.children[targetIndex]?.querySelector("textarea");
              if (targetTextarea) {
                targetTextarea.focus({ preventScroll: true });
                const length = targetTextarea.value.length;
                targetTextarea.setSelectionRange(length, length);
              }
            }, 10);
          } else if (index < memos.length - 1) {
            if (isHome && index + 1 >= 3) {
              textarea.blur();
              openMemoModal();
              setTimeout(() => {
                  const modalList = document.getElementById("memoModalList");
                  const nextTextarea = modalList.children[index + 1]?.querySelector("textarea");
                  if (nextTextarea) {
                      nextTextarea.focus({ preventScroll: true });
                      const length = nextTextarea.value.length;
                      nextTextarea.setSelectionRange(length, length);
                  }
              }, 100);
              return;
            }
            const nextTextarea = container.children[index + 1]?.querySelector("textarea");
            if (nextTextarea) {
              nextTextarea.focus({ preventScroll: true });
              const length = nextTextarea.value.length;
              nextTextarea.setSelectionRange(length, length);
            }
          } else {
            textarea.blur();
            memos.splice(index + 1, 0, { text: "", checked: false });
            saveMemos();
            if (isHome && index + 1 >= 3) {
                updateAllMemosDOM();
                openMemoModal();
                setTimeout(() => {
                    const modalList = document.getElementById("memoModalList");
                    const nextTextarea = modalList.children[index + 1]?.querySelector("textarea");
                    if (nextTextarea) {
                        nextTextarea.focus({ preventScroll: true });
                        nextTextarea.parentElement.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                }, 100);
                return;
            }
            updateAllMemosDOM();
            setTimeout(() => {
              const nextTextarea = container.children[index + 1]?.querySelector("textarea");
              if (nextTextarea) {
                  nextTextarea.focus({ preventScroll: true });
                  nextTextarea.parentElement.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            }, 10);
          }
        }
      } else if (e.key === "Backspace" && textarea.value === "" && memos.length > 1) {
        e.preventDefault();
        memos.splice(index, 1);
        textarea.blur();
        saveMemos();
        updateAllMemosDOM();
        const targetIndex = index > 0 ? index - 1 : 0;
        setTimeout(() => {
          const targetTextarea = container.children[targetIndex]?.querySelector("textarea");
          if (targetTextarea) {
            targetTextarea.focus({ preventScroll: true });
            const len = targetTextarea.value.length;
            targetTextarea.setSelectionRange(len, len);
          }
        }, 10);
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
    }, 200);
  }
  updateAllMemosDOM();
}

/* =========================================================
   PAGE CONTENT EDIT & SYNC LOGIC
   ========================================================= */

// Store editing state per page
const editingState = {
  daily: false,
  monthly: false,
  annual: false,
  staff: false
};

function syncAnnualMobileCards() {
  const table = document.querySelector('.annual-table tbody');
  if (!table) return;
  const listContainer = document.getElementById('annual-mobile-auto-list');
  if (!listContainer) return;

  listContainer.innerHTML = '';
  let currentMonthCard = null;

  const rows = table.querySelectorAll('tr');
  rows.forEach(row => {
    const cells = row.querySelectorAll('td, th');
    if (cells.length === 0) return;

    let titleText, contentHtml;

    if (cells.length >= 3) {
      // New month
      const monthText = cells[0].innerText.trim();
      currentMonthCard = document.createElement('div');
      currentMonthCard.className = 'annual-month-card';
      const h3 = document.createElement('h3');
      h3.textContent = monthText;
      currentMonthCard.appendChild(h3);
      listContainer.appendChild(currentMonthCard);

      titleText = cells[1].innerText.trim();
      contentHtml = cells[2].innerHTML;
    } else if (cells.length === 2 && currentMonthCard) {
      // Continue same month
      titleText = cells[0].innerText.trim();
      contentHtml = cells[1].innerHTML;
    } else {
      return;
    }

    if (currentMonthCard && (titleText || contentHtml)) {
      const taskDiv = document.createElement('div');
      taskDiv.className = 'annual-task';
      
      const strong = document.createElement('strong');
      strong.textContent = titleText;
      taskDiv.appendChild(strong);

      const contentWrapper = document.createElement('div');
      contentWrapper.innerHTML = contentHtml;
      
      while(contentWrapper.firstChild) {
        taskDiv.appendChild(contentWrapper.firstChild);
      }

      currentMonthCard.appendChild(taskDiv);
    }
  });
}

// Initial sync for annual mobile cards on page load
syncAnnualMobileCards();

// Setup real-time listeners for each page
['daily', 'monthly', 'annual', 'staff'].forEach(pageId => {
  // We need to setup the listener inside init() after db is ready, or just check db here.
  // Wait, db is initialized synchronously at the top of the file!
  if (!isFirebaseConfigured || !db) return;
  
  onSnapshot(doc(db, "pageContents", pageId), (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      // Only update DOM if NOT currently editing this page
      if (!editingState[pageId]) {
        Object.keys(data).forEach(elementId => {
          const el = document.getElementById(elementId);
          if (el) {
            el.innerHTML = data[elementId];
          }
        });
        if (pageId === 'annual') {
          syncAnnualMobileCards();
        }
      }
    }
  });
});

// Setup Edit/Save buttons
document.querySelectorAll('.fab-edit-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const targetBtn = e.currentTarget;
    const pageId = targetBtn.getAttribute('data-target');
    const isEditing = editingState[pageId];
    const section = document.getElementById(pageId);
    if (!section) return;

    const editables = section.querySelectorAll('.editable-content');

    if (!isEditing) {
      // Enter edit mode
      editingState[pageId] = true;
      targetBtn.textContent = "저장";
      targetBtn.classList.add('saving');
      
      editables.forEach(el => {
        el.setAttribute('contenteditable', 'true');
      });
      
      if (editables.length > 0) {
        editables[0].focus();
      }
    } else {
      // Save mode
      targetBtn.textContent = "저장 중...";
      
      const updateData = {};
      editables.forEach(el => {
        el.removeAttribute('contenteditable');
        updateData[el.id] = el.innerHTML;
      });

      if (!isFirebaseConfigured || !db) {
        editingState[pageId] = false;
        targetBtn.textContent = "수정";
        targetBtn.classList.remove('saving');
        if (pageId === 'annual') syncAnnualMobileCards();
        return;
      }

      setDoc(doc(db, "pageContents", pageId), updateData).then(() => {
        editingState[pageId] = false;
        targetBtn.textContent = "수정";
        targetBtn.classList.remove('saving');
        
        if (pageId === 'annual') {
          syncAnnualMobileCards();
        }
      }).catch(err => {
        console.error("Save failed:", err);
        alert("저장에 실패했습니다.");
        editingState[pageId] = false;
        targetBtn.textContent = "수정";
        targetBtn.classList.remove('saving');
      });
    }
  });
});

// ====== Navigation Guard Logic ======
window.hasUnsavedChanges = () => {
  const otherUnsaved = Object.values(editingState).some(state => state === true);
  const bookmarkUnsaved = (typeof window.isBookmarkEditMode === 'function' && window.isBookmarkEditMode());
  return otherUnsaved || bookmarkUnsaved;
};

window.addEventListener('beforeunload', (e) => {
  if (window.hasUnsavedChanges()) {
    e.preventDefault();
    e.returnValue = '';
  }
});

document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  
  const targetHash = link.getAttribute('href');
  const currentHash = window.location.hash || '#home';
  
  if (targetHash !== currentHash && window.hasUnsavedChanges()) {
    e.preventDefault();
    
    let modal = document.getElementById('unsavedModalOverlay');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'unsavedModalOverlay';
      modal.className = 'memo-modal-overlay';
      modal.style.cssText = 'display: none; z-index: 10000; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); align-items: center; justify-content: center; backdrop-filter: blur(4px); transition: opacity 0.2s;';
      modal.innerHTML = `
        <div class="memo-modal" style="max-width: 360px; width: 90%; background: var(--card); border-radius: 20px; overflow: hidden; position: relative; box-shadow: 0 10px 40px rgba(0,0,0,0.15); margin: auto;">
          <button id="unsavedModalCloseBtn" type="button" aria-label="닫기" style="position: absolute; top: 16px; right: 16px; background: transparent; border: none; padding: 8px; cursor: pointer; color: var(--text); border-radius: 50%; transition: background 0.2s;" onmouseover="this.style.background='var(--line)'" onmouseout="this.style.background='transparent'">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          <div style="padding: 32px 24px 24px; text-align: center;">
            <div style="width: 54px; height: 54px; border-radius: 50%; background: rgba(255, 107, 107, 0.1); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <h3 style="margin: 0 0 12px; font-size: 1.25rem; font-weight: 800; color: var(--heading);">저장하지 않은 내용</h3>
            <p style="margin: 0 0 28px; line-height: 1.6; font-size: 15px; color: var(--text);">
              이 화면을 나가면 수정한 내용이<br>사라질 수 있습니다.
            </p>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <button id="unsavedModalConfirmBtn" type="button" style="width: 100%; padding: 14px 0; font-size: 16px; font-weight: 700; background: var(--primary); color: #ffffff !important; border: none; border-radius: 12px; cursor: pointer; box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);">저장하지 않고 나가기</button>
              <button id="unsavedModalCancelBtn" type="button" style="width: 100%; padding: 14px 0; font-size: 16px; font-weight: 700; background: var(--card-soft); color: var(--heading); border: 1px solid var(--line); border-radius: 12px; cursor: pointer;">계속 작성하기</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    
    // Force visibility regardless of CSS issues
    modal.style.display = 'flex';
    void modal.offsetWidth; // force reflow
    modal.style.opacity = '1';
    modal.style.pointerEvents = 'auto';
    modal.classList.add('active');
    
    const closeBtn = document.getElementById('unsavedModalCloseBtn');
    const cancelBtn = document.getElementById('unsavedModalCancelBtn');
    const confirmBtn = document.getElementById('unsavedModalConfirmBtn');
    
    const cleanupAndClose = () => {
      modal.style.opacity = '0';
      modal.style.pointerEvents = 'none';
      modal.classList.remove('active');
      setTimeout(() => {
        modal.style.display = 'none';
      }, 200);
      closeBtn.removeEventListener('click', cleanupAndClose);
      cancelBtn.removeEventListener('click', cleanupAndClose);
      confirmBtn.removeEventListener('click', confirmNav);
    };
    
    const confirmNav = () => {
      for (let key in editingState) {
        if (editingState[key]) {
          editingState[key] = false;
          const section = document.getElementById(key);
          if (section) {
            const btn = section.querySelector('.fab-edit-btn');
            if (btn) {
              btn.textContent = "수정";
              btn.classList.remove('saving');
            }
            const editables = section.querySelectorAll('.editable-content');
            editables.forEach(el => el.removeAttribute('contenteditable'));
          }
        }
      }
      
      if (typeof window.exitBookmarkEditMode === 'function') {
        window.exitBookmarkEditMode();
      }
      
      cleanupAndClose();
      window.location.hash = targetHash;
    };
    
    closeBtn.addEventListener('click', cleanupAndClose);
    cancelBtn.addEventListener('click', cleanupAndClose);
    confirmBtn.addEventListener('click', confirmNav);
  }
});
// ===================================

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
    setupCloudDataSync();
    loadLocalMemos();
    updateAllMemosDOM();


    onSnapshot(doc(db, "bookmarks", BOOKMARK_DOC_ID), (snapshot) => {
      if (snapshot.exists()) {
        const snapshotData = snapshot.data();
        const remoteData = snapshotData.items;
        if (remoteData && Array.isArray(remoteData)) {
          if (typeof window.updateBookmarkData === 'function') {
            window.updateBookmarkData(remoteData, { updatedAt: snapshotData.updatedAt });
          }
        }
      } else {
        if (typeof window.getBookmarkData === 'function') {
          const meta = typeof window.getBookmarkSyncMeta === 'function' ? window.getBookmarkSyncMeta() : {};
          window.syncBookmarksToFirebase(window.getBookmarkData(), meta);
        }
      }
    });

    onSnapshot(doc(db, "memos", MEMO_DOC_ID), (snapshot) => {
      isFirebaseLoaded = true;
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.items) {
          const remoteUpdatedAt = Number(data.updatedAt) || 0;
          if (memoPendingLocalWriteAt && remoteUpdatedAt >= memoPendingLocalWriteAt) {
            memoPendingLocalWriteAt = 0;
          }
          if (memoPendingLocalWriteAt && memoPendingLocalWriteAt > remoteUpdatedAt) {
            setDoc(doc(db, "memos", MEMO_DOC_ID), {
              items: memos,
              updatedAt: memoPendingLocalWriteAt
            }).catch((error) => console.error("Firestore 메모 최신 로컬 업로드 대기 실패:", error));
            return;
          }
          if (JSON.stringify(memos) !== JSON.stringify(data.items) || (remoteUpdatedAt && remoteUpdatedAt !== memoUpdatedAt)) {
            memos = data.items;
            writeLocalMemos(remoteUpdatedAt || Date.now(), { allowEmpty: true });
            updateAllMemosDOM();
          }
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
