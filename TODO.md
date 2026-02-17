# WebSpeedReader 開發任務清單 (TODO List)

這個清單用於追蹤 `WebSpeedReader` 的後續優化計畫，確保開發進度條理清晰。

## 🟢 已完成 (Done)
- [x] **歷史紀錄 (History)**: 保存最近 10 次總結，支援離線查看。
- [x] **自定義總結風格**: 支援簡明 (Concise)、適中 (Normal) 或深度 (Detailed) 模式。
- [x] **精確內容提取 (Smart Extraction)**: 整合 `Readability.js` (Mozilla) 以過濾網頁雜訊，提升總結品質。
- [x] **Markdown 渲染**: 引入 `marked.min.js` 將 AI 回傳的總結轉化為美觀的 HTML。
- [x] **一鍵複製**: 新增複製原始 Markdown 內容的功能並提供 UI 回饋.
- [x] **API Key 安全與佈局**: 將 Key 輸入移至頂部並改為密碼格式，提供尾碼校驗。
- [x] **基礎多語言**: 支援繁體中文與英文切換。
- [x] **專案規範文件**: 建立 `GEMINI.md` 與 `CHANGELOG.md`。
- [x] **載入狀態美化**: 加入 Loading 動畫與打字機光標效果，提升互動感。

## 🟡 進行中 / 優先開發 (Priority)
- [ ] **右鍵選單功能**: 選取網頁一段文字後，點擊右鍵即可「總結選取內容」。

## ⚪ 待辦功能 (Backlog)
- [ ] **UI/UX 優化**:
    - [ ] 深色模式支援。
    - [ ] 更多模型選擇選單（Llama 3, Mixtral 等）。
- [ ] **交互式功能**:
    - [ ] 閱讀量節省統計（原字數 vs 總結字數）。
    - [ ] 歷史紀錄刪除與匯出功能。

---
*最後更新日期: 2026-02-18*
