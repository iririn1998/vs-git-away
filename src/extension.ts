/**
 * VS Code拡張機能API用のモジュール
 * このモジュールにはVS Codeの拡張機能開発に必要なAPIが含まれています
 */
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Git Awayサイドバー用のツリーアイテムクラス
 * VS CodeのTreeItemを継承し、サイドバーに表示される各項目を表現します
 * 
 * @class GitAwayTreeItem
 * @extends {vscode.TreeItem}
 */
class GitAwayTreeItem extends vscode.TreeItem {
	/**
	 * GitAwayTreeItemのコンストラクタ
	 * 
	 * @param {string} label - ツリーアイテムに表示されるラベル文字列
	 * @param {vscode.TreeItemCollapsibleState} collapsibleState - アイテムの展開/折りたたみ状態
	 * @param {vscode.ThemeIcon | string} [iconPath] - アイテムに表示するアイコン（オプション）
	 * @param {vscode.Command} [command] - アイテムクリック時に実行されるコマンド（オプション）
	 */
	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly iconPath?: vscode.ThemeIcon | string,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
		this.tooltip = `${this.label}`;
		this.contextValue = 'gitAwayItem';
	}
}

/**
 * Git Awayツリービュー用のデータプロバイダークラス
 * VS CodeのTreeDataProviderインターフェースを実装し、サイドバーに表示するツリー構造のデータを提供します
 * 
 * @class GitAwayTreeDataProvider
 * @implements {vscode.TreeDataProvider<GitAwayTreeItem>}
 */
class GitAwayTreeDataProvider implements vscode.TreeDataProvider<GitAwayTreeItem> {
	/**
	 * ツリーデータ変更時に発火するイベントエミッター
	 * ツリービューの更新を通知するために使用されます
	 * 
	 * @private
	 * @type {vscode.EventEmitter<GitAwayTreeItem | undefined | null | void>}
	 */
	private _onDidChangeTreeData: vscode.EventEmitter<GitAwayTreeItem | undefined | null | void> = new vscode.EventEmitter<GitAwayTreeItem | undefined | null | void>();
	
	/**
	 * ツリーデータ変更イベント
	 * VS Codeがツリービューの更新を検知するために使用されます
	 * 
	 * @readonly
	 * @type {vscode.Event<GitAwayTreeItem | undefined | null | void>}
	 */
	readonly onDidChangeTreeData: vscode.Event<GitAwayTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

	/**
	 * GitAwayTreeDataProviderのコンストラクタ
	 * データプロバイダーを初期化します
	 */
	constructor() {}

	/**
	 * ツリービューを手動で更新する
	 * イベントエミッターを発火してツリービューの再描画を促します
	 * 
	 * @returns {void}
	 */
	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	/**
	 * ツリーアイテムの表示情報を取得する
	 * VS Codeがツリーアイテムを描画する際に呼び出されます
	 * 
	 * @param {GitAwayTreeItem} element - 表示するツリーアイテム
	 * @returns {vscode.TreeItem} ツリーアイテムオブジェクト
	 */
	getTreeItem(element: GitAwayTreeItem): vscode.TreeItem {
		return element;
	}

	/**
	 * 指定された要素の子要素を取得する
	 * .git/info/excludeに記載された除外ファイル一覧を表示します
	 * 
	 * @param {GitAwayTreeItem} [element] - 親要素（未指定の場合はルート要素）
	 * @returns {Thenable<GitAwayTreeItem[]>} 子要素の配列を返すPromise
	 */
	async getChildren(element?: GitAwayTreeItem): Promise<GitAwayTreeItem[]> {
		if (!element) {
			// 除外されたファイル一覧を取得
			const excludedFiles = await getExcludedFiles();
			
			if (excludedFiles.length === 0) {
				// 除外ファイルがない場合は説明メッセージを表示
				return [new GitAwayTreeItem(
					'除外されたファイルはありません',
					vscode.TreeItemCollapsibleState.None,
					new vscode.ThemeIcon('info'),
					undefined
				)];
			}

			const workspaceFolders = vscode.workspace.workspaceFolders;
			if (!workspaceFolders) {
				return [];
			}

			const workspaceRoot = workspaceFolders[0].uri.fsPath;
			const files: GitAwayTreeItem[] = [];
			
			// 除外されたファイルのTreeItemを作成
			for (const excludedPath of excludedFiles) {
				const fullPath = path.join(workspaceRoot, excludedPath);
				
				// ファイルが存在するかチェック
				const fileExists = fs.existsSync(fullPath);
				const iconName = fileExists ? 'file' : 'warning';
				const tooltip = fileExists ? 
					`除外されたファイル: ${excludedPath}` : 
					`除外されたファイル（存在しません）: ${excludedPath}`;
				
				let command: vscode.Command | undefined;
				if (fileExists) {
					const uri = vscode.Uri.file(fullPath);
					command = {
						command: 'vscode.open',
						title: 'ファイルを開く',
						arguments: [uri]
					};
				}

				const treeItem = new GitAwayTreeItem(
					excludedPath,
					vscode.TreeItemCollapsibleState.None,
					new vscode.ThemeIcon(iconName),
					command
				);
				treeItem.tooltip = tooltip;
				treeItem.contextValue = 'excludedFile';
				files.push(treeItem);
			}
			
			// ファイル名でソート
			files.sort((a, b) => a.label.localeCompare(b.label));
			return files;
		}
		
		return [];
	}
}

