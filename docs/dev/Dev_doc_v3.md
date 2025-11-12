# Artale Boss Timer — 開發文件（可執行版）

## 摘要

本文件根據 `docs/dev/Dev_doc_v2.md` 與 `docs/dev/SPEC.md`（schema v1）整理，目標是提供一份可被工程師直接依據實作的開發文件，內容包含：系統合約（inputs/outputs）、資料模型、LocalStorage 設計、API 規格、表單驗證、Boss 復活規則、計算邏輯、UI 元件映射、接受準則、測試案例、邊界情況與實作任務分解。

本文件假設為靜態前端專案（部署於 GitHub Pages，預覽資料夾為 `docs/`），所有資料儲存在使用者瀏覽器的 LocalStorage 中，預設 per-boss 每日保留上限為 300 筆，並以 `v1` schema 處理。

## 1. 目標（Goal）

- 提供使用者：選擇 Boss、記錄擊殺（含時間精確到秒、頻道、是否出貨、備註）、查看當天紀錄、編輯/刪除紀錄。
- 提供 Boss 復活時間參考與計算器（支援固定分鐘、範圍分鐘、每小時偏移）。
- 使用 LocalStorage 做 per-boss 儲存與淘汰（每個 Boss 最多 300 筆）。

成功準則：在本機啟動 HTTP server，可以新增/編輯/刪除紀錄，驗證 LocalStorage 中 `abt_records_v1`（或 per-boss key）資料結構正確，復活計算器對常見規則正確輸出時間（含跨日）。

## 2. 使用者與輸入/輸出合約（Contract）

Inputs:
- bossId (string) — 必選（從 `docs/bosses/bosses.json` 下拉選）
- timestamp (ISO string) — 預設為現在時間，可手動編輯
- channel (integer) — 必填，整數，1..3000
- looted (boolean) — 必選（true = 有出貨 / false = 無）
- note (string) — 選填，最多 200 字

Outputs:
- 新增後回傳完整 record 物件（含 id、createdAt、version）。
- getRecords({bossId, date}) 回傳當天該 boss 的紀錄陣列（按照時間 desc 或指定排序）。

Error modes:
- 驗證錯誤（channel 非整數或不在 1..3000、bossId 空、looted 未選）應回傳可顯示的錯誤訊息並阻止儲存。
- LocalStorage 容量錯誤：在寫入失敗時顯示提示，提供匯出資料備份指引。

## 3. 資料模型（schema v1，來源：`SPEC.md`）

Record 範例：

{
  "id": "string",
  "bossId": "string",
  "timestamp": "string",        // ISO
  "channel": 123,
  "looted": true,
  "note": "string",
  "createdAt": "string",
  "updatedAt": "string",
  "version": "v1"
}

LocalStorage 主要建議格式（single key）：

key: `abt_records_v1`
value:
{
  records: [ /* record objects */ ],
  meta: { schemaVersion: "v1", lastPurgeAt: "ISO timestamp" }
}

備註：專案採用 per-boss 保留策略（每個 boss 最多 300 筆），若需改成 per-day-per-boss 或 global，請在 PR 中說明遷移策略。

## 4. LocalStorage API（模組化）

提供下列 JS 模組函式（簽名與行為詳述）：

- addRecord(record) -> returns newRecord
  - 輸入：部分 record（包含 bossId、timestamp、channel、looted、note）
  - 行為：驗證輸入、補 id/createdAt/updatedAt/version、插入 records、呼叫 purgeOldRecordsIfNeeded(bossId)

- updateRecord(id, changes) -> returns updatedRecord
  - 找到 record，套用變更（更新 updatedAt），存回 LocalStorage

- deleteRecord(id) -> returns boolean
  - 刪除指定 id，並回傳是否成功

- getRecords({bossId, date}) -> records[]
  - 如果提供 date（ISO 或 yyyy-mm-dd），回傳該日 00:00:00~23:59:59 的紀錄
  - 若未提供 date，預設回傳今天

- purgeOldRecordsIfNeeded(bossId)
  - 檢查該 boss 的紀錄數量，若超過 300，刪除最舊紀錄直到剩下 300
  - 更新 meta.lastPurgeAt

