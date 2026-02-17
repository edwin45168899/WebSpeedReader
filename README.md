# 🚀 WebSpeedReader (網頁快速閱讀助手)

![總結](./images/總結DEMO.gif)

**WebSpeedReader** 是一款專為效率控設計的 Chrome 擴充套件！⚡️ 它透過 [Groq](https://console.groq.com/) 驅動的高速 AI 模型（如 `openai/gpt-oss-20b`），在幾秒鐘內為您讀完長篇大論，並精煉出最有價值的重點。

---

## ✨ 核心亮點

- 🎯 **聰明選題 (Smart Extraction)**：內建 `Readability.js` 技術，自動過濾網頁廣告、導航欄及雜訊，精準抓取主體文字。
- 📝 **精美渲染 (Markdown Support)**：支援完整 Markdown 語法，總結內容層次分明，重要資訊一目瞭然。
- ⚡️ **極速生成 (Streaming API)**：採用流式傳輸技術，看著 AI 實時「思考」並逐行輸出，不再枯坐等待。
- 🔒 **隱私防護 (Security First)**：API Key 採用加密輸入顯示，並提供尾碼校驗功能，保障您的隱私與安全。
- 📋 **一鍵複製**：生成的總結內容支援 Markdown 一鍵複製，方便直接存入筆記軟體。
- 🌐 **雙語支援**：支援繁體中文與英文總結，跨國資訊閱讀零障礙。

---

## 🛠 安裝步驟

1. 下載本專案原始碼。
2. 開啟 Chrome 瀏覽器，進入 `chrome://extensions`。
3. 啟動右側的 **「開發者模式」**。
4. 點擊 **「載入未封裝項目」**，並選擇本資料夾即可！📦

![擴充功能](./images/擴充功能.png)

---

## 🔑 開始使用

1. **配置 Key**：至 [Groq Console](https://console.groq.com/keys) 申請免費 API Key。
2. **保存設定**：將 Key 貼入擴充功能頂部並點選 `保存` 💾。（Key 將儲存在本地端，安全無虞）。

![保存](./images/保存.png)

3. **一鍵閱讀**：在任何網頁點選 `總結`，AI 就會立即為您服務囉！☕️

![總結](./images/總結DEMO.gif)

### 📝 專案資訊
- **AI 模型**: openai/gpt-oss-120b (via Groq API)
- **核心庫**: Readability.js, Marked.js
- **開發者**: chiisen

---
*祝您閱讀愉快！如果有任何問題歡迎反饋 📖✨*
