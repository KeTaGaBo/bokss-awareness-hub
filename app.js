let quizData = null;
let currentLang = "zh-HK";
let current = 0;
let answersState = {};
let showingFinal = false;
let qrCodeInstance = null; // 用來儲存 QR Code 物件

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

/* 一鍵生成圖片大引擎 */
function generateCertificateImage() {
  const score = getScore();
  const total = quizData.questions.length;
  const levelKey = getLevelKey();
  
  // 1. 同步資料到隱藏的 HTML 繪圖模板
  document.getElementById("certSiteTitle").innerText = getUIText("siteTitle");
  document.getElementById("certScoreLabel").innerText = getUIText("scoreLabel");
  document.getElementById("certScoreVal").innerText = `${score} / ${total}`;
  document.getElementById("certMsgVal").innerText = getEncouragementMessage();
  
  const levelText = getUIText("levels")[levelKey] || "";
  const parts = levelText.trim().split(" ");
  document.getElementById("certLevelIcon").innerText = parts[0] || "🏅";
  document.getElementById("certLevelText").innerText = getUIText("levelLabel") + "：" + (parts.slice(1).join(" ") || levelText);

  // 2. 在模板中動態繪製現有網址的 QR Code，讓別人掃描就能挑戰
  const qrContainer = document.getElementById("certQrCode");
  qrContainer.innerHTML = "";
  const currentUrl = window.location.origin + window.location.pathname + "?lang=" + currentLang;
  new QRCode(qrContainer, {
    text: currentUrl,
    width: 90,
    height: 90,
    correctLevel: QRCode.CorrectLevel.H
  });

  // 3. 等待 QR Code 渲染完畢後，呼叫 html2canvas 將 DOM 轉換為畫布
  setTimeout(() => {
    const element = document.getElementById("certificateCaptureTemplate").firstElementChild;
    
    html2canvas(element, {
      scale: 2, // 提升圖片清晰度，發社群不模糊
      useCORS: true,
      backgroundColor: "#ffffff"
    }).then(canvas => {
      const imgData = canvas.toDataURL("image/png");
      
      // 4. 判斷是否為 iOS / iPhone 行動裝置
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
      if (isIOS) {
        // iPhone 開放彈出預覽層，讓使用者長按圖片儲存
        const container = document.getElementById("previewImageContainer");
        container.innerHTML = `<img src="${imgData}" alt="Certificate">`;
        document.getElementById("imagePreviewModal").style.display = "flex";
      } else {
        // 電腦、Android 直接自動化下載圖片
        const link = document.createElement("a");
        link.download = `quiz-result-${score}pts.png`;
        link.href = imgData;
        link.click();
        
        // 同時也複製連結方便雙重分享
        navigator.clipboard.writeText(currentUrl);
        const msg = document.getElementById("copyMsg");
        if (msg) {
          msg.classList.add("show");
          setTimeout(() => { msg.classList.remove("show"); }, 2000);
        }
      }
    });
  }, 150);
}

function closePreviewModal() {
  document.getElementById("imagePreviewModal").style.display = "none";
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
  
  const sortedSelected = [...selectedIndexes].map(num => Number(num)).sort((x, y) => x - y);
  const sortedCorrect = [...correctIndexes].map(num => Number(num)).sort((x, y) => x - y);
  
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
  document.getElementById("summary").innerHTML = `${getUIText("scoreLabel")}：${score} / ${quizData.questions.length}`;
}

