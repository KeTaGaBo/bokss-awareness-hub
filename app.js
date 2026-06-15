let quizData = null;
let currentLang = "zh-HK";
let current = 0;
let answersState = {};
let showingFinal = false;

// 🛡️ 強化版：取得翻譯文字，若 JSON 漏寫 key 則安全回傳空字串，防止程式崩潰
function getUIText(key) {
  if (!quizData || !quizData.ui || !quizData.ui[currentLang]) return "";
  return quizData.ui[currentLang][key] || "";
}

function updateLanguageInUrl(lang) {
  const url = new URL(window.location);
  url.searchParams.set("lang", lang);
  window.history.replaceState({}, "", url);
}

function getQuestionState(questionId) {
  if (!answersState[questionId]) {
    answersState[questionId] = { selected: [], submitted: false };
  }
  return answersState[questionId];
}

/* === 社群分享功能區 === */
function shareWhatsApp() {
  const url = window.location.origin + window.location.pathname + "?lang=" + currentLang;
  const text = `${getUIText("siteTitle")} \n${url}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
}

function shareFacebook() {
  const url = window.location.origin + window.location.pathname + "?lang=" + currentLang;
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
}

function shareInstagram() {
  const url = window.location.origin + window.location.pathname + "?lang=" + currentLang;
  navigator.clipboard.writeText(url).then(() => {
    const msg = document.getElementById("copyMsg");
    if (msg) {
      msg.innerText = getUIText("copied") || "Link Copied!";
      setTimeout(() => { msg.innerText = ""; }, 3000);
    } else {
      alert("Link Copied!");
    }
  });
}

function calculateScore() {
  let score = 0;
  if (!quizData || !quizData.questions) return 0;
  
  quizData.questions.forEach(q => {
    const state = answersState[q.id];
    if (!state) return;
    
    if (q.type === "single") {
      const correctIdx = q.options.findIndex(o => o.correct);
      if (state.selected.length === 1 && state.selected[0] === correctIdx) score += 10;
    } else if (q.type === "multiple") {
      const correctIndices = q.options.map((o, idx) => o.correct ? idx : null).filter(v => v !== null);
      const userSel = [...state.selected].sort((x, y) => x - y);
      const corrSel = [...correctIndices].sort((x, y) => x - y);
      if (userSel.length === corrSel.length && userSel.every((v, i) => v === corrSel[i])) score += 10;
    }
  });
  return score;
}

function applyLanguageUI() {
  const badgeEl = document.getElementById("badge");
  const langLabelEl = document.getElementById("langLabel");
  const siteTitleEl = document.getElementById("siteTitle");
  const heroSubtitleEl = document.getElementById("heroSubtitle");
  const introEl = document.getElementById("intro");

  if (badgeEl) badgeEl.innerText = getUIText("badge");
  if (langLabelEl) langLabelEl.innerText = getUIText("langLabel");
  if (siteTitleEl) siteTitleEl.innerText = getUIText("siteTitle");
  if (heroSubtitleEl) heroSubtitleEl.innerText = getUIText("heroSubtitle");
  if (introEl) introEl.innerText = getUIText("intro");
}

function renderQuestion() {
  applyLanguageUI();
  showingFinal = false;

  const questionArea = document.getElementById("questionArea");
  if (questionArea) questionArea.style.display = "block";

  if (!quizData || !quizData.questions || quizData.questions.length === 0) return;
  const question = quizData.questions[current];
  const state = getQuestionState(question.id);

  const metaEl = document.getElementById("meta");
  if (metaEl) {
    // 🛡️ 確保 replace 前字串存在
    let qLabel = getUIText("questionLabel") || "Question {current} / {total}";
    metaEl.innerText = String(qLabel).replace("{current}", current + 1).replace("{total}", quizData.questions.length);
  }

  const titleEl = document.getElementById("title");
  if (titleEl) titleEl.innerText = (question.title && question.title[currentLang]) ? question.title[currentLang] : "";

  const storyCard = document.getElementById("storyCard");
  if (question.presentation === "scenario" && question.story) {
    if (storyCard) storyCard.style.display = "block";
    const story = question.story[currentLang] || {};
    
    const storyLabelEl = document.getElementById("storyLabel");
    const storyTitleEl = document.getElementById("storyTitle");
    const storyContentEl = document.getElementById("storyContent");

    if (storyLabelEl) storyLabelEl.innerText = story.label || "";
    if (storyTitleEl) storyTitleEl.innerText = story.title || "";
    
    if (storyContentEl) {
      storyContentEl.innerHTML = "";
      if (story.dialogues) {
        story.dialogues.forEach(d => {
          const row = document.createElement("div");
          row.className = `dialogue-item ${d.side === "right" ? "right" : ""}`;
          row.innerHTML = `<div class="dialogue-avatar">${d.avatar || "👤"}</div><div class="dialogue-bubble"><strong>${d.speaker || "User"}:</strong> ${d.text || ""}</div>`;
          storyContentEl.appendChild(row);
        });
      }
    }
  } else {
    if (storyCard) storyCard.style.display = "none";
  }

  const questionEl = document.getElementById("question");
  if (questionEl) {
    let qText = "";
    if (question.type === "single") {
      qText = (question.question && question.question[currentLang]) ? question.question[currentLang] : (question.scenario && question.scenario[currentLang] ? question.scenario[currentLang] : "");
    } else {
      qText = (question.scenario && question.scenario[currentLang]) ? question.scenario[currentLang] : "";
    }
    questionEl.innerText = qText;
  }

  const questionTypeEl = document.getElementById("questionType");
  if (questionTypeEl) questionTypeEl.innerText = question.type === "single" ? getUIText("singleLabel") : getUIText("multipleLabel");

  const questionHintEl = document.getElementById("questionHint");
  if (questionHintEl) questionHintEl.innerText = question.type === "single" ? getUIText("singleHint") : getUIText("multipleHint");

  const answersContainer = document.getElementById("answers");
  if (answersContainer) {
    answersContainer.innerHTML = "";
    if (question.options) {
      question.options.forEach((opt, idx) => {
        const div = document.createElement("div");
        div.className = `option ${state.selected.includes(idx) ? "selected" : ""}`;
        const iconClass = question.type === "single" ? "radio-box" : "checkbox-box";
        const optText = (opt.text && opt.text[currentLang]) ? opt.text[currentLang] : "";
        
        div.innerHTML = `<div class="${iconClass}"></div><div class="option-text">${optText}</div>`;

        if (!state.submitted) {
          div.onclick = () => {
            if (question.type === "single") {
              state.selected = [idx];
            } else {
              if (state.selected.includes(idx)) {
                state.selected = state.selected.filter(i => i !== idx);
              } else {
                state.selected.push(idx);
              }
            }
            renderQuestion();
          };
        }
        answersContainer.appendChild(div);
      });
    }
  }

  const answerAction = document.getElementById("answerAction");
  const checkBtn = document.getElementById("checkBtn");
  const resultDiv = document.getElementById("result");

  if (!state.submitted) {
    if (answerAction) answerAction.style.display = "block";
    if (checkBtn) checkBtn.innerText = getUIText("checkAnswer");
    if (resultDiv) resultDiv.style.display = "none";
  } else {
    if (answerAction) answerAction.style.display = "none";
    if (resultDiv) {
      resultDiv.style.display = "block";
      
      let isCorrect = false;
      if (question.type === "single") {
        isCorrect = question.options[state.selected[0]]?.correct === true;
      } else {
        const correctIndices = question.options.map((o, idx) => o.correct ? idx : null).filter(v => v !== null);
        const userSel = [...state.selected].sort((x, y) => x - y);
        const corrSel = [...correctIndices].sort((x, y) => x - y);
        isCorrect = userSel.length === corrSel.length && userSel.every((v, i) => v === corrSel[i]);
      }

      // 🛡️ 安全讀取詳解與提醒，避免出現 "undefined"
      const expText = (question.explanation && question.explanation[currentLang]) ? question.explanation[currentLang] : "";
      const remText = (question.reminder && question.reminder[currentLang]) ? question.reminder[currentLang] : "";

      resultDiv.className = `result ${isCorrect ? "correct" : "wrong"}`;
      resultDiv.innerHTML = `
        <div class="result-status">${isCorrect ? getUIText("correctLabel") : getUIText("wrongLabel")}</div>
        <div>${expText}</div>
        <div class="reminder-box">
          <strong>${getUIText("reminderLabel")}:</strong> ${remText}
        </div>
      `;
    }
  }

  const nextBtn = document.getElementById("nextBtn");
  if (nextBtn) {
    nextBtn.innerText = (current === quizData.questions.length - 1) ? getUIText("finish") : getUIText("next");
  }
}

function checkCurrentAnswer() {
  const question = quizData.questions[current];
  const state = getQuestionState(question.id);

  if (state.selected.length === 0) {
    alert(getUIText("selectAtLeastOne") || "Please select an answer.");
    return;
  }
  state.submitted = true;
  renderQuestion();
}

function showFinalResult() {
  showingFinal = true;
  applyLanguageUI();

  const total = quizData.questions.length * 10;
  const score = calculateScore();

  let levelKey = "below70";
  if (score === total) {
    levelKey = "perfect";
  } else if (score >= 70) {
    levelKey = "pass70";
  }

  // 🛡️ 終極強化：相容不同的 JSON 結構（不管 levels 是寫在 ui 裡面還是外層）
  let levelText = "Rank";
  if (quizData.levels && quizData.levels[levelKey] && quizData.levels[levelKey][currentLang]) {
    levelText = quizData.levels[levelKey][currentLang];
  } else if (quizData.ui && quizData.ui[currentLang] && quizData.ui[currentLang].levels) {
    levelText = quizData.ui[currentLang].levels[levelKey] || "Rank";
  }

  let msgText = "Great job!";
  if (quizData.messages && quizData.messages[levelKey] && quizData.messages[levelKey][currentLang]) {
    msgText = quizData.messages[levelKey][currentLang];
  }

  const certBadgeTop = document.getElementById("certBadgeTop");
  const certSiteTitle = document.getElementById("certSiteTitle");
  const certScoreLabel = document.getElementById("certScoreLabel");
  const certScoreVal = document.getElementById("certScoreVal");
  const certLevelLabel = document.getElementById("certLevelLabel");
  const certLevelName = document.getElementById("certLevelName");
  const certMsgVal = document.getElementById("certMsgVal");
  const certQrTip = document.getElementById("certQrTip");
  const certQuizName = document.getElementById("certQuizName");
  const certMotto = document.getElementById("certMotto");

  if (certBadgeTop) certBadgeTop.innerText = getUIText("badge");
  if (certSiteTitle) certSiteTitle.innerText = getUIText("siteTitle");
  if (certScoreLabel) certScoreLabel.innerText = getUIText("scoreLabel") + ":";
  if (certScoreVal) certScoreVal.innerText = `${score} / ${total}`;
  if (certLevelLabel) certLevelLabel.innerText = getUIText("levelLabel") + ":";
  
  if (certLevelName) {
    // 🛡️ 強制轉型為字串，確保 .replace 絕對不會報錯
    const cleanLevelName = String(levelText).replace(/[\u2000-\u3300\ud83c\ud83d\ud83e]/g, '').trim();
    certLevelName.innerText = cleanLevelName;
  }
  
  if (certMsgVal) certMsgVal.innerText = msgText;
  if (certQrTip) certQrTip.innerText = "Scan to play or verify results online.";
  if (certQuizName) certQuizName.innerText = "Data Protection Compliance System";
  if (certMotto) certMotto.innerText = getUIText("footer");

  const certBadgeImg = document.getElementById("certBadgeImg");
  if (certBadgeImg) certBadgeImg.src = `badge-${levelKey}.png`;

  const questionArea = document.getElementById("questionArea");
  if (questionArea) {
    questionArea.innerHTML = `
      <div class="final-score-title">${getUIText("resultTitle")}</div>
      <div class="final-rank">${levelText}</div>
      <div class="intro">${msgText}</div>
      
      <div class="controls" style="padding:0; margin-top:16px;">
        <div style="font-size:20px; font-weight:bold; margin-bottom:8px;">
          ${getUIText("scoreLabel")}: <span style="color:var(--red); font-size:26px;">${score}</span> / ${total}
        </div>
      </div>

      <div class="share-zone">
        <button class="share-btn" onclick="shareWhatsApp()">WhatsApp</button>
        <button class="share-btn" onclick="shareFacebook()">Facebook</button>
        <button class="share-btn" onclick="shareInstagram()">${getUIText("copyLink")}</button>
        <span id="copyMsg" style="margin-left:8px; font-weight:bold; color:var(--green); align-self:center;"></span>
      </div>

      <div class="screenshot-area">
        <p id="screenshotStatusTip" style="margin:0 0 10px 0; font-weight:bold; font-size:14px; color:#555;">
          🖼️ 正在即時繪製您的個人合規成就卡片...
        </p>
        <div id="screenshotSpinner" style="font-weight:bold; color:var(--purple);">Generating Achievement Card...</div>
        <div id="imageContainer"></div>
      </div>
    `;
  }

  const nextBtn = document.getElementById("nextBtn");
  if (nextBtn) nextBtn.innerText = getUIText("restartQuiz");

  setTimeout(() => {
    const target = document.getElementById("hiddenCardCapture");
    if (!target) return;

    html2canvas(target, {
      useCORS: true,
      scale: 2,
      backgroundColor: null
    }).then(canvas => {
      const imgData = canvas.toDataURL("image/png");
      const img = document.createElement("img");
      img.src = imgData;
      img.className = "screenshot-img";
      
      const container = document.getElementById("imageContainer");
      const spinner = document.getElementById("screenshotSpinner");
      const statusTip = document.getElementById("screenshotStatusTip");

      if (container) {
        container.innerHTML = ""; 
        container.appendChild(img);
      }
      if (spinner) spinner.style.display = "none";
      if (statusTip) statusTip.innerText = "📸 成就卡片生成完畢！長按或點選右鍵即可儲存圖片：";
    }).catch(err => {
      console.error("Canvas drawing failed:", err);
      const spinner = document.getElementById("screenshotSpinner");
      if (spinner) spinner.innerText = "❌ 無法自動生成卡片圖片，請手動進行螢幕截圖。";
    });
  }, 600);
}

function restartQuiz() {
  current = 0;
  answersState = {};
  showingFinal = false;
  window.location.reload(); 
}

function handleNext() {
  if (showingFinal) {
    restartQuiz();
    return;
  }

  if (!quizData || !quizData.questions) return;
  const question = quizData.questions[current];
  const state = getQuestionState(question.id);

  if (!state.submitted) {
    checkCurrentAnswer();
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

    const langSelect = document.getElementById("langSelect");
    if (langSelect) langSelect.value = currentLang;
    
    renderQuestion();
  } catch (error) {
    document.body.innerHTML = `
      <div class="card">
        <div class="result wrong" style="display:block;">
          ❌ Failed to load quiz configurations.<br><br>
          <small>${error.message}</small>
        </div>
      </div>`;
    console.error(error);
  }
}

const langSelectEl = document.getElementById("langSelect");
if (langSelectEl) {
  langSelectEl.addEventListener("change", function () {
    currentLang = this.value; 
    updateLanguageInUrl(currentLang);

    if (showingFinal) {
      showFinalResult(); 
    } else {
      renderQuestion(); 
    }
  });
}

const nextBtnEl = document.getElementById("nextBtn");
if (nextBtnEl) {
  nextBtnEl.addEventListener("click", handleNext);
}

window.onload = loadQuestions;
