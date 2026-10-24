# ACFH V1.2 — Editorial Armory / 美術重構

日期：2026-10-24。範圍：**網站美術與資訊架構；不變動 AKM SVG 幾何、配件公式或 3D 模型。**

## 研究依據

- Codrops / Beaucoup, [Inside Bisous: Designing an Editorial Experience for Cinematic CGI](https://tympanus.net/codrops/2026/06/29/inside-bisous-designing-an-editorial-experience-for-cinematic-cgi/)：透過嚴謹的網格、受限制的色彩/字級、編輯式構圖，把大幅影像與使用者動作放在首位；不等於引入它的動畫套件。
- Codrops, [Juan Mora Romero ’26](https://tympanus.net/codrops/2026/10/22/juan-mora-romero-portfolio/)：自述多次迭代首屏版面，限制字級選項，透過 1/4 與 3/4 的編輯式網格組織內容。
- [web.dev: high-performance animations](https://web.dev/articles/animations-guide)：非必要避免動畫化會引起 Layout/Paint 的屬性；優先 transform/opacity，切忌濫用 will-change。
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion)：尊重減少動態效果需求。
- [web.dev: Web Vitals](https://web.dev/articles/vitals)：LCP、INP、CLS 真機第 75 百分位，**尚未實測，不可冒充通過**。
- [Active Theory](https://activetheory.net/)：參考敘事式場景/品牌沉浸感，不拷貝其專有視覺、程式碼或素材。

## 來源畫面診斷（使用者 2026-10-24 三張截圖）

目前視覺是單色矩形的大量重複：11 個掛點都像不透明卡片、四個性能 KPI 各有深色框、配件組裝與試算又各自包上大型框。全部都重要 = 沒有視覺焦點。另 AKM SVG 形狀精準度不足，是**不同的圖形工作**，本批不得藉「美術優化」擅自重畫。

## 應用規則

- **One stage**：槍械／環境連成一個主要展台；不在上面放 11 個深色實體 UI 方框。桌面改為無背景輕量標註（border-left）、點擊/鍵盤聚焦再顯示有明顯對比的選中狀態。
- **Type over surface**：四大數值由卡片改為等寬數據列，靠排版、字級、對齊、細分割線，不靠陰影標示重要性。
- **Open data regions**：CONFIGURATION / STATS 欄位由無限背景盒子改成共用欄線；警告/真正會編輯的輸入繼續保有邊界。
- **Reading order**：槍械 → 四大性能 → 彈藥 → 細節 → 組裝 → 模型分析及研究來源，減少前後跳轉。
- **Material truth**：不添加假金屬 specular、彩色霓虹邊、漂浮塑膠面板。背景是低對比的原創 2D 場景；保留現有 CSS/必要時一次短暫的非連續 WebGL。
- **Mobile**：<=1000px 槽位為可點擊的普通列表，<=620px KPI 保持二欄；配件槽 `min-height:57px`，抽屜仍由現有 DOM 交互。
- **Legacy consolidation**：生產只引用 `assets/main.css`，本批直接**替換**既有 ACFH V1 尾段，不在尾端堆疊第二套 ACFH 美術；舊基礎樣式的全面模組化需在視覺驗收後分開進行，避免本次重構混入破壞性刪除。

## 自動驗收（不可代替審美審稿）

- 單元測試確認 DOM IDs、內容順序、SVG 靜態資產、無分別伸縮槍模；
- Chromium 桌面／360／390 手機、reduced-motion、無 WebGL、抽屜 Escape+焦點還原；
- 在 Chromium 讀取計算樣式，確認 performance、configuration 是透明開放版面，桌面槽位無卡片上框、手機 touch target >=44px；
- Browser evidence 截圖保存於 Actions Artifact，供**人工檢視是否真正去掉塑膠卡片感**；CI 綠僅確認機械條件。

## 不包含

- 不修改 2D AKM 輪廓（槍管、木護木、機匣、握把、槍托與彈匣的重繪仍為單獨工作）；
- 不新增 PBR / GLB、3D shader、heavy blur、粒子引擎；不填入缺乏驗證的配件數值；
- 不能宣稱已通過 POCO F8 Ultra 真機熱降頻、續航與 Core Web Vitals p75 實測。
