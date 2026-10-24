# AKM 配件補齊・第二批：槍口與槍托（2026-10-24）

## 研究範圍與可信度

以使用者指定的 [Delta Force Tools 槍口目錄](https://deltaforcetools.gg/tw/wiki/attachment/muzzle) 與 [槍托目錄](https://deltaforcetools.gg/tw/wiki/attachment/stock) 對照，以及 GameGrids 各單件配件 2026-09-23（標示由 dfm/object.list 轉載）的 ID、名稱、面板效果、重量、品質、占格資訊，新增 **3 件槍口 + 7 件槍托**。第一批 35 件擴充為 45 件，包含 16 種槍口及 14 種槍托。

**這不是 2026 手遊 AKM 逐件裝備驗證。** GameGrids 的武器相容清單是以相同槽位類型推導，而不是遊戲中 AKM 物件與配件的實裝關係。所有新項維持 `dataStatus=community-unverified`、`confidence=slot-inferred`、`platformValidated=false`、`parameterValidated=false`，只能在研究模式作假設試算，strict mode 拒絕。站內的 `compatibleWeapons:["akm"]` 是供 **研究模式假設選擇** 的既有欄位，不可讀成實裝認證。

## 新增槍口（來源個別詳頁）

| ID | 名稱 | 後座 | 操控 | 據槍 | 腰射 | 重量 kg | 等級 |
|---:|---|---:|---:|---:|---:|---:|---:|
| 13130000178 | [鳥籠消焰器](https://gamegrids.io/delta-force/zh/attachments/birdcage-flash-hider/) | +2 | — | +1 | — | 0.71 | 2 |
| 13130000182 | [餘燼消音器](https://gamegrids.io/delta-force/zh/attachments/ember-suppressor/) | +10 | -4 | +4 | -8 | 0.80 | 4 |
| 13130000201 | [OPS 消音器](https://gamegrids.io/delta-force/zh/attachments/ops-suppressor/) | +10 | -8 | -3 | — | 0.70 | 3 |

餘燼與 OPS 另有社群文字效果「槍聲抑制：弱」；因未能從正式面板驗證遊戲表現，**只以 qualitativeEffects 儲存，不加入數值計算**。

## 新增槍托（來源個別詳頁）

| ID | 名稱 | 後座 | 操控 | 據槍 | 腰射 | 重量 kg | 等級 |
|---:|---|---:|---:|---:|---:|---:|---:|
| 13040000182 | [AK19 槍托](https://gamegrids.io/delta-force/zh/attachments/ak19-stock/) | +6 | +4 | -2 | -8 | 0.10 | 3 |
| 13040000225 | [QR 高性能後托](https://gamegrids.io/delta-force/zh/attachments/qr-high-performance-rear-stock/) | +3 | -2 | +3 | +16 | 0.53 | 2 |
| 13040000105 | [實用戰術槍托](https://gamegrids.io/delta-force/zh/attachments/practical-tactical-stock/) | +4 | — | — | — | 0.54 | 2 |
| 13040000104 | [實用穩定槍托](https://gamegrids.io/delta-force/zh/attachments/practical-stable-stock/) | +2 | — | — | — | 0.53 | 2 |
| 13040000106 | [實用輕型槍托](https://gamegrids.io/delta-force/zh/attachments/practical-lightweight-stock/) | — | +2 | — | — | 0.47 | 2 |
| 13040000009 | [核心導軌槍托](https://gamegrids.io/delta-force/zh/attachments/core-rail-stock/) | +2 | +2 | — | — | 0.47 | 2 |
| 13040000110 | [UR 特種戰術槍托](https://gamegrids.io/delta-force/zh/attachments/ur-special-tactical-stock/) | +8 | -4 | +4 | — | 0.52 | 4 |

「—」是該來源沒有非零修正，不代表 AKM 真機裝備結果保證為零。等級 2/3/4 分別是資料站的物品品質，不是證據可信度。快拆資訊只記錄其物品來源標示，不代表所有平台都支援。

## 槍托墊／托芯／轉接座：維持隔離

[AK 槍托緩衝墊](https://gamegrids.io/delta-force/zh/attachments/ak-stock-recoil-pad/)（13240000006，後座 +3、操控 -3、據槍 +1）在第三方被歸為大類「槍托」，但網站目前有獨立 `buttpad` 槽。僅靠名稱和類別不能確認其原生掛載關係，故保留 `researchOnly=true`、`mountValidation=unresolved`、**禁止裝備、禁止試算**。單獨記錄於 `data/research/akm-stock-mount-audit.json`；任何可能的轉接件、前置槍托與互斥關係，沒有當期手機改槍介面證據一律不開放。

## 交付與檢查

- 45 件已整理候選，全名及研究警示顯示於原有右側搜尋式選單；左側即時試算沿用單一 engine。
- 更新 `data/research/akm-coverage.json`，並保留 2024 歷史與兩筆跨來源衝突；仍有 **0 件手機版逐件驗證**。
- Node 對 10 筆物品 ID、數值、來源、唯一性、嚴格模式及 AK 槍托墊隔離測試。
- Chromium 桌面與 390px 手機：驗證 16 槍口、14 槍托＋「不安裝」選項，搜尋並裝備新增的餘燼消音器與 AK19 槍托，確認右側實名與左側變動。360px、reduced-motion、無 WebGL、原有 3D 回歸照常跑。
- 遺留：還沒有當期行動版逐件實裝相容性，沒有確認槍托墊父子掛點，沒有其餘全武器配件的逐件 AKM 驗證，因此**不可宣稱「所有槍口／槍托都已經補齊」**。

發布流程：PR → CI 全綠 → squash merge。
