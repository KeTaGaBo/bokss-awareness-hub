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

function getShareInviteText() {
  const levelKey = getLevelKey();
  const levelText = cleanLevelText(getLevelText(levelKey));
  const score = getScore();
  const total = AppState.quizData.questions.length;

  const templates = {
    "zh-HK": {
      perfect: `我在這個資料安全大考驗拿到「${levelText}」(${score}/${total})！你也來挑戰一下，看看自己能不能拿滿分！`,
      pass70: `我剛完成這個資料安全小測，結果是「${levelText}」(${score}/${total})。你也來試試，看你能拿到哪個級別！`,
      below70: `我剛做完這個資料安全小測，原來有些細節比想像中更容易忽略。你也來試試，看自己屬於哪一級！`
    },
    "zh-CN": {
      perfect: `我在这个资料安全大考验拿到「${levelText}」(${score}/${total})！你也来挑战一下，看看自己能不能拿满分！`,
      pass70: `我刚完成这个资料安全小测，结果是「${levelText}」(${score}/${total})。你也来试试，看你能拿到哪个级别！`,
      below70: `我刚做完这个资料安全小测，原来有些细节比想象中更容易忽略。你也来试试，看自己属于哪一级！`
    },
    "en": {
      perfect: `I got "${levelText}" (${score}/${total}) in this data safety challenge! Come and see if you can get a perfect score too!`,
      pass70: `I just completed this data safety quiz and got "${levelText}" (${score}/${total}). Give it a try and see which level you can reach!`,
      below70: `I just tried this data safety quiz and found that some details are easier to overlook than expected. Give it a try and see which level you get!`
    }
  };

  return templates[AppState.currentLang]?.[levelKey] || templates["zh-HK"][levelKey];
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
  const candidates = isEnglish ? [62, 58, 54, 50, 46] : [64, 60, 56, 52, 48, 44];
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

function loadQrImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const qrImg = new Image();
    qrImg.crossOrigin = "anonymous";
    qrImg.onload = () => resolve(qrImg);
    qrImg.onerror = reject;

    // 使用外部 QR 服務；若失敗，稍後會 fallback 回 URL 文字框
    qrImg.src = `https://quickchart.io/qr?text=${encodeURIComponent(dataUrl)}&size=220`;
  });
}

