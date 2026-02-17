# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **語音朗讀 (TTS)**: 新增朗讀按鈕，可將 AI 總結內容透過瀏覽器語音讀出，支援多語言切換與播放/暫停。
- **自定義總結風格**: 支援簡明 (Concise)、標準 (Normal) 或詳細 (Detailed) 三種模式切換，適應不同閱讀場景。
- **雙重色彩自定義**: 支援自定義「字體顏色」與「背景顏色」。介面按鈕現在會根據字體色自動產生對應的框線，讓整體配色保持一致且優雅。

### Removed
- **快捷鍵支援**: 因應 V3 環境限制與熱鍵衝突頻繁，暫時移除快捷鍵功能，以確保介面穩定性。
- **歷史紀錄進階管理**: 新增單筆刪除、一鍵清空以及匯出為 JSON 檔案的功能。
- **多模型選擇**: 提供選單讓使用者切換不同的 Groq 模型（如 GPT-OSS, Llama 3.3, Mixtral 等）。
- **UI 佈局重大更新**: 重構了彈窗頂部佈局，改為「設定列」與「操作列」雙行顯示。
- **介面擴大**: 將彈窗寬度從 `350px` 提升至 `400px`，徹底解決英文環境下按鈕擠壓與溢出的問題。
- **深色模式支援 (Dark Mode)**: 支援系統主題自動偵測與手動切換選單，並在本地持久化偏好。
- **閱讀量節省統計**: 總結完成後顯示原字數 vs 總結字數，並計算節省百分比。
- **版本號顯示**: 在彈窗底部自動顯示來自 `manifest.json` 的版本號。
- **右鍵選單總結**: 新增右鍵選單 `總結選取內容`。
- **歷史紀錄 (History)**: 支援保存最近 10 次總結。
- **自定義總結風格**: 新增選擇器，支援「標準摘要」、「簡明模式 (3個重點)」與「深度解析」。
- **Markdown 渲染**: 整合 `marked.js`。
- **Readability 整合**: 引入 `readability.js` (Mozilla)。

### Fixed
- 修復了 UI 溢出問題：彈窗介面現在能完美適配長英文按鈕（如 "Summarize", "History"）。
- 修復了負數節省量的情況：當內容擴展時自動將提示切換為「內容擴展」。
- 修復了閱讀量統計顯示 `NaN%` 與 `undefined` 的問題。

### Changed
- 將模型更新為 `openai/gpt-oss-20b`。
- 重構 `styles.css` 為 CSS 變數架構。
