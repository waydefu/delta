# ACFH V1.3 — Integrated Armory Workspace（2026-10-24）

## 理念

**主體 > 操作 > 數據 > 證據**。先讓使用者看清 AKM，再選擇槍身部位、比較現有配置與候選效果；只有真正需要輸入與警示的區域才需要封閉框。

這一版不重畫槍型、不引入 3D/新動畫框架、不修改已核對或未核對的遊戲數值。仍標示此 AKM 2D 為示意圖，不冒充正式模型。

## 研究參考

- [Codrops: Inside Bisous (2026-06-29)](https://tympanus.net/codrops/2026/06/29/inside-bisous-designing-an-editorial-experience-for-cinematic-cgi/)：統一構圖網格、限制色彩與字型、編輯式閱讀節奏，讓主體視覺而非卡片成為焦點。
- [MDN: View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)：同頁局部 DOM 狀態轉換可漸進增強；其焦點管理與動畫偏好須另外處理。**本版先不用這個 API**，避免把純配件工具變成轉場展示。
- [web.dev: Optimize INP](https://web.dev/articles/optimize-inp)：避免互動長任務和無關重繪，良好 INP 以 p75 <200ms 為目標；**本次沒有真實流量實測**。
- [MDN: content-visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/content-visibility)：深頁面非可見內容可延後渲染，但可用性與錨點需要測量，未在這批直接全站啟用。
- [Active Theory](https://activetheory.net/)：學其狀態化互動與場景統一，不使用其專有素材或引擎。

## 設計決策

- `index.html` 增加單一 `armory-experience`：Hero、改槍工作台、四項性能、彈藥概況同一段敘事式版面。
- `src/gunsmith.mjs` 裝配槽仍為真實按鈕，維持資料狀態（可選／已安裝／待建檔／需掛載）。11 個按鈕搬到獨立 `nav.bench-slot-rail`，不再壓到 AKM SVG 上。
- 大螢幕：左側不受卡片遮擋的 2D 槍械舞台；右側精簡 Inspector Rail。右側每項由原生 DOM 的 click/焦點事件繼續打開配件抽屜。
- <=1000px：右側 Rail 轉移至槍下方，每列仍是原生可點擊按鈕；<=620px 為三欄，沒有緊貼槍身的小標籤。
- 鍵盤：Tab 進入槽位；上下鍵相鄰切換焦點、Home/End 到首末槽；Enter/Space 原生啟動。Escape 抽屜與焦點還原延用現有功能。
- 3D 仍可主動開啟，但 V1.3 不更動 GLB 或第三方模型。切到 3D 時隱藏 2D Inspector Rail，維持原有 3D 導覽按鈕。
- `assets/main.css` 只在現有單一生產樣式內**替換**原 V1.2 美術塊；維持共用變數、可縮放的 2D SVG、平靜的低反射場景，不引入大面積 backdrop blur 或無限動畫。
- 研究狀態、配件警告和可追溯資料原封保留。

## 驗收條件

- `node --test tests/*.test.mjs` 必須通過現有資料模型／治理測試、SVG 幾何對照與新增布局測試。
- `node scripts/p2-2d-browser-check.mjs` 驗證 1440×900、390×844、360×800、reduced-motion、無 WebGL；要求 11 個部位存在、右側導覽不遮槍、手機導覽不壓在槍上、不水平溢出、按鈕能開關抽屜與恢復焦點。
- 擷取 desktop/mobile viewport 與 full-page 證據，與使用者先前的 V1.2 畫面比較；機械 CI 綠不等於美術已達 Active Theory 完成度。
- 3D smoke 保留驗證，避免 2D 修改誤傷既存選用功能。
- 沒有 POCO F8 Ultra 真機 FPS、熱降頻、電量與 Core Web Vitals p75 資料，不能宣稱已達標。

## 下一步（不在本 PR）

真正重畫高精度 AKM SVG 外形與配件分層；配件切換實際視覺更換；進階的畫面細節、字體校正與低階 Android 真機監測。
