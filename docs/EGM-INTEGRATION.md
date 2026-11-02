# EGM（Elephant-Goldfish Model）專案級整合

本專案透過 Codex 的 **Repo 級插件 Marketplace** 引入 Google 開源的 EGM，供設計規格撰寫、獨立設計審查與實作偏差檢查使用。這是**開發代理工具**，不是 AKM 網站的執行時相依套件。

## 加入方式

- `.agents/plugins/marketplace.json`：指向 [上游 EGM 原始碼](https://github.com/google/elephant-goldfish-model)，並固定到提交 `403d8881d62022490637d740657b33f01e321ea8`，避免上游更新時無預期變更。
- `.codex/config.toml`：只在本 Repo 對 `egm@delta-egm` 設為 `enabled = true`。
- 不將第三方插件原始碼複製到本 Repo，也不在網站中引入任何 JS 執行時套件。
- 不修改既有 `AGENTS.md`、CI、程式碼、Hermes `default` Profile、子代理/並行限制與審批權限。

## 在 Codex 驗證

1. 在支援 Repo Marketplace 的 Codex CLI 或 ChatGPT 桌面版中開啟**受信任**的本專案目錄。
2. 重新啟動 Codex，檢查 Plugins 目錄是否能辨識 `DELTA LAB - EGM` 並載入 `egm`。本機初次安裝需要由用戶完成插件安裝/信任操作（依客戶端實際支援而定）。
3. 在新 Session 選擇 EGM 的 `egm-draft`，以一個**僅產出設計文件、不修改來源程式**的需求進行試用。
4. 正式進行 `egm-review` 前，先確認執行環境能建立**真正獨立、沒有繼承父對話的子代理**。如果不支援，停止該審查流程，**不可**由主代理假扮 Goldfish。
5. 實作或合併仍須遵循既有 `AGENTS.md`、人工審批與 CI。不可把 EGM 的設計建議當成授權修改程式碼。

本變更只提交**可供客戶端讀取的 Repo 設定**；無法從 GitHub 提交動作驗證使用者本機 Codex／Hermes 真的已下載或執行插件。Hermes 是否支援 Repo Marketplace 與原生子代理需要在本機另行確認。

## 停用與更新

- 暫停此 Repo 的 EGM：將 `.codex/config.toml` 的 `enabled` 設為 `false`。
- 更新 EGM：審閱上游變更後，另開 PR 修改 `.agents/plugins/marketplace.json` 的 `sha`；不要自動追蹤 `main`。
- 官方安裝／使用說明：[EGM Codex 文件](https://github.com/google/elephant-goldfish-model/blob/main/docs/codex.md) · [OpenAI Repo Marketplace 文件](https://developers.openai.com/plugins/build/plugins)。
