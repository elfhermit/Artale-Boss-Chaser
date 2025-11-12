# 簡易Boss重生記錄網頁開發方案

最適合你的工作流程是**架設一個純前端網頁應用，利用原生 HTML、JavaScript 及 CSS，結合 Material Design 規範，實現友善且現代化的操作介面**。以下方案詳述整體架構、設計思路、資料儲存方式與重生時間邏輯，協助你高效落實此工具。

---

## 1. 網頁功能規劃

**主要目標：紀錄 Boss 擊殺資訊並預測重生時間，提升使用者操作流暢性**

- Boss 選擇：下拉選單或快速切換（初期可用固定清單）
- 擊殺紀錄：每筆輸入「頻道」、「掉落物」（是/否掉落）及「擊殺時間」自動套用目前時間
- 歷史紀錄查詢：清晰列表呈現擊殺記錄及預計重生時間
- 重生倒數：自動計算並顯示 Boss 再度復活的預估時間
- 操作簡便，適合重複快速輸入

---

## 2. 頁面結構設計（Material Design 風格）

**建議採用下列分區設計，充分利用 Material Design 元素，保持簡潔美觀：**

- **Header（App Bar）：** 網站標題，選單切換（紀錄、新增、查詢）
- **Boss 選擇卡片：** Material Card 形式，乾淨下拉選單或 Chip 選擇
- **紀錄表單區塊：**  
  - 頻道輸入：TextField
  - 掉落物選擇：radio buttons
  - 時間自動（隱藏）
  - 提交按鈕（FloatingActionButton 或 RaisedButton）
- **紀錄展示區：**
  - Material Table 或 List，逐條顯示歷史擊殺資訊、預計重生時間
  - 支援篩選/排序
- **Footer（固定）：** 板權/工具說明

---

## 3. 程式邏輯核心說明

**原生 JS 僅需具備以下重點邏輯：**

- Boss 資料結構統一（名稱、預設重生間隔等）
- 擊殺資訊前端存取：建議使用 localStorage 快速讀寫，簡單持久化
- 新紀錄加入：自動計算預計重生時間（例如擊殺時間＋固定 respawn interval）
- 歷史紀錄渲染與排序
- 倒數提示：可以顯示剩餘多久復活，或直接顯示日期時間

**資料範例：**

```javascript
const BossList = [
  { name: "Boss A", respawnHour: 4 }, // name 用 Boss 中文名稱
  { name: "Boss B", respawnHour: 6 },
];

const killRecords = [
  {
    boss: "Boss A", // Boss id 紀錄
    channel: "CH1",
    drop: ["素材A"],
    killedAt: "2025-11-12T12:30:00",
    respawnAt: "2025-11-12T16:30:00"
  },
];
```

**localStorage 操作：**
- 新增時存入 killRecords
- 頁面載入時讀取並呈現所有紀錄

---

## 4. Material Design 前端設計重點

**無外部框架也能套用 Material 規則設計：**

- 按鈕、表單控制項、卡片區塊，皆運用 Material Design 樣式指引（陰影、圓角、漸變）
- 透過 CSS 自訂動畫效果、主題色
- 可參考 Google 官方 Material Design 規範： https://m3.material.io/

---

## 5. UI/UX 操作流程

1. 選擇 Boss（可預設為最近一次紀錄過的 Boss）
2. 輸入頻道+掉落物，點擊「擊殺紀錄」按鈕
3. 新增紀錄後即顯示在列表，顯示預計重生時間
4. 歷史紀錄支援快速回查，倒數提示方便判斷何時再打 Boss

---

## 6. 附加建議

- 支援 Boss 名稱的增刪編輯（可用 Modal 實現）
- 彈窗或 Snackbar 告知紀錄已儲存、倒數剩餘時間
- 純前端設計，方便移植至桌面或手機瀏覽器

---

## 7. 簡易範例原型（HTML片段）  // 參考 但要修改

```html
<header>
  <h1>Boss擊殺紀錄</h1>
</header>
<section>
  <div class="card">
    <label for="boss">選擇Boss:</label>
    <select id="boss"></select>
    <input type="text" id="channel" placeholder="頻道"/>
    <input type="checkbox" id="drop1"/> 素材A
    <input type="checkbox" id="drop2"/> 素材B
    <button id="recordBossKill">紀錄擊殺</button>
  </div>
</section>
<section>
  <table>
    <thead>
      <tr><th>Boss</th><th>頻道</th><th>掉落</th><th>擊殺時間</th><th>復活時間</th></tr>
    </thead>
    <tbody id="recordTable"></tbody>
  </table>
</section>
```

---

## 結語

本方案結合**原生 Web 技術**與 Material Design 現代視覺規範，可高效、快速開發一個獨立且美觀的 Boss 重生記錄工具，不需依賴外部巨型框架，既能保持彈性又易於維護，操作流暢度與使用體驗均佳，非常適合輕量型日常遊戲管理需求。