function hideResult() {
  const box = document.getElementById("result");
  box.className = "result";
  box.innerHTML = "";
  box.style.display = "none";
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

function buildLevelBadge(levelKey) {
  const levelText = getUIText("levels")[levelKey] || "";
  const parts = levelText.trim().split(" ");
  const icon = parts[0] || "🏅";
  const text = parts.slice(1).join(" ") || levelText;

  return `
    <div class="level-badge">
      <span class="level-icon">${icon}</span>
      <span class="level-text">${getUIText("levelLabel")}：${text}</span>
    </div>
  `;
}

/* 即時變更選項的 UI 反應，確保底色與邊框同步連動 */
function refreshOptionSelectionUI(question, state) {
  const buttons = document.querySelectorAll("#answers .option-btn");
  buttons.forEach((btn, i) => {
    if (state.selected.includes(i)) {
      btn.classList.add("option-selected");
    } else {
      btn.classList.remove("option-selected");
    }
  });

  if (question.type === "multiple" && !state.submitted) {
    document.getElementById("answerAction").style.display = "block";
    document.getElementById("checkBtn").disabled = state.selected.length === 0;
  }
}

function showFinalResult() {
  showingFinal = true;
  const card = document.getElementById("quizCard");
  card.classList.add("final-mode");

  const finalBox = document.getElementById("finalResult");
  const score = getScore();
  const total = quizData.questions.length;
  const levelKey = getLevelKey();

  let finalHtml = `
    <div class="final-enter">
      <h3 style="margin-top:0; font-size:24px;">🎉 ${getUIText("resultTitle")}</h3>
      <p style="font-size:18px; font-weight:bold;">
        ${getUIText("scoreLabel")}：<span style="color:var(--red); font-size:24px;">${score}</span> / ${total}
      </p>
      ${buildLevelBadge(levelKey)}
      <p class="intro" style="margin-top:14px; background:#fff; padding:12px; border-radius:8px; border:2px solid var(--ink);">
        ${getEncouragementMessage()}
      </p>
      
      <div class="share-box" style="text-align:left;">
        <div class="share-title">📸 生成你的榮譽成就卡</div>
        <div class="share-text">我們已為您優化分享功能。點選下方按鈕即可「一鍵生成專屬證書圖片」，自由發布至 Instagram、WhatsApp、Facebook 等各大社群平台！</div>
        <div class="share-actions">
          <button class="share-btn" style="background:linear-gradient(135deg, #ffd54f, #ff6b6b); color:#1f1f1f; width:100%; font-size:16px; padding:14px;" onclick="generateCertificateImage()">
            ✨ 一鍵生成/下載成就卡圖片
          </button>
        </div>
        <div class="copy-msg" id="copyMsg">📋 測驗連結已同時複製到剪貼簿！</div>
      </div>
    </div>
  `;

  finalBox.innerHTML = finalHtml;
  finalBox.className = "result info";
  finalBox.style.display = "block";

  const nextBtn = document.getElementById("nextBtn");
  nextBtn.innerText = getUIText("restart");
  nextBtn.classList.remove("cta-glow");
}

function hideFinalResult() {
  const box = document.getElementById("finalResult");
  if (!box) return;
  box.className = "result";
  box.innerHTML = "";
  box.style.display = "none";
  showingFinal = false;
}

function getOptionLetter(index) {
  const alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
  return alphabet[index] || `${index + 1}`;
}

function renderPresentation(question) {
  const storyCard = document.getElementById("storyCard");
  const questionBox = document.getElementById("question");

  if (question.presentation === "scenario" && question.story && question.story[currentLang]) {
    const story = question.story[currentLang];
    document.getElementById("storyLabel").innerText = story.label || getUIText("scenarioLabelDefault");
    document.getElementById("storyTitle").innerText = story.title || "";

    const storyContentBox = document.getElementById("storyContent");
    storyContentBox.innerHTML = "";

    if (Array.isArray(story.dialogues)) {
      story.dialogues.forEach((item, idx) => {
        const wrap = document.createElement("div");
        wrap.className = `dialogue-wrap ${item.side === "right" ? "right" : "left"}`;
        wrap.style.animationDelay = `${idx * 0.08}s`;

        const avatar = document.createElement("div");
        avatar.className = "avatar";
        avatar.textContent = item.avatar || "🙂";

        const bubble = document.createElement("div");
        bubble.className = "bubble";

        const speaker = document.createElement("div");
        speaker.className = "speaker";
        speaker.textContent = item.speaker || "";

        const text = document.createElement("div");
        text.className = "bubble-text";
        text.textContent = item.text || "";

        bubble.appendChild(speaker);
        bubble.appendChild(text);
        wrap.appendChild(avatar);
        wrap.appendChild(bubble);
        storyContentBox.appendChild(wrap);
      });
    } else if (Array.isArray(story.content)) {
      story.content.forEach(line => {
        const div = document.createElement("div");
        div.className = "bubble-text";
        div.textContent = line;
        storyContentBox.appendChild(div);
      });
    }
    storyCard.style.display = "block";
    questionBox.innerHTML = question.question[currentLang];
  } else {
    storyCard.style.display = "none";
    questionBox.innerHTML = question.scenario[currentLang];
  }
}

function animateQuestionArea() {
  const area = document.getElementById("questionArea");
  if (!area) return;
  area.classList.remove("content-anim");
  void area.offsetWidth;
  area.classList.add("content-anim");
}

function renderQuestion() {
  const question = quizData.questions[current];
  if (!question) return;

  document.getElementById("quizCard").classList.remove("final-mode");
  hideFinalResult();
  applyLanguageUI();

  const state = getQuestionState(question.id);
  const alreadySubmitted = state.submitted;

  const questionLabel = getUIText("questionLabel")
    .replace("{current}", current + 1)
    .replace("{total}", quizData.questions.length);

  document.getElementById("meta").innerHTML = `${questionLabel} ・ ${question.category[currentLang]}`;
  document.getElementById("title").innerHTML = question.title[currentLang];

  renderPresentation(question);

  document.getElementById("questionType").innerHTML =
    question.type === "multiple" ? getUIText("multipleLabel") : getUIText("singleLabel");

  document.getElementById("questionHint").innerHTML =
    question.type === "multiple" ? getUIText("multipleHint") : getUIText("singleHint");

  let html = "";
  const correctIndexes = getCorrectIndexes(question);

  question.options.forEach((opt, i) => {
    let classes = ["option-btn"];
    if (state.selected.includes(i)) classes.push("option-selected");

    if (alreadySubmitted) {
      if (correctIndexes.includes(i)) {
        classes.push("option-correct");
      } else if (state.selected.includes(i) && !correctIndexes.includes(i)) {
        classes.push("option-wrong");
      }
    }

    html += `
      <button class="${classes.join(" ")}" onclick="selectOption(${i})" ${alreadySubmitted ? "disabled" : ""}>
        <span class="option-letter">${getOptionLetter(i)}.</span>
        <span>${opt.text[currentLang]}</span>
      </button>
    `;
  });

  document.getElementById("answers").innerHTML = html;

  if (question.type === "multiple" && !alreadySubmitted) {
    document.getElementById("answerAction").style.display = "block";
    document.getElementById("checkBtn").disabled = state.selected.length === 0;
  } else {
    document.getElementById("answerAction").style.display = "none";
  }

  if (alreadySubmitted) {
    showResult(question, state.selected);
  } else {
    hideResult();
  }

  updateSummary();
  const nextBtn = document.getElementById("nextBtn");
  nextBtn.classList.remove("cta-glow");

  if (allAnswered() && current === quizData.questions.length - 1 && alreadySubmitted) {
    nextBtn.innerText = getUIText("finish");
    nextBtn.classList.add("cta-glow");
  } else {
    nextBtn.innerText = getUIText("next");
  }

  animateQuestionArea();
}

function selectOption(index) {
  const question = quizData.questions[current];
  const state = getQuestionState(question.id);
  if (state.submitted) return;

  if (question.type === "single") {
    state.selected = [index];
    state.submitted = true;
    renderQuestion();
    return;
  }

  if (question.type === "multiple") {
    if (state.selected.includes(index)) {
      state.selected = state.selected.filter(i => i !== index);
    } else {
      state.selected.push(index);
    }
    refreshOptionSelectionUI(question, state);
  }
}

function submitMultipleAnswer() {
  const question = quizData.questions[current];
  const state = getQuestionState(question.id);
  if (question.type !== "multiple") return;
  if (state.selected.length === 0) {
    alert(getUIText("selectAtLeastOne"));
    return;
  }
  state.submitted = true;
  renderQuestion();
}

function restartQuiz() {
  answersState = {};
  current = 0;
  showingFinal = false;
  document.getElementById("quizCard").classList.remove("final-mode");
  document.getElementById("nextBtn").classList.remove("cta-glow");
  renderQuestion();
}

function nextQuestion() {
  if (!quizData) return;
  if (showingFinal) {
    restartQuiz();
    return;
  }

  const question = quizData.questions[current];
  const state = getQuestionState(question.id);

  if (!state.submitted) {
    alert(getUIText("answerBeforeNext"));
    return;
  }

  if (current === quizData.questions.length - 1) {
    showFinalResult();
    return;
  }

  current++;
  renderQuestion();
}

async function loadQuestions() {
  try {
    const response = await fetch("questions.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    quizData = await response.json();

    const urlLang = new URLSearchParams(window.location.search).get("lang");
    const supported = ["zh-HK", "zh-CN", "en"];
    if (supported.includes(urlLang)) {
      currentLang = urlLang;
    }

    renderQuestion();
  } catch (error) {
    document.body.innerHTML = `
      <div class="card">
        <div class="result wrong" style="display:block;">
          ❌ Failed to load quiz<br><br>
          <small>${error.message}</small>
        </div>
      </div>`;
    console.error(error);
  }
}

document.getElementById("langSelect").addEventListener("change", function () {
  currentLang = this.value;
  updateLanguageInUrl(currentLang);

  if (showingFinal) {
    applyLanguageUI();
    showFinalResult();
  } else {
    renderQuestion();
  }
});

document.getElementById("checkBtn").addEventListener("click", submitMultipleAnswer);
document.getElementById("nextBtn").addEventListener("click", nextQuestion);

loadQuestions();