- exportJSON() / importJSON(json)
  - 用於備份/還原（匯出整個 `abt_records_v1` JSON 或從 JSON 匯入，必要時做 schema 檢查與遷移）

錯誤與回退：所有 write 操作應包 try/catch，寫入失敗時不破壞舊資料並回報 UI 錯誤。

## 5. 表單驗證規則（前端）

- Boss: required
- Timestamp: required, valid ISO datetime
- Channel: required, integer, 1..3000
- Looted: required (radio)
- Note: optional, max 200 characters

驗證反饋方式：即時驗證並顯示錯誤訊息；在嘗試提交時以 focus 指向第一個錯誤欄位。

## 6. Boss 復活規則資料結構（`docs/bosses/bosses.json`）

建議條目結構：

{
  "id": "boss-1",
  "name": "紅寶王",
  "respawn": "23分~30分", // human readable
  "minMinutes": 23,         // optional
  "maxMinutes": 30,         // optional
  "offsetMinute": null,     // 若 hourlyOffset 則表示每小時的哪分鐘復活
  "type": "rangeMinutes", // one of fixedMinutes | rangeMinutes | hourlyOffset
  "image": "placeholder.svg",
  "drops": ["道具A","道具B"]
}

說明：UI 與計算器應以結構化欄位（minMinutes/maxMinutes/type/offsetMinute）為主，`respawn` 為備註用的 human-friendly 字串。

## 7. 復活計算邏輯（實作細節與範例）

規則：
- fixedMinutes: respawn = killTime + minutes
- rangeMinutes: respawnRange = [killTime + min, killTime + max]
- hourlyOffset: 找到下一個 minute == offset 且 > killTime 的時間點（可能是下一小時或當小時），例如 offset=15 且 killTime=10:20 -> respawn=11:15

實作注意：
- 使用 Date/ISO 處理，輸出要包含日期（跨日情況），例如 23:50 + 60min -> 次日 00:50。
- 若 boss 規則未含結構化欄位，UI 顯示文字並阻止計算（或 fallback 提示）。

範例函式簽名：

calculateRespawnTimes(killISO, bossRule) -> { type, times: [ISO, ...], humanReadable }

## 8. UI 元件清單（對應檔案與小提示）

- Header：日期切換、快速預設今日（`docs/index.html` header）
- Boss 下拉選單（支援搜尋） — 資料來源 `docs/bosses/bosses.json`，若 >50 則加 autocomplete
- 新增擊殺表單（或 modal，欄位按第5節驗證） — `docs/app.js` 中的 form handling
- 當日紀錄表格（排序、編輯、刪除、分頁/載入更多） — 支援 per-boss filter
- 復活計算器：輸入 kill time（預設現在）+ 選 Boss -> 顯示固定或範圍時間

檔案地點（專案慣例）：
- 行為與 helper：`docs/app.js`
- 樣式：`docs/styles.css`
- 靜態資源：`docs/bosses/bosses.json`

開發建議：keep DOM update minimal（只重新渲染受影響區塊），重用 app.js 裡的 CRUD helper。

## 9. 接受準則（Acceptance Criteria）

最低通過標準：

1) 新增紀錄：使用者能選 Boss、按新增，LocalStorage 中新增 record（包含 id、createdAt、version=v1）且 UI 更新。
2) 編輯紀錄：使用者能修改記錄欄位，updatedAt 更新，UI 與 LocalStorage 同步。
3) 刪除紀錄：刪除會從 LocalStorage 移除並從 UI 隱藏。
4) 當天查詢：getRecords({bossId, date=today}) 回傳今天（00:00..23:59:59）該 boss 的所有紀錄。
5) 復活計算：對於 fixed/range/hourly 規則能正確計算（含跨日），輸出 human-readable 與 ISO。
6) 保留策略：當某 boss 紀錄數 > 300，最舊紀錄被自動移除至只剩 300 筆。
7) 表單驗證：channel、looted、boss 等驗證拒絕不合法輸入並顯示錯誤。

## 10. 最小測試集（manual + 自動化建議）

Manual 測試步驟（快速）：

