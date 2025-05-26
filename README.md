# mytest02 - Three.js Basic Demo

基本的なthree.jsプロジェクトのデモです。回転する立方体を表示します。

## 🚀 セットアップ

### 必要な環境
- Node.js (v16以上推奨)
- npm

### インストールと起動

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

ブラウザで http://localhost:3000 にアクセスすると、回転する立方体が表示されます。

### ビルド

```bash
# 本番用ビルド
npm run build

# ビルド結果のプレビュー
npm run preview
```

## 📁 プロジェクト構造

```
mytest02/
├── src/
│   ├── main.js          # メインのthree.jsコード
│   └── style.css        # スタイルシート
├── index.html           # HTMLエントリーポイント
├── vite.config.js       # Vite設定
└── package.json         # プロジェクト設定
```

## 🎯 Phase 1 実装内容

- ✅ Three.js基本セットアップ
- ✅ 回転する立方体のデモ
- ✅ Vite開発サーバー設定
- ✅ レスポンシブ対応
- ✅ エラーハンドリング
- ✅ ライティング（環境光、ディレクショナルライト、ポイントライト）

## 🔧 使用技術

- **Three.js** (v0.161.0) - 3Dグラフィックライブラリ
- **Vite** (v5.1.0) - 高速ビルドツール
- **ES6 Modules** - モダンなJavaScript

## 📋 今後の計画

### Phase 2: 機能拡張
- 複数オブジェクト
- カメラ制御
- TypeScript導入
- ESLint/Prettier

### Phase 3: テスト基盤
- Jest設定
- Playwright E2E
- CI/CD

### Phase 4: 高度なテスト
- パフォーマンステスト
- 統合テスト
- ドキュメント整備