async function generateShareCardBlob() {
  const levelKey = getLevelKey();
  const badgePath = getBadgeImagePath(levelKey);
  const levelText = cleanLevelText(getLevelText(levelKey));
  const shortSummary = getShortResultSummary(levelKey);
  const urlText = getShareUrl();

  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");

  // background
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#fff8ec");
  grad.addColorStop(1, "#ffeed0");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // comic dots
  ctx.fillStyle = "rgba(255,213,79,0.22)";
  for (let y = 30; y < canvas.height; y += 32) {
    for (let x = 30; x < canvas.width; x += 32) {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // main board
  ctx.fillStyle = "#ffffff";
  drawRoundedRect(ctx, 54, 54, 972, 1242, 34);
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#1f1f1f";
  ctx.stroke();

  // top yellow tag
  ctx.font = "bold 28px Arial";
  const topTagText = getUIText("badge");
  const tagTextWidth = Math.min(ctx.measureText(topTagText).width, 420);
  const tagWidth = Math.max(240, Math.min(tagTextWidth + 64, 500));

  ctx.fillStyle = "#ffd54f";
  drawRoundedRect(ctx, 120, 104, tagWidth, 72, 36);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#1f1f1f";
  ctx.stroke();

  ctx.fillStyle = "#1f1f1f";
  ctx.font = "bold 28px Arial";
  ctx.fillText(
    truncateTextToWidth(ctx, topTagText, tagWidth - 52),
    150,
    149
  );

  // title
  const title = getUIText("siteTitle");
  const isEnglish = AppState.currentLang === "en";
  const picked = pickTitleFont(ctx, title, 840, isEnglish);

  ctx.fillStyle = "#1f1f1f";
  ctx.font = `bold ${picked.size}px Arial`;
  drawWrappedLines(ctx, picked.lines, 120, 255, picked.size + 12);

  // badge image
  const badgeImg = new Image();
  badgeImg.src = badgePath;
  await waitImageLoaded(badgeImg);

  ctx.fillStyle = "#fffef8";
  drawRoundedRect(ctx, 110, 420, 290, 300, 28);
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#1f1f1f";
  ctx.stroke();
  drawImageContain(ctx, badgeImg, 140, 450, 230, 230);

  // score box
  ctx.fillStyle = "#ffffff";
  drawRoundedRect(ctx, 430, 420, 520, 300, 28);
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#1f1f1f";
  ctx.stroke();

  ctx.fillStyle = "#1f1f1f";
  ctx.font = "bold 38px Arial";
  ctx.fillText(getUIText("scoreLabel"), 470, 480);

  const score = getScore();
  const total = AppState.quizData.questions.length;

  ctx.fillStyle = "#ff6b6b";
  ctx.font = "bold 88px Arial";
  ctx.fillText(String(score), 470, 590);

  ctx.fillStyle = "#1f1f1f";
  ctx.font = "bold 46px Arial";
  ctx.fillText(`/ ${total}`, 600, 587);

  // level pill
  ctx.fillStyle = "#fff7d0";
  drawRoundedRect(ctx, 465, 610, 430, 78, 39);
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#1f1f1f";
  ctx.stroke();

  ctx.fillStyle = "#1f1f1f";
  ctx.font = "bold 30px Arial";
  ctx.fillText(truncateTextToWidth(ctx, levelText, 360), 500, 658);

  // result box
  ctx.fillStyle = "#ffffff";
  drawRoundedRect(ctx, 110, 780, 840, 260, 24);
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#1f1f1f";
  ctx.stroke();

  ctx.fillStyle = "#1f1f1f";
  ctx.font = "bold 34px Arial";
  ctx.fillText(getUIText("resultTitle"), 150, 845);

  ctx.font = "30px Arial";
  const summaryLines = isEnglish
    ? wrapTextByWords(ctx, shortSummary, 740, 4)
    : wrapTextByChars(ctx, shortSummary, 740, 4);
  drawWrappedLines(ctx, summaryLines, 150, 910, 46);

  // QR 區塊（優先）
  let qrLoaded = false;

  try {
    const qrImg = await loadQrImage(urlText);

    ctx.fillStyle = "#ffffff";
    drawRoundedRect(ctx, 110, 1080, 840, 150, 24);
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#1f1f1f";
    ctx.stroke();

    ctx.fillStyle = "#1f1f1f";
    ctx.font = "bold 26px Arial";
    ctx.fillText(
      AppState.currentLang === "en" ? "Scan to try" : "掃描 QR Code 立即參與",
      145,
      1135
    );

    drawImageContain(ctx, qrImg, 700, 1094, 220, 120);

    ctx.font = "20px Arial";
    const qrHint =
      AppState.currentLang === "en"
        ? "Open the quiz instantly"
        : "打開網頁立即參與";
    ctx.fillText(qrHint, 145, 1188);

    qrLoaded = true;
  } catch (error) {
    console.warn("QR image load failed, fallback to URL box.", error);
  }

  // fallback：若 QR 載入失敗，退回 URL 文字框
  if (!qrLoaded) {
    ctx.fillStyle = "#ffffff";
    drawRoundedRect(ctx, 110, 1100, 840, 120, 24);
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#1f1f1f";
    ctx.stroke();

    ctx.fillStyle = "#1f1f1f";
    ctx.font = "bold 22px Arial";
    ctx.fillText("URL", 145, 1140);

    ctx.font = "20px Arial";
    const urlLines = wrapTextByWords(ctx, urlText, 760, 3);
    drawWrappedLines(ctx, urlLines, 145, 1180, 28);
  }

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
    alert(AppState.currentLang === "en" ? "Failed to generate share card image." : "未能生成成就卡圖片。");
  }
}

async function shareImageAndUrl() {
  const url = getShareUrl();
  const title = getShareTitle();
  const text = getShareInviteText();

  try {
    const blob = await generateShareCardBlob();
    const file = new File([blob], `quiz-share-card-${getLevelKey()}.png`, { type: "image/png" });

    if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
      await navigator.share({
        files: [file],
        title,
        text: `${text}\n${url}`
      });
      return;
    }

    await downloadShareCard();
    await copyQuizLink(false);
    alert(
      AppState.currentLang === "en"
        ? "Image downloaded and link copied."
        : "已下載成就卡圖片，並已複製連結。"
    );
  } catch (error) {
    console.error(error);
    try {
      await downloadShareCard();
      await copyQuizLink(false);
      alert(
        AppState.currentLang === "en"
          ? "Image downloaded and link copied."
          : "已下載成就卡圖片，並已複製連結。"
      );
    } catch {
      alert(url);
    }
  }
}

function hideFinalResult() {
  const box = document.getElementById("finalResult");
  if (!box) return;
  box.className = "result";
  box.innerHTML = "";
  box.style.display = "none";
  AppState.showingFinal = false;
}

function showFinalResult() {
  AppState.showingFinal = true;
  const card = document.getElementById("quizCard");
  card.classList.add("final-mode");
  window.scrollTo({ top: 0, behavior: "smooth" });

  const finalBox = document.getElementById("finalResult");
  const score = getScore();
  const total = AppState.quizData.questions.length;
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
        <button class="cta-btn cta-primary" onclick="shareImageAndUrl()">📤 分享圖片 + 連結</button>
        <button class="cta-btn cta-secondary" onclick="restartQuiz()">🔄 ${getUIText("restart")}</button>
      </div>

      <div class="result-more">
        <details>
          <summary>▽ 查看詳細解說與其他方式</summary>
          <div class="result-detail-copy">${getEncouragementMessage()}</div>
          <div class="result-secondary-actions">
            <button class="secondary-btn share" onclick="shareImageAndUrl()">📤 系統分享圖片 + 連結</button>
            <button class="secondary-btn download" onclick="downloadShareCard()">🖼️ 只下載成就卡</button>
            <button class="secondary-btn copy" onclick="copyQuizLink()">🔗 ${getUIText("copyLink")}</button>
          </div>
          <div class="result-helper-text">主按鈕會優先使用系統分享圖片並附上網址；若裝置不支援，會自動下載圖片並複製網址。</div>
        </details>
      </div>
    </div>
  `;

  finalBox.className = "result info";
  finalBox.style.display = "block";
}
