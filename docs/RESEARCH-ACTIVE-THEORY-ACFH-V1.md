# Active Theory × DELTA LAB：ACFH V1 設計工程研究

- 日期：2026-10-24
- 狀態：研究完成；**尚未啟動 ACFH V1 網站視覺實作**。
- 產品界線：2D AKM 優先，3D 暫緩；保持 `src/engine.mjs`、`src/data-governance.mjs` 既有資料與計算信任模型。

## 實際參考與可信度

- [Active Theory 官網](https://activetheory.net/)：作品展示入口，實際畫面、效能依裝置與版本變動；本文不宣稱已對 2026 正式站做效能採樣。
- [Active Theory V5 官方舊站](https://v5.activetheory.net/)：展示多環境敘事與高度整合的創意開發。
- [The Webby Awards：Active Theory V5](https://www.webbyawards.com/crafted-with-code/active-theory/)：團隊稱 V5 以 WebGL、自家 Hydra 框架建構。這是歷史案例，不能推導所有現行版本的實作細節。
- [Communication Arts 訪談](https://www.commarts.com/webpicks/active-theory-2)：團隊說明約兩個月開發、約八成時間用於打磨，以及偏向 state-based JavaScript 的交互組織；這是訪談自述。
- [Active Theory XR Experiments](https://xr.activetheory.net/)：公開說明烘焙/即時全域光、光探針、球諧光照等實驗，非 DELTA 的既有能力。
- [web.dev Web Vitals](https://web.dev/articles/vitals) 與 [高效動畫](https://web.dev/articles/animations-guide)：效能和交互目標參考。

**授權界線：只學設計模式、互動架構及方法；不移植 Active Theory 專有 Hydra、原網站腳本、shader、貼圖、音效、字體、模型。Hydra 與公開的 hydra-synth 並非同一個引擎。**

## 核心移植原則

1. **視覺導演先行**：先做高品質靜態構圖，取得配件槽位可辨識性與數據可讀性，再增加有用途的動態。
2. **狀態驅動**：槍械槽位 `idle → focus → preview → apply/cancel`；渲染是狀態的結果，不能反過來控制真實配件狀態。
3. **非 3D 的空間感**：以背景材質、攝影棚燈光、暗角、空氣透視、深度分層打造軍械室，不必渲染完整 3D 場景。
4. **效能分級**：靜態圖像預設；短暫局部特效僅在需要、可見且未開啟 reduced motion 時出現；支援 CSS-only 退化。
5. **工藝密度**：高級感主要由比例、對齊、材質質感、留白、字級節奏與微交互一致性建立，不靠全螢幕粒子數量。

## ACFH 五層場景

| 層 | 用途 | 首選實作 |
|---|---|---|
| L1 Environment | 昏暗工業軍械室空間 | 不同解析度 AVIF/WebP 或 CSS 背景 |
| L2 Atmosphere | 柔霧、暗角、景深 | 預烘焙疊層；不用永久運算的模糊 |
| L3 Lighting | 頂部冷白柔光、窄暖色輪廓 | CSS 靜態光；必要時短暫 WebGL2 |
| L4 Weapon | 正確比例的 AKM 側視與彈匣 | `assets/akm-side.svg` + `assets/akm-magazine.svg`，共享 viewBox |
| L5 UI | 11 槽位、研究警告、數值差、詳情 | 原生 HTML/CSS/JS、可鍵盤使用 |

色彩：#090D0F 黑底、#182126 板岩、#344139 鋼綠、#B4C8A0 淺綠、#C59C67 暖燈。可從既有 `DESIGN.md` 漸進採用，**本研究不改 production CSS**。

## 互動與資產規則

- AKM 是唯一視覺主角，圖層不以獨立的 `scaleX`/`scaleY` 拉伸，不能破壞原來 1000×420 的相對比例。
- 2D 畫面不因首頁載入而下載 GLB 或 Three.js。3D 模組既存，但 V1 不開發、不擴大其觸發範圍。
- 每個槽位需要已安裝／可選／鎖定／缺來源／待驗證與清楚原因，不以發光取代文字。
- 裝卸展示不假稱實機可裝配；真實研究計算與動畫完全解耦。
- 手機觸控目標採至少 44×44 CSS px 的設計目標；抽屜必須 Escape、觸控關閉、焦點恢復。
- `prefers-reduced-motion`、低效能與 WebGL context loss 都不能阻擋改槍核心操作。

## 效能與驗收預算（目標；目前尚未量測）

| 指標 | V1 目標 |
|---|---|
| Core Web Vitals 75th percentile | LCP ≤ 2.5s，INP ≤ 200ms，CLS ≤ 0.1 |
| 前景動畫 | 力求 60 FPS；記錄長幀與主執行緒阻塞，不保證每台裝置 |
| 靜止工作台 | 不維持常駐 `requestAnimationFrame`，非可見區停止重繪 |
| 手機背景 | 最小有用的初始資產、適當壓縮、按需求載入 |
| 測試覆蓋 | 360×800、390×844、768×1024、1440×900，桌面和手機 browser smoke |
| 真機關卡 | POCO F8 Ultra 操作、耗電、熱降頻、低速網路；模擬器不能替代真機 |

## 執行門檻

治理完成 → 靜態版獨立審稿 → 互動實作 → 2D 比例／數據回歸 → 手機效能量測 → 釋出。

在此之前只交付研究與治理；**不宣稱 ACFH V1 已完成，也不因研究而啟用新效果**。
