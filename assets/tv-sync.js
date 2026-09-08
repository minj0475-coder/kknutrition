import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAbn8Lyayv8rIBo-5LD_GNctRduvM_lrvw",
  authDomain: "kknutrition-memo.firebaseapp.com",
  projectId: "kknutrition-memo",
  storageBucket: "kknutrition-memo.firebasestorage.app",
  messagingSenderId: "1094497868885",
  appId: "1:1094497868885:web:8673ea8aabec7bcee5c8dc"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const COLLECTION = "schoolLunchTv";

function withTimeout(promise, timeoutMs = 7000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => window.setTimeout(() => reject(new Error("Cloud save timed out")), timeoutMs))
  ]);
}

function toFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (typeof value === "string") return { stringValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } };
  if (typeof value === "object") {
    const fields = {};
    Object.entries(value).forEach(([key, item]) => { fields[key] = toFirestoreValue(item); });
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

async function saveViaRest(documentId, value) {
  const fields = {};
  Object.entries(value || {}).forEach(([key, item]) => { fields[key] = toFirestoreValue(item); });
  const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${COLLECTION}/${encodeURIComponent(documentId)}`;
  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields })
  });
  if (!response.ok) {
    let detail = "";
    try { detail = (await response.json()).error?.message || ""; } catch (error) {}
    throw new Error(detail || `TV cloud save failed: ${response.status}`);
  }
  return true;
}

async function reliableSet(documentId, value) {
  try {
    await withTimeout(setDoc(doc(db, COLLECTION, documentId), value));
    return true;
  } catch (error) {
    console.warn("급식TV Firebase SDK 저장 재시도:", documentId, error);
    return saveViaRest(documentId, value);
  }
}

async function readDocument(documentId) {
  try {
    const snapshot = await withTimeout(getDoc(doc(db, COLLECTION, documentId)));
    return snapshot.exists() ? snapshot.data() : null;
  } catch (error) {
    console.warn("급식TV 원격 데이터 읽기 실패:", documentId, error);
    return undefined;
  }
}

async function readSettings() {
  const value = await readDocument("settings");
  if (value === undefined) return undefined;
  return value && value.payload && typeof value.payload === "object"
    ? { ...value.payload, savedAt: Number(value.savedAt || value.payload.savedAt) || 0 }
    : null;
}

async function saveSettings(payload) {
  const savedAt = Number(payload?.savedAt) || Date.now();
  return reliableSet("settings", { payload, savedAt });
}

async function readMedia() {
  const [main, special] = await Promise.all([readDocument("today-main"), readDocument("today-special")]);
  if (main === undefined || special === undefined) return undefined;
  const newest = Math.max(Number(main?.savedAt) || 0, Number(special?.savedAt) || 0);
  const date = String(main?.date || special?.date || "");
  if (!date && !main?.data && !special?.data) return null;
  return {
    date,
    photo: main?.date === date ? main.data || null : null,
    specialPhoto: special?.date === date ? special.data || null : null,
    savedAt: newest
  };
}

async function saveMedia(date, photo, specialPhoto, savedAt = Date.now()) {
  const timestamp = Number(savedAt) || Date.now();
  await Promise.all([
    reliableSet("today-main", { date: String(date || ""), data: photo || null, savedAt: timestamp }),
    reliableSet("today-special", { date: String(date || ""), data: specialPhoto || null, savedAt: timestamp })
  ]);
  return true;
}

window.KKNutritionTvCloud = { readSettings, saveSettings, readMedia, saveMedia };
window.dispatchEvent(new CustomEvent("kknutrition:tv-cloud-ready"));
