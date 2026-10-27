# ACFH 2.2｜真正的 3D 分件稽核、資產引入門檻與幾何檢視

本階段延續 V2.1 真實 Three.js 光影。使用者要求進一步追近 Active Theory 類型的視覺完成度，下一個真瓶頸是分件高品質的 GLB 資產，而不是持續增加 CSS 特效。

## 交付能力

- `src/model-topology.mjs`：只授權已核實的 `AKM_Body`、`AKM_Magazine` 兩個獨立網格。把 **「網格能獨立顯示」** 與 **「已備有真實替換款模型」** 分開。現有模型可檢視的彈匣為 1 件，但**可替換的配件型號仍是 0**。
- `src/local-viewer.mjs`：讀取實際 Three.js mesh 陣列建立 topology；只有核准的 `AKM_Magazine` 可以透過「單看彈匣幾何」真實隱藏其餘槍身，並一鍵還原，禁止聲稱其它槍口與槍托可拆；同時不觸碰遊戲數值。
- `src/model-reference.mjs`：原生 3D 檢視器新增「檢查 3D 分件」，讓使用者看真實網格數量、材質數量、節點名稱、可分離和未可分離類別，並連結原作者及 CC0 來源。全部使用 DOM，可用鍵盤及觸控操作。
- `scripts/audit-segmented-glb.mjs`：原生 Node GLB binary JSON chunk 解析。檢查 2 種本地 GLB 的來源、SHA256、檔案大小、實際網格／節點、材質／圖片／貼圖、估計三角面與是否出現未審核的分件。**不依賴 Blender、網路或 GPU**。CI 會跑這個工具。
- `data/research/akm-3d-asset-acquisition.json`：記錄高品質模型候選、原作者、授權聲明、哪些分件只來自描述、取得原檔的限制，以及能否公開發布。
- Playwright 桌面及手機會實際點「檢查 3D 分件」與「單看彈匣幾何」，確認遮罩真的移除／還原槍身幾何並不影響其它 3D 功能；純 Node 假網格測試則確保假槍托、假槍口、錯誤拓樸無法成為已驗證資料。

## 資產證據與分件限制

目前真正發布在專案內的模型來源為 [LonesomeDucky 的 Weathered AKM](https://opengameart.org/content/weathered-akm-rifle)，OpenGameArt 明列 CC0。

- `akm.glb` 是**原始 3D 展示 GLB**：1 個網格，無經核實可更換部位。
- `akm-parts-candidate.glb` 是已進行本地彈匣幾何拆分的研究模型：2 個網格（`AKM_Body`、`AKM_Magazine`），**1 種材質**。幾何獨立≠已確認遊戲掛點，也不代表存在 40 發、70 發、不同槍托或消音器模型。
- 「真正換裝」還需要數個**外觀正確、可對位**的獨立網格／替換款，及依武器結構核實過的 attachment sockets；這次沒有根據通用名稱或猜想生成假的 3D 零件。

## 外部模型研究

- [GAMICO 高品質 AKM（Sketchfab，CC BY）](https://sketchfab.com/3d-models/akm-assault-rifle-high-quality-3d-game-asset-4de981b588194d42bdea5ff8a2b80d0e)：頁面標明約 10.1k triangles，作者說 trigger／保險／彈匣／槍機可獨立操作，**未能由列表確認槍托與槍口的獨立替換款**。原檔尚未合法下載與檢查，因此不取代目前 CC0 GLB。
- [Ag72 AKM（Fab，標示 Free）](https://www.fab.com/listings/54921e31-5077-4ad8-9d5a-7b8bdd6ac7d3)：宣稱分件並有 4K 貼圖，GLB 格式可用；但必須取得帳戶允許的原檔、核對具體授權條款及各物件階層，不直接公開轉載。
- [Gaurav Verma 模組化 AKM（ArtStation）](https://www.artstation.com/marketplace/p/8Gzj0/akm-assault-rifle-3d-model-game-ready-lowpoly-pbr-fbx-obj-blend-low-poly-3d-model)：有明確分件與多套 PBR 質感貼圖，屬付費用途；未購得許可前不可匯入公用 GitHub。

詳情見 `data/research/akm-3d-asset-acquisition.json`。第三方展示圖不能當成本網站已可使用的真實模型。

## 下一個真正有質感的里程碑

需要取得獲允許使用且能通過來源審核的高品質 AKM GLB／Blender 原始檔，確認材質分離、正確槍口與槍托的本體獨立幾何、掛點座標。模型到位後，才能開啟按研究配置挑選零件的真實 3D 換裝，同時維持手機幀率。

此階段已完成**自動稽核與已知真正幾何分離的可視化**，不是宣稱新的高畫質、全模組化 3D 資產已完成。
