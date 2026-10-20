# 検証記録 — 2026-10-18

## 実施環境と結果

Windowsローカル / Node 24.19 / Chromium 156 / PixiJS WebGL / Playwright。指定されたCodexクラウドへの移設は行っていません。

| 項目 | 結果 |
| --- | --- |
| TypeScript型チェック＋Vite製品ビルド | PASS |
| 戦術ロジックテスト | 9 / 9 PASS |
| 旧P05.4との移動・射程・敵AI比較 | 同一状態で一致 |
| マウスによる通しプレイ | ROUND 5で敵全滅・勝利 |
| リリアの実操作 | 経路表示→石橋移動→敵剣士HP 22→14、EXP 0→10 |
| 最終リリア | HP 23/30、EXP 90 |
| 敵AI・味方戦闘不能 | 実プレイ中に確認。ミレイユ戦闘不能、残り3人で勝利 |
| 入力と画面 | 選択・移動・攻撃・待機・ズーム・ドラッグ・視点復帰・説明・再開 PASS |
| 作戦 | 3種類の選択と初期化、各勝敗条件の単体テスト PASS |
| 画面サイズ | 1900×900 / 1536×864 / 1280×720 / 2560×1080 |
| ブラウザエラー | 0 |
| 最終追加スモーク | 護衛8体の座標重複なし、敵フェイズ中の初期化で旧タイマー無効化 |
| 既存ファイル | index.html / town/index.html 差分なし |

通しプレイは公開された読み取り専用snapshotから判断し、画面のマウス操作とボタンだけで進行しています。状態書換え・HP変更・勝利フラグの注入はしていません。拠点制圧と護衛はロジックの勝敗・進行テストとブラウザの初期化まで確認しており、各作戦の勝利までの通しブラウザ試験は未実施です。

通しテスト後、1280px時の味方名の行高と護衛の初期配置を修正し、9件の単体テスト、製品ビルド、追加スモークを再実行しています。

## 性能測定の条件

製品版ローカル起動で初期ロード758ms。これはこのマシン・ローカル配信条件での値で、公開サイトの初回ロードを保証しません。

1900×900のヘッドレス測定は8〜9FPSでした。WebGL rendererは **ANGLE / SwiftShader Device (Subzero)** で、ソフトウェア描画です。実GPUを使用する通常ブラウザのFPSは未測定で、60FPS到達を主張しません。JS heapの参考値は約10MBですが、画像・GPUメモリやピークプロセスメモリを含みません。

## スクリーンショット

- [最終画面](evidence/06-final.png)
- [初期画面](evidence/01-initial.png)
- [リリアの移動経路](evidence/02-lilia-path.png)
- [リリアの攻撃予測](evidence/03-attack-preview.png)
- [攻撃後HP変化](evidence/04-hp-after-attack.png)
- [第5ラウンドの勝利](evidence/05-result.png)
- [護衛の8体配置](evidence/07-escort.png)
- [1280×720](evidence/responsive-1280x720.png)
- [1536×864](evidence/responsive-1536x864.png)
- [2560×1080](evidence/responsive-2560x1080.png)
- [機械可読の通し試験結果](evidence/browser-results.json)
- [最終スモーク結果](evidence/final-smoke.json)

## 参考画像との比較と反復

| 比較項目 | 実装・改善 | 残差 |
| --- | --- | --- |
| 石橋・清流・花・城壁 | 参考画像に沿って人物なしの地形美術を生成 | 欄干・花際の微細な遮蔽は完全な3Dメッシュではない |
| キャラクターの魅力 | 旧リリア画像を参照し、同じ制作で4味方＋3敵＋使節を生成 | 専用歩行コマ未制作。個々の新デザインはレビュー待ち |
| 地形と高さ | 8×10の論理盤面、共通投影、高さ0/1/2、旧テクスチャで高さ2の独立テラス | 生成美術の全段差と論理段差の完全な画素一致は未達 |
| 地形と操作範囲 | 川・外周の7マスを追加遮断し青/赤/金で明示 | 背景を少し広く見せるため外周は非操作領域 |
| 人物サイズ・HUD | 初期味方を広く配置し、HPと下部HUDの被りを軽減 | 移動後に前後のユニットが重なる場合はある |
| マウス判定 | 空き移動マスを人物矩形より優先、攻撃モードでは敵を優先 | 最終通し試験で重なった敵への攻撃も成功 |
| 低い画面サイズ | 1280×720の味方名の見切れを行高調整で解消 | スマホ縦は対象外 |

修正前の攻撃誤選択は `evidence/iterations/attack-overlap-before-fix.png` に保存。最終通し試験では解消しています。

## リリア近接エフェクト — 2026-10-18

