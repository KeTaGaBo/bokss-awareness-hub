/* HUB_LAUNCHER_20260624_v3 */

const hubText = {
  "zh-HK": {
    badge: "BOKSS Awareness Hub",
    subtitle: "資安與私隱學習目錄",
    title: "請選擇一個測驗開始",
    intro: "這裡集合了不同主題的資安及私隱教育測驗。你可按需要選擇合適的測驗開始，並持續留意最新更新。",
    start: "開始測驗",
    updated: "更新至",
    active: "進行中",
    empty: "目前尚未有可顯示的測驗。",
    loading: "載入中...",
    loadError: "未能載入測驗目錄。",
    footerSub: "Awareness Hub · 資安及私隱教育",
    searchPlaceholder: "搜尋測驗標題或簡介",
    resultCountLabel: "顯示結果",
    sectionTitle: "應用目錄",
    langLabel: "Language / 語言 / 语言"
  },
  "zh-CN": {
    badge: "BOKSS Awareness Hub",
    subtitle: "信息安全与隐私学习目录",
    title: "请选择一个测验开始",
    intro: "这里集合了不同主题的信息安全与隐私教育测验。你可按需要选择合适的测验开始，并持续留意最新更新。",
    start: "开始测验",
    updated: "更新至",
    active: "进行中",
    empty: "目前尚未有可显示的测验。",
    loading: "加载中...",
    loadError: "未能加载测验目录。",
    footerSub: "Awareness Hub · 信息安全与隐私教育",
    searchPlaceholder: "搜索测验标题或简介",
    resultCountLabel: "显示结果",
    sectionTitle: "应用目录",
    langLabel: "Language / 语言 / 语言"
  },
  "en": {
    badge: "BOKSS Awareness Hub",
    subtitle: "Cybersecurity & Privacy Learning Directory",
    title: "Choose a quiz to begin",
    intro: "This hub brings together different cybersecurity and privacy awareness quizzes. Pick a quiz to start and keep an eye on the latest updates.",
    start: "Start Quiz",
    updated: "Updated",
    active: "Active",
    empty: "No quizzes are available at the moment.",
    loading: "Loading...",
    loadError: "Unable to load quiz directory.",
    footerSub: "Awareness Hub · Cybersecurity & Privacy Education",
    searchPlaceholder: "Search by quiz title or description",
    resultCountLabel: "Results",
    sectionTitle: "App Directory",
    langLabel: "Language / 語言 / 语言"
  }
};

let currentLang = "zh-HK";
let quizzesCache = [];
let currentKeyword = "";

function $(id) {
  return document.getElementById(id);
}

function updateLanguageInUrl(lang) {
  const url = new URL(window.location.href);
  url.searchParams.set("lang", lang);
  window.history.replaceState({}, "", url.toString());
}

function getLangText(obj) {
  if (!obj || typeof obj !== "object") return "";
  return obj[currentLang] || obj["zh-HK"] || obj["en"] || "";
}

function formatYearMonth(lastModified) {
  if (!lastModified) return "";

  if (typeof lastModified === "string") {
    return lastModified.slice(0, 7);
  }

  if (typeof lastModified === "object") {
    if (lastModified.display) return String(lastModified.display).slice(0, 7);
    if (lastModified.iso) return String(lastModified.iso).slice(0, 7);
  }

  return "";
}

function setText(id, text) {
  const el = $(id);
  if (el) el.textContent = text;
}

function updateHubLanguageUI() {
  const t = hubText[currentLang];
  document.documentElement.lang = currentLang;
  document.title = t.badge;

  setText("hubBadge", t.badge);
  setText("hubTitle", t.title);
  setText("hubSubtitle", t.subtitle);
  setText("hubIntro", t.intro);
  setText("hubFooterSub", t.footerSub);
  setText("resultCountLabel", t.resultCountLabel);
  setText("sectionTitle", t.sectionTitle);
  setText("langLabel", t.langLabel);

  const select = $("langSelect");
  if (select) select.value = currentLang;

  const search = $("hubSearch");
  if (search) search.placeholder = t.searchPlaceholder;

  const loadingBox = $("loadingBox");
  if (loadingBox) loadingBox.textContent = t.loading;
}

function sortQuizzes(quizzes) {
  return [...quizzes].sort((a, b) => {
    const aVal = (a.lastModified && (a.lastModified.iso || a.lastModified.display || a.lastModified)) || "";
    const bVal = (b.lastModified && (b.lastModified.iso || b.lastModified.display || b.lastModified)) || "";
    return String(bVal).localeCompare(String(aVal));
  });
}