1. 在瀏覽器打開 `http://localhost:8000/docs/index.html`（或 gh-pages）
2. 選 Boss，確認表單 timestamp 預設為現在時間
3. 輸入 channel=1, looted=yes, note='test' -> 新增 -> 檢查 LocalStorage `abt_records_v1` 有此項
4. 編輯該紀錄（改 channel 或 note）-> 檢查 updatedAt 改變
5. 刪除該紀錄 -> 檢查不存在
6. 新增多筆超過 300 筆同一 boss -> 檢查 purge 是否執行（只保留 300）
7. 測試復活計算器（固定 60 分、範圍 45~60、offset=15），包含跨日（23:50 + 60）

單元測試（建議）：
- 寫小型測試檔測試 `addRecord`, `getRecords`, `purgeOldRecordsIfNeeded`, `calculateRespawnTimes`（可用 jest 或簡易 browser-based assertions）

## 11. 邊界案例（Edge cases）

- channel = 0 / 負數 / 非整數 -> 驗證失敗
- LocalStorage 容量不足或 quota exceeded -> 顯示提示並提供匯出
- 跨日（00:00 分界）查詢必須以當地時區正確切分
- Boss 規則缺少結構化欄位（只有 `respawn` 字串）-> 計算器需提示不可用或手動設定
- 多 tab 同時寫入 -> 建議使用 read-modify-write 前再 fetch 最新資料，或簡單鎖定 UI 避免 race condition（瀏覽器環境下可接受小概率 race）

## 12. 資料遷移（若有舊 key）

建議實作啟動時遷移腳本：

- 若發現舊單一 key（例如 `abt_records`），讀取並轉換到 `abt_records_v1`（加入 version、createdAt），然後儲存並記錄遷移結果在 console（或 UI 的 debug 區）。
- 提供 `migrationTool()` 可在 console 直接執行以驗證結果（列出每個 boss record count、檢查 version === 'v1'）。

## 13. 實作任務拆解（Sprint-sized tasks）

每項可做為獨立 PR：

1) 初始化與資料夾確認（小）：檢查 `docs/`、`docs/bosses/bosses.json`，新增 `docs/dev/Dev_doc_v3.md`（本文）。 — 0.5d
2) CRUD helper（LocalStorage module） — add/get/update/delete/purge/export/import + unit tests — 1.5d
3) 新增/編輯/刪除表單 UI（含驗證） — 1.0d
4) 當日紀錄表格與篩選（按 boss） — 1.0d
5) 復活計算器（fixed/range/hourly）與 UI — 1.0d
6) Boss 下拉（搜尋/Autocomplete 若 >50） — 0.5d
7) 樣式與響應式調整（styles.css） — 0.5d
8) 測試與手動驗證、README/部署說明更新 — 0.5d

總估算（小型專案 MVP）：大約 6-7 工作日，視優化與測試深度而定。

## 14. PR/合併檢查清單

- [ ] 包含修改說明與 screenshots（若 UI 有變）
- [ ] 有至少一個單元測試或手動驗證步驟
- [ ] 檢查 LocalStorage key 名稱與 schemaVersion
- [ ] 如變更 schema，包含遷移程式碼與遷移說明

## 15. 本機快速驗證（小提示）

在 repo 根目錄下執行（PowerShell）：

```powershell
python -m http.server 8000
# 瀏覽 http://localhost:8000/docs/index.html
```

## 16. 建議的下一步（non-blocking 改善）

- 新增一個小型的 `migration` helper 並暴露於 console，方便使用者匯入舊資料。
- 加入自動化測試（jest 或 browser-based），覆蓋 LocalStorage helper 與復活計算器。
- 加入匯出/匯入 UI，方便備份大量紀錄以避免 LocalStorage 爆掉。

---

變更紀錄：
- 2025-11-12: 新增 `docs/dev/Dev_doc_v3.md` — 整理 `Dev_doc_v2.md` 與 `SPEC.md`，轉成可執行開發文件與任務拆解。

如需我把部分任務直接實作（例如：LocalStorage helper 與 minimal unit tests），我可以在下一輪開始實作並把變更提交為 PR。
