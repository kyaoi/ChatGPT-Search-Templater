# ChatGPT Search Templater (Chrome Extension)

選択テキストをテンプレートURLに挿入して **chatgpt.com** を開く Chrome 拡張（Manifest v3）。

> **現状の方針**
>
> * 文字列が“長すぎる”場合は **アラート表示のみ** で検索は実行しません（将来的に課金ユーザー向けに自動検索フォールバックを提供予定）。

---

## 1. できること（要件対応）

* **検索機能**

  1. ページ内の文字列を選択して右クリック
  2. コンテキストメニューからテンプレートを選択
  3. テンプレートに選択文字列を挿入し、`chatgpt.com` を新規タブで開く
* **テンプレート作成機能**

  * 拡張アイコン（または右クリックメニュー）から **テンプレート作成画面（Options）** を開く
  * テンプレートは **最大2件**まで保存可能
* **URL編集＆UI指定**

  * 設定画面でユーザーが **URLを直入力** 可能
  * URLを空にしても、**チェックボックス**（例：`hints=search`, `temporary-chat=true`）や **プルダウン**（`model`）でクエリを付与可能
* **既定テンプレート**

  * `https://chatgpt.com/?q={選択した文字列}`

> **注意**：`q`, `hints`, `temporary-chat`, `model` などのクエリは公式仕様として公開されていないため、将来変更される可能性があります。拡張は自由編集のURLと任意クエリ付与UIで影響を最小化します。

---

## 2. 文字列の扱い（“そのまま”の準拠）

* 選択テキストは **改行・空白・記号** を含めてそのまま渡します。
* URL埋め込み時は `encodeURIComponent` を使用（例：`\n` → `%0A`）。
* 余計なトリム・正規化・空白の `+` 置換は行いません。

---

## 3. 制限時の挙動（いまはアラートのみ）

* エンコード後の **最終URL長** を評価します（文字数ではなく URL 文字列長）。
* しきい値を **HARD_LIMIT** で管理し、超過した場合は **アラート表示** → **検索を中断** します。
* デフォルト値（変更可）

  * `HARD_LIMIT = 3000`  ※実運用に合わせて調整してください

**疑似コード**

```js
const HARD_LIMIT = 3000;

function buildChatGPTUrl(template, rawText, opts = {}) {
  const encoded = encodeURIComponent(rawText);
  let urlStr = template
    .replaceAll('{選択した文字列}', encoded)
    .replaceAll('{TEXT}', encoded);
  const u = new URL(urlStr);
  if (opts.model) u.searchParams.set('model', opts.model);
  if (opts.hintsSearch) u.searchParams.set('hints', 'search');
  if (opts.temporaryChat) u.searchParams.set('temporary-chat', 'true');
  return u.toString();
}

function openChatGPT(template, selectionText, opts) {
  const url = buildChatGPTUrl(template, selectionText, opts);
  if (url.length > HARD_LIMIT) {
    alert('選択テキストが長すぎるため、URLに挿入できません。内容を短くするか、分割してください。');
    return;
  }
  chrome.tabs.create({ url });
}
```

> **将来のプレミアム機能**（Roadmap）
>
> * HARD_LIMIT超過時に **自動でChatGPTを開いて検索に誘導**（例：クリップボードコピー＋自動貼り付け/送信）
> * `host_permissions: ["https://chatgpt.com/*"]` と `chrome.scripting` を活用した自動投入（DOM変更に弱いため、オプションで明示的にON）

---

## 4. テンプレート仕様

* **プレースホルダ**

  * `{選択した文字列}` / `{TEXT}` のいずれか（両方サポート）
* **サンプル**

  * 標準：`https://chatgpt.com/?q={選択した文字列}`
  * Searchヒント：`https://chatgpt.com/?q={TEXT}&hints=search`
  * モデル指定：`https://chatgpt.com/?q={TEXT}&model=gpt-5`
* **備考**

  * プレースホルダ未使用のテンプレートも保存可能ですが、意図誤解を避けるため **保存時に警告** を出します。

---

## 5. オプション画面（UI仕様）

