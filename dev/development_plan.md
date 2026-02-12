# 開發計畫 — 快速紀錄功能集

目標：為專業玩家提高紀錄 Boss 擊殺的速度與便利性，實作以下功能：

- Quick Kill API（一鍵紀錄）
- 全域鍵盤快捷鍵（數字鍵、方向鍵、Enter、K 快速紀錄）
- 記住最近使用的 `channel`（lastChannel）
- Quick Presets（儲存 Boss+Channel 範本，一鍵套用）
- 非阻塞刪除 + 撤銷（Undo toast）

每個功能會包含驗收準則、實作檔案與優先順序。開發流程採迭代方式：先實作高回報低成本項目，再處理中高成本項目。

時間表（建議）：
- 第 1 天：Quick Kill API、鍵盤快捷鍵、lastChannel（高優先）
- 第 2 天：Quick Presets、UI 按鈕、樣式（中等）
- 第 3 天：非阻塞刪除 + Undo、Toast queue（中等）

參考實作位置：
- 主要邏輯： `docs/app.js`
- UI： `docs/index.html`, `docs/styles.css`
- 開發文件與規格： `dev/feature_spec.md`

若需要我將變更拆成多個 PR，我可以依功能建立對應的 commit 與說明。
