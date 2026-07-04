/**
 * 湲됱떇 ?ы꽭 媛踰쇱슫 ?몄쬆 ?쒖뒪??
 * ?ν썑 愿由ъ옄 ?뱀씤?쒕줈 ?꾪솚?????덈룄濡??몄쬆 濡쒖쭅???꾩쟾???낅┰?곸쑝濡?遺꾨━?⑸땲??
 */

// --- ?ㅼ젙 (Settings) ---
const PORTAL_PASSWORD = "Zxcv2041520!"; // ?꾩떆 珥덇린 鍮꾨?踰덊샇 (?먰븯?쒕뒗 鍮꾨?踰덊샇濡?蹂寃쏀븯?몄슂)
const AUTH_KEY = "kknutrition_portal_auth";
const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycby3sgo-M0JiwyMBnlw6zjHY9p8n5vJdUk0NSTF1dd-chEMtDGnrknvKW51ZKQygynkD/exec"; // Google Apps Script 諛고룷 ???앹꽦???뱀빋 URL???ш린???낅젰?섏꽭??

function isPublicPage() {
  const path = decodeURIComponent(window.location.pathname || "");
  return path.includes("신규대체조리종사원_안내");
}

// --- ?몄쬆 ?곹깭 ?뺤씤 (Check Auth) ---
function checkAuth() {
  return localStorage.getItem(AUTH_KEY) === "true";
}

// --- ?몄쬆 ?듦낵 泥섎━ (Grant Access) ---
function grantAccess(isNewDevice = false) {
  // ?몄쬆 ?곹깭 ???
  localStorage.setItem(AUTH_KEY, "true");
  
  // UI 蹂寃? ?몄쬆 ?붾㈃ ?④린怨?蹂몃Ц ?쒖떆
  document.getElementById("auth-screen").style.display = "none";
  const appContent = document.getElementById("app-content");
  appContent.style.display = ""; // ?먮옒 ?ㅽ???block ?? 蹂듦뎄
  
  // 蹂몃Ц???섑?????遺?쒕윭???좊땲硫붿씠???④낵
  appContent.style.animation = "modal-fade-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)";

  // ??湲곌린??寃쎌슦 ?뱁썒 諛쒖넚 (?ㅻ쪟媛 諛쒖깮?대룄 ?ы꽭 ?묒냽??留됱? ?딆쓬)
  if (isNewDevice && WEBHOOK_URL) {
    sendWebhookNotification();
  }
}

// --- 濡쒓렇???쒖텧 ?몃뱾??(Handle Login) ---
function handleLoginSubmit(e) {
  e.preventDefault();
  const input = document.getElementById("authPasswordInput");
  const errorMsg = document.getElementById("authErrorMsg");
  
  if (input.value === PORTAL_PASSWORD) {
    errorMsg.style.display = "none";
    // localStorage???ㅺ? ?놁뿀?쇰?濡???湲곌린濡?媛꾩＜
    grantAccess(true);
  } else {
    // 鍮꾨?踰덊샇 ?由?
    errorMsg.style.display = "block";
    input.value = "";
    input.focus();
    // ?붾뱾由??좊땲硫붿씠???④낵 (?좏깮??
    const box = document.querySelector(".auth-box");
    box.style.animation = "none";
    box.offsetHeight; // trigger reflow
    box.style.animation = "shake 0.4s ease-in-out";
  }
}

// --- ?뱁썒 ?뚮┝ ?꾩넚 (Send Webhook) ---
function sendWebhookNotification() {
  const payload = {
    timestamp: new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }),
    url: window.location.href,
    userAgent: navigator.userAgent,
    result: "success",
    isNewDevice: true
  };

  fetch(WEBHOOK_URL, {
    method: "POST",
    mode: "no-cors", // 蹂댁븞 ?뺤콉 ?고쉶??(?묐떟 ?댁슜? ?쎌쓣 ???놁쓬)
    headers: {
      "Content-Type": "text/plain;charset=utf-8", // GAS CORS ?뚰뵾??
    },
    body: JSON.stringify(payload)
  }).catch(error => {
    console.error("?뱁썒 ?꾩넚 以??ㅻ쪟 諛쒖깮 (臾댁떆??:", error);
  });
}

// --- 珥덇린??(Init) ---
function initAuth() {
  if (isPublicPage()) {
    const authScreen = document.getElementById("auth-screen");
    const appContent = document.getElementById("app-content");
    if (authScreen) authScreen.style.display = "none";
    if (appContent) appContent.style.display = "";
    return;
  }
  // ?꾩옱 ?섏씠吏媛 怨듦컻 ?섏씠吏?몄? ?뺤씤
  if (!document.getElementById("auth-screen") || !document.getElementById("app-content")) {
    return;
  }
  if (!checkAuth()) {
    document.getElementById("app-content").style.display = "none";
    document.getElementById("auth-screen").style.display = "flex";
    document.getElementById("authForm").addEventListener("submit", handleLoginSubmit);
  } else {
    document.getElementById("auth-screen").style.display = "none";
    document.getElementById("app-content").style.display = "";
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAuth);
} else {
  initAuth();
}
