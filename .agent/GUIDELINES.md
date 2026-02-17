# WebSpeedReader Opencode 專案指引

> [!IMPORTANT]
> 本文件為 `WebSpeedReader` 專案特定規範，優先於全域開發指南。

## 0. 🏁 規則優先權
1. **本指引檔案**：優先於任何全域規則。
2. **GEMINI.md**：專案核心規範，涵蓋技術棧與開發原則。
3. **全域指南**：若本專案無特殊定義，則參考通用開發標準。

## 1. 🔍 專案識別
- **專案類型**：Chrome Extension (Manifest V3)
- **技術棧**：Vanilla JavaScript (ES6+), HTML5, CSS3
- **AI 整合**：Groq API (OpenAI 相容接口)
- **第三方庫**：`marked.min.js` (本地端，存放於根目錄)

## 2. 📁 目錄結構
- `popup.html/.js/styles.css`：擴充套件彈窗主要邏輯與 UI
- `content.js`：網頁內容提取 Script
- `marked.min.js`：外部庫（禁止使用遠端 CDN，符合 CSP 安全政策）
- `manifest.json`：擴充套件配置文件

## 3. ⚠️ 開發注意事項

### 安全政策 (CSP)
- **禁止**使用 `eval()` 或內聯腳本 (`onclick` 等)
- 所有事件必須在 `popup.js` 中使用 `addEventListener` 綁定

### 生命週期
- 注意 `chrome.storage.local` 的非同步特性
- 讀取設定時應確保邏輯正確

### 權限管理
- 若需存取更多網頁資訊，需在 `manifest.json` 的 `permissions` 中聲明

## 4. 🚀 AI 功能細節
- **模型選擇**：預設使用 `openai/gpt-oss-120b` (經由 Groq 轉發)
- **流式傳輸**：必須支援 Stream 模式以優化使用者體驗
- **提示詞 (Prompt)**：支援繁體中文與英文雙語總結，由 `currentLanguage` 變數控制

## 5. 📝 變更管理與提交

### CHANGELOG.md
- 每次功能更新必須更新 `Unreleased` 區塊
- 語言：繁體中文

### Git Commit
- 格式：`<type>(<scope>): <subject>`
- 使用繁體中文描述

## 6. ✅ 完工定義 (DoD)
- 代碼需通過手動測試（載入未解壓擴充功能）
- 新增的外部 JS 庫必須有對應的本地檔案
- 更新 `CHANGELOG.md` 並確保 Git 提交訊息規範

## 7. 🪟 Windows 環境
- 使用 PowerShell 進行檔案管理
- 開發時透過 `chrome://extensions/` 載入未解壓擴充功能進行測試
