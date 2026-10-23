# CC0 AKM 本機 3D 模型（2026-10-24）

來源：LonesomeDucky / [OpenGameArt: Weathered AKM](https://opengameart.org/content/weathered-akm-rifle)，CC0。原始 Blender 檔透過安全的 GitHub Actions 流程取得、Zstd 解壓後由官方 bpy 4.5.15 匯出 glTF/GLB。

**實際驗證：44,293,464 bytes，只有 1 個網格、1 種材質、6 張貼圖，沒有可證實的獨立彈匣／槍托／槍管。** 因此只能用於原生 PBR 3D 檢視，不可表示成已能換配件的遊戲精確模型。

已發生的轉檔成功紀錄：https://github.com/waydefu/delta/actions/runs/40024755786

另設「Publish reviewed CC0 AKM preview」工作流程，必須下載上述成功產物、檢查來源、強制 1 網格與 0 可拆分件、壓縮貼圖為 WebP、驗證二進位 GLB 和小於 25MB 才發布 `assets/models/akm.glb`。授權和 checksum 會在 `assets/models/akm-provenance.json` 登記。

**限制：** 渲染資料仍需目視對照遊戲內 AKM 的槍長、機匣與彈匣位置，且尚未完成手機 GPU/記憶體實測。不能拿這個模型偽裝成原遊戲槍模。
## 實際模型發布（2026-10-24）
- 成功 [Blender GLB 匯出](https://github.com/waydefu/delta/actions/runs/40024755786)；成功 [WebP 優化發佈](https://github.com/waydefu/delta/actions/runs/40025116885)。
- 模型已存在 `assets/models/akm.glb`，大小 1,092,960 B（來源 44,293,464 B）。物件數 1、材質數 1、圖片數 6、可確認獨立拆件 0。
- 真實 3D Viewer 會在支援的裝置按需載入，並提供側視角重置、材質／網格模式。分件及遊戲精準幾何需要另外建模與驗收。

## 分件可行性研究（幾何連通區塊）
原始模型為 1 個 AKM 網格，但網格內可能有多個不相連的拓撲區塊。腳本現在以頂點／邊的 union-find 計算每個連通區的頂點數、多邊形數、局部座標包圍盒、表面積與尺寸，結果寫入 `inspection.json.connected_islands` 並印出 `AKM_ISLAND_ANALYSIS`。這並**不等於**已辨識遊戲彈匣；下一步仍需比對位置、材質與實際預覽，不能僅以尺寸與名稱自動分離可換零件。

## 分件候選（2026-10-24）
原始 AKM mesh 具有 28 個彼此不連通的幾何島。依原始 Blender 座標，其中一個島有約 80 頂點、150 個面、約 0.160 × 0.201 m 的 X/Z 外形，位於機匣下方；它可能是完整彈匣。新增嚴格幾何範圍檢查，只在唯一候選吻合時，從原網格拆成 **AKM_Body + AKM_Magazine** 兩個物件，匯出另一個 `akm-segmented-unreviewed.glb` 以及 `magazine-segmentation.json`。這個分件尚未驗收，不會自動取代網站已發布的模型。

## 雙網格幾何視覺驗收與展示（2026-10-24）
- 2026-10-24 Chromium 對照圖片：`draft-parts-3d.png` vs `draft-mag-hidden.png`，只消失完整彎曲彈匣，機匣／扳機／槍托仍完整。GitHub Actions [影像驗收](https://github.com/waydefu/delta/actions/runs/40026932830) 成功；原始分件 [Blender](https://github.com/waydefu/delta/actions/runs/40026606857)。
- 已改以來源清楚的 `assets/models/akm-parts-candidate.glb` 兩網格模型做常規 3D 展示；有一個 960ms 非循環、可取消的 3D 彈匣退出復位示範，使用真實 GLB 節點平移，不動改槍數值。
- 這是**幾何上的分件已驗證**，但遊戲內配件裝卸軸、掛載點、槍托／槍管更換能力和所有數值仍不具備驗證；不可視為正式模組化遊戲槍模。

## 3D 彈匣動畫驗收
- 真實 Playwright Chromium **1440×900、390×844** 及 `?partReview=1` 三種情境皆通過：<https://github.com/waydefu/delta/actions/runs/40027320914>。GLB 顯示 `AKM_Body` + `AKM_Magazine`，可旋轉、重置、單擊觸發約 960ms 彈匣退出與回位，無 JS 錯誤。
- 動畫只在使用者手動點擊後執行；離開 3D 畫面時應取消影格、復原零件位置並釋放 GPU。`prefers-reduced-motion` 關閉連續平移。
- 仍屬**拓撲與視覺分件校準**，不是完整 AKM 遊戲配件替換：沒有官方模型節點、裝配接口與遊戲可驗證的動畫軸。
