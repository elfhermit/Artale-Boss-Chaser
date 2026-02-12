
# Maintenance Guide

本文件說明如何維護與更新 Artale-Boss-Chaser 專案。

## 專案結構

本專案採用純前端架構 (HTML/CSS/JS)，主要程式碼位於 `docs/` 目錄下，可直接透過瀏覽器開啟 `index.html` 使用，無需後端伺服器。

```text
docs/
├── index.html        (入口網頁)
├── css/
│   └── styles.css    (樣式表)
├── js/
│   ├── data/
│   │   └── bosses.js (Boss 資料設定檔)
│   ├── core/
│   │   ├── state.js  (狀態管理與 localStorage 存取)
│   │   └── utils.js  (工具函式)
│   ├── ui/
│   │   ├── dom.js    (DOM 元素參照)
│   │   ├── render.js (UI 渲染邏輯)
│   │   └── events.js (事件監聽設定)
│   ├── logic/
│   │   └── actions.js (核心業務邏輯)
│   └── main.js       (程式初始化入口)
```

## 如何更新 Boss 資料

若遊戲改版或需要新增 Boss，請編輯 `docs/js/data/bosses.js`。

### 欄位說明

```javascript
{
  "id": "unique-id",      // 唯一識別碼 (請勿重複)
  "name": "顯示名稱",
  "respawn": "顯示文字",  // 例如 "23分~30分"
  "minMinutes": 23,       // 最短重生時間 (分鐘)
  "maxMinutes": 30,       // 最長重生時間 (分鐘)
  "image": "placeholder.svg" // 圖片檔名 (目前未實作圖片顯示)
}
```

## 如何備份資料

使用者的紀錄儲存於瀏覽器 LocalStorage。若要備份，請開啟瀏覽器開發者工具 (F12) -> Console，輸入：

```javascript
copy(localStorage.getItem('bossKillHistory'));
```

## Git 同步

本專案已設定 `.gitignore`，開發時請確保不將測試用的暫存檔或作業系統產生的檔案 (如 `.DS_Store`) 推送到儲存庫。

若要部署到 GitHub Pages，請至 GitHub Repo Settings -> Pages，將 Source 設定為 `/docs` 資料夾即可。
