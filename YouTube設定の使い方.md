# フルリエル公式サイト：YouTube CM設定ガイド（v11）

## 管理画面から差し替える

1. YouTubeにCM動画をアップロード（公開 または 限定公開、埋め込み可能な状態）。
2. Pages CMSにログイン → 「トップページ・YouTube設定」を開く。
3. 「YouTube動画のURL」にその動画の共有URLを貼り付ける（例 `https://www.youtube.com/watch?v=XXXXXXXXXXX`）。チャンネルのトップURLではなく**動画単体のURL**を使う。
4. 見出しを必要なら変更し、「YouTubeのCMを表示する」をオン → Save。
5. Cloudflare PagesをGitHub連携で公開している場合、GitHub更新後のビルド完了でサイトに反映されます。

## 表示ルール

- トップページの告知画像の次に「フルリエル公式CM」欄を設置。
- 動画欄までスクロールしたら、可能なブラウザでは**無音で自動再生**を試みます。自動再生が禁止された場合は動画の再生ボタンを押して視聴できます。
- 「小音量で聴く（15%）」は利用者が押したときだけ音声をONにします。YouTube標準プレイヤーで再生、一時停止、音量、全画面表示も操作できます。
- 動画がなければ（URL未入力、無効、または表示オフ）CM欄は非表示。
- YouTube側で埋め込みを禁止した動画、非公開動画、年齢制限などで埋め込みできない動画は再生できません。
- **GitHubに動画をアップロードする必要はありません**。CMを変えるときはURLを変更するだけです。

## 初回の更新（既存GitHubリポジトリ）

「v11差分更新ファイル.zip」を解凍し、フォルダの**中身**をGitHubリポジトリ直下へアップロード。`index.html`・`styles.css`・`youtube.js`・`scripts/build.mjs`・`content/site.json`・`site-settings.js`・`.pages.yml` を置き換えます。

`.pages.yml` は先頭に**ドットが必要**。ブラウザアップロードで先頭ドットが消える場合はGitHubの既存 `.pages.yml` ファイルを編集して差し替えてください。既存 `content/casts` 名簿は変更不要です。

Cloudflare Pagesはまだ未設定なら、GitHub接続方式で、ビルドコマンド `node scripts/build.mjs`、出力フォルダ `dist` を設定します。
