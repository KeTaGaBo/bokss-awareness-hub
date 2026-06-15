let quizData = null;
let currentLang = "zh-HK";
let current = 0;
let answersState = {};
let showingFinal = false;

// 取得當前語言的 UI 翻譯文字
function getUIText(key) {
  if (!quizData || !quizData.ui || !quizData.ui[currentLang]) return "";
  return quizData.ui[currentLang][key] || "";
}

// 將目前的語系參數同步寫入 URL 地址欄，維持瀏覽狀態
function updateLanguageInUrl(lang) {
  const url = new URL(window.location);
  url.searchParams.set("lang", lang);
  window.history.replaceState({}, "", url);
}

// 取得或初始化指定題目的答題狀態
function getQuestionState(questionId) {
  if (!answersState[questionId]) {
    answersState[questionId] = {
      selected: [],
      submitted: false
    };
  }
  return answersState[questionId];
}

/* === 社群分享功能區 === */
function shareWhatsApp() {
  const url = window.location.origin + window.location.pathname + "?lang=" + currentLang;
  const text = `${getUIText("siteTitle")} \n${url}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(waUrl, "_blank");
}

function shareFacebook() {
  const url = window.location.origin + window.location.pathname + "?lang=" + currentLang;
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  window.open(fbUrl, "_blank");
}

function shareInstagram() {
  const url = window.location.origin + window.location.pathname + "?lang=" + currentLang;
  navigator.clipboard.writeText(url).then(() => {
    const msg = document.getElementById("copyMsg");
    if (msg) {
      msg.innerText = getUIText("copied");
      setTimeout(() => { msg.innerText = ""; }, 3000);
    } else {
      alert(getUIText("copied"));
    }
  });
}

/* === 分數計算邏輯 === */
function calculateScore() {
  let score = 0;
  if (!quizData || !quizData.questions) return 0;
  
  quizData.questions.forEach(q => {
    const state = answersState[q.id];
    if (!state) return;
    
    if (q.type === "single") {
      const correctIdx = q.options.findIndex(o => o.correct);
      if (state.selected.length === 1 && state.selected[0] === correctIdx) {
        score += 10;
      }
    } else if (q.type === "multiple") {
      const correctIndices = q.options.map((o, idx) => o.correct ? idx : null).filter(v => v !== null);
      const userSel = [...state.selected].sort((x, y) => x - y);
      const corrSel = [...correctIndices].sort((x, y) => x - y);
      
      if (userSel.length === corrSel.length && userSel.every((v, i) => v === corrSel[i])) {
        score += 10;
      }
    }
  });
  return score;
}

/* === 實時刷新主頁面靜態 UI 元件的語言 === */
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

/* === 渲染核心測驗題目畫面 === */
function renderQuestion() {
  applyLanguageUI();
  showingFinal = false;

  const questionArea = document.getElementById("questionArea");
  if (questionArea) questionArea.style.display = "block";

  if (!quizData || !quizData.questions || quizData.questions.length === 0) return;
  const question = quizData.questions[current];
  const state = getQuestionState(question.id);

  // 設置題號進度 (例如: 第 1 題 / 共 5 題)
  const metaEl = document.getElementById("meta");
  if (metaEl) {
    metaEl.innerText = getUIText("questionLabel")
      .replace("{current}", current + 1)
      .replace("{total}", quizData.questions.length);
  }

  // 設定題目大標題
  const titleEl = document.getElementById("title");
  if (titleEl) titleEl.innerText = question.title[currentLang] || "";

  // 處理情境對話框 (Scenario Presentation)
  const storyCard = document.getElementById("storyCard");
  if (question.presentation === "scenario" && question.story) {
    if (storyCard) storyCard.style.display = "block";
    const story = question.story[currentLang];
    
    const storyLabelEl = document.getElementById("storyLabel");
    const storyTitleEl = document.getElementById("storyTitle");
    const storyContentEl = document.getElementById("storyContent");

    if (storyLabelEl) storyLabelEl.innerText = story.label || "";
    if (storyTitleEl) storyTitleEl.innerText = story.title || "";
    
    if (storyContentEl) {
      storyContentEl.innerHTML = "";
      story.dialogues.forEach(d => {
        const row = document.createElement("div");
        row.className = `dialogue-item ${d.side === "right" ? "right" : ""}`;
        row.innerHTML = `
          <div class="dialogue-avatar">${d.avatar}</div>
          <div class="dialogue-bubble">
            <strong>${d.speaker}:</strong> ${d.text}
          </div>
        `;
        storyContentEl.appendChild(row);
      });
    }
  } else {
    if (storyCard) storyCard.style.display = "none";
  }

  // 設定題目主要內文、題型標籤與點選提示
  const questionEl = document.getElementById("question");
  if (questionEl) {
    questionEl.innerText = question.type === "single" 
      ? (question.question ? question.question[currentLang] : question.scenario[currentLang])
      : (question.scenario ? question.scenario[currentLang] : "");
  }

  const questionTypeEl = document.getElementById("questionType");
  if (questionTypeEl) {
    questionTypeEl.innerText = question.type === "single" 
      ? getUIText("singleLabel") 
      : getUIText("multipleLabel");
  }

  const questionHintEl = document.getElementById("questionHint");
  if (questionHintEl) {
    questionHintEl.innerText = question.type === "single" 
      ? getUIText("singleHint") 
      : getUIText("multipleHint");
  }

  // 渲染選項按鈕
  const answersContainer = document.getElementById("answers");
  if (answersContainer) {
    answersContainer.innerHTML = "";
    question.options.forEach((opt, idx) => {
      const div = document.createElement("div");
      div.className = `option ${state.selected.includes(idx) ? "selected" : ""}`;
      
      const iconClass = question.type === "single" ? "radio-box" : "checkbox-box";
      div.innerHTML = `
        <div class="${iconClass}"></div>
        <div class="option-text">${opt.text[currentLang]}</div>
      `;

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

  // 處理下方「提交答案」按鈕與「正確/錯誤批改詳解」的顯示邏輯
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

      resultDiv.className = `result ${isCorrect ? "correct" : "wrong"}`;
      resultDiv.innerHTML = `
        <div class="result-status">${isCorrect ? getUIText("correctLabel") : getUIText("wrongLabel")}</div>
        <div>${question.explanation[currentLang]}</div>
        <div class="reminder-box">
          <strong>${getUIText("reminderLabel")}:</strong> ${question.reminder[currentLang]}
        </div>
      `;
    }
  }

  // 修改「下一步」或「完成測驗」的導覽按鈕文字
  const nextBtn = document.getElementById("nextBtn");
  if (nextBtn) {
    if (current === quizData.questions.length - 1) {
      nextBtn.innerText = getUIText("finish");
    } else {
      nextBtn.innerText = getUIText("next");
    }
  }
}

// 當使用者點擊「提交答案」時的驗證邏測
function checkCurrentAnswer() {
  const question = quizData.questions[current];
  const state = getQuestionState(question.id);

  if (state.selected.length === 0) {
    alert(getUIText("selectAtLeastOne"));
    return;
  }

  state.submitted = true;
  renderQuestion();
}

/* === 核心修正：結算結果頁與多語言卡片生成 === */
function showFinalResult() {
  showingFinal = true;
  applyLanguageUI();

  const total = quizData.questions.length * 10;
  const score = calculateScore();

  // 根據分數比對對應的等級 ID 
  let levelKey = "below70";
  if (score === total) {
    levelKey = "perfect";
  } else if (score >= 70) {
    levelKey = "pass70";
  }

  const levelText = getUIText("levels")[levelKey] || "";
  const msgText = quizData.messages[levelKey][currentLang] || "";

  // 🎯 完美同步：將隱藏卡片模板（#hiddenCardCapture）內的所有元件全面替換為當前所選語言
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
  
  // 乾淨清除稱號字串中的 Emoji，避免部分網頁環境字體渲染破碎
  if (certLevelName) {
    const cleanLevelName = levelText.replace(/[\u2000-\u3300\ud83c\ud83d\ud83e]/g, '').trim();
    certLevelName.innerText = cleanLevelName;
  }
  
  if (certMsgVal) certMsgVal.innerText = msgText;
  if (certQrTip) certQrTip.innerText = "Scan to play or verify results online.";
  if (certQuizName) certQuizName.innerText = "Data Protection Compliance System";
  if (certMotto) certMotto.innerText = getUIText("footer");

  // 🎯 核心圖片聯動：載入對應等級的專屬 PNG 勳章檔名到卡片模板
  const certBadgeImg = document.getElementById("certBadgeImg");
  if (certBadgeImg) {
    certBadgeImg.src = `badge-${levelKey}.png`;
  }

  // 渲染前端主畫面的結果頁面板
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

  // 變更主導覽按鈕為「再試一次」文字
  const nextBtn = document.getElementById("nextBtn");
  if (nextBtn) nextBtn.innerText = getUIText("restartQuiz");

  // 使用 setTimeout 確保圖片 DOM 完全生成並渲染完畢後，再調用 html2canvas 擷取高清圖形
  setTimeout(() => {
    const target = document.getElementById("hiddenCardCapture");
    if (!target) return;

    html2canvas(target, {
      useCORS: true,
      scale: 2, // 提升渲染放大率，確保手機或視網膜螢幕上字體清晰不模糊
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
        container.innerHTML = ""; // 清除舊圖
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

// 重新開始測驗
function restartQuiz() {
  current = 0;
  answersState = {};
  showingFinal = false;
  window.location.reload(); // 清除所有暫存狀態，完整重新載入
}

// 控制點擊主導覽按鈕時的切換狀態機
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

// 異步讀取 JSON 設定檔與初始化
async function loadQuestions() {
  try {
    const response = await fetch("questions.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    quizData = await response.json();

    // 解析 URL 中的語系參數 (例如: ?lang=en)
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

/* === 核心修正：監聽語言下拉選單切換事件 === */
const langSelectEl = document.getElementById("langSelect");
if (langSelectEl) {
  langSelectEl.addEventListener("change", function () {
    currentLang = this.value; // 更新當前系統全域語言變數
    updateLanguageInUrl(currentLang); // 同步改寫瀏覽器網址列參數

    // 關鍵修復：依據使用者目前停留在「答題中」還是「最終結果頁」，即時重新驅動渲染流程
    if (showingFinal) {
      showFinalResult(); // 重新整理隱藏卡片各語系標籤並重繪畫布
    } else {
      renderQuestion(); // 重新編排當前題目的翻譯文字與選項
    }
  });
}

// 註冊「下一步」按鈕的點擊監聽器
const nextBtnEl = document.getElementById("nextBtn");
if (nextBtnEl) {
  nextBtnEl.addEventListener("click", handleNext);
}

// 初始化加載
window.onload = loadQuestions;
