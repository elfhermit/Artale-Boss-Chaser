## [2026-03-02] UI Layout Divergence
- **問題**：在修復跑版時，發現 index.html 的 class 名稱與 styles.css 完全脫鉤（如 .app-container 對應 .container）。這導致整個版面徹底崩潰。
- **對策**：未來在進行大範圍重構或修復 CSS 前，必須優先尋找並同步 HTML 與 CSS 的選擇器名稱。
- **Browser Subagent 限制**：子代理程式無法存取 ile:///，需使用 Python \http.server\ 提供靜態檢視。

## [2026-03-02] UI 類別遺漏問題
- **問題**：撰寫 CSS 時為 \.btn-primary\ 定義了新的漸層，但 HTML 中的發送按鈕僅包含 \.submit-btn\，導致樣式未套用。
- **對策**：擴展或重構共通 UI 元件時，應全域搜尋相關 HTML DOM 的 class 組合，以確保一致性與覆蓋率。
