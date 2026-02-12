# 功能規格（Feature Spec）

此文件列出要實作的功能、驗收準則與優先順序。

1) Quick Kill API
- 描述：一個可由 UI 按鈕或鍵盤觸發的輕量紀錄函式。
- 驗收：點擊卡片上的 `Quick` 按鈕或按 `K` 將在當前 `channel` 新增紀錄，更新列表與卡片狀態。

2) 全域鍵盤快捷鍵
- 描述：支援數字鍵 (1-9) 設頻道、方向鍵調整頻道、Enter 提交、K 快速紀錄。
- 驗收：在非輸入情況下按鍵能正確觸發行為且不會阻擋使用文字輸入。

3) 記住最近頻道（lastChannel）
- 描述：把最近一次使用的 `channel` 存到 `localStorage`，下次載入自動填入。
- 驗收：重新整理頁面後 `channel` 保持為上次值。

4) Quick Presets
- 描述：使用者可將當前 Boss+Channel 儲存為範本，一鍵套用。
- 驗收：在側欄可儲存、套用與刪除範本；範本存在於 `localStorage`。

5) 非阻塞刪除 + 撤銷
- 描述：刪除紀錄後會顯示 Toast，提供數秒內撤銷的按鈕，而非同步彈窗確認。
- 驗收：刪除後能在 toast 時間內恢復該紀錄。

實作細節與檔案位置：
- UI/行為： `docs/index.html`, `docs/styles.css`
- 邏輯： `docs/app.js`
