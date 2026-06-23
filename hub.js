/* HUB_SPLIT_20260623_v1 */

const hubText = {
  "zh-HK": {
    badge: "BOKSS Awareness Hub",
    subtitle: "資安與私隱學習目錄",
    title: "請選擇一個測驗開始",
    intro: "這裡集合了不同主題的資安及私隱教育測驗。你可按需要選擇合適的測驗開始，並持續留意最新更新。",
    highlight: "🎯 精選互動測驗 · 即開即玩",
    sectionTitle: "📚 測驗目錄",
    footerSub: "Awareness Hub · 資安及私隱教育",
    start: "開始測驗",
    updated: "更新至",
    active: "進行中",
    empty: "目前尚未有可顯示的測驗。",
    loading: "載入中...",
    loadError: "未能載入測驗目錄。"
  },
  "zh-CN": {
    badge: "BOKSS Awareness Hub",
    subtitle: "信息安全与隐私学习目录",
    title: "请选择一个测验开始",
    intro: "这里集合了不同主题的信息安全与隐私教育测验。你可按需要选择合适的测验开始，并持续留意最新更新。",
    highlight: "🎯 精选互动测验 · 即开即玩",
    sectionTitle: "📚 测验目录",
    footerSub: "Awareness Hub · 信息安全与隐私教育",
    start: "开始测验",
    updated: "更新至",
    active: "进行中",
    empty: "目前尚未有可显示的测验。",
    loading: "加载中...",
    loadError: "未能加载测验目录。"
  },
  "en": {
    badge: "BOKSS Awareness Hub",
    subtitle: "Cybersecurity & Privacy Learning Directory",
    title: "Choose a quiz to begin",
    intro: "This hub brings together different cybersecurity and privacy awareness quizzes. Pick a quiz to start and keep an eye on the latest updates.",
    highlight: "🎯 Featured interactive quizzes · Start instantly",
    sectionTitle: "📚 Quiz Directory",
    footerSub: "Awareness Hub · Cybersecurity & Privacy Education",
    start: "Start Quiz",
    updated: "Updated",
    active: "Active",
    empty: "No quizzes are available at the moment.",
    loading: "Loading...",
    loadError: "Unable to load quiz directory."
  }
};

let currentLang = "zh-HK";
let quizzesCache = [];

function updateLanguageInUrl(lang) {
  const url = new URL(window.location.href);
  url.searchParams.set("lang", lang);
  window.history.replaceState({}, "", url.toString());
}

function getLangText(obj) {
  if (!obj || typeof obj !== "object") {
    return "";
  }
  return obj[currentLang] || obj["zh-HK"] || obj["en"] || "";
}

function formatYearMonth(lastModified) {
  if (!lastModified) return "";

  if (typeof lastModified === "string") {
    return lastModified.slice(0, 7);
  }

  if (typeof lastModified === "object") {
    if (lastModified.display) {
      return String(lastModified.display).slice(0, 7);
    }
    if (lastModified.iso) {
      return String(lastModified.iso).slice(0, 7);
    }
  }

  return "";
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function updateHubLanguageUI() {
  const t = hubText[currentLang];
  document.documentElement.lang = currentLang;
  document.title = t.badge;

  setText("hubBadge", t.badge);
  setText("hubSubtitle", t.subtitle);
  setText("hubTitle", t.title);
  setText("hubIntro", t.intro);
  setText("hubHighlight", t.highlight);
  setText("sectionTitle", t.sectionTitle);
  setText("hubFooterSub", t.footerSub);

  const langSelect = document.getElementById("langSelect");
  if (langSelect) {
    langSelect.value = currentLang;
  }

  const loadingBox = document.getElementById("loadingBox");
  if (loadingBox) {
    loadingBox.textContent = t.loading;
  }
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

function createQuizCard(q) {
  const t = hubText[currentLang];
  const title = getLangText(q.title);
  const desc = getLangText(q.description);
  const lastModified = formatYearMonth(q.lastModified);
  const targetUrl = q.path + "?lang=" + encodeURIComponent(currentLang);

  const card = document.createElement("div");
  card.className = "quiz-card";

  const status = document.createElement("div");
  status.className = "quiz-status";
  status.textContent = t.active;
  card.appendChild(status);

  const titleLink = document.createElement("a");
  titleLink.className = "quiz-title-link";
  titleLink.href = targetUrl;

  const titleDiv = document.createElement("div");
  titleDiv.className = "quiz-title";
  titleDiv.textContent = title;

  titleLink.appendChild(titleDiv);
  card.appendChild(titleLink);

  const descDiv = document.createElement("div");
  descDiv.className = "quiz-desc";
  descDiv.textContent = desc;
  card.appendChild(descDiv);

  const metaDiv = document.createElement("div");
  metaDiv.className = "quiz-meta";
  metaDiv.textContent = t.updated + "：" + (lastModified || "-");
  card.appendChild(metaDiv);

  const actions = document.createElement("div");
  actions.className = "quiz-actions";

  const startBtn = document.createElement("a");
  startBtn.className = "start-btn";
  startBtn.href = targetUrl;

  const icon = document.createElement("span");
  icon.className = "open-icon";
  icon.textContent = "🚀";

  const btnText = document.createElement("span");
  btnText.textContent = t.start;

  startBtn.appendChild(icon);
  startBtn.appendChild(btnText);

  const quizUrl = document.createElement("div");
  quizUrl.className = "quiz-url";
  quizUrl.textContent = q.path;

  actions.appendChild(startBtn);
  actions.appendChild(quizUrl);

  card.appendChild(actions);

  return card;
}

function renderQuizzes(quizzes) {
  const list = document.getElementById("quizList");
  const t = hubText[currentLang];

  if (!list) return;

  clearElement(list);

  const activeQuizzes = sortQuizzes(quizzes).filter(q => q.status === "active");

  if (!activeQuizzes.length) {
    const emptyBox = document.createElement("div");
    emptyBox.className = "empty-box";
    emptyBox.textContent = t.empty;
    list.appendChild(emptyBox);
    return;
  }

  activeQuizzes.forEach(q => {
    list.appendChild(createQuizCard(q));
  });
}

function renderError() {
  const list = document.getElementById("quizList");
  if (!list) return;

  clearElement(list);

  const errorBox = document.createElement("div");
  errorBox.className = "error-box";
  errorBox.textContent = hubText[currentLang].loadError;
  list.appendChild(errorBox);
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
  const langSelect = document.getElementById("langSelect");
  if (!langSelect) return;

  langSelect.addEventListener("change", function () {
    currentLang = this.value;
    updateLanguageInUrl(currentLang);
    updateHubLanguageUI();

    if (quizzesCache.length) {
      renderQuizzes(quizzesCache);
    } else {
      loadQuizzes();
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  initLanguageFromUrl();
  updateHubLanguageUI();
  bindEvents();
  loadQuizzes();
});
