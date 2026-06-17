let quizData = null;
let currentLang = "zh-HK";
let current = 0;
let answersState = {};
let showingFinal = false;

const badgeImageMap = {
  perfect: "img/badge-perfect.png",
  pass70: "img/badge-pass70.png",
  below70: "img/badge-below70.png"
};

function getUIText(key) {
  return quizData.ui[currentLang][key];
}

function updateLanguageInUrl(lang) {
  const url = new URL(window.location);
  url.searchParams.set("lang", lang);
  window.history.replaceState({}, "", url);
}

function getQuestionState(questionId) {
  if (!answersState[questionId]) {
    answersState[questionId] = {
      selected: [],
      submitted: false
    };
  }
  return answersState[questionId];
}

function getCorrectIndexes(question) {
  const indexes = [];
  question.options.forEach((opt, i) => {
    if (opt.correct) indexes.push(i);
  });
  return indexes;
}

function isAnswerCorrect(question, selectedIndexes) {
  const correctIndexes = getCorrectIndexes(question);
  if (selectedIndexes.length !== correctIndexes.length) return false;

  const sortedSelected = [...selectedIndexes]
    .map(num => Number(num))
    .sort((x, y) => x - y);

  const sortedCorrect = [...correctIndexes]
    .map(num => Number(num))
    .sort((x, y) => x - y);

  return sortedSelected.every((value, index) => value === sortedCorrect[index]);
}

function getScore() {
  if (!quizData) return 0;
  let score = 0;

  quizData.questions.forEach(q => {
    const state = answersState[q.id];
    if (state && state.submitted && isAnswerCorrect(q, state.selected)) {
      score++;
    }
  });

  return score;
}

function getAnsweredCount() {
  return Object.values(answersState).filter(s => s && s.submitted).length;
}

function allAnswered() {
  return quizData && getAnsweredCount() === quizData.questions.length;
}

function getLevelKey() {
  const total = quizData.questions.length;
  const score = getScore();
  const ratio = score / total;

  if (score === total) return "perfect";
  if (ratio >= 0.7) return "pass70";
  return "below70";
}

function getEncouragementMessage() {
  return quizData.messages[getLevelKey()][currentLang];
}

function getShortResultSummary(levelKey) {
  const shortMap = {
    "zh-HK": {
      perfect: "你對資料安全界線有很清晰的掌握。",
      pass70: "你已掌握大部分重點，但仍有細節值得再留意。",
      below70: "你需要重新建立資料安全界線意識。"
    },
    "zh-CN": {
      perfect: "你对资料安全界线有很清晰的掌握。",
      pass70: "你已掌握大部分重点，但仍有细节值得再留意。",
      below70: "你需要重新建立资料安全界线意识。"
    },
    "en": {
      perfect: "You have a very clear grasp of data safety boundaries.",
      pass70: "You got most of the key ideas, but some details still need attention.",
      below70: "You need to rebuild your awareness of data safety boundaries."
    }
  };
  return shortMap[currentLang]?.[levelKey] || getEncouragementMessage();
}

function getBadgeImagePath(levelKey) {
  return badgeImageMap[levelKey] || badgeImageMap.pass70;
}

function getShareUrl() {
  return `${window.location.origin}${window.location.pathname}?lang=${currentLang}`;
}

function getShareTitle() {
  return getUIText("siteTitle");
}

function getLevelText(levelKey) {
  return getUIText("levels")[levelKey] || "";
}

function cleanLevelText(levelText) {
  return levelText.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "").trim();
}

function applyLanguageUI() {
  const ui = quizData.ui[currentLang];
  document.title = ui.siteTitle;
  document.documentElement.lang = currentLang;

  document.getElementById("badge").innerText = ui.badge;
  document.getElementById("siteTitle").innerText = ui.siteTitle;
  document.getElementById("heroSubtitle").innerText = ui.heroSubtitle;
  document.getElementById("intro").innerText = ui.intro;
  document.getElementById("nextBtn").innerText = ui.next;
  document.getElementById("footer").innerText = ui.footer;
  document.getElementById("langSelect").value = currentLang;
  document.getElementById("langLabel").innerText = ui.langLabel || "Language / 語言 / 语言";
  document.getElementById("checkBtn").innerText = ui.checkAnswer;
}

function updateSummary() {
  const score = getScore();
  document.getElementById("summary").innerHTML =
    `${getUIText("scoreLabel")}：${score} / ${quizData.questions.length}`;
}

function hideResult() {
  const box = document.getElementById("result");
  box.className = "result";
  box.innerHTML = "";
  box.style.display = "none";
}

function hideFinalResult() {
  const box = document.getElementById("finalResult");
  if (!box) return;

  box.className = "result";
  box.innerHTML = "";
  box.style.display = "none";
  showingFinal = false;
}

function triggerAnimation(el, className) {
  if (!el) return;
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
}

function showResult(question, selectedIndexes) {
  const resultBox = document.getElementById("result");
  const correct = isAnswerCorrect(question, selectedIndexes);

  resultBox.classList.remove("result-pop", "result-shake");

  const contentHtml = `
    ${correct ? getUIText("correctLabel") : getUIText("wrongLabel")}<br>
    ${question.explanation[currentLang]}
    <div class="reminder">${getUIText("reminderLabel")}：${question.reminder[currentLang]}</div>
  `;

  if (correct) {
    resultBox.className = "result correct";
    resultBox.innerHTML = contentHtml;
    resultBox.style.display = "block";
    triggerAnimation(resultBox, "result-pop");
  } else {
    resultBox.className = "result wrong";
    resultBox.innerHTML = contentHtml;
    resultBox.style.display = "block";
    triggerAnimation(resultBox, "result-shake");
  }
}

function copyQuizLink(showAlert = true) {
  const url = getShareUrl();
  return navigator.clipboard.writeText(url).then(() => {
    if (showAlert) {
      alert(getUIText("copied"));
    }
  }).catch(() => {
    alert(url);
  });
}

/* ------------------------------
   Share card PNG generation
------------------------------ */

function waitImageLoaded(img) {
  return new Promise((resolve, reject) => {
    if (img.complete && img.naturalWidth > 0) {
      resolve(img);
      return;
    }
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