/**
 * .git/info/excludeファイルから除外されたファイル一覧を取得する関数
 * 
 * @returns {Promise<string[]>} 除外されたファイルパスの配列
 */
async function getExcludedFiles(): Promise<string[]> {
	try {
		// ワークスペースのルートディレクトリを取得
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders || workspaceFolders.length === 0) {
			return [];
		}

		const workspaceRoot = workspaceFolders[0].uri.fsPath;
		const excludeFilePath = path.join(workspaceRoot, '.git', 'info', 'exclude');

		// excludeファイルが存在しない場合は空配列を返す
		if (!fs.existsSync(excludeFilePath)) {
			return [];
		}

		// excludeファイルの内容を読み取り
		const excludeContent = fs.readFileSync(excludeFilePath, 'utf8');
		const lines = excludeContent.split('\n')
			.map(line => line.trim())
			.filter(line => line && !line.startsWith('#')); // 空行とコメント行を除外

		return lines;
	} catch (error) {
		console.error('Error reading excluded files:', error);
		return [];
	}
}

/**
 * ファイルを除外リストから削除するためのヘルパー関数
 * 指定されたファイルを.git/info/excludeから削除します
 * 
 * @param {string} excludedPath - 除外リストから削除するファイルの相対パス
 * @returns {Promise<boolean>} 成功した場合はtrue、失敗した場合はfalse
 */
async function removeFileFromExclude(excludedPath: string): Promise<boolean> {
	try {
		// ワークスペースのルートディレクトリを取得
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders || workspaceFolders.length === 0) {
			vscode.window.showErrorMessage('ワークスペースが開かれていません。');
			return false;
		}

		const workspaceRoot = workspaceFolders[0].uri.fsPath;
		const excludeFilePath = path.join(workspaceRoot, '.git', 'info', 'exclude');

		// excludeファイルが存在しない場合
		if (!fs.existsSync(excludeFilePath)) {
			vscode.window.showWarningMessage('除外ファイルが存在しません。');
			return false;
		}

		// excludeファイルの既存の内容を読み取り
		const excludeContent = fs.readFileSync(excludeFilePath, 'utf8');
		const lines = excludeContent.split('\n');

		// 指定されたパスを除外
		const filteredLines = lines.filter(line => line.trim() !== excludedPath);

		// ファイルが見つからなかった場合
		if (filteredLines.length === lines.length) {
			vscode.window.showWarningMessage(`${excludedPath} は除外リストに見つかりませんでした。`);
			return false;
		}

		// 更新された内容を書き込み
		const newContent = filteredLines.join('\n');
		fs.writeFileSync(excludeFilePath, newContent, 'utf8');

		vscode.window.showInformationMessage(`${excludedPath} を除外リストから削除しました。`);
		return true;
	} catch (error) {
		console.error('Error removing file from exclude:', error);
		vscode.window.showErrorMessage(`ファイルを除外リストから削除できませんでした: ${error}`);
		return false;
	}
}

/**
 * ファイルをgit管理から外すためのヘルパー関数
 * 指定されたファイルを.git/info/excludeに追加します
 * 
 * @param {string} filePath - git管理から外すファイルのパス
 * @returns {Promise<boolean>} 成功した場合はtrue、失敗した場合はfalse
 */
