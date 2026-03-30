# GEMINI.md - Artale Boss Chaser (Pro) 專案指令規範

## 1. 專案概觀 (Project Overview)
- **專案名稱**: Artale Boss Chaser (Pro) - 獵人儀表板
- **核心目標**: 提供玩家追蹤《Artale》遊戲中各頻道 Boss 重生時間的工具。
- **技術棧 (Tech Stack)**:
    - **前端**: 原生 HTML5, CSS3, Vanilla JavaScript (ES6+)。
    - **架構**: 命名空間架構 (`window.App`)，將邏輯劃分為 `Core` (狀態/工具), `UI` (渲染/DOM), `Logic` (動作), `Data` (靜態資料)。
    - **持久化**: 使用瀏覽器 `LocalStorage` 儲存擊殺紀錄與使用者偏好。
    - **測試**: 使用 `Playwright` 進行 E2E 測試。
- **部署目錄**: `docs/` 目錄為靜態網頁發佈點，可直接透過 `file://` 或靜態伺服器開啟。

## 2. 專案結構與模組說明
- `docs/index.html`: 應用程式入口點。
- `docs/css/styles.css`: 核心樣式表，包含暗黑模式與 RWD 支援。
- `docs/js/`:
    - `namespace.js`: 初始化全域命名空間 `window.App`。
    - `core/state.js`: 集中管理全域狀態 (殺紀錄、篩選器、偏好)。
    - `core/utils.js`: 通用輔助函式（格式化時間、計算倒數）。
    - `ui/dom.js`: 快取並管理 DOM 元素引用。
    - `ui/render.js`: 處理畫面渲染（卡片更新、表格生成）。
    - `ui/events.js`: 集中綁定 DOM 事件。
    - `logic/actions.js`: 執行核心商務邏輯（新增紀錄、刪除紀錄、自動跳頻）。
    - `data/bosses.js`: 寫死的 Boss 基本資料。
    - `main.js`: 應用程式初始化入口。
- `docs/bosses/`: 存放 Boss 頭像 (GIF/SVG) 與 JSON 資料。
- `dev/SPEC.md`: 專案規格文件 (Schema v1)，定義了資料模型與保留策略。
- `tests/`: 包含 Playwright 測試腳本。

## 3. 開發規範 (Development Conventions)
- **命名空間**: 嚴格遵守 `window.App` 結構。新增函式時必須掛載於正確的子模組下（例如 `window.App.Logic.Actions`）。
- **資料模型**:
    - 擊殺紀錄格式必須符合 `dev/SPEC.md` 定義。
    - 關鍵欄位: `id`, `bossId`, `killTime` (ISO 8601), `channel`, `hasDrop`, `notes`。
- **保留策略**: 單一 Boss 的擊殺紀錄上限為 **300 筆**。新增第 301 筆時必須刪除該 Boss 最舊的一筆紀錄。
- **語系**: 
    - UI 顯示與註解一律使用 **繁體中文 (zh-TW)**。
    - 技術術語保留英文。
- **樣式**: 優先使用原生 CSS 變數進行主題切換（暗黑/明亮模式）。

## 4. 關鍵指令 (Key Commands)
- **運行應用程式**: 
    - 直接在瀏覽器開啟 `docs/index.html`。
    - 或使用 `npx http-server docs` (如有安裝)。
- **測試與驗證**:
    - 執行 E2E 測試: `npx playwright test`
    - 查看測試結果: `npx playwright show-report`
- **資料維護 (DevTools Console)**:
    - 匯出紀錄: `console.log(localStorage.getItem('bossKillHistory'))`
    - 匯入紀錄: `localStorage.setItem('bossKillHistory', 'JSON_STRING')`

## 5. 任務執行優先級 (Task Priorities)
1. **資料完整性**: 修改邏輯前必須確保不毀損 LocalStorage 中的舊紀錄。
2. **時間計算準確性**: Boss 重生區間計算必須符合 `minMinutes` 與 `maxMinutes`。
3. **介面響應速度**: 大量紀錄 (Max 300 * Boss 數) 下的渲染效能。
4. **自動化驗證**: 每次重大修改邏輯後，必須運行 `playwright` 測試。

---
*此檔案由 Gemini CLI 自動產生，作為專案開發的核心引導。*
