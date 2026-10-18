# 銀花戦記 — Ginka Senki

スマートフォン縦持ち (9:16) 向け、固定視点の浅い2.5D戦術SLGの試作です。

## P01
- 高さ0/1/2の地形。段差1までは移動可能
- 味方フェイズ → 敵フェイズの交代制
- 移動先を2回タップして確定
- 攻撃、HP、敵の危険範囲
- 固定カメラ（回転・切り替えなし）
- 単体HTML。外部依存なし

## プレイ方法
GitHub Pages を **Settings → Pages → Build and deployment → Deploy from a branch → main / (root)** に設定してください。

公開後のURL: https://sugikazu777.github.io/ginka-senki/

※現段階では仮グラフィックによる操作試作です。iPhone Safariでの実機検証はこれから行います。

## PC版の公開URL

**https://sugikazu777.github.io/ginka-senki/battle-pc/**

認証不要のHTTPSページです。PC・スマホのブラウザや、ブラウザ操作に対応したChatGPTからアクセスできます。スマホでは横向きを推奨します。

`main` の更新時に `.github/workflows/pages.yml` が戦術テストとViteビルドを実行し、GitHub Pagesへ公開します。PagesのBuild and deploymentは **GitHub Actions** を使用します。既存のトップページと `town/` は元のHTMLをそのままコピーし、PC版のビルド成果物だけを `battle-pc/` に配置します。

ChatGPTのURL取得機能だけではCanvasゲームの操作ができない場合があります。ゲームを操作するにはJavaScriptとWebGLを実行できるブラウザが必要です。
