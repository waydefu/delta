# 可重現的 AKM 資產轉換流程

來源：LonesomeDucky 在 [OpenGameArt](https://opengameart.org/content/weathered-akm-rifle) 公開的 Weathered AKM (`akm54.blend`)，頁面標示 **CC0 1.0**。

- GitHub Actions `Research AKM model conversion` 自動在隔離的 Ubuntu Runner 安裝 Blender，透過原作者檔案下載連結取得 .blend，檢查 Blender 檔頭、尺寸與 SHA-256。
- 以 `scripts/inspect-export-akm.py` 列出網格、材質、貼圖與可能的彈匣／槍托等節點，再匯出 `akm.glb`。
- 結果只上傳 GitHub Actions 的 **artifact：akm-cc0-glb-unreviewed**（保存 7 天），**不會自動寫入主分支或部署**。確認零件、材質、大小與實機比例後，才能把真正可用的 GLB 放進 `assets/models/akm.glb`。
- `inspection.json` 中若偵測不到彈匣獨立節點，不能假裝已能拆卸。單件 GLB 不會自動具有改槍動畫。
- Blender `--disable-autoexec`，僅允許 HTTPS 來源下載；來源仍是第三方檔案，部署前需人工審查。

網站目前沒有採用任何來歷不明的《三角洲行動》遊戲拆包模型。
## 已驗證下載格式（2026-10-23）
GitHub Actions 實際下載的來源檔為約 40.5 MiB，檔案 magic bytes `28 b5 2f fd`，即 **Zstandard 壓縮串流**。因此不能以副檔名推斷其內容是直接可讀的 Blender 檔。轉換工作流程現在先依 magic 檢查、解壓，然後再次驗證 `BLENDER` 檔頭；同時保留下載檔與解壓檔各自的 SHA-256，以便追溯。
