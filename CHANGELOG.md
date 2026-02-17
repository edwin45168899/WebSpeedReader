# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **閱讀量節省統計**: 總結完成後顯示原字數 vs 總結字數，並計算節省百分比，直觀展示效率提升。
- **版本號顯示**: 在彈窗底部自動顯示來自 `manifest.json` 的版本號，方便開發與核對。
- **右鍵選單總結**: 新增右鍵選單 `總結選取內容`，選取文字後可快速匯入彈窗進行總結。
- **歷史紀錄 (History)**: 支援保存最近 10 次總結，包含網頁標題與時間戳記，點擊即可重載內容。
- **自定義總結風格**: 新增選擇器，支援「標準摘要」、「簡明模式 (3個重點)」與「深度解析」三種風格。
- **UI 佈局優化**: 擴大插槽寬度至 350px，並美化按鈕與下拉選單的視覺質感（圓角、過渡效果）。
- **載入狀態美化**: 加入了實時打字機光標動畫效果與 Loading Spinner。
- **一鍵複製**: 新增複製功能與即時 UI 回饋。
- **Markdown 渲染**: 整合 `marked.js`。
- **Readability 整合**: 引入 `readability.js` (Mozilla) 實現精確網頁主體內容提取。

### Fixed
- 修復了閱讀量統計顯示 `NaN%` 與 `undefined` 的問題，加強了字串校驗與除零保護。
- 優化統計邏輯：當總結內容長於原始內容時，訊息將自動從「節省」切換為「內容擴展」，避免顯示 `0%` 的誤導性資訊。
- 修復了在切換語言時，部分 UI 元素未同步更新的問題。

### Changed
- 將模型更新為 `openai/gpt-oss-20b` 以優化生成速度與穩定性。
- 優化 API Key 顯示邏輯：支援最後 3 字元即時校驗。
- 將 API Key 輸入框移至頂部並優化佈局，提升易用性。
- 將 API Key 輸入框類型改為 `password` 以增強隱私安全性。
- 優化 `popup.js` 的流式傳輸處理，實時渲染 Markdown。
- 更新 `styles.css` 以美化 Markdown 標題、列表和程式碼塊的顯示效果。
- 升級介面多語言支援，包含「複製」按鈕的國際化。
