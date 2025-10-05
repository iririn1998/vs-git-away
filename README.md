# VS Git Away

Git管理から特定のファイルを除外し、除外されたファイルを視覚的に管理するためのVS Code拡張機能です。`.git/info/exclude`ファイルを使用してローカルでのGit除外を管理します。

## 機能

### 🗂️ Git除外ファイル管理
- `.git/info/exclude`に記載されたファイル一覧をサイドバーに表示
- 除外されたファイルの存在確認とアイコン表示
- ファイルクリックで直接開く機能

### ➕ ファイル除外機能
- エクスプローラーからファイルを右クリックしてGit管理から除外
- ワークスペースルートからの相対パスで自動管理
- 重複チェック機能付き

### ➖ 除外解除機能
- サイドバーから除外されたファイルを右クリックで除外解除
- 除外リストからの安全な削除

### 🔄 リアルタイム更新
- ファイル操作後の自動ツリービュー更新
- 手動更新コマンドも利用可能

## 使用方法

### ファイルをGit管理から除外する
1. エクスプローラーで除外したいファイルを右クリック
2. 「Git管理から外す」を選択
3. ファイルが`.git/info/exclude`に追加され、サイドバーに表示されます

### 除外を解除する
1. VS Git Awayサイドバーで除外解除したいファイルを右クリック
2. 「除外リストから削除」を選択
3. ファイルが`.git/info/exclude`から削除されます

### サイドバーを更新する
- コマンドパレット（Ctrl+Shift+P）から「Git Away: Refresh Explorer」を実行

## 必要な環境

- Visual Studio Code 1.60.0以上
- Gitが初期化されたプロジェクト（`.git`ディレクトリが存在すること）

## 拡張機能の設定

この拡張機能は追加の設定は必要ありません。インストール後すぐに使用できます。

## 既知の問題

- 現在のところ、既知の問題はありません

## リリースノート

### 1.0.0

- 初回リリース
- Git除外ファイル管理機能
- サイドバーツリービュー
- ファイル除外・除外解除機能

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