* **テンプレート 1 / 2**（カード表示）

  * 入力欄：URL（自由入力、空OK）
  * プレースホルダのプレビュー：`{TEXT}` に仮テキストを流し込み
  * チェックボックス：

    * 「Searchを有効化」 → `hints=search`
    * 「一時チャット」 → `temporary-chat=true`
  * プルダウン：モデル選択（例：`gpt-4o`, `o3`, `gpt-5`, `custom`）
  * `custom` 選択時のみテキスト入力欄を表示
  * 保存/リセットボタン、テンプレートの有効/無効トグル
* **メニュー名編集**：コンテキストメニューに表示するラベルを編集可能
* **しきい値**：`HARD_LIMIT` の数値を入力可能（デフォルト 3000）

---

## 6. 使い方

1. 選択 → 右クリック → 「ChatGPTで検索」 → テンプレートを選ぶ
2. 文字列が長すぎる場合はアラートが表示され、検索は実行されません
3. テンプレートの作成/編集は拡張アイコンまたは右クリック内の「テンプレートを編集…」から

---

## 7. インストール（開発版）

1. リポジトリをクローン/ダウンロード
2. Chrome で `chrome://extensions/` を開く
3. 「デベロッパーモード」をON
4. 「パッケージ化されていない拡張機能を読み込む」→ 本プロジェクトフォルダを選択

---

## 8. 権限（Manifest v3）

* `permissions`: `contextMenus`, `storage`, `tabs`
* （将来のプレミアム機能で）`host_permissions`: `https://chatgpt.com/*`, `scripting`（自動貼り付け/送信に必要）

**manifest.json（抜粋）**

```json
{
  "manifest_version": 3,
  "name": "ChatGPT Search Templater",
  "version": "0.1.0",
  "permissions": ["contextMenus", "storage", "tabs"],
  "background": { "service_worker": "background.js" },
  "action": { "default_popup": "popup.html" },
  "options_page": "options.html"
}
```

---

## 9. ディレクトリ構成（例）

```
/ (root)
├─ manifest.json
├─ src/
│  ├─ background.js      # メニュー作成・クリックハンドラ・URL組み立て
│  ├─ options.html       # テンプレート編集UI
│  ├─ options.js
│  ├─ popup.html         # 任意（ワンクリ検索）
│  ├─ popup.js
│  └─ lib/urlBuilder.js  # buildChatGPTUrl など
└─ assets/
   └─ icons/*            # 16/32/48/128px
```

---

## 10. 既知の制約と注意

* `chatgpt.com` のクエリは非公式。将来の変更により挙動が変わる可能性があります。
* 一部の特殊ページ（`chrome://`、Chrome ウェブストア、PDFビューワ等）では選択テキストが取得できないことがあります。
* 非ASCIIや改行が多いと URL 長が伸びやすいです。**評価は常にエンコード後の長さ基準**で行います。

---

## 11. プライバシー

* 選択テキストやテンプレートは `chrome.storage.sync` に保存（ローカル/Googleアカウント間で同期）。
* 送信はユーザー操作時に `chatgpt.com` へ **URLクエリとして** 行われます。拡張は外部サーバに送信しません。

---

## 12. 開発メモ（テスト観点）

* 長文：貼り付け用ダミーテキスト（数千文字）で HARD_LIMIT 超過アラートを確認
* 改行：複数行・タブ・絵文字混在の選択を検証
* プレースホルダ未設定テンプレートの警告表示
* 2テンプレートのメニュー表示/切替

---

## 13. ロードマップ（Premium）

* HARD超過時：

  * クリップボード自動コピー → ChatGPT 自動起動
  * ChatGPT 画面内への自動貼り付け＆送信（`scripting` + `host_permissions`）
  * 分割投入オプション（10k字級を複数メッセージに分割）
* しきい値のユーザー別設定、ショートカット操作、テンプレートのインポート/エクスポート

---

## 14. ライセンス

* TBD（例：MIT）

---

## 15. クイックFAQ

**Q. 改行は保持されますか？**
A. はい。`encodeURIComponent` により `\n` は `%0A` として渡され、ChatGPT 側で改行として扱われます。

**Q. なぜ“URL長”判定なの？**
A. ブラウザ・サーバ側のURL上限にかかるためです。文字数よりも **エンコード後のURL長** を見るのが実用的です。

**Q. 2つ以上のテンプレートは作れますか？**
A. 現状は要件通り **最大2件** です。