| 確認 | 結果 |
| --- | --- |
| `npm test` | 9 / 9 PASS |
| `npm run build` | TypeScript型チェック・Vite製品ビルド PASS |
| 外部Chrome・1920×855 | フィオナ待機 → リリア移動・剣士攻撃。敵剣士HP 22→14、リリアEXP 0→10、次の行動者へ進行 |
| ブラウザ操作スモーク・1920×855 | 実際のボタン・マウス入力でリリアが3回攻撃し、敵剣士HP 0、リリアEXP 50。ページエラーなし |
| 演出 | 踏み込み、斬撃、着弾火花、ダメージ値、のけぞり、撃破粒子、敵スプライト消失を確認 |

ブラウザ操作は移動・攻撃・待機ボタンと盤面クリックで行い、検証用snapshotは読み取りにだけ使用しています。画面状態の直接書き換えはしていません。

- [初期画面](evidence/lilia-melee-review-v2/01-initial.png)
- [リリア移動後](evidence/lilia-melee-review-v2/02-lilia-moved.png)
- [攻撃予測](evidence/lilia-melee-review-v2/03-attack-preview.png)
- [白銀の斬撃・着弾](evidence/lilia-melee-review-v2/04-slash-impact-frame.png)
- [攻撃後](evidence/lilia-melee-review-v2/05-attack-result.png)
- [撃破粒子](evidence/lilia-melee-review-v5/02-defeat-particles.png)

生成アセットのプロンプト、透過情報、解像度、SHA-256は `assets/manifest.json` に登録しています。すべて未承認候補として記録し、既存のキャラクター素材・汎用VFXは変更していません。

## 操作UI・移動取消・リリア高精細化 — 2026-10-19

| 確認 | 結果 |
| --- | --- |
| `npm test` | 11 / 11 PASS。移動取消で座標・行動状態だけが戻り、HP・EXP・敵状態・行動順が変化しないことを確認 |
| `npm run build` | TypeScript型チェック・Vite製品ビルド PASS |
| 外部Chrome・1920×855 | 行動順外の情報閲覧、移動・経路取消・再移動、攻撃予測、攻撃演出、手動パン後の再選択、作戦変更後の取消情報破棄を確認 |
| 外部Chrome・1920×854 | リリアの高精細素材を標準倍率・拡大3回で確認。頭上ラベル、足元、HP位置に重なりなし |
| 戦闘 | 敵剣士HP 22→14、リリアEXP 0→10、次の行動者へ切り替わることを確認 |

操作の証拠画像：

- [行動順外の人物を閲覧](evidence/ui-regression-20261019/02-out-of-turn-selection-1920x855.png)
- [移動完了](evidence/ui-regression-20261019/04-after-move-1920x855.png)
- [攻撃予測](evidence/ui-regression-20261019/05-attack-prediction-1920x855.png)
- [移動取消後](evidence/ui-regression-20261019/06-after-undo-1920x855.png)
- [攻撃演出中](evidence/ui-regression-20261019/08-attack-animation-1920x855.png)
- [手動パン後の明示的再選択](evidence/ui-regression-20261019/12-explicit-reselection-reveals-1920x855.png)
- [案内パネルの変更前](evidence/hud-design-20261019/00-baseline-hud-comparison.png) ／ [変更後](evidence/hud-design-20261019/30-after-hud-comparison.png)
- [高精細化の同サイズ比較](evidence/visual-ui-20261019/05-lilia-before-candidate-comparison.png) ／ [拡大確認](evidence/visual-ui-20261019/06-lilia-same-size-closeup.png)

リリアの戦場素材は384×512から1086×1448へ差し替え、画面上の表示高さ128、足元アンカー、HP表示位置は維持しています。差し替え前の素材と比較候補は `evidence/quality-candidate/` に保存しています。他の人物素材は変更していません。

## G02 戦場空間整合性診断 — 2026-10-19

| 確認 | 結果 |
| --- | --- |
| `npm test` | 11 / 11 PASS |
| `npm run test:g02` | PASS。1920×855で通常表示、診断表示、全80セル、地形/高さ/人物クリック、透明度0、ホバーラベル、ズーム・ドラッグ後の再判定、診断前後の戦闘状態不変をブラウザー操作で検証 |
| `npm run build` | PASS。TypeScriptチェックおよびVite製品ビルド |
| `npm run test:browser` | PASS。既存の画面操作で第5ラウンド勝利、全16行動、ブラウザーエラー0件。追跡済み証拠画像を保護するため、テスト出力だけ一時フォルダーへ分離 |
| 診断中の状態 | ラウンド、行動順、全ユニット位置・HP・EXP・行動状態は診断前後で同一 |
| 集計 | 80マス、高さ0/1/2、通行可能65、不可15。ゲーム内の現行マップから算出 |

診断デモ、観察した地点、分類と残る不確実性は [`../docs/G02_SPATIAL_DIAGNOSTICS.md`](../docs/G02_SPATIAL_DIAGNOSTICS.md)。証拠画像と機械可読結果は `evidence/g02-20261019/` に保存しています。