async function excludeFileFromGit(filePath: string): Promise<boolean> {
	try {
		// ワークスペースのルートディレクトリを取得
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders || workspaceFolders.length === 0) {
			vscode.window.showErrorMessage('ワークスペースが開かれていません。');
			return false;
		}

		const workspaceRoot = workspaceFolders[0].uri.fsPath;
		const gitInfoDir = path.join(workspaceRoot, '.git', 'info');
		const excludeFilePath = path.join(gitInfoDir, 'exclude');

		// .git/infoディレクトリが存在しない場合は作成
		if (!fs.existsSync(gitInfoDir)) {
			fs.mkdirSync(gitInfoDir, { recursive: true });
		}

		// ワークスペースルートからの相対パスを取得
		const relativePath = path.relative(workspaceRoot, filePath);
		
		// excludeファイルの既存の内容を読み取り
		let excludeContent = '';
		if (fs.existsSync(excludeFilePath)) {
			excludeContent = fs.readFileSync(excludeFilePath, 'utf8');
		}

		// 既に追加されているかチェック
		const lines = excludeContent.split('\n');
		const pathToAdd = relativePath.replace(/\\/g, '/'); // Windowsパスを正規化
		
		if (lines.includes(pathToAdd)) {
			vscode.window.showInformationMessage(`${pathToAdd} は既にgit管理から外されています。`);
			return true;
		}

		// ファイルパスを追加
		const newContent = excludeContent.trim() + (excludeContent.trim() ? '\n' : '') + pathToAdd + '\n';
		fs.writeFileSync(excludeFilePath, newContent, 'utf8');

		vscode.window.showInformationMessage(`${pathToAdd} をgit管理から外しました。`);
		return true;
	} catch (error) {
		console.error('Error excluding file from git:', error);
		vscode.window.showErrorMessage(`ファイルをgit管理から外すことができませんでした: ${error}`);
		return false;
	}
}

/**
 * 拡張機能がアクティベートされたときに呼び出されるメソッド
 * 拡張機能が初めて実行されるときに一度だけ呼び出されます
 * ツリービューの作成、コマンドの登録、イベントリスナーの設定などを行います
 * 
 * @param {vscode.ExtensionContext} context - VS Codeから提供される拡張機能のコンテキスト
 * @returns {void}
 */
export function activate(context: vscode.ExtensionContext) {
	/**
	 * ツリーデータプロバイダーのインスタンスを作成
	 * サイドバーに表示するツリー構造のデータを管理します
	 * 
	 * @type {GitAwayTreeDataProvider}
	 */
	const gitAwayProvider = new GitAwayTreeDataProvider();
	
	/**
	 * ツリービューを登録
	 * VS Codeのサイドバーにカスタムツリービューを表示します
	 * 
	 * @type {vscode.TreeView<GitAwayTreeItem>}
	 */
	const treeView = vscode.window.createTreeView('vs-git-away-explorer', {
		treeDataProvider: gitAwayProvider,
		showCollapseAll: true
	});

	// コマンドを登録

	/**
	 * エクスプローラーを更新するコマンド
	 * ツリービューを手動で再読み込みします
	 * 
	 * @type {vscode.Disposable}
	 */
	const refreshCommand = vscode.commands.registerCommand('vs-git-away.refreshExplorer', () => {
		gitAwayProvider.refresh();
		vscode.window.showInformationMessage('Git Away Explorer refreshed!');
	});

	/**
	 * ファイルをgit管理から外すコマンド
	 * 選択されたファイルを.git/info/excludeに追加します
	 * 
	 * @type {vscode.Disposable}
	 */
	const excludeFromGitCommand = vscode.commands.registerCommand('vs-git-away.excludeFromGit', async (uri: vscode.Uri) => {
		if (!uri) {
			vscode.window.showErrorMessage('ファイルが選択されていません。');
			return;
		}

		const success = await excludeFileFromGit(uri.fsPath);
		if (success) {
			// サイドバーを更新
			gitAwayProvider.refresh();
		}
	});

	/**
	 * ファイルを除外リストから削除するコマンド
	 * 選択されたファイルを.git/info/excludeから削除します
	 * 
	 * @type {vscode.Disposable}
	 */
	const removeFromExcludeCommand = vscode.commands.registerCommand('vs-git-away.removeFromExclude', async (item: GitAwayTreeItem) => {
		if (!item || !item.label) {
			vscode.window.showErrorMessage('ファイルが選択されていません。');
			return;
		}

		const success = await removeFileFromExclude(item.label);
		if (success) {
			// サイドバーを更新
			gitAwayProvider.refresh();
		}
	});

	// すべてのDisposableをサブスクリプションに追加
	// 拡張機能が無効化されるときに適切にクリーンアップされるようにします
	context.subscriptions.push(
		treeView,
		refreshCommand,
		excludeFromGitCommand,
		removeFromExcludeCommand
	);
}

/**
 * 拡張機能が無効化されたときに呼び出されるメソッド
 * 拡張機能がアンインストールされたり、VS Codeが終了したりするときに呼び出されます
 * 必要に応じてリソースのクリーンアップやイベントリスナーの削除を行います
 * 
 * @returns {void}
 */
export function deactivate() {}
