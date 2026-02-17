let currentLanguage = 'zh'; // 預設語言為繁體中文
let currentStyle = 'normal'; // 預設總結風格為標準摘要
let currentModel = 'openai/gpt-oss-20b'; // 預設模型
let summarizing = false; // 標記是否正在進行總結

document.addEventListener('DOMContentLoaded', function () {
  // 獲取 DOM 元素
  const languageSelect = document.getElementById('language-select');
  const styleSelect = document.getElementById('style-select');
  const modelSelect = document.getElementById('model-select'); // 新增
  const summarizeBtn = document.getElementById('summarize-btn');
  const copyBtn = document.getElementById('copy-btn');
  const ttsBtn = document.getElementById('tts-btn'); // 新增 TTS 按鈕
  const historyBtn = document.getElementById('history-btn');
  const clearSummaryBtn = document.getElementById('clear-summary-btn'); // 新增
  const messageDiv = document.getElementById('message');
  const summaryDiv = document.getElementById('summary');
  const apiKeyInput = document.getElementById('api-key');
  const apiKeyHint = document.getElementById('api-key-hint');
  const saveApiKeyBtn = document.getElementById('save-api-key');
  const loadingDiv = document.getElementById('loading');
  const loadingText = document.getElementById('loading-text');

  // 歷史紀錄相關 DOM
  const historyPanel = document.getElementById('history-panel');
  const historyList = document.getElementById('history-list');
  const closeHistoryBtn = document.getElementById('close-history');
  const historyTitle = document.getElementById('history-title');
  const exportHistoryBtn = document.getElementById('export-history');
  const clearHistoryBtn = document.getElementById('clear-history');

  // 統計相關 DOM
  const statsDiv = document.getElementById('stats');
  const statsText = document.getElementById('stats-text');

  // 主題切換相關 DOM
  const themeToggle = document.getElementById('theme-toggle');
  const textColorPicker = document.getElementById('text-color-picker');
  const bgColorPicker = document.getElementById('bg-color-picker');

  let rawSummary = ''; // 儲存原始 Markdown 文本

  // 顯示版本號
  const versionNumber = document.getElementById('version-number');
  if (versionNumber) {
    versionNumber.textContent = chrome.runtime.getManifest().version;
  }

  // 載入之前的狀態
  chrome.storage.local.get(['language', 'summary', 'apiKey', 'style', 'pendingSelection', 'pendingTitle', 'theme', 'model', 'textColor', 'customBgColor'], function (result) {
    // 處理字體顏色
    if (result.textColor) {
      document.documentElement.style.setProperty('--text-color', result.textColor);
      textColorPicker.value = result.textColor;
    }
    // 處理自定義背景色
    if (result.customBgColor) {
      document.documentElement.style.setProperty('--bg-color', result.customBgColor);
      bgColorPicker.value = result.customBgColor;
    }
    // 處理主題
    let themeToUse = result.theme;
    if (!themeToUse) {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        themeToUse = 'dark';
      } else {
        themeToUse = 'light';
      }
    }
    document.documentElement.setAttribute('data-theme', themeToUse);

    // 設定 picker 預設值 (如果沒有自定義)
    if (!result.textColor) {
      textColorPicker.value = themeToUse === 'dark' ? '#e0e0e0' : '#333333';
    }
    if (!result.customBgColor) {
      bgColorPicker.value = themeToUse === 'dark' ? '#1e1e1e' : '#ffffff';
    }

    // 優先初始化 API Key 與語言
    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
      updateApiKeyHint(result.apiKey);
    }
    updateLanguage();

    if (result.language) {
      currentLanguage = result.language; // 設定當前語言
      languageSelect.value = currentLanguage; // 更新語言選擇器的值
    }
    if (result.style) {
      currentStyle = result.style; // 設定當前風格
      styleSelect.value = currentStyle; // 更新風格選擇器的值
    }
    if (result.model) {
      currentModel = result.model; // 設定當前模型
      modelSelect.value = currentModel; // 更新模型選擇器的值
    }

    // 如果有背景選取的內容，優先處理
    if (result.pendingSelection) {
      // 來自右鍵選單的內容
      const selectedText = result.pendingSelection;
      const selectedTitle = result.pendingTitle || "選取內容總結";
      // 清除 pending，避免和下一次開啟衝突
      chrome.storage.local.remove(['pendingSelection', 'pendingTitle']);
      // 自動觸發總結
      summarize(selectedText, selectedTitle);
    } else if (result.summary) {
      rawSummary = result.summary;
      summaryDiv.innerHTML = marked.parse(rawSummary); // 顯示之前的總結（渲染後）
    }
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

  // 模型選擇器變更事件
  modelSelect.addEventListener('change', function () {
    currentModel = this.value; // 更新當前模型
    chrome.storage.local.set({ model: currentModel }); // 保存模型設定
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
    const textToCopy = rawSummary;
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy).then(() => {
      // 視覺反饋
      const originalTitle = copyBtn.getAttribute('title');
      copyBtn.setAttribute('title', currentLanguage === 'zh' ? '已複製！' : 'Copied!');
      copyBtn.classList.add('copied');
      setTimeout(() => {
        copyBtn.setAttribute('title', originalTitle);
        copyBtn.classList.remove('copied');
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  });

  // TTS 語音朗讀邏輯
  let isSpeaking = false;
  const synth = window.speechSynthesis;
  // 語言代碼映射表 (Map ISO 639-1 to BCP 47)
  const langMap = {
    'zh': 'zh-TW', // 繁體中文預設台灣口音
    'en': 'en-US',
    'ja': 'ja-JP',
    'ko': 'ko-KR',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'es': 'es-ES'
  };

  ttsBtn.addEventListener('click', function () {
    if (isSpeaking) {
      stopSpeak();
    } else {
      // 從 DOM 獲取純文字內容 (去除 Markdown 符號)
      // 使用 summaryDiv.innerText 而不是 rawSummary，因為 innerText 是已經渲染好的文字，讀起來比較順
      const textToRead = summaryDiv.innerText;
      if (!textToRead) return;

      speak(textToRead, langMap[currentLanguage] || 'en-US');
    }
  });

  function speak(text, lang) {
    if (synth.speaking) {
      console.error('speechSynthesis.speaking');
      return;
    }

    const utterThis = new SpeechSynthesisUtterance(text);
    utterThis.lang = lang;
    utterThis.rate = 1.0; // 語速
    utterThis.pitch = 1.0; // 音調

    utterThis.onstart = function () {
      isSpeaking = true;
      ttsBtn.classList.add('speaking');
      // 切換圖示為「停止」 (可選)
    };

    utterThis.onend = function () {
      isSpeaking = false;
      ttsBtn.classList.remove('speaking');
    };

    utterThis.onerror = function (event) {
      console.error('SpeechSynthesisUtterance.onerror', event);
      isSpeaking = false;
      ttsBtn.classList.remove('speaking');
    };

    synth.speak(utterThis);
  }

  function stopSpeak() {
    if (synth.speaking) {
      synth.cancel();
    }
    isSpeaking = false;
    ttsBtn.classList.remove('speaking');
  }

  // 當 Popup 關閉時停止朗讀，避免背景持續有聲音
  window.addEventListener('unload', function () {
    stopSpeak();
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

  // 字體顏色切換事件
  textColorPicker.addEventListener('input', function () {
    const newColor = this.value;
    document.documentElement.style.setProperty('--text-color', newColor);
    chrome.storage.local.set({ textColor: newColor });
  });

  // 背景色切換事件
  bgColorPicker.addEventListener('input', function () {
    const newColor = this.value;
    document.documentElement.style.setProperty('--bg-color', newColor);
    chrome.storage.local.set({ customBgColor: newColor });
  });

  // 匯出歷史紀錄
  exportHistoryBtn.addEventListener('click', function () {
    chrome.storage.local.get(['history'], function (result) {
      const history = result.history || [];
      if (history.length === 0) {
        const t = {
          zh: '尚無紀錄可匯出', en: 'No history to export', ja: 'エクスポートする履歴がありません',
          ko: '내보낼 기록이 없습니다', fr: 'Aucun historique à exporter', de: 'Kein Verlauf zum Exportieren', es: 'No hay historial para exportar'
        };
        alert(t[currentLanguage] || t.en);
        return;
      }
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `webspeedreader_history_${new Date().getTime()}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    });
  });

  // 清空歷史紀錄
  clearHistoryBtn.addEventListener('click', function () {
    const t = {
      zh: '確定要清空所有歷史紀錄嗎？', en: 'Are you sure you want to clear all history?',
      ja: '履歴をすべて消去してもよろしいですか？', ko: '모든 기록을 정말 지우시겠습니까?',
      fr: 'Êtes-vous sûr de vouloir effacer tout l\'historique ?', de: 'Möchten Sie wirklich den gesamten Verlauf löschen?',
      es: '¿Seguro que quieres borrar todo el historial?'
    };
    const confirmMsg = t[currentLanguage] || t.en;
    if (confirm(confirmMsg)) {
      chrome.storage.local.set({ history: [] }, function () {
        renderHistory();
      });
    }
  });

  // 主題切換事件
  themeToggle.addEventListener('click', function () {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    chrome.storage.local.set({ theme: newTheme });

    // 切換主題時，重置所有自定義顏色，以免混淆
    chrome.storage.local.remove(['textColor', 'customBgColor', 'accentColor']);
    document.documentElement.style.removeProperty('--text-color');
    document.documentElement.style.removeProperty('--bg-color');
    document.documentElement.style.removeProperty('--accent-color');

    // 重置選擇器的顯示值
    textColorPicker.value = newTheme === 'dark' ? '#e0e0e0' : '#333333';
    bgColorPicker.value = newTheme === 'dark' ? '#1e1e1e' : '#ffffff';
  });

  // 保存 groq API Key 按鈕點擊事件
  saveApiKeyBtn.addEventListener('click', function () {
    const apiKey = apiKeyInput.value.trim(); // 獲取並修剪 groq API Key
    if (apiKey) {
      chrome.storage.local.set({ apiKey: apiKey }); // 保存 groq API Key
      const t = {
        zh: 'groq API Key 已保存', en: 'groq API Key saved', ja: 'APIキーが保存されました',
        ko: 'API 키 저장됨', fr: 'Clé API enregistrée', de: 'API Key gespeichert', es: 'Clave API guardada'
      };
      alert(t[currentLanguage] || t.en); // 顯示保存成功訊息
    }
  });

  // 更新語言相關的 UI 文本
  function updateLanguage() {
    const texts = {
      zh: {
        summarize: '總結', copy: '複製', history: '歷史', clear: '清除',
        message: '請點擊"總結"按鈕開始總結當前頁面內容。',
        loading: '正在思考...', historyTitle: '最近總結',
        styles: ['標準摘要', '簡明模式', '深度解析'],
        alertKey: '請先設置 groq API Key', keySaved: 'groq API Key 已保存',
        error: '總結時發生錯誤', noHistory: '尚無歷史紀錄', confirmClear: '確定要清空所有歷史紀錄嗎？',
        copied: '已複製', delete: '刪除', expanded: '內容擴展了', saved: '節省了', reading: '的閱讀量'
      },
      en: {
        summarize: 'Sum', copy: 'Copy', history: 'Hist', clear: 'Clear',
        message: 'Click "Sum" to start.',
        loading: 'Thinking...', historyTitle: 'Recent Summaries',
        styles: ['Normal', 'Concise', 'Detailed'],
        alertKey: 'Please set groq API Key first', keySaved: 'groq API Key saved',
        error: 'Error occurred', noHistory: 'No history', confirmClear: 'Clear all history?',
        copied: 'Copied', delete: 'Delete', expanded: 'Content expanded', saved: 'Saved', reading: 'of reading'
      },
      ja: {
        summarize: '要約', copy: '複製', history: '履歴', clear: '消去',
        message: '「要約」ボタンをクリックして開始します。',
        loading: '思考中...', historyTitle: '最近の要約',
        styles: ['標準', '簡潔', '詳細'],
        alertKey: 'groq APIキーを設定してください', keySaved: 'APIキーが保存されました',
        error: 'エラーが発生しました', noHistory: '履歴なし', confirmClear: '履歴をすべて消去しますか？',
        copied: '複製完了', delete: '削除', expanded: '内容が拡張されました', saved: '読書量を', reading: '節約しました'
      },
      ko: {
        summarize: '요약', copy: '복사', history: '기록', clear: '지우기',
        message: '시작하려면 "요약" 버튼을 클릭하세요.',
        loading: '생각 중...', historyTitle: '최근 요약',
        styles: ['표준', '간결', '상세'],
        alertKey: 'groq API 키를 먼저 설정하세요', keySaved: 'API 키 저장됨',
        error: '오류가 발생했습니다', noHistory: '기록 없음', confirmClear: '모든 기록을 지우시겠습니까?',
        copied: '복사됨', delete: '삭제', expanded: '내용이 확장되었습니다', saved: '절약됨', reading: '독서량'
      },
      fr: {
        summarize: 'Résumer', copy: 'Copier', history: 'Hist.', clear: 'Effacer',
        message: 'Cliquez sur "Résumer" pour commencer.',
        loading: 'Penser...', historyTitle: 'Résumés récents',
        styles: ['Normal', 'Concis', 'Détaillé'],
        alertKey: 'Veuillez définir la clé API groq', keySaved: 'Clé API enregistrée',
        error: 'Une erreur est survenue', noHistory: 'Aucun historique', confirmClear: 'Effacer tout l\'historique ?',
        copied: 'Copié', delete: 'Supprimer', expanded: 'Contenu étendu', saved: 'Économisé', reading: 'de lecture'
      },
      de: {
        summarize: 'Resümee', copy: 'Kopieren', history: 'Verlauf', clear: 'Leeren',
        message: 'Klicken Sie auf "Resümee", um zu beginnen.',
        loading: 'Denken...', historyTitle: 'Letzte Zusammenfassungen',
        styles: ['Normal', 'Prägnant', 'Detailliert'],
        alertKey: 'Bitte setzen Sie zuerst den groq API Key', keySaved: 'API Key gespeichert',
        error: 'Ein Fehler ist aufgetreten', noHistory: 'Kein Verlauf', confirmClear: 'Verlauf leeren?',
        copied: 'Kopiert', delete: 'Löschen', expanded: 'Inhalt erweitert', saved: 'Gespart', reading: 'des Lesens'
      },
      es: {
        summarize: 'Resumir', copy: 'Copiar', history: 'Hist.', clear: 'Borrar',
        message: 'Haga clic en "Resumir" para comenzar.',
        loading: 'Pensando...', historyTitle: 'Resúmenes recientes',
        styles: ['Normal', 'Conciso', 'Detallado'],
        alertKey: 'Configure primero la clave API groq', keySaved: 'Clave API guardada',
        error: 'Ocurrió un error', noHistory: 'Sin historial', confirmClear: '¿Borrar todo el historial?',
        copied: 'Copiado', delete: 'Borrar', expanded: 'Contenido expandido', saved: 'Ahorrado', reading: 'de lectura'
      }
    };

    const t = texts[currentLanguage] || texts.en;

    summarizeBtn.textContent = t.summarize;
    copyBtn.textContent = t.copy;
    historyBtn.textContent = t.history;
    clearSummaryBtn.textContent = t.clear;
    messageDiv.textContent = t.message;
    loadingText.textContent = t.loading;
    historyTitle.textContent = t.historyTitle;

    loadingText.textContent = t.loading;
    historyTitle.textContent = t.historyTitle;

    styleSelect.options[0].text = t.styles[0];
    styleSelect.options[1].text = t.styles[1];
    styleSelect.options[2].text = t.styles[2];

    // 更新 Placeholder (如果有的話)
    apiKeyInput.placeholder = 'Groq API Key';
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
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url) {
          throw new Error("無法獲取當前頁面資訊。");
        }
        if (tab.url.startsWith("chrome://") || tab.url.startsWith("edge://") || tab.url.startsWith("about:")) {
          alert("此頁面受瀏覽器安全限制，無法執行擴充功能腳本。");
          summarizing = false;
          summarizeBtn.disabled = false;
          return;
        }

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
        const t = {
          zh: '請先設置 groq API Key', en: 'Please set the groq API Key first',
          ja: '最初にgroq APIキーを設定してください', ko: '먼저 groq API 키를 설정하세요',
          fr: 'Veuillez d\'abord définir la clé API groq', de: 'Bitte setzen Sie zuerst den groq API Key',
          es: 'Por favor, configure primero la clave API groq'
        };
        alert(t[currentLanguage] || t.en); // 提示設置 groq API Key
        summarizing = false; // 重置總結狀態
        summarizeBtn.disabled = false; // 啟用總結按鈕
        return;
      }

      // 根據語言與風格生成提示文本
      // 根據語言與風格生成提示文本
      let prompt = '';
      if (currentLanguage === 'zh') {
        prompt = `請用繁體中文總結以下內容：\n\n`;
      } else if (currentLanguage === 'ja') {
        prompt = `以下の内容を日本語で要約してください：\n\n`;
      } else if (currentLanguage === 'ko') {
        prompt = `다음 내용을 한국어로 요약해 주세요:\n\n`;
      } else if (currentLanguage === 'fr') {
        prompt = `Veuillez résumer le contenu suivant en français :\n\n`;
      } else if (currentLanguage === 'de') {
        prompt = `Bitte fassen Sie den folgenden Inhalt auf Deutsch zusammen:\n\n`;
      } else if (currentLanguage === 'es') {
        prompt = `Por favor, resuma el siguiente contenido en español:\n\n`;
      } else {
        prompt = `Please summarize the following content in English:\n\n`;
      }

      const stylePrompts = {
        concise: {
          zh: `請以「簡明模式」總結，只提供 3 個核心重點（使用 bullet points）。\n\n`,
          en: `Use "Concise Mode", providing only 3 core key points (using bullet points).\n\n`,
          ja: `「簡潔モード」を使用し、3つの重要なポイントのみを箇条書きで提供してください。\n\n`,
          ko: `핵심 포인트 3개만 글머리 기호를 사용하여 "간결 모드"로 요약해 주세요.\n\n`,
          fr: `Utilisez le "Mode Concis", en fournissant seulement 3 points clés (avec des puces).\n\n`,
          de: `Verwenden Sie den "Prägnanten Modus" und geben Sie nur 3 Kernpunkte an (mit Aufzählungszeichen).\n\n`,
          es: `Use el "Modo Conciso", proporcionando solo 3 puntos clave (con viñetas).\n\n`
        },
        detailed: {
          zh: `請以「深度解析」模式總結，包含詳細的背景、核心觀點、具體細節與結論，並使用適當的標題。\n\n`,
          en: `Use "Detailed Mode", including detailed background, core arguments, specific details, and conclusion, categorized with clear headings.\n\n`,
          ja: `「詳細モード」を使用し、詳細な背景、核心的な議論、具体的な詳細、結論を含め、明確な見出しで分類してください。\n\n`,
          ko: `상세한 배경, 핵심 주장이 포함된 "상세 모드"를 사용하여 적절한 제목과 함께 요약해 주세요.\n\n`,
          fr: `Utilisez le "Mode Détaillé", incluant le contexte détaillé, les arguments principaux, les détails spécifiques et la conclusion, avec des titres clairs.\n\n`,
          de: `Verwenden Sie den "Detaillierten Modus" mit ausführlichem Hintergrund, Kernargumenten, spezifischen Details und Schlussfolgerungen, kategorisiert mit klaren Überschriften.\n\n`,
          es: `Use el "Modo Detallado", incluyendo antecedentes detallados, argumentos centrales, detalles específicos y conclusiones, con encabezados claros.\n\n`
        },
        normal: {
          zh: `請以「標準摘要」模式總結，提供整體的概要與重要細節。\n\n`,
          en: `Use "Normal Mode", providing a general overview and important details.\n\n`,
          ja: `「標準モード」を使用し、全体的な概要と重要な詳細を提供してください。\n\n`,
          ko: `전체적인 개요와 중요한 세부 사항을 포함하여 "표준 모드"로 요약해 주세요.\n\n`,
          fr: `Utilisez le "Mode Normal", en fournissant un aperçu général et des détails importants.\n\n`,
          de: `Verwenden Sie den "Normalen Modus" und geben Sie einen allgemeinen Überblick sowie wichtige Details.\n\n`,
          es: `Use el "Modo Normal", proporcionando una visión general y detalles importantes.\n\n`
        }
      };

      const langKey = (['zh', 'en', 'ja', 'ko', 'fr', 'de', 'es'].includes(currentLanguage)) ? currentLanguage : 'en';
      prompt += stylePrompts[currentStyle][langKey] || stylePrompts[currentStyle]['en'];

      prompt += pageContent;

      // 向 API 發送請求以獲取總結
      const apiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: currentModel,
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
          } else if (currentLanguage === 'ja') {
            statsText.textContent = `📝 内容が拡張されました (元 ${originalLen} → 現 ${summaryLen} 文字)`;
          } else if (currentLanguage === 'ko') {
            statsText.textContent = `📝 내용이 확장되었습니다 (원문 ${originalLen} → 요약 ${summaryLen} 자)`;
          } else {
            statsText.textContent = `📝 Content expanded (${originalLen} → ${summaryLen} chars)`;
          }
        } else {
          const savedPercent = Math.round(((originalLen - summaryLen) / originalLen) * 100);
          if (currentLanguage === 'zh') {
            statsText.textContent = `⚡️ 節省了 ${savedPercent}% 的閱讀量 (${originalLen} → ${summaryLen} 字)`;
          } else if (currentLanguage === 'ja') {
            statsText.textContent = `⚡️ 読書量を ${savedPercent}% 節約しました (${originalLen} → ${summaryLen} 文字)`;
          } else if (currentLanguage === 'ko') {
            statsText.textContent = `⚡️ 독서량 ${savedPercent}% 절약됨 (${originalLen} → ${summaryLen} 자)`;
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
      const t = {
        zh: '總結時發生錯誤', en: 'An error occurred during summarization',
        ja: '要約中にエラーが発生しました', ko: '요약 중 오류가 발생했습니다',
        fr: 'Une erreur est survenue lors du résumé', de: 'Ein Fehler ist während der Zusammenfassung aufgetreten',
        es: 'Ocurrió un error durante el resumen'
      };
      summaryDiv.textContent = t[currentLanguage] || t.en; // 顯示錯誤訊息
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
        const t = {
          zh: '尚無歷史紀錄', en: 'No history yet', ja: '履歴はまだありません',
          ko: '기록이 없습니다', fr: 'Pas encore d\'historique', de: 'Noch kein Verlauf', es: 'Todavía no hay historial'
        };
        historyList.innerHTML = `<div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">${t[currentLanguage] || t.en}</div>`;
        return;
      }

      history.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'history-item';
        itemDiv.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="flex: 1; overflow: hidden;">
              <div class="history-item-title">${item.title}</div>
              <div class="history-item-meta">
                <span>${item.date}</span>
              </div>
            </div>
            <button class="delete-item-btn" data-index="${index}" title="${currentLanguage === 'zh' ? '刪除' : (currentLanguage === 'ja' ? '削除' : 'Delete')}" style="background:none; border:none; padding: 4px; cursor: pointer; opacity: 0.5;">✕</button>
          </div>
        `;

        // 點擊載入歷史
        itemDiv.addEventListener('click', (e) => {
          if (e.target.classList.contains('delete-item-btn')) return;
          rawSummary = item.summary;
          summaryDiv.innerHTML = marked.parse(rawSummary);
          chrome.storage.local.set({ summary: rawSummary });
          historyPanel.classList.add('hidden');
          // 滾動到頂部
          window.scrollTo(0, 0);
        });

        // 單筆刪除邏輯
        const deleteBtn = itemDiv.querySelector('.delete-item-btn');
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const targetIndex = parseInt(deleteBtn.getAttribute('data-index'));
          const newHistory = [...history];
          newHistory.splice(targetIndex, 1);
          chrome.storage.local.set({ history: newHistory }, function () {
            renderHistory();
          });
        });

        historyList.appendChild(itemDiv);
      });
    });
  }
});