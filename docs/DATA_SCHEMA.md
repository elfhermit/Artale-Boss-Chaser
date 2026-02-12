
# Data Schema Documentation

本專案使用 LocalStorage 儲存使用者資料。主要使用的 Key 如下：

## 1. 擊殺紀錄 (`bossKillHistory`)

儲存型別：`Array<KillEntry>` (JSON String)

### `KillEntry` Object

| 欄位 | 型別 | 說明 | 範例 |
|------|------|------|------|
| `id` | String | 唯一識別碼 (Timestamp-based) | `"kill-1707724800000"` |
| `bossId` | String | 對應 Boss ID | `"boss-1"` |
| `killTime` | String | 擊殺時間 (ISO 8601) | `"2024-02-12T12:00:00.000Z"` |
| `channel` | Number | 頻道編號 | `1` |
| `hasDrop` | Boolean | 是否掉寶 | `false` |
| `notes` | String | 備註 | `"隊友A, 隊友B"` |

## 2. 快速範本 (`quickPresets`)

儲存型別：`Array<Preset>` (JSON String)

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | String | 唯一識別碼 |
| `name` | String | 範本顯示名稱 |
| `bossId` | String | Boss ID |
| `channel` | Number | 頻道 (單一) |
| `channels` | Array<Number> | 頻道列表 (批次) |

## 3. 其他設定

- `theme`: `String` ("light" | "dark") - 介面主題
- `lastChannel`: `String` - 上次輸入的頻道
