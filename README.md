# home-tube-api

API Server for HomeTube.

## Repository overview

The project is a TypeScript/Node.js API server called **HomeTube API**. The entry point is `src/index.ts` which exports `ApiServer`. The executable script `bin/home-tube-api` (used via the `npm start` command) starts the server after building the TypeScript sources.

Key constants such as the default port (`DEFAULT_API_PORT`) and directory names for metadata and thumbnails are defined in `src/const.ts`. The main class `ApiServer` sets up the HTTP server, parses command-line args, loads the app config, and registers all request handlers.

### Video processing

Modules under `src/videos/` manage metadata, thumbnails, snapshots, and video conversions using FFmpeg. For example, `MetaManager` reads/writes `meta.json` files, then enqueues tasks for thumbnails, snapshots, and MP4 conversion as needed. `FFmpegWorker` provides a simple queue mechanism to process video tasks asynchronously. Managers for thumbnails, snapshots, and MP4 files derive from this base worker. `StorageMonitor` scans directories for video files to keep the `VideoCollection` in sync.

### Configuration and utilities

Application configuration is stored in a JSON file (default `~/.home-tube-config.json`). Helper functions for loading, saving, and validating this configuration live in `src/utils/AppConfigUtils.ts`. The server parses command-line arguments such as `--port` and `--appConfig` using `yargs` in `src/utils/ApiServerUtils.ts`. General utilities are under `src/utils/`.

### Tests and hooks

Unit tests use Jest with `ts-jest` and can be run via `npm test`. Preconfigured Git hooks enforce code quality:

- `.githooks/pre-commit` runs ESLint (`npm run lint`) before committing.
- `.githooks/pre-push` runs the Jest test suite before pushing.

Enable these hooks by running:

```bash
$ git config --local core.hooksPath .githooks
```

### Suggested next steps

1. **Install dependencies and build**
   ```bash
   npm install
   npm run build
   ```
2. **Run linting and tests**
   ```bash
   npm run lint
   npm test
   ```
3. **Explore HTTP endpoints** by reading `src/handlers/` and the tests under `src/**/*.test.ts`.
4. **Configuration** details can be found in `src/utils/AppConfigUtils.ts`.
5. **Video processing workflow** is implemented under `src/videos/`.

## リポジトリ概要 (Japanese)

このプロジェクトは TypeScript/Node.js 製の API サーバー **HomeTube API** です。エントリーポイントは `src/index.ts` で `ApiServer` をエクスポートしています。`npm start` で使用される `bin/home-tube-api` スクリプトは TypeScript ソースをビルドしてからサーバーを起動します。

`src/const.ts` には、デフォルトポート (`DEFAULT_API_PORT`) やメタデータ・サムネイルのディレクトリ名など、重要な定数が定義されています。メインクラス `ApiServer` は HTTP サーバーの設定、コマンドライン引数の解析、アプリ設定の読み込み、各種リクエストハンドラの登録を行います。

### 動画処理

`src/videos/` 以下のモジュールでは、FFmpeg を使ったメタデータ管理、サムネイル生成、スナップショット、動画変換を扱います。たとえば `MetaManager` は `meta.json` を読み書きした後、サムネイル、スナップショット、MP4 変換のタスクをキューに追加します。`FFmpegWorker` はこれらの処理を非同期に実行する簡易キューを提供し、各マネージャはこのベースクラスを継承します。`StorageMonitor` はディレクトリを監視して `VideoCollection` と同期を保ちます。

### 設定とユーティリティ

アプリの設定は JSON ファイル（デフォルトは `~/.home-tube-config.json`）に保存されます。設定の読み込み・保存・バリデーションを行うヘルパー関数は `src/utils/AppConfigUtils.ts` にあります。サーバーは `src/utils/ApiServerUtils.ts` で `yargs` を用いて `--port` や `--appConfig` などのコマンドライン引数を解析します。その他のパス操作やログ出力などのユーティリティは `src/utils/` にまとめられています。

### テストとフック

単体テストは Jest（ts-jest）を使用しており、`npm test` で実行できます。Git フックによりコード品質が保たれます。

- `.githooks/pre-commit` で ESLint (`npm run lint`) が実行されます
- `.githooks/pre-push` で Jest テストスイートが実行されます

以下のコマンドでフックを有効化できます。

```bash
$ git config --local core.hooksPath .githooks
```

### 新規参加者へのステップ

1. **依存関係のインストールとビルド**
   ```bash
   npm install
   npm run build
   ```
2. **リントチェックとテストの実行**
   ```bash
   npm run lint
   npm test
   ```
3. **HTTP エンドポイントの構造** は `src/handlers/` や `src/**/*.test.ts` を見て理解しましょう
4. **設定ファイル** の構造は `src/utils/AppConfigUtils.ts` を参照しましょう
5. **動画処理のワークフロー** は `src/videos/` を読んで把握してください

## Development

### Initial setup

```bash
$ git config --local core.hooksPath .githooks
```

## 開発 (Japanese)

### 初期設定

```bash
$ git config --local core.hooksPath .githooks
```
