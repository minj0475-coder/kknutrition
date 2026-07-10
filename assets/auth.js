const PORTAL_PASSWORD = "Zxcv2041520!";
const AUTH_KEY = "kknutrition_portal_auth";
const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycby3sgo-M0JiwyMBnlw6zjHY9p8n5vJdUk0NSTF1dd-chEMtDGnrknvKW51ZKQygynkD/exec";

function isPublicPage() {
  const path = decodeURIComponent(window.location.pathname || "");
  return path.includes("신규대체조리종사원_안내");
}

function checkAuth() {
  return localStorage.getItem(AUTH_KEY) === "true";
}

function grantAccess(isNewDevice = false) {
  localStorage.setItem(AUTH_KEY, "true");

  document.getElementById("auth-screen").style.display = "none";
  const appContent = document.getElementById("app-content");
  appContent.style.display = "";
  appContent.style.animation = "modal-fade-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)";

  if (isNewDevice && WEBHOOK_URL) {
    sendWebhookNotification();
  }
}

function handleLoginSubmit(e) {
  e.preventDefault();
  const input = document.getElementById("authPasswordInput");
  const errorMsg = document.getElementById("authErrorMsg");

  if (input.value === PORTAL_PASSWORD) {
    errorMsg.style.display = "none";
    grantAccess(true);
  } else {
    errorMsg.style.display = "block";
    input.value = "";
    input.focus();

    const box = document.querySelector(".auth-box");
    box.style.animation = "none";
    box.offsetHeight;
    box.style.animation = "shake 0.4s ease-in-out";
  }
}

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
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(payload)
  }).catch(error => {
    console.error("Webhook notification failed:", error);
  });
}

function initAuth() {
  if (isPublicPage()) {
    const authScreen = document.getElementById("auth-screen");
    const appContent = document.getElementById("app-content");
    if (authScreen) authScreen.style.display = "none";
    if (appContent) appContent.style.display = "";
    return;
  }

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
