# DELTA LAB — AKM 槍械研究原型

《三角洲行動》改槍計算網站第一版，以 **AKM** 驗證槍械資料、配件相容性、面板試算與彈道研究流程。**並非官方網站。**

## 直接體驗

網站為原生 HTML / CSS / JavaScript，不需要 Node 套件、資料庫或 API 金鑰。

```bash
python3 -m http.server 8000
# 瀏覽 http://localhost:8000
```

如果開啟 GitHub Pages，選擇 **Deploy from a branch → main / (root)** 即可使用 `https://waydefu.github.io/delta/`。本專案尚未代為開啟 Pages；原始 GitHub 檔案頁不是可執行的網站。

## 已完成

- AKM 裸槍基礎面板：傷害、護甲傷害、射速、初速、射程、操控、後座力、穩定性、腰射
- 9 件示範配件：4 個 AKM 槍管、2 個 AK 槍口、3 個 AK 槍托
- 槽位檢查、同槽排他、屬性修正、連結分享
- 理想飛行時間 `t=d/v` 與無甲 TTK 示意；**不宣稱有真實子彈下墜與後座力模型**
- JSON 版本來源紀錄、Node 原生單元測試、GitHub Actions CI

## 精確度與限制

1. `data/weapons/akm.json` 記錄研究來源、數據與平台狀態。當前資料並未以 **2026-10-23 手遊實機** 全面核對。
2. 配件 `confidence: weapon-named` 僅代表名稱明確指向 AKM；`slot-inferred` 只代表其他網站根據槍械槽位推導相容性，**不可視為已證實可安裝**。
3. 面板固定值採用逐項加總；射程/初速百分比暫時對裸槍基準做**加總**後相乘。遊戲內真實的配件疊加、精校、上限、顯示取整尚未校準，特別是當同時裝多個百分比配件時。
4. 遊戲原始數值可能隨版本、模式、PC/手機平台或隱藏機制而改變。本專案沒有得到已驗證的重力、阻力、散布與連射後座力參數。
5. 網站展示的 TTK 忽略裝甲、命中部位、彈藥品質與飛行時間；不得用來預測實戰擊殺。

## 來源

- [Delta Force DB / AKM](https://deltaforcedb.com/weapon/akm)
- [GameGrids / AKM](https://gamegrids.io/delta-force/zh/weapons/akm/)
- [GameGrids / AKM 性能槍管](https://gamegrids.io/delta-force/zh/attachments/akm-performance-barrel-assembly/)
- [GameGrids / AKM 實用長槍管](https://gamegrids.io/delta-force/zh/attachments/akm-practical-long-barrel-assembly/)
- [DeltaForceData / 原始槍械資料](https://github.com/jiansenc/DeltaForceData)（歷史資料 2024；僅作交叉比對）
- 完整單件配件來源存於 `data/attachments/akm-sample.json`

每筆第三方數值均以人工挑選與欄位重建方式收錄，不直接複製上游程式碼或圖片。不同第三方數值衝突時，優先使用相對較新的可查資料，但仍必須實測確認。

## 檔案

```text
index.html                     靜態網站
assets/styles.css              響應式介面
src/app.mjs                    前端資料讀取與控制
src/engine.mjs                 純計算引擎
data/weapons/akm.json         AKM 槍械面板、來源
data/attachments/akm-sample.json   配件與來源
data/sources.json             來源及模型假設
tests/engine.test.mjs         計算與輸入防呆測試
.github/workflows/ci.yml      GitHub Actions
```

## 驗證

```bash
node --test tests/*.test.mjs
node --check src/app.mjs
node --check src/engine.mjs
```

下一步：實機確認相容性、建立遊戲版本快照、拍攝無壓槍重複射擊樣本以擬合真正後座力曲線。

## 改槍台與實機截圖（2026-10-23）

- **互動槍械示意**：中央 AKM 向量側視，四周有 11 個依照玩家實機截圖對位的配件槽。點選可打開側邊配件選單。
- **目前可以選裝**：槍管、槍口、槍托（9 件研究樣本）；其他槽位點擊後顯示「配件資料建置中」，不造假。
- **詳細屬性**：新增基礎傷害、後座力、操控、穩定性、腰射五組實機裸槍數據；完整 JSON 於 `data/weapons/akm-details.json`。
- 不會公開玩家截圖原圖或畫面內 UID。側面示意是本專案自製 SVG，並非官方 3D 槍模。
- **仍待實測**：配件相容性、改裝後的 ADS/換彈時間、實際連射後座力軌跡及傷害衰減轉折點。

這是以實機資料驅動的**研究原型**，尚非完整遊戲改槍模擬器。

## 2026-10-23 改槍 UI 與掛載依賴引擎

- 改為深色專業軍械庫 HUD：層次化武器頁首、對照指標、槍械視覺舞台、手機槽位網格與圖表區。
- 加入後座力控制來源分析、研究性的掛載關係視覺、恆速飛行時間裸槍與當前配置折線比較。
- `src/attachment-graph.mjs` 支援資料驅動的父配件 `providesSlots`、多層掛載、拆除父配件後清理失效子配件；有自動測試。
- **注意**：AKM 現行配件資料未提供已實機驗證的子槽位屬性，因此不會憑空讓前握把或瞄具變成可裝；加入有來源的 `providesSlots` 與配件資料後，系統會自動啟用。
- 圖表是恆速飛行假設，不是實機彈道或後座力落點；後座力貢獻視覺基於當前社群面板數值。

## 動效／設計／比例校準（2026-10-23）

- AKM 側視圖已按使用者提供的實機畫面重新構建前段、機匣、槍托比例，並保持 SVG 長寬比；詳見 DESIGN.md 及 data/weapons/akm-geometry.json。
- 配件選單包含切換預覽、進退場、鍵盤 Esc、手機下滑關閉、已安裝槽位強調、數值圖表動效與手動關閉動效。
- 設計與動效規則分別存放 DESIGN.md、docs/MOTION.md。相關 Skill 來源與安裝腳本 scripts/install-agent-skills.sh 可供自行檢視。
- **限制**：未安裝第三方 Skills 到使用者本機 Agent；亦未導入 GSAP / Motion / Three.js 到網站 runtime。獨立網站目前使用原生 Web Animations API。
- 真正原生 3D 槍械模型、實際彈道／後座力曲線仍須合法素材與遊戲實測。
