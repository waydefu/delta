# AKM 彈匣資料補齊與交叉查證 — 2026-10-24

本次以使用者指定的 [Delta Force Tools 繁體中文彈匣分類](https://deltaforcetools.gg/tw/wiki/attachment/mag) 作為清單確認來源，搭配 GameGrids 2026-09-23 轉載資料、現有 2024-12-21 公開歷史快照。**僅更新 AKM 彈匣資料**，不擅自把整個遊戲彈匣庫宣稱為 AKM 相容。數值與模式可能隨遊戲更新改變；未取得 2026 手遊對每件配件的實機裝備核對。

## 已收錄 AKM 名稱明確的三件彈匣

| 名稱 | 物品 ID | 容量（絕對值） | 操控修正 | 重量 | 格數 | 品質 | 快拆 | 換彈懲罰 |
|---|---:|---:|---:|---:|---|---:|---|---|
| AKM 30 發聚合物彈匣 | 13120000313 | 30 發 | +4 | 0.13 kg | 1×1 | 2 | 是 | 頁面未列懲罰 |
| AKM 40 發延長彈匣 | 13120000239 | 40 發 | −8 | 0.17 kg | 1×2 | 3 | 是 | 有，但未能核實秒數 |
| AKM 70 發大彈鼓 | 13120000241 | 70 發 | −15 | 0.32 kg | 2×2 | 3 | 是 | 有，但未能核實秒數 |

來源詳頁（**第三方轉載，並非玩家手遊裝配認證**）：
- 30 發：[GameGrids](https://gamegrids.io/delta-force/zh/attachments/akm-polymer-30-round-magazine/)、[Delta Force Tools](https://deltaforcetools.gg/tw/wiki/attachment/AKM%2030%E7%99%BC%E8%81%9A%E5%90%88%E7%89%A9%E5%BD%88%E5%8C%A3)
- 40 發：[GameGrids](https://gamegrids.io/delta-force/zh/attachments/akm-extended-40-round-magazine/)、[Delta Force Tools 英文分類](https://deltaforcetools.gg/wiki/attachment)（中文詳頁未取得完整效果，名稱可從索引確認）
- 70 發：[GameGrids](https://gamegrids.io/delta-force/zh/attachments/akm-large-70-round-drum/)、[Delta Force Tools](https://deltaforcetools.gg/tw/wiki/attachment/AKM%2070%E7%99%BC%E5%A4%A7%E5%BD%88%E9%BC%93)

## 價格：僅封存有日期的快照，不是假裝即時行情

| 品項 | 快照價格（哈夫幣） | 快照日期 | 來源 |
|---|---:|---|---|
| 30 發聚合物 | 3,334 | 2026-09-23 | GameGrids |
| 40 發延長 | 24,127 | 2026-09-23 | GameGrids |
| 70 發彈鼓 | 36,593 | 2026-10-06 | GameGrids |

市場變動快速，因此 UI 明確標示「歷史價格」及日期，不把過去快照當成當日價格。沒有去抓外部網站價格到現場演算。

## 數值語義與品質閘門

- 第三方頁面將「容彈量 +30 / +40 / +70」呈現為效果；本站使用 **magazineCapacity 的絕對覆蓋**（不是裸槍 30 再相加）；30、40、70 分別是裝備後的容量。
- 2026 效果數值與 2024 歷史資料一致，故以 2026-09-23 為目前採用的社群候選版本，同時保留 2024 historicalComparison，方便將來回溯。
- `platformValidated=false`、`parameterValidated=false`、`dataStatus=community-unverified`；未有手遊逐件裝配／裝配後完整面板證據，不可提升為 verified。
- **GameGrids 明寫其「55 把可裝武器」是按照槽位類型推導，不能當作 AKM 對每一款通用彈匣的硬相容證據**。
- 有「換彈時間懲罰」但無可靠秒數，故只保留文字說明，**不發明重裝秒數，也不導入錯誤的 TTK／裝填模擬**。
- 容量以外的擴散、槍管彈道、重量影響、3D 外觀切換等，來源不足就不填。

## 尚待證實：AK762 木色 30 發彈匣

GameGrids 另有 [AK762 30 發木色彈匣](https://gamegrids.io/delta-force/zh/attachments/ak762-30-round-magazine-wood/)（物品 ID 13120000240、30 發、操控 +2、0.17 kg、1×2、品質 2、可快拆）。然而其「相容 AKM」宣稱依賴通用槽位推論，未取得手遊 AKM 實機裝配證據；因此寫入 `data/research/akm-magazine-quarantine-2026.json`，**不加入正式候選選單，也不進行面板計算**。

## 產品展示及驗收

- `src/gunsmith.mjs` 選擇彈匣時可看容量、重量、格數、品質、快拆、換彈懲罰與來源可信度；只展示有日期的歷史行情。
- Node 測試查三筆資料、來源與日期、2024 歷史比較、嚴格模式拒絕未驗證配件、30／40／70 發容量覆蓋與操控速度、禁止研究隔離品項裝配。
- Playwright 會點選 70 發彈鼓，確認彈匣資訊可見、選擇後右側顯示實名且左側同步更新。
- 若要真正達到手遊 verified，必須另取得逐件裝配、裝配後屬性與更新版本的實機截圖（不得只憑相同槽位或他站演算法）。
