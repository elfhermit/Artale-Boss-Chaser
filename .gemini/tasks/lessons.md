## [2026-03-09] 🔄 自動版控流程 (Mandatory Flow)
- **原則**：每個 Directive (指令) 任務執行完畢並驗證成功後，**必須**自動主動提議執行 Git commit。
- **步驟**：
  1. `git add .` (或指定檔案)。
  2. `git status` 與 `git diff --staged` 確認變更。
  3. 提供一個清晰、符合專案規範的 Traditional Chinese commit message 提案。
  4. 獲得使用者確認後執行提交。
- **例外**：若使用者明確要求「不要 commit」或「先保留變更」，則跳過。

## [2026-03-09] 🔧 技術與邏輯紀錄 (Technical Lessons)
- **JS 模組匯出**：在 IIFE 模式下，新增的內部函式（如 `handleFocusSubmit`）若未明確掛載至匯出物件（如 `window.App.Logic.Actions`），外部將無法存取。
- **UI/UX 穩定性**：當使用 `display: none` 隱藏表單時，原本綁定在該表單的 `submit` 事件將無法透過點擊按鈕觸發（因為按鈕通常在另一個面板），必須分開處理事件綁定或同步輸入值。
- **自動化測試**：Playwright 測試在 file:// 協定下可能遇到權限或路徑問題，建議使用 `path.resolve` 處理絕對路徑。
- **Browser Log**：當發生「功能按鈕無反應」但無 JS error 時，應透過 Playwright 監聽瀏覽器 Console，能極速定位 `... is not a function` 類型的隱藏錯誤。

## [2026-03-02] UI Layout Divergence
- **問題**：在修復跑版時，發現 index.html 的 class 名稱與 styles.css 完全脫鉤（如 .app-container 對應 .container）。這導致整個版面徹底崩潰。
- **對策**：未來在進行大範圍重構或修復 CSS 前，必須優先尋找並同步 HTML 與 CSS 的選擇器名稱。
- **Browser Subagent 限制**：子代理程式無法存取 file:///，需使用 Python http.server 提供靜態檢視。

## [2026-03-02] UI 類別遺漏問題
- **問題**：撰寫 CSS 時為 .btn-primary 定義了新的漸層，但 HTML 中的發送按鈕僅包含 .submit-btn，導致樣式未套用。
- **對策**：擴展或重構共通 UI 元件時，應全域搜尋相關 HTML DOM 的 class 組合，以確保一致性與覆蓋率。
