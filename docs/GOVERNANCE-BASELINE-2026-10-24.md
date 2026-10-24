# DELTA LAB 治理基線與技術債（2026-10-24）

基準 ref：`c6ddede1ce9e331ae12d4baee27680a639699129`。此文件是實際勘查與修復追蹤，不是假稱清空所有技術債。後續以 GitHub 最新狀態及 CI 為準。

## 高階治理參考

- [OpenSSF Scorecard](https://scorecard.dev/)：分支保護、Token 最小權限、危險工作流程、依賴釘選。
- [SLSA v1.2](https://slsa.dev/spec/v1.2/)：來源和產物可追溯；不能只靠寫 README 就聲稱達到任一 SLSA 等級。
- [GitHub Actions 安全建議](https://docs.github.com/en/actions/how-tos/secure-your-work)：固定 Action 版本至完整 SHA，保護部署憑證及來源。
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)：外部輸入驗證、安全連結、使用者可控制資料。
- [web.dev](https://web.dev/articles/vitals)：行動裝置實測與 UX 退化策略。

## 最高風險：主分支與資產發布

| ID | 觀察 | 處置與完成證據 |
|---|---|---|
| GOV-P0-01 | GitHub branches/main API 回傳 `protected:false`；Rulesets=[] | 需管理權限啟用 main required checks / PR gate（repo settings 實際驗證）。寫文件不能代替平台保護 |
| GOV-P0-02 | `publish-akm-model.yml` 與 `publish-akm-magazine-candidate.yml` 給 `contents:write` 並 `git push origin HEAD:main` | 把發布改為唯讀、產生待審核 artifact。真正發布需另開經檢查的 PR |
| GOV-P0-03 | 5 個 workflows 以可移動 `@v4`/`@v5` 指向 GitHub Actions | 鎖到 40 字元完整 commit SHA；可用 Dependabot 更新 SHA、人工審查差異 |
| GOV-P0-04 | 目前 CI 不含針對危險 CI 權限／push main 的定向防回歸檢查 | 加上零外部依賴 governance guard + tests；CI 必跑，fail closed |
| GOV-P0-05 | 發布轉檔以執行期 `npm exec --yes` 抓依賴，Python pip 亦直接安裝 | 獨立追蹤來源校驗、鎖依賴、供應鏈審查；此批優先阻止自動發布，暫不擅自宣稱完成 SLSA 等級 |

## 中優先：2D V1 架構健康度

| ID | 觀察 | 後續驗收 |
|---|---|---|
| GOV-P1-01 | `src/gunsmith.mjs` 啟動工作台即初始化 `studio-light.mjs` WebGL2 | 建立 opt-in／靜態降級與 lifecycle profiling；若要改 runtime，與 ACFH 階段分開 |
| GOV-P1-02 | CSS 歷史檔與 `main.css` 並存 | 先建立引用圖與差異查核，再決定是否刪；不能直接刪避免破壞維護依據 |
| GOV-P1-03 | 視覺 smoke 偏向 3D；尚缺完整 2D 低階 Android 真機量測 | 增加 2D slot、無 WebGL、無動畫、焦點回歸、404 模式、不同觸控尺寸 |
| GOV-P1-04 | 21 件配件有研究來源，但沒有 2026 手遊完整逐件核對 | 保持 `data-governance.mjs` 研究／verified 二分；不得標記為正式 |
| GOV-P1-05 | 動畫與大量 UI 邏輯於單檔耦合 | 在測試保護下逐步抽出狀態；沒有測試就不要為「乾淨」重寫整檔 |

## Agent 與交付契約

- 最終權限：使用者。未來若要求先審核，先交付 PR；若明確允許直接推送，也要先完成機械驗收，提供 commit 與回退點。
- 說明及驗證記錄需區分 **觀察**／**推論**／**未完成**，不得把 CI 測試取代手遊實測。
- 不得無證據改寫 AKM 兼容、效果或數據。新效果必須可以退化且可停用。
- 任何「技術債全部清完」均須逐條有可重現證據，並註明仍無法由工具證實的項目。
- 重大修改分成 `governance`、`2D visual`、`data`、`3D` 不同提交，減少回退牽連。
- 回退標準：保留基準 SHA、提交分界、測試報告，使用 `git revert` 而不是強制覆蓋 main 歷史。

## 驗收待辦

- [ ] 平台分支保護已啟用並由 API／設定頁驗證
- [ ] 資產 Workflow 不再直接 push main
- [ ] 所有 GitHub Actions 用完整 SHA
- [ ] Governance guard Node 測試與 CI 通過
- [ ] 2D Browser 操作與 reduced-motion 回歸
- [ ] POCO F8 Ultra 真機性能評估
- [ ] 當季手機遊戲資料來源逐件校準

**P0 工程修復與 P0 遊戲資料驗收是兩件不同的事，不能混淆。**
