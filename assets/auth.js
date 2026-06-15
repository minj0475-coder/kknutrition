/**
 * 급식 포털 가벼운 인증 시스템
 * 향후 관리자 승인제로 전환할 수 있도록 인증 로직을 완전히 독립적으로 분리합니다.
 */

// --- 설정 (Settings) ---
const PORTAL_PASSWORD = "Zxcv2041520!"; // 임시 초기 비밀번호 (원하시는 비밀번호로 변경하세요)
const AUTH_KEY = "kknutrition_portal_auth";
const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycby3sgo-M0JiwyMBnlw6zjHY9p8n5vJdUk0NSTF1dd-chEMtDGnrknvKW51ZKQygynkD/exec"; // Google Apps Script 배포 후 생성된 웹앱 URL을 여기에 입력하세요.

// --- 인증 상태 확인 (Check Auth) ---
function checkAuth() {
  return localStorage.getItem(AUTH_KEY) === "true";
}

// --- 인증 통과 처리 (Grant Access) ---
function grantAccess(isNewDevice = false) {
  // 인증 상태 저장
  localStorage.setItem(AUTH_KEY, "true");
  
  // UI 변경: 인증 화면 숨기고 본문 표시
  document.getElementById("auth-screen").style.display = "none";
  const appContent = document.getElementById("app-content");
  appContent.style.display = ""; // 원래 스타일(block 등) 복구
  
  // 본문이 나타날 때 부드러운 애니메이션 효과
  appContent.style.animation = "modal-fade-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)";

  // 새 기기인 경우 웹훅 발송 (오류가 발생해도 포털 접속을 막지 않음)
  if (isNewDevice && WEBHOOK_URL) {
    sendWebhookNotification();
  }
}

// --- 로그인 제출 핸들러 (Handle Login) ---
function handleLoginSubmit(e) {
  e.preventDefault();
  const input = document.getElementById("authPasswordInput");
  const errorMsg = document.getElementById("authErrorMsg");
  
  if (input.value === PORTAL_PASSWORD) {
    errorMsg.style.display = "none";
    // localStorage에 키가 없었으므로 새 기기로 간주
    grantAccess(true);
  } else {
    // 비밀번호 틀림
    errorMsg.style.display = "block";
    input.value = "";
    input.focus();
    // 흔들림 애니메이션 효과 (선택적)
    const box = document.querySelector(".auth-box");
    box.style.animation = "none";
    box.offsetHeight; // trigger reflow
    box.style.animation = "shake 0.4s ease-in-out";
  }
}

// --- 웹훅 알림 전송 (Send Webhook) ---
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
    mode: "no-cors", // 보안 정책 우회용 (응답 내용은 읽을 수 없음)
    headers: {
      "Content-Type": "text/plain;charset=utf-8", // GAS CORS 회피용
    },
    body: JSON.stringify(payload)
  }).catch(error => {
    console.error("웹훅 전송 중 오류 발생 (무시됨):", error);
  });
}

// --- 초기화 (Init) ---
function initAuth() {
  // 현재 페이지가 공개 페이지인지 확인
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
