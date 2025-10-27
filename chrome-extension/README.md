# ChatGPT Search Templater (Chrome Extension)

選択テキストをテンプレート URL に挿入して **chatgpt.com** を開く Manifest v3 対応の Chrome 拡張です。

## リポジトリ構成

```text
chrome-extension/
├─ manifest.json
├─ options.html
├─ popup.html
├─ scripts/
│  └─ prebuild.mjs
├─ src/
│  ├─ background/        # メニュー作成・クリックハンドラ・URL組み立て
│  ├─ content-script/
│  ├─ pages/options/     # テンプレート編集 UI
│  └─ lib/               # URL ビルダーや設定処理
└─ assets/
   └─ icons/*            # 16/32/48/128px
```

テンプレート仕様や URL ビルダーなどの共通ロジックは `chrome-extension/shared/` に配置されています。TypeScript からは `@shared/*`（`shared/ts/*`）として参照します。

## セットアップとビルド

```bash
pnpm install
pnpm build    # TypeScript の型チェック + bundling
pnpm lint     # Biome による静的解析
```

## 機能概要

1. ページ内の文字列を選択して右クリック。
2. コンテキストメニューからテンプレートを選択。
3. テンプレートに選択文字列を挿入し、`chatgpt.com` を新規タブで開きます。

テンプレートはオプションページから最大 2 件まで保存でき、URL のプレースホルダー（`{TEXT}` / `{選択した文字列}`）やチェックボックスによるクエリ付与（`hints=search`、`temporary-chat=true` など）、モデル選択などをサポートします。

## 文字列と URL 長の扱い

- 選択テキストは改行や空白、記号を含めてそのままエンコードします。
- URL へ埋め込む際は `encodeURIComponent` を使用します。
- エンコード後の URL 長が `HARD_LIMIT`（デフォルト 3000 文字）を超える場合はアラートを表示し、検索を中断します。

## 開発版のインストール手順

1. リポジトリをクローンまたはダウンロードします。
2. `pnpm build` でバンドルしたのち、Chrome で `chrome://extensions/` を開きます。
3. デベロッパーモードを ON にし、「パッケージ化されていない拡張機能を読み込む」から `chrome-extension/` を選択します。

## 付与する権限

- `permissions`: `contextMenus`, `storage`, `tabs`, `scripting`
- `host_permissions`: `<all_urls>`（選択テキスト取得フォールバックで `chrome.scripting` を利用）

## 既知の注意点

- `chatgpt.com` のクエリは非公式のため将来的に変更される可能性があります。
- 一部ページ（`chrome://`、Chrome ウェブストア、PDF ビューワなど）では選択テキストを取得できない場合があります。
- 非 ASCII 文字や改行が多い場合は URL 長が伸びやすく、HARD_LIMIT を超えることがあります。

## ライセンス

TBD（例：MIT）。
