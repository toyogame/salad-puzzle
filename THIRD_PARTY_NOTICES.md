# 使用している素材・データとライセンス

サラダパズルのドット絵（具材・ボウル・アイコン）、BGM・効果音、プログラムは、すべてこのゲームのために作ったものです（画像・音はプログラムでその場で描画・合成）。
そのほかに、次の素材・データを使っています。

## プログラム・フォント

| 名前 | 使い方 | 権利者 | ライセンス |
|---|---|---|---|
| [BudouX](https://github.com/google/budoux) 日本語モデル | 日本語を文節で改行するため、モデルのデータを `index.html` に埋めこみ。判定の処理は短く書き直して使用（変更あり） | Copyright 2021 Google LLC | Apache License 2.0（全文：[licenses/Apache-2.0.txt](licenses/Apache-2.0.txt)） |
| [DotGothic16](https://fonts.google.com/specimen/DotGothic16) | 画面の文字（Google Fonts から読みこみ）と、カード画像の文字 | Copyright 2020 The DotGothic16 Project Authors | SIL Open Font License 1.1（全文：[licenses/OFL-1.1-DotGothic16.txt](licenses/OFL-1.1-DotGothic16.txt)） |

## 栄養データ

| 名前 | 使い方 | 条件 |
|---|---|---|
| [日本食品標準成分表（八訂）増補2023年](https://www.mext.go.jp/a_menu/syokuhinseibun/index.htm)（文部科学省） | ほとんどの食材の栄養値（サラダで使う状態に近い食品の値をもとに、ゲーム用に加工） | 出典を記載して利用（ゲーム内の「あそびかた」と食材ページの「i」に記載） |
| [FoodData Central](https://fdc.nal.usda.gov/)（U.S. Department of Agriculture, Agricultural Research Service） | キヌアの栄養値の目安 | パブリックドメイン（CC0 1.0）。出典の記載をお願いされている |

成分表にない食品（蒸し鶏・ボイルえび・揚げ玉ねぎなど）とドレッシングは、近い食品や市販品をもとにした目安です。

## お題の目安として参考にしたもの（数値の考え方のみ参照）
- 厚生労働省「日本人の食事摂取基準（2025年版）」
- 「健康な食事・食環境」認証制度「スマートミール」の基準（このゲームは同制度の認証を受けたものではありません）
- 厚生労働省・農林水産省「食事バランスガイド」

## 外部サービス
- アクセス解析：[GoatCounter](https://www.goatcounter.com/)（Cookie を使わない計測。GitHub Pages 版のみ）
- 文節判定の BudouX と同じく、ゲームの動作に必要なものはすべて `index.html` に入っています（フォントと解析だけ外部から読みこみ）
