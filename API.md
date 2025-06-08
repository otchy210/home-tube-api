# HomeTube API Reference

This document describes the HTTP endpoints exposed by the HomeTube API server.
All responses are JSON unless otherwise noted. Many endpoints require a video
`key` parameter which can be obtained from search results.

## Endpoints

### GET `/appConfig`
Return the current application configuration.

Response body: `AppConfig`

### POST `/appConfig`
Update the application configuration. The request body must be a partial
`AppConfig` object. On success the updated configuration is returned. Validation
errors are returned as an array when inputs are invalid.

### GET `/search`
Search videos. When no query parameters are provided all indexed videos are
returned. Supported parameters:

- `names`: string to search in file path tokens
- `length`: one of `moment`, `short`, `middle`, `long`, `movie`
- `size`: one of `sd`, `hd`, `fhd`, `4k`, `8k`
- `stars`: number 1-5
- `tags`: comma separated tags

Response body: array of `VideoDocument`.

### GET `/details`
Get metadata and properties for a single video.
Required query parameter: `key`.

Response body: `VideoDetails`.

### POST `/properties`
Update stars or tags of a video.
Query parameter `key` must be specified and request body should contain any of
`stars` or `tags` fields. The updated properties are returned.

### POST `/rename`
Rename a file. Requires `key` and `name` query parameters.
The response returns the updated `VideoValues` of the renamed file.

### POST `/convert`
Enqueue conversion job. Requires `key` and `type=mp4` parameters.
Returns `{ status: 'queued' | 'processing' | 'available' }` indicating the
current conversion state.

### DELETE `/convert`
Remove a converted file. Requires `key` and `type=mp4` parameters.
Returns `{ status: 'unavailable' | 'queued' | 'processing' | 'available' }`.

### GET `/video`
Download the video file. When an MP4 file has been converted it will be served
instead of the original file. Requires `key` parameter.
The response body is a static file stream.

### GET `/thumbnails`
Return a thumbnails image. Requires `key` and `minute` parameters where `minute`
represents the start minute of the thumbnails. The response is a static JPEG
file with cache header.

### GET `/snapshot`
Retrieve a snapshot image. Requires `key` parameter. If no snapshot exists a
`no-snapshot.png` file is returned.

### POST `/snapshot`
Update the snapshot image for a video. Requires `key` parameter and body
`{ dataURL: string }` containing a base64 encoded PNG image. Returns `true` on
success.

### GET `/allTags`
Return all tags with counts.

### GET `/serverStatus`
Return status of workers and storages.

Response body: `ServerStatus`.

---

# HomeTube API リファレンス (日本語)

このドキュメントでは HomeTube API サーバーが公開している HTTP エンドポイントを説明します。
レスポンスは特別な記載がない限り JSON を返します。多くのエンドポイントでは検索結果から取得できる `key` パラメータが必要です。

## エンドポイント

### GET `/appConfig`
現在のアプリケーション設定を返します。

レスポンスボディ: `AppConfig`

### POST `/appConfig`
アプリケーション設定を更新します。リクエストボディには部分的な `AppConfig` オブジェクトを指定します。成功すると更新された設定を返します。入力が不正な場合はバリデーションエラーが配列で返されます。

### GET `/search`
動画を検索します。クエリパラメータを指定しない場合、すべての動画が返されます。利用可能なパラメータ:

- `names`: パスのトークンに対して検索する文字列
- `length`: `moment`, `short`, `middle`, `long`, `movie` のいずれか
- `size`: `sd`, `hd`, `fhd`, `4k`, `8k` のいずれか
- `stars`: 1-5 の数字
- `tags`: カンマ区切りのタグ

レスポンスボディ: `VideoDocument` の配列

### GET `/details`
単一の動画のメタデータとプロパティを取得します。
必須クエリパラメータ: `key`

レスポンスボディ: `VideoDetails`

### POST `/properties`
動画の star やタグを更新します。
`key` クエリパラメータを指定し、リクエストボディに `stars` または `tags` を含めます。更新後のプロパティが返されます。

### POST `/rename`
ファイル名を変更します。`key` と `name` クエリパラメータが必要です。
レスポンスとして変更後の `VideoValues` が返されます。

### POST `/convert`
変換ジョブを登録します。`key` と `type=mp4` が必要です。
`{ status: 'queued' | 'processing' | 'available' }` を返し、現在の変換状態を示します。

### DELETE `/convert`
変換済みファイルを削除します。`key` と `type=mp4` が必要です。
`{ status: 'unavailable' | 'queued' | 'processing' | 'available' }` を返します。

### GET `/video`
動画ファイルをダウンロードします。MP4 に変換済みの場合はそちらが提供されます。
`key` パラメータが必要です。レスポンスボディは静的ファイルストリームです。

### GET `/thumbnails`
サムネイル画像を返します。`key` と `minute` パラメータが必要で、`minute` はサムネイルの開始分を表します。レスポンスはキャッシュヘッダ付きの JPEG 画像です。

### GET `/snapshot`
スナップショット画像を取得します。`key` パラメータが必要です。スナップショットが存在しない場合は `no-snapshot.png` が返されます。

### POST `/snapshot`
動画のスナップショットを更新します。`key` パラメータと、base64 でエンコードされた PNG 画像を含む `{ dataURL: string }` をボディに指定します。成功すると `true` を返します。

### GET `/allTags`
タグの一覧とそれぞれの件数を返します。

### GET `/serverStatus`
ワーカーとストレージの状態を返します。

レスポンスボディ: `ServerStatus`
