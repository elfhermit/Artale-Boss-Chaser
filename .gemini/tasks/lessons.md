## [2026-03-02] UI Layout Divergence
- **問題**：在修復跑版時，發現 index.html 的 class 名稱與 styles.css 完全脫鉤（如 .app-container 對應 .container）。這導致整個版面徹底崩潰。
- **對策**：未來在進行大範圍重構或修復 CSS 前，必須優先尋找並同步 HTML 與 CSS 的選擇器名稱。
- **Browser Subagent 限制**：子代理程式無法存取 ile:///，需使用 Python \http.server\ 提供靜態檢視。
