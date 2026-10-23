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
