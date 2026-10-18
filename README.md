# 銀花戦記 — Ginka Senki

美麗な固定視点2.5D戦場、シンプルな戦術、女性キャラクターの成長と愛着を核とするファンタジー戦術SLGの開発プロジェクトです。

> **設計判断の唯一の正本**：[docs/DESIGN_DECISIONS.md](docs/DESIGN_DECISIONS.md)  
> 確定仕様・暫定実装・未決論点・技術選定の経緯を集約しています。Codex等の開発エージェントは実装変更の前に確認してください。

## 遊ぶ

| 画面 | 公開URL | 位置付け |
| --- | --- | --- |
| **PC版戦闘 B01：風紡ぐ橋** | https://sugikazu777.github.io/ginka-senki/battle-pc/ | **現行の主開発対象**。PC横長19:9基準。PixiJS＋TypeScript |
| 街探索 E01 | https://sugikazu777.github.io/ginka-senki/town/ | 既存HTMLプロトタイプ。PC版再設計は未実施 |
| 旧戦闘 P05.4 | https://sugikazu777.github.io/ginka-senki/ | 旧スマホ9:16向け単体HTML。戦術実装の参照資産として維持 |

## リポジトリ構成

- [`docs/DESIGN_DECISIONS.md`](docs/DESIGN_DECISIONS.md)：**設計判断の正本**（有効な決定・未決論点・判断履歴）。
- [`docs/BATTLE_VISUAL_G01.md`](docs/BATTLE_VISUAL_G01.md)：旧G01初期計画の**履歴資料**。現在の仕様には優先しない。
- [`battle-pc/`](battle-pc/)：現行PC戦闘実装。起動方法・操作説明は [battle-pc/README.md](battle-pc/README.md)。
- [`battle-pc/VALIDATION.md`](battle-pc/VALIDATION.md)：テスト・画面・性能の**検証記録**。
- [`battle-pc/assets/manifest.json`](battle-pc/assets/manifest.json)：アセット版・出自・採否の**台帳**。生成済みの新素材はユーザー承認済みとは限りません。
- [`battle-pc/assets/PROMPTS.md`](battle-pc/assets/PROMPTS.md)：素材生成のプロンプト・来歴。
- [`town/index.html`](town/index.html)：街探索の実行可能なHTML試作。
- [`index.html`](index.html)：旧P05.4戦闘試作。

## PC戦闘版の開発・公開

PC版は `battle-pc/` ディレクトリで開発します。

```sh
cd battle-pc
npm ci
npm run dev
# 別途: npm test / npm run build
```

`main` 更新時は [GitHub Actions](.github/workflows/pages.yml) で戦術テストとViteビルドを実行し、既存の旧戦闘・街探索HTMLも維持した形でGitHub Pagesへ公開します。

**注意**：旧版の「スマホ9:16設計」は現在の新規画面の前提ではありません。また、PC版はCanvas/WebGLを使うため、単純なHTML取得では動作画面を評価できません。実ブラウザで確認してください。
