let currentLanguage = 'zh'; // 預設語言為繁體中文
let currentStyle = 'normal'; // 預設總結風格為標準摘要
let summarizing = false; // 標記是否正在進行總結

document.addEventListener('DOMContentLoaded', function () {
  // 獲取 DOM 元素
  const languageSelect = document.getElementById('language-select');
  const styleSelect = document.getElementById('style-select'); // 新增
  const summarizeBtn = document.getElementById('summarize-btn');
  const copyBtn = document.getElementById('copy-btn');
  const clearSummaryBtn = document.getElementById('clear-summary-btn'); // 新增
  const messageDiv = document.getElementById('message');
  const summaryDiv = document.getElementById('summary');
  const apiKeyInput = document.getElementById('api-key');
  const apiKeyHint = document.getElementById('api-key-hint');
  const saveApiKeyBtn = document.getElementById('save-api-key');
  const loadingDiv = document.getElementById('loading');
  const loadingText = document.getElementById('loading-text');

  // 歷史紀錄相關 DOM
  const historyBtn = document.getElementById('history-btn');
  const historyPanel = document.getElementById('history-panel');
  const historyList = document.getElementById('history-list');
  const closeHistoryBtn = document.getElementById('close-history');
  const historyTitle = document.getElementById('history-title');

  // 統計相關 DOM
  const statsDiv = document.getElementById('stats');
  const statsText = document.getElementById('stats-text');

  let rawSummary = ''; // 儲存原始 Markdown 文本

  // 顯示版本號
  const versionNumber = document.getElementById('version-number');
  if (versionNumber) {
    versionNumber.textContent = chrome.runtime.getManifest().version;
  }

  // 載入之前的狀態
  chrome.storage.local.get(['language', 'summary', 'apiKey', 'style', 'pendingSelection', 'pendingTitle'], function (result) {
    if (result.language) {
      currentLanguage = result.language; // 設定當前語言
      languageSelect.value = currentLanguage; // 更新語言選擇器的值
    }
    if (result.style) {
      currentStyle = result.style; // 設定當前風格
      styleSelect.value = currentStyle; // 更新風格選擇器的值
    }

    // 如果有背景選取的內容，優先處理
    if (result.pendingSelection) {
      const selectedText = result.pendingSelection;
      const selectedTitle = result.pendingTitle || "選取內容總結";
      // 清除 pending，避免下次開啟又是同一個
      chrome.storage.local.remove(['pendingSelection', 'pendingTitle']);
      // 自動觸發總結
      summarize(selectedText, selectedTitle);
    } else if (result.summary) {
      rawSummary = result.summary;
      summaryDiv.innerHTML = marked.parse(rawSummary); // 顯示之前的總結（渲染後）
    }

    if (result.apiKey) {
      apiKeyInput.value = result.apiKey; // 顯示之前保存的 groq API Key
      updateApiKeyHint(result.apiKey);
    }
    updateLanguage(); // 更新語言相關的 UI 文本
  });

  // 更新 API Key 提示（最後三碼）
  function updateApiKeyHint(val) {
    if (val && val.length > 3) {
      apiKeyHint.textContent = '...' + val.slice(-3);
    } else {
      apiKeyHint.textContent = '';
    }
  }

  // API Key 輸入監聽
  apiKeyInput.addEventListener('input', function () {
    updateApiKeyHint(this.value);
  });

  // 語言選擇器變更事件
  languageSelect.addEventListener('change', function () {
    currentLanguage = this.value; // 更新當前語言
    chrome.storage.local.set({ language: currentLanguage }); // 保存語言設定
    updateLanguage(); // 更新語言相關的 UI 文本
  });

  // 風格選擇器變更事件
  styleSelect.addEventListener('change', function () {
    currentStyle = this.value; // 更新當前風格
    chrome.storage.local.set({ style: currentStyle }); // 保存風格設定
    updateLanguage(); // 更新相關 UI (如果需要)
  });

  // 總結按鈕點擊事件
  summarizeBtn.addEventListener('click', summarize);

  // 清除按鈕點擊事件
  clearSummaryBtn.addEventListener('click', function () {
    rawSummary = '';
    summaryDiv.innerHTML = ''; // 清空總結區域
    chrome.storage.local.remove('summary'); // 移除保存的總結
  });

  // 複製按鈕點擊事件
  copyBtn.addEventListener('click', function () {
    if (rawSummary) {
      navigator.clipboard.writeText(rawSummary).then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = currentLanguage === 'zh' ? '已複製' : 'Copied';
        setTimeout(() => {
          copyBtn.textContent = originalText;
        }, 2000);
      });
    }
  });

  // 歷史紀錄按鈕點擊事件
  historyBtn.addEventListener('click', function () {
    historyPanel.classList.toggle('hidden');
    if (!historyPanel.classList.contains('hidden')) {
      renderHistory();
    }
  });

  // 關閉歷史紀錄
  closeHistoryBtn.addEventListener('click', function () {
    historyPanel.classList.add('hidden');
  });

  // 保存 groq API Key 按鈕點擊事件
  saveApiKeyBtn.addEventListener('click', function () {
    const apiKey = apiKeyInput.value.trim(); // 獲取並修剪 groq API Key
    if (apiKey) {
      chrome.storage.local.set({ apiKey: apiKey }); // 保存 groq API Key
      alert(currentLanguage === 'zh' ? 'groq API Key 已保存' : 'groq API Key saved'); // 顯示保存成功訊息
    }
  });

  // 更新語言相關的 UI 文本
  function updateLanguage() {
    if (currentLanguage === 'zh') {
      summarizeBtn.textContent = '總結'; // 更新總結按鈕文本
      copyBtn.textContent = '複製'; // 更新複製按鈕文本
      historyBtn.textContent = '歷史'; // 更新歷史按鈕文本
      clearSummaryBtn.textContent = '清除'; // 更新清除按鈕文本
      messageDiv.textContent = '請點擊"總結"按鈕開始總結當前頁面內容。'; // 更新提示訊息
      loadingText.textContent = '正在思考...';
      historyTitle.textContent = '最近總結';
      // 更新風格選單文本
      styleSelect.options[0].text = '標準摘要';
      styleSelect.options[1].text = '簡明模式';
      styleSelect.options[2].text = '深度解析';
    } else {
      summarizeBtn.textContent = 'Summarize'; // 更新總結按鈕文本
      copyBtn.textContent = 'Copy'; // 更新複製按鈕文本
      historyBtn.textContent = 'History'; // 更新歷史按鈕文本
      clearSummaryBtn.textContent = 'Clear'; // 更新清除按鈕文本
      messageDiv.textContent = 'Please click the "Summarize" button to start summarizing the current page content.'; // 更新提示訊息
      loadingText.textContent = 'Thinking...';
      historyTitle.textContent = 'Recent Summaries';
      // 更新風格選單文本
      styleSelect.options[0].text = 'Normal';
      styleSelect.options[1].text = 'Concise';
      styleSelect.options[2].text = 'Detailed';
    }
  }

  // 總結功能 (支援傳入特定內容)
  async function summarize(forcedContent = null, forcedTitle = null) {
    if (summarizing) return; // 如果正在總結，則返回
    summarizing = true; // 標記為正在總結
    summarizeBtn.disabled = true; // 禁用總結按鈕
    summaryDiv.innerHTML = ''; // 清空之前的總結
    statsDiv.classList.add('hidden'); // 隱藏統計
    rawSummary = ''; // 重置原始文本

    try {
      let pageContent = "";
      let tabTitle = "";
      let tabUrl = "";

      if (forcedContent) {
        pageContent = forcedContent;
        tabTitle = forcedTitle || "選取內容";
        tabUrl = ""; // 選取內容可能無 URL 或不重要
      } else {
        // 獲取當前活動標籤頁
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        tabTitle = tab.title;
        tabUrl = tab.url;

        // 確認內容腳本已加載
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['readability.js', 'content.js']
        });

        // 向內容腳本發送訊息以獲取頁面內容
        const pageContentResponse = await chrome.tabs.sendMessage(tab.id, { action: "getPageContent" });
        pageContent = pageContentResponse.content;
      }

      // 獲取保存的 groq API Key
      const apiKey = await new Promise((resolve) => {
        chrome.storage.local.get('apiKey', function (result) {
          resolve(result.apiKey);
        });
      });

      if (!apiKey) {
        alert(currentLanguage === 'zh' ? '請先設置 groq API Key' : 'Please set the groq API Key first'); // 提示設置 groq API Key
        summarizing = false; // 重置總結狀態
        summarizeBtn.disabled = false; // 啟用總結按鈕
        return;
      }

      // 根據語言與風格生成提示文本
      let prompt = '';
      if (currentLanguage === 'zh') {
        prompt = `請用繁體中文總結以下內容：\n\n`;
        if (currentStyle === 'concise') {
          prompt += `請以「簡明模式」總結，只提供 3 個核心重點（使用 bullet points）。\n\n`;
        } else if (currentStyle === 'detailed') {
          prompt += `請以「深度解析」模式總結，包含詳細的背景、核心觀點、具體細節與結論，並使用適當的標題。\n\n`;
        } else {
          prompt += `請以「標準摘要」模式總結，提供整體的概要與重要細節。\n\n`;
        }
      } else {
        prompt = `Please summarize the following content in English:\n\n`;
        if (currentStyle === 'concise') {
          prompt += `Use "Concise Mode", providing only 3 core key points (using bullet points).\n\n`;
        } else if (currentStyle === 'detailed') {
          prompt += `Use "Detailed Mode", including detailed background, core arguments, specific details, and conclusion, categorized with clear headings.\n\n`;
        } else {
          prompt += `Use "Normal Mode", providing a general overview and important details.\n\n`;
        }
      }
      prompt += pageContent;

      // 向 API 發送請求以獲取總結
      const apiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [{ role: "user", content: prompt }],
          stream: true
        })
      });

      const reader = apiResponse.body.getReader();
      const decoder = new TextDecoder("utf-8");
      loadingDiv.classList.remove('hidden'); // 顯示載入動畫

      // 逐行讀取 API 響應
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        const parsedLines = lines
          .map(line => line.replace(/^data: /, '').trim())
          .filter(line => line !== '' && line !== '[DONE]')
          .map(line => {
            try { return JSON.parse(line); } catch (e) { return null; }
          })
          .filter(line => line !== null);

        // 更新總結區域的內容
        for (const parsedLine of parsedLines) {
          const { choices } = parsedLine;
          const { delta } = choices[0];
          const { content } = delta;
          if (content) {
            loadingDiv.classList.add('hidden'); // 開始收到內容後，隱藏載入動畫
            rawSummary += content;
            summaryDiv.innerHTML = marked.parse(rawSummary);
          }
        }
      }

      // 保存總結結果
      chrome.storage.local.set({ summary: rawSummary });

      // 計算並顯示統計資訊
      const originalText = String(pageContent || "");
      const originalLen = originalText.length;
      const summaryLen = rawSummary.length;

      if (originalLen > 0) {
        if (summaryLen > originalLen) {
          // 內容反而變多了
          if (currentLanguage === 'zh') {
            statsText.textContent = `📝 內容擴展了 (原 ${originalLen} → 現 ${summaryLen} 字)`;
          } else {
            statsText.textContent = `📝 Content expanded (${originalLen} → ${summaryLen} chars)`;
          }
        } else {
          const savedPercent = Math.round(((originalLen - summaryLen) / originalLen) * 100);
          if (currentLanguage === 'zh') {
            statsText.textContent = `⚡️ 節省了 ${savedPercent}% 的閱讀量 (${originalLen} → ${summaryLen} 字)`;
          } else {
            statsText.textContent = `⚡️ Saved ${savedPercent}% of reading (${originalLen} → ${summaryLen} chars)`;
          }
        }
        statsDiv.classList.remove('hidden');
      }

      // 儲存到歷史紀錄
      saveToHistory(rawSummary, tabTitle, tabUrl);
    } catch (error) {
      console.error('Error:', error);
      summaryDiv.textContent = currentLanguage === 'zh' ? '總結時發生錯誤' : 'An error occurred during summarization'; // 顯示錯誤訊息
    } finally {
      summarizing = false; // 重置總結狀態
      summarizeBtn.disabled = false; // 啟用總結按鈕
      loadingDiv.classList.add('hidden'); // 確保隱藏載入動畫
    }
  }

  // 儲存到歷史紀錄 (最多 10 筆)
  function saveToHistory(summary, title, url) {
    chrome.storage.local.get(['history'], function (result) {
      let history = result.history || [];
      const newEntry = {
        summary: summary,
        title: title,
        url: url,
        date: new Date().toLocaleString(),
        timestamp: Date.now()
      };
      // 避免重複儲存相同的內容 (以內容或是 URL/標題組合判斷)
      history = history.filter(item => item.summary !== summary);
      history.unshift(newEntry);
      if (history.length > 10) {
        history.pop();
      }
      chrome.storage.local.set({ history: history });
    });
  }

  // 渲染歷史紀錄清單
  function renderHistory() {
    chrome.storage.local.get(['history'], function (result) {
      const history = result.history || [];
      historyList.innerHTML = '';
      if (history.length === 0) {
        historyList.innerHTML = `<div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">${currentLanguage === 'zh' ? '尚無歷史紀錄' : 'No history yet'}</div>`;
        return;
      }

      history.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'history-item';
        itemDiv.innerHTML = `
          <div class="history-item-title">${item.title}</div>
          <div class="history-item-meta">
            <span>${item.date}</span>
          </div>
        `;
        itemDiv.addEventListener('click', () => {
          rawSummary = item.summary;
          summaryDiv.innerHTML = marked.parse(rawSummary);
          historyPanel.classList.add('hidden');
          // 保存為當前總結，方便重新整理後還在
          chrome.storage.local.set({ summary: rawSummary });
        });
        historyList.appendChild(itemDiv);
      });
    });
  }
});