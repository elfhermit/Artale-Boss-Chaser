# ArtaleBossTimer
一個簡單好上手的 Boss 擊殺紀錄工具，幫助你記錄每次擊殺、追蹤已出貨狀態，並自動預估下一次復活時間。

**專案定位**

- **對象**: 遊戲玩家、公會管理者或任何需要追蹤 Boss 出現/擊殺時間的人。
- **核心價值**: 以最少的操作成本快速紀錄擊殺、提供可靠的復活預估與即時視覺化提示，協助玩家進行「連續刷王 (Chain Hunting)」的高頻工作流。

**功能總覽（玩家視角）**

- **快速記錄**: 點選左側 Boss 卡片，按下右側表單的送出即可記錄一次擊殺。
- **連續狩獵優化 (Chain Hunting)**: 提交紀錄時系統會自動
   - **擷取擊殺時間**: 使用按下送出當下的時間 (`new Date().toISOString()`)，不再需要手動輸入時間。
   - **頻道自動遞增**: 提交成功後頻道自動 +1，方便下一場接續登記。
   - **掉寶與備註重設**: 是否掉寶自動重設為「否」，備註清空，以便下一筆快速輸入。
- **復活預估**: 每筆紀錄會計算「最早」與「最晚」復活時間（以 `minMinutes` / `maxMinutes` 計算），並在 Boss 卡片上顯示倒數與進度條。
- **智慧狀態提示**: 卡片會以顏色與文字顯示狀態（全部 / 已存活 / 即將重生 / 冷卻中），並支援篩選。
- **歷史紀錄表**: 顯示首領、擊殺時間、頻道、是否掉寶、備註與預計復活區間，支援刪除單筆或清除全部。
- **私密儲存**: 資料僅保存在你的瀏覽器 LocalStorage，未自動上傳外部伺服器。

**操作教學（玩家快速上手）**

- 步驟 1: 在瀏覽器中開啟 `docs/index.html`（或啟動靜態伺服器並開啟 `http://localhost:8000/docs/index.html`）。
- 步驟 2: 點選左側想紀錄的 Boss 卡片以選擇。
- 步驟 3: 在右側直接按下「確認新增紀錄」。系統會使用當下時間作為擊殺時間；若你要修改頻道或備註，可在按下送出前調整。
- 步驟 4: 在下方「近期擊殺歷史紀錄」確認紀錄；如需刪除請用該列的刪除按鈕。

**檔案與資料結構重點（給進階使用者）**

- **Boss 資料**: `docs/bosses/bosses.json` — 包含 `id`, `name`, `minMinutes`, `maxMinutes`, `respawn` 等欄位。
- **擊殺紀錄儲存**: 使用 LocalStorage key: `bossKillHistory`，其內容為陣列，每筆為一個紀錄物件（包含 `id`, `bossId`, `killTime`, `channel`, `hasDrop`, `notes`）。
- **規格**: 詳細 schema 與遷移 / 備份範例請參閱 `dev/SPEC.md`。

**備份與還原（快速）**

- 匯出: 在瀏覽器 DevTools Console 執行：

   ```js
   const data = localStorage.getItem('bossKillHistory');
   console.log(data);
   ```

- 匯入: 在 Console 執行：

   ```js
   localStorage.setItem('bossKillHistory', '<PASTE_JSON_STRING>');
   location.reload();
   ```

**保留策略 (Retention)**

- 預設採用每個 Boss 最多保留 300 筆的策略（詳見 `dev/SPEC.md`）。若單一 Boss 超過上限，系統建議刪除最舊的紀錄以維持上限。

**已知限制與注意事項**

- 本專案為純前端靜態應用，所有資料儲存於使用者本機的 LocalStorage；瀏覽器清除資料或換裝置會導致資料遺失，請務必匯出備份。
- 部分舊檔或工具（例如 `scripts/` 內的腳本）已從介面移除；若你依賴這些腳本，請在合併紀錄時參照 commit 歷史恢復或更新相應工具。

**改動紀要（重要 UX 更新）**

- `Chain Hunting` 優化：提交後自動使用當下時間為擊殺時間、頻道自動 +1、掉寶/備註重設，能顯著降低高頻紀錄時的操作負擔。
- 移除手動時間輸入：UI 已移除 `datetime-local` 輸入與時間微調按鈕（若你想恢復手動輸入，可在 `docs/index.html` 與 `docs/styles.css` 中還原相應區塊並調整 `docs/app.js` 的 `handleFormSubmit` 行為）。

**開發 / 本機預覽（快速命令）**

在專案根目錄下啟動 Python 內建靜態伺服器（PowerShell）：

```powershell
python -m http.server 8000
# 然後在瀏覽器開啟 http://localhost:8000/docs/index.html
```

或使用其他靜態伺服器工具（例如 `live-server`、`http-server`）。

**如何回報問題或貢獻**

- 回報 bug 或提出功能建議：在專案頁面建立 Issue。
- 提交程式碼貢獻：Fork → 新分支 → PR，請在 PR 描述中包含測試步驟與遷移影響（如涉及 storage schema）。

---

如果你希望我再：

- **加入範例截圖** 到 `docs/` 並在 `README.md` 顯示，或
- **在 `docs/app.js` 補上自動套用保留策略** 的 helper，或
- **把 `dev/SPEC.md` 範例包成 `scripts/migrate.js`**（可直接在 Node 下執行），

請告訴我要執行哪一項，我會幫你 `建立`（建立）並提交相應變更。