function clearElement(el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

function getTileGradient(index) {
  const gradients = [
    "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
    "linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)",
    "linear-gradient(135deg, #7c3aed 0%, #db2777 100%)",
    "linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)",
    "linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)"
  ];
  return gradients[index % gradients.length];
}

function getTileIconText(quiz, index) {
  const title = getLangText(quiz.title).trim();
  if (title) return title.charAt(0).toUpperCase();
  return String(index + 1);
}

function createQuizCard(quiz, index) {
  const t = hubText[currentLang];
  const targetUrl = quiz.path + "?lang=" + encodeURIComponent(currentLang);
  const title = getLangText(quiz.title);
  const desc = getLangText(quiz.description);
  const lastModified = formatYearMonth(quiz.lastModified);

  const card = document.createElement("div");
  card.className = "quiz-card";

  const top = document.createElement("div");
  top.className = "quiz-card-top";

  const icon = document.createElement("div");
  icon.className = "quiz-icon";
  icon.style.background = getTileGradient(index);
  icon.textContent = getTileIconText(quiz, index);

  const status = document.createElement("div");
  status.className = "quiz-status";
  status.textContent = t.active;

  top.appendChild(icon);
  top.appendChild(status);
  card.appendChild(top);

  const titleLink = document.createElement("a");
  titleLink.className = "quiz-title-link";
  titleLink.href = targetUrl;

  const titleEl = document.createElement("div");
  titleEl.className = "quiz-title";
  titleEl.textContent = title;

  titleLink.appendChild(titleEl);
  card.appendChild(titleLink);

  const descEl = document.createElement("div");
  descEl.className = "quiz-desc";
  descEl.textContent = desc;
  card.appendChild(descEl);

  const meta = document.createElement("div");
  meta.className = "quiz-meta";
  meta.textContent = `${t.updated}：${lastModified || "-"}`;
  card.appendChild(meta);

  const actions = document.createElement("div");
  actions.className = "quiz-actions";

  const startBtn = document.createElement("a");
  startBtn.className = "start-btn";
  startBtn.href = targetUrl;

  const iconSpan = document.createElement("span");
  iconSpan.className = "open-icon";
  iconSpan.textContent = "🚀";

  const textSpan = document.createElement("span");
  textSpan.textContent = t.start;

  startBtn.appendChild(iconSpan);
  startBtn.appendChild(textSpan);

  const urlEl = document.createElement("div");
  urlEl.className = "quiz-url";
  urlEl.textContent = quiz.path;

  actions.appendChild(startBtn);
  actions.appendChild(urlEl);
  card.appendChild(actions);

  return card;
}

function filterQuizzes(quizzes, keyword) {
  const trimmed = keyword.trim().toLowerCase();
  if (!trimmed) return quizzes;

  return quizzes.filter(q => {
    const title = getLangText(q.title).toLowerCase();
    const desc = getLangText(q.description).toLowerCase();
    const path = String(q.path || "").toLowerCase();

    return (
      title.includes(trimmed) ||
      desc.includes(trimmed) ||
      path.includes(trimmed)
    );
  });
}

function updateResultCount(count) {
  const el = $("resultCount");
  if (el) el.textContent = String(count);
}

function renderQuizzes(quizzes) {
  const list = $("quizList");
  if (!list) return;

  clearElement(list);

  const activeQuizzes = sortQuizzes(quizzes).filter(q => q.status === "active");
  const filteredQuizzes = filterQuizzes(activeQuizzes, currentKeyword);

  updateResultCount(filteredQuizzes.length);

  if (!filteredQuizzes.length) {
    const emptyBox = document.createElement("div");
    emptyBox.className = "empty-box";
    emptyBox.textContent = hubText[currentLang].empty;
    list.appendChild(emptyBox);
    return;
  }

  filteredQuizzes.forEach((quiz, index) => {
    list.appendChild(createQuizCard(quiz, index));
  });
}

function renderError() {
  const list = $("quizList");
  if (!list) return;

  clearElement(list);

  const errorBox = document.createElement("div");
  errorBox.className = "error-box";
  errorBox.textContent = hubText[currentLang].loadError;
  list.appendChild(errorBox);

  updateResultCount(0);
}

async function loadQuizzes() {
  try {
    const res = await fetch("/quizzes.json", { cache: "no-store" });
    if (!res.ok) {
      throw new Error("HTTP " + res.status);
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      throw new Error("quizzes.json is not an array");
    }

    quizzesCache = data;
    renderQuizzes(quizzesCache);
  } catch (error) {
    console.error("Hub loadQuizzes error:", error);
    renderError();
  }
}

function initLanguageFromUrl() {
  const urlLang = new URLSearchParams(window.location.search).get("lang");
  const supported = ["zh-HK", "zh-CN", "en"];
  if (supported.includes(urlLang)) {
    currentLang = urlLang;
  }
}

function bindEvents() {
  const langSelect = $("langSelect");
  if (langSelect) {
    langSelect.addEventListener("change", function () {
      currentLang = this.value;
      updateLanguageInUrl(currentLang);
      updateHubLanguageUI();
      renderQuizzes(quizzesCache);
    });
  }

  const searchInput = $("hubSearch");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      currentKeyword = this.value || "";
      renderQuizzes(quizzesCache);
    });
  }
}

document.addEventListener("DOMContentLoaded", function () {
  initLanguageFromUrl();
  updateHubLanguageUI();
  bindEvents();
  loadQuizzes();
});
