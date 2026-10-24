# 2D 工作台效能研究與採用決策（2026-10-24）

狀態：研究先行、P1 工程修復中；並非 ACFH 電影級背景完成。基準：合併治理 PR #1 後的 `main` 4b0967bf09c978d5eaf3aa97521e069cdf985f84。

## 研究來源及取捨

- [Active Theory 技術文章](https://medium.com/active-theory/the-story-of-technology-built-at-active-theory-5d17ae0e3fb4)：強調針對需求建立工具、降低 CPU 額外工作；不移植其專有 Hydra。
- [MDN WebGL 最佳實務](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)：資源釋放、控制緩衝尺寸、context lost、避免閒置期耗用 GPU。
- [web.dev 高效 CSS 動畫](https://web.dev/articles/animations-guide)：優先 transform/opacity、用 DevTools 證實是否觸發 Paint；避免任意添加 will-change。
- [MDN 效能基礎](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Fundamentals)：以動畫幀時機安排工作，避免不用時持續運算。
- [Google Core Web Vitals](https://web.dev/articles/vitals)：LCP ≤2.5s、INP ≤200ms、CLS ≤0.1（p75），仍待真機量測。

## 經程式核對的觀察

- `src/studio-light.mjs` 原本每次初始化 `initGunsmith` 都先呼叫 `getContext("webgl2")`，手機或完全沒操作時仍配置 GPU 資源；並不是現有場景保持常駐 RAF。
- CSS `.bench-canvas` 已提供不依賴 WebGL 的底色；AKM 2D SVG、選單、研究試算與 WebGL 光效沒有資料上的耦合。
- 現有前景光效只有在 slot hover / focus 後才運動約 360ms；適合改為首次互動按需啟用，而不是更換渲染引擎。
- `src/motion.mjs` 已有站內動效開關與 prefers-reduced-motion；新增光影生命周期應共同遵守它。
- 3D GLB / Three.js 本來就選擇後動態載入，這批不改其模型或幾何。

## 這批決定與回退

1. 2D 工作台初始化時 **不建立 WebGL canvas/context**；首次桌面交互且動效啟用才建立。
2. <=760px 螢幕與 reduced motion 不使用 WebGL 光效，保留完整原生 DOM、2D SVG、配件槽與 CSS 底色。這是 V1 的主動效能政策，不代表所有手機均不支援 WebGL2。
3. 離開可視區、頁面轉到背景、站內關閉動效或從寬螢幕轉窄螢幕時釋放 canvas、buffer、program、WebGL context；回到頁面後只在下次實際互動時重新建立。
4. WebGL 不可用時應安靜退化；測試確認桌面、390/360 手機、reduced-motion、強制無 WebGL 的抽屜與 Escape/焦點回歸。
5. 本批不改 AKM 比例、彈匣、遊戲資料、3D 內容與 ACFH 正式造景，以便容易獨立回退。

## 驗收與限制

- `node --test tests/*.test.mjs`：純函數與資源生命週期 mock。
- `node scripts/p2-2d-browser-check.mjs`：Playwright Chromium 真瀏覽器操作；需 Playwright / Chromium，並與現有 P1 browser check 一起在 visual-smoke workflow 檢驗。
- `node scripts/governance-check.mjs`、GLB SHA256 保護和語法測試不得退步。
- 這只能證明效能機制與功能回歸，**不代表已取得 POCO F8 Ultra 真機 FPS、耗電、發熱、LCP/INP/CLS p75 數值**。正式 ACFH 光影升級仍需單獨性能基準與視覺比對。
