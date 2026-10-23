# AKM 配件研究與衝突稽核（2026-10-24）

目前整理了 **21 件 AKM 研究配件**，並無一件已經完成 2026 手遊配件數值與相容性逐項驗證。

| 項目 | 數量 |
|---|---:|
| 遊戲截圖辨識槽位 | 11 |
| 研究配件 | 21 |
| 和 2024 年 objectID 配對成功 | 17 |
| 跨來源數值衝突 | 2 |
| 2024 年全槍系配件（不是 AKM 適配數量） | 392 |
| 2026 第三方推導 AKM 相容候選 | 531（未實機逐件確認） |

## 數值衝突
- AKM 實用長槍管（13020000357）：2024 記載後座 +6、射程／初速 +18%；本站既有研究樣本為 +8 與 +30%。
- AK 勇火消音器（13130000176）：2024 記載操控 -10、穩定 +4；本站研究樣本為 -4、+3。

以上未自動選取任一來源作為現行真值，網站標記「來源衝突」，原本的試算值不代表 2026 真實遊戲數值。

## 2024 全武器配件資料
槍管 104、槍口 34、彈匣 58、護木 24、前握把 21、瞄具 31、槍托 57、功能性配件 36、後握把 27，共 392。

2024 上游 GitHub 未提供可核實的授權檔，因此不將完整第三方資料庫直接複製並公開。

## 待補
- 共用型配件的 AKM 實機相容性、父子掛載結構與型號差異。
- 實際改裝效果與百分比疊加、調校、特殊效果、取整公式。
- 需要 2026 手遊逐件截圖或可查官方接口來完成核驗。

來源：[DeltaForceData](https://github.com/jiansenc/DeltaForceData)、[GameGrids AKM](https://gamegrids.io/delta-force/zh/weapons/akm/)、[DeltaForceTools](https://deltaforcetools.gg/tw/wiki/attachment)。
## 2026 配件候選新增
- AKM 海狸槍管（ID 13020000490）：後座 +4、操控 +8、穩定 -6、腰射 +8。
- AKM 海狸長槍管（ID 13020000491）：後座 +9、操控 -7、穩定 +4、腰射 -12、射程與初速 +30%。
- 穩定 AK 後握把（ID 13030000122）：後座 +4。
- AK 槍托緩衝墊（ID 13240000006）：後座 +3、操控 -3、穩定 +1；實際是否屬 AKM 直接槍托墊掛載未驗證。

四件數值均來自各個 2026 年 GameGrids 配件頁，不等於手遊實測確認。


## 2026-10-24 再核對：最新來源與修正
- 官方近期可核對的 10/10、10/15、10/22 更新無明確 AKM 基礎數值調整紀錄；未公告不代表絕無熱修。
- [GameGrids 2026-09-23](https://gamegrids.io/delta-force/zh/attachments/akm-beaver-long-barrel-assembly/) 與 [DeltaForceTools 2026-07-04](https://deltaforcetools.gg/tw/wiki/attachment) 都支持 AKM 海狸長槍管後座 +9、穩定 +4、操控 -7、腰射 -12、射程/初速 +30%。仍非 2026-10-24 實機驗證。
- AKM 實用長槍管：2026-10-02 的 [DeltaForceTools](https://deltaforcetools.gg/wiki/attachment/AKM%2520Practical%2520Long%2520Barrel%2520Combo) 仍顯示後座 +6，而 2026-09-23 的 [GameGrids](https://gamegrids.io/delta-force/zh/attachments/akm-practical-long-barrel-assembly/) 顯示後座 +8、射程/初速 +30%。衝突不限於 2024 舊資料。
- AK 勇火消音器：2026-09-09 的 [DeltaForceTools](https://deltaforcetools.gg/wiki/attachment/AK%2520Bravefire%2520Suppressor) 顯示操控 -10、穩定 +4；2026-09-23 [GameGrids](https://gamegrids.io/delta-force/zh/attachments/ak-valor-flame-suppressor/) 顯示操控 -4、穩定 +3。同年資料仍存在衝突。
- AK 槍托緩衝墊 (13240000006) 在 [GameGrids](https://gamegrids.io/delta-force/zh/attachments/ak-stock-recoil-pad/) 與 [零號站](https://sjz.jbskins.com/Item/index/category_id/2) 都歸為「槍托」，不代表可以裝在 AKM「槍托墊」槽。本項標記 `researchOnly:true` 並拒絕直接套用改槍計算。
- GameGrids 的武器兼容清單按「相同槽位」推導，曾將 AKM 特定槍管列為多種手槍的兼容候選；此推導不能當作實際可安裝證據。
- AKM 本地研究條目共 21 件，其中 1 件因掛載關係未明禁用，20 件仍僅供研究試算；沒有 2026 年手機版完整實機驗證的 AKM 配件。
