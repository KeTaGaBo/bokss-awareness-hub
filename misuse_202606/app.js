
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

function copyQuizLink() {
  const url = getShareUrl();
  navigator.clipboard.writeText(url).then(() => {
    alert(getUIText("copied"));
  }).catch(() => {
    alert(url);
  });
}

function shareWhatsApp() {
  const url = getShareUrl();
  const text = `${getShareTitle()}\n${url}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(waUrl, "_blank", "noopener,noreferrer");
}

function shareFacebook() {
  const url = getShareUrl();
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  window.open(fbUrl, "_blank", "noopener,noreferrer");
}

function shareInstagram() {
  const url = getShareUrl();
  navigator.clipboard.writeText(url).then(() => {
    alert(currentLang === "en" ? "Link copied. You can paste it into Instagram." : "連結已複製，你可以到 Instagram 貼上分享。");
  }).catch(() => {
    alert(url);
  });
}

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
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawImageContain(ctx, img, x, y, boxW, boxH) {
  const ratio = Math.min(boxW / img.naturalWidth, boxH / img.naturalHeight);
  const drawW = img.naturalWidth * ratio;
  const drawH = img.naturalHeight * ratio;
  const drawX = x + (boxW - drawW) / 2;
  const drawY = y + (boxH - drawH) / 2;
  ctx.drawImage(img, drawX, drawY, drawW, drawH);
}

function truncateTextToWidth(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let result = text;
  while (result.length > 1 && ctx.measureText(result + "…").width > maxWidth) {
    result = result.slice(0, -1);
  }
  return result + "…";
}

function wrapTextByWords(ctx, text, maxWidth, maxLines = 4) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";

  for (let i = 0; i < words.length; i++) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = words[i];
      if (lines.length >= maxLines - 1) break;
    } else {
      line = testLine;
    }
  }
  if (line) lines.push(line);

  if (lines.length === maxLines) {
    lines[maxLines - 1] = truncateTextToWidth(ctx, lines[maxLines - 1], maxWidth);
  }
  return lines.slice(0, maxLines);
}

function wrapTextByChars(ctx, text, maxWidth, maxLines = 4) {
  const chars = Array.from(String(text));
  const lines = [];
  let line = "";

  for (let i = 0; i < chars.length; i++) {
    const testLine = line + chars[i];
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = chars[i];
      if (lines.length >= maxLines - 1) break;
    } else {
      line = testLine;
    }
  }
  if (line) lines.push(line);

  if (lines.length === maxLines) {
    lines[maxLines - 1] = truncateTextToWidth(ctx, lines[maxLines - 1], maxWidth);
  }
  return lines.slice(0, maxLines);
}

function drawWrappedLines(ctx, lines, x, y, lineHeight) {
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });
}

function pickTitleFont(ctx, title, maxWidth, isEnglish) {
  const candidates = isEnglish ? [64, 60, 56, 52, 48] : [66, 62, 58, 54, 50, 46];
  for (const size of candidates) {
    ctx.font = `bold ${size}px Arial`;
    const lines = isEnglish
      ? wrapTextByWords(ctx, title, maxWidth, 3)
      : wrapTextByChars(ctx, title, maxWidth, 3);

    const widest = Math.max(...lines.map(line => ctx.measureText(line).width));
    if (widest <= maxWidth && lines.length <= 3) {
      return { size, lines };
    }
  }

  const fallbackSize = candidates[candidates.length - 1];
  ctx.font = `bold ${fallbackSize}px Arial`;
  return {
    size: fallbackSize,
    lines: isEnglish
      ? wrapTextByWords(ctx, title, maxWidth, 3)
      : wrapTextByChars(ctx, title, maxWidth, 3)
  };
}

function getShortShareUrlForCard() {
  const url = new URL(getShareUrl());
  let shortText = url.host + url.pathname;
  if (url.searchParams.get("lang")) {
    shortText += `?lang=${url.searchParams.get("lang")}`;
  }
  return shortText;
}

async function generateShareCardBlob() {
  const levelKey = getLevelKey();
  const badgePath = getBadgeImagePath(levelKey);
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#fff8ec");
  grad.addColorStop(1, "#ffeed0");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255,213,79,0.22)";
  for (let y = 30; y < canvas.height; y += 32) {
    for (let x = 30; x < canvas.width; x += 32) {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = "#ffffff";
  drawRoundedRect(ctx, 54, 54, 972, 1242, 34);
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#1f1f1f";
  ctx.stroke();

  ctx.fillStyle = "#ffd54f";
  drawRoundedRect(ctx, 120, 104, 300, 72, 36);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#1f1f1f";
  ctx.stroke();

  ctx.fillStyle = "#1f1f1f";
  ctx.font = "bold 28px Arial";
  ctx.fillText(truncateTextToWidth(ctx, getUIText("badge"), 240), 150, 150);

  const title = getUIText("siteTitle");
  const isEnglish = currentLang === "en";
  const picked = pickTitleFont(ctx, title, 840, isEnglish);
  ctx.fillStyle = "#1f1f1f";
  ctx.font = `bold ${picked.size}px Arial`;
  drawWrappedLines(ctx, picked.lines, 120, 250, picked.size + 12);

  const badgeImg = new Image();
  badgeImg.src = badgePath;
  await waitImageLoaded(badgeImg);

  ctx.fillStyle = "#fffef8";
  drawRoundedRect(ctx, 110, 410, 290, 300, 28);
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#1f1f1f";
  ctx.stroke();
  drawImageContain(ctx, badgeImg, 140, 445, 230, 230);

  ctx.fillStyle = "#ffffff";
  drawRoundedRect(ctx, 430, 410, 520, 300, 28);
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#1f1f1f";
  ctx.stroke();

  ctx.fillStyle = "#1f1f1f";
  ctx.font = "bold 38px Arial";
  ctx.fillText(getUIText("scoreLabel"), 470, 470);

  const score = getScore();
  const total = quizData.questions.length;
  ctx.fillStyle = "#ff6b6b";
  ctx.font = "bold 88px Arial";
  ctx.fillText(String(score), 470, 580);
  ctx.fillStyle = "#1f1f1f";
  ctx.font = "bold 46px Arial";
  ctx.fillText(`/ ${total}`, 600, 577);

  const levelText = cleanLevelText(getLevelText(levelKey));
  ctx.fillStyle = "#fff7d0";
  drawRoundedRect(ctx, 465, 600, 430, 78, 39);
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#1f1f1f";
  ctx.stroke();
  ctx.fillStyle = "#1f1f1f";
  ctx.font = "bold 30px Arial";
  ctx.fillText(truncateTextToWidth(ctx, levelText, 360), 500, 648);

  ctx.fillStyle = "#ffffff";
  drawRoundedRect(ctx, 110, 760, 840, 310, 24);
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#1f1f1f";
  ctx.stroke();

  ctx.fillStyle = "#1f1f1f";
  ctx.font = "bold 34px Arial";
  ctx.fillText(getUIText("resultTitle"), 150, 825);
  ctx.font = "30px Arial";

  const message = getEncouragementMessage();
  const messageLines = isEnglish
    ? wrapTextByWords(ctx, message, 740, 5)
    : wrapTextByChars(ctx, message, 740, 5);
  drawWrappedLines(ctx, messageLines, 150, 885, 46);

  ctx.fillStyle = "#ffffff";
  drawRoundedRect(ctx, 110, 1130, 330, 64, 32);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#1f1f1f";
  ctx.stroke();

  ctx.fillStyle = "#1f1f1f";
  ctx.font = "bold 24px Arial";
  ctx.fillText(truncateTextToWidth(ctx, getUIText("footer"), 280), 140, 1171);

  drawRoundedRect(ctx, 470, 1130, 460, 64, 32);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#1f1f1f";
  ctx.stroke();

  ctx.fillStyle = "#1f1f1f";
  ctx.font = "20px Arial";
  ctx.fillText(truncateTextToWidth(ctx, getShortShareUrlForCard(), 390), 500, 1171);

  return await new Promise(resolve => canvas.toBlob(resolve, "image/png", 1.0));
}

async function downloadShareCard() {
  try {
    const blob = await generateShareCardBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quiz-share-card-${getLevelKey()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    console.error(error);
    alert(currentLang === "en" ? "Failed to generate share card image. Please try again later." : "未能生成成就卡圖片，請稍後再試。");
  }
}

async function systemShareCard() {
  try {
    const blob = await generateShareCardBlob();
    const file = new File([blob], `quiz-share-card-${getLevelKey()}.png`, { type: "image/png" });

    if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
      await navigator.share({
        files: [file],
        title: getShareTitle(),
        text: getShortResultSummary(getLevelKey())
      });
    } else {
      await downloadShareCard();
    }
  } catch (error) {
    console.error(error);
    await downloadShareCard();
  }
}

async function oneClickShare() {
  await systemShareCard();
}

function showFinalResult() {
  showingFinal = true;
  const card = document.getElementById("quizCard");
  card.classList.add("final-mode");
  window.scrollTo({ top: 0, behavior: "smooth" });

  const finalBox = document.getElementById("finalResult");
  const score = getScore();
  const total = quizData.questions.length;
  const levelKey = getLevelKey();
  const badgePath = getBadgeImagePath(levelKey);
  const levelText = cleanLevelText(getLevelText(levelKey));
  const shortSummary = getShortResultSummary(levelKey);

  finalBox.innerHTML = `
    <div class="final-enter">
      <div class="result-heading">🎉 ${getUIText("resultTitle")}</div>

      <div class="result-hero-simple">
        <div class="result-badge-core">
          <img src="${badgePath}" alt="${levelText}">
        </div>

        <div class="result-core-meta">
          <div class="result-score-inline">${getUIText("scoreLabel")}：<span class="score-number">${score}</span> / ${total}</div>

          <div class="result-level-pill">
            <img src="${badgePath}" alt="${levelText}">
            <span>${levelText}</span>
          </div>

          <div class="result-short-summary">${shortSummary}</div>
        </div>
      </div>

      <div class="result-cta">
        <button class="cta-btn cta-primary" onclick="oneClickShare()">📤 分享成就卡</button>
        <button class="cta-btn cta-secondary" onclick="restartQuiz()">🔄 ${getUIText("restart")}</button>
      </div>

      <div class="result-more">
        <details>
          <summary>▽ 查看詳細解說與其他方式</summary>
          <div class="result-detail-copy">${getEncouragementMessage()}</div>
          <div class="result-secondary-actions">
            <button class="secondary-btn share" onclick="oneClickShare()">📤 系統分享圖片</button>
            <button class="secondary-btn download" onclick="downloadShareCard()">🖼️ 下載成就卡</button>
            <button class="secondary-btn copy" onclick="copyQuizLink()">🔗 ${getUIText("copyLink")}</button>
          </div>
          <div class="result-helper-text">預設主按鈕會優先使用系統分享圖片；如果瀏覽器或裝置未支援，會自動改為下載成就卡。</div>
        </details>
      </div>
    </div>
  `;

  finalBox.className = "result info";
  finalBox.style.display = "block";
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

function refreshOptionSelectionUI(question, state) {
  const buttons = document.querySelectorAll("#answers .option-btn");

  buttons.forEach((btn, i) => {
    btn.classList.remove("option-selected");
    if (state.selected.includes(i)) {
      btn.classList.add("option-selected");
    }
  });

  if (question.type === "multiple" && !state.submitted) {
    document.getElementById("answerAction").style.display = "block";
    document.getElementById("checkBtn").disabled = state.selected.length === 0;
  }
}

function hideFinalResult() {
  const box = document.getElementById("finalResult");
  if (!box) return;

  box.className = "result";
  box.innerHTML = "";
  box.style.display = "none";
  showingFinal = false;
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

    if (state.selected.includes(i)) {
      classes.push("option-selected");
    }

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
