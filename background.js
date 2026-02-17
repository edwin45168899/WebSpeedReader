// 當擴充功能安裝或更新時，建立右鍵選單
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "summarizeSelection",
        title: "總結選取內容",
        contexts: ["selection"]
    });
});

// 處理右鍵選單點擊事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "summarizeSelection" && info.selectionText) {
        // 將選取的文字儲存到本地儲存空間，供 popup 讀取
        chrome.storage.local.set({
            pendingSelection: info.selectionText,
            pendingTitle: tab.title || "選取內容總結"
        }, () => {
            // 提示使用者點擊圖示查看總結 (V3 無法直接從背景開啟 popup)
            console.log("已儲存選取內容，請開啟彈窗進行總結。");
        });
    }
});
