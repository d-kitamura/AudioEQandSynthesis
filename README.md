# Audio EQ and Synthesis / 音のEQ・加算合成シミュレータ

## 概要

**Audio EQ and Synthesis** は，ブラウザ上で動作する音響教育用Webアプリです。
ホワイトノイズ，ピンクノイズ，音声ファイル，正弦波加算合成音などに対してパラメトリックEQを適用し，周波数特性の変化と実際の音の変化を同時に確認できます。

また，複数の正弦波を自由に重ね合わせることで，音色がどのように構成されるかを体験的に学ぶことができます。
のこぎり波，矩形波，三角波に対応する倍音構造も確認できるため，フーリエ級数展開や倍音構造の理解にも利用できます。

PAにおけるEQ調整の練習，音響工学・信号処理・音楽音響の教育デモ，音色とスペクトルの関係の説明などを想定しています。

## 公開ページ

以下のGitHub Pagesから利用できます。

https://d-kitamura.github.io/AudioEQandSynthesis/

## 主な機能

* ブラウザ上で動作するリアルタイム音響デモ
* ホワイトノイズ・ピンクノイズへのEQ適用
* 内蔵サンプル音源（`mix.mp3`）へのEQ適用
* 音声ファイルを読み込んでEQを適用
* 最大20バンドのパラメトリックEQ
* EQバンドごとの周波数，ゲイン，Qの調整
* EQ点をドラッグして直感的に周波数・ゲインを操作
* マウスホイールまたは2本指ピンチによるQの調整
* EQ点のダブルクリックによるフラット化
* グラフの空き位置をダブルクリックしてPeakingバンドを追加
* 以下のフィルタタイプに対応

  * Peaking
  * Low shelf
  * High shelf
  * Low pass
  * High pass
* リアルタイムスペクトル表示
* 正弦波加算合成モード
* 正弦波成分の追加・削除
* 各正弦波成分の周波数・レベルの調整
* 波形表示
* 倍音プリセット

  * のこぎり波
  * 矩形波
  * 三角波
* 合成音量の正規化
* 日本語・英語表示の切り替え

## 想定用途

* EQのかかり具合の確認
* PAやライブ音響におけるEQ調整の練習
* ハウリング対策や不要帯域のカットの感覚的理解
* ホワイトノイズ・ピンクノイズの違いの確認
* 周波数，ゲイン，Qの関係の学習
* 音色が複数の周波数成分から構成されることの理解
* 倍音構造の学習
* フーリエ級数展開の導入
* 音響信号処理，音楽音響，波形・スペクトル解析の教育デモ

## 使い方

1. 公開ページをブラウザで開きます。
2. `Start` ボタンを押して音を出します。
3. `Parametric EQ` モードでは，音源を選択してEQを調整します。

   * White noise
   * Pink noise
   * Synthesis
   * Music（内蔵サンプル `mix.mp3`）
   * Audio file
4. グラフ上のEQ点をドラッグすると，中心周波数とゲインを変更できます。
5. マウスホイールまたは2本指ピンチでQを変更できます。
6. `Add` でEQバンドを追加できます。
7. `Flat` でEQをフラットに戻せます。
8. `Synthesis` モードでは，正弦波成分を追加・調整して音色の変化を確認できます。
9. 倍音プリセットを使うと，のこぎり波，矩形波，三角波の典型的な倍音構造を確認できます。

## 教育での利用例

### EQの練習

ホワイトノイズやピンクノイズに対して，特定の周波数帯域をブーストまたはカットすることで，EQが音に与える影響を耳で確認できます。
PAの現場でよく行われる「特定帯域を探して削る」「音を太くする」「こもりを取る」「耳に痛い帯域を抑える」といった操作の練習に利用できます。

### Qの理解

Qを小さくすると広い帯域に影響し，Qを大きくすると狭い帯域だけに影響します。
この違いをグラフと音の両方で確認できるため，パラメトリックEQの基本操作の理解に役立ちます。

### 音色と倍音構造の理解

正弦波を複数重ねることで，単純な正弦波から複雑な音色が作られることを確認できます。
基音に対して整数倍の周波数成分を加えることで，倍音構造と音色の関係を学習できます。

### フーリエ級数展開の導入

のこぎり波，矩形波，三角波のプリセットを用いることで，周期波形が複数の正弦波の和として表現できることを体験的に確認できます。
数式としてのフーリエ級数展開に入る前の直感的な導入として利用できます。

## ローカルでの実行方法

このリポジトリをクローンまたはダウンロードし，`index.html` をブラウザで開いてください。

```bash
git clone https://github.com/d-kitamura/AudioEQandSynthesis.git
cd AudioEQandSynthesis
```

その後，`index.html` をブラウザで開きます。

簡易HTTPサーバを使う場合は，例えば以下のように実行できます。

```bash
python -m http.server 8000
```

ブラウザで以下にアクセスします。

```text
http://localhost:8000
```

## ファイル構成

```text
AudioEQandSynthesis/
├── index.html   # アプリ本体のHTML
├── styles.css   # 画面レイアウトとデザイン
├── app.js       # 音声処理，描画，UI制御
├── mix-data.js  # ローカル実行用に埋め込んだMusicデータ
└── mix.mp3      # Music用の内蔵サンプル音源
```

## 注意

このアプリは教育・デモンストレーションを目的とした簡易ツールです。
大音量で使用すると聴覚に負担を与える可能性があります。特に高いゲイン設定，高周波成分，ヘッドホン使用時には，必ず小さな音量から開始してください。

また，このアプリはブラウザのWeb Audio APIを利用しています。
ブラウザやOSの音声設定によって，動作や音量が異なる場合があります。

## ライセンス

ライセンスは未設定です。
必要に応じて，`LICENSE` ファイルを追加してください。

---

# Audio EQ and Synthesis

## Overview

**Audio EQ and Synthesis** is a browser-based educational web application for audio equalization and additive synthesis.
It allows users to apply parametric EQ to white noise, pink noise, audio files, and synthesized sine-wave sounds while observing the relationship between frequency response and perceived sound.

The application also provides an additive synthesis mode, where users can combine multiple sine waves and learn how timbre is formed from individual frequency components.
Harmonic presets for sawtooth, square, and triangle waves are included, making the tool useful for understanding harmonic structures and Fourier series.

This application is intended for PA equalization practice, educational demonstrations in acoustics and signal processing, and explanations of the relationship between sound, waveform, and spectrum.

## Live Demo

The application is available via GitHub Pages:

https://d-kitamura.github.io/AudioEQandSynthesis/

## Features

* Real-time browser-based audio demonstration
* EQ processing for white noise and pink noise
* EQ processing for the built-in music sample (`mix.mp3`)
* Audio file loading and EQ processing
* Up to 20 parametric EQ bands
* Control of frequency, gain, and Q for each EQ band
* Intuitive drag operation for frequency and gain
* Mouse wheel or two-finger pinch control for Q
* Double-click an EQ point to flatten its band
* Double-click an empty graph position to add a Peaking band
* Supported filter types:

  * Peaking
  * Low shelf
  * High shelf
  * Low pass
  * High pass
* Real-time spectrum visualization
* Additive sine synthesis mode
* Addition and deletion of sine components
* Frequency and level control for each sine component
* Waveform display
* Harmonic presets:

  * Sawtooth wave
  * Square wave
  * Triangle wave
* Optional normalization of synthesized sound level
* Japanese and English user interface

## Intended Use

* Checking how EQ affects sound
* Practicing EQ operation for PA and live sound reinforcement
* Understanding how to cut or boost specific frequency ranges
* Comparing white noise and pink noise
* Learning the relationship between frequency, gain, and Q
* Understanding how timbre is constructed from multiple frequency components
* Learning harmonic structures
* Introductory demonstration of Fourier series
* Educational demonstrations in audio signal processing, musical acoustics, waveform analysis, and spectrum analysis

## How to Use

1. Open the live demo page in a web browser.
2. Press the `Start` button to enable audio playback.
3. In `Parametric EQ` mode, select the source to be processed:

   * White noise
   * Pink noise
   * Synthesis
   * Music (built-in `mix.mp3` sample)
   * Audio file
4. Drag an EQ point on the graph to change its center frequency and gain.
5. Use the mouse wheel or a two-finger pinch gesture to change Q.
6. Use `Add` to add an EQ band.
7. Use `Flat` to reset the EQ curve.
8. In `Synthesis` mode, add and adjust sine-wave components to observe changes in timbre.
9. Use the harmonic presets to explore typical harmonic structures of sawtooth, square, and triangle waves.

## Educational Examples

### EQ Practice

By applying EQ to white noise or pink noise, users can hear how boosting or cutting a specific frequency range changes the sound.
This is useful for practicing common PA operations such as finding problematic frequency bands, reducing harshness, removing muddiness, or shaping the overall tone.

### Understanding Q

A smaller Q affects a wider frequency range, while a larger Q affects a narrower range.
The application allows users to observe this difference both visually and aurally, helping them understand the basic behavior of parametric EQ.

### Timbre and Harmonic Structure

By combining multiple sine waves, users can experience how complex timbres are created from simple sinusoidal components.
Adding frequency components at integer multiples of a fundamental frequency helps explain the relationship between harmonics and perceived timbre.

### Introduction to Fourier Series

The sawtooth, square, and triangle wave presets demonstrate that periodic waveforms can be represented as sums of sine waves.
This provides an intuitive introduction to Fourier series before moving on to mathematical formulations.

## Running Locally

Clone or download this repository and open `index.html` in a web browser.

```bash
git clone https://github.com/d-kitamura/AudioEQandSynthesis.git
cd AudioEQandSynthesis
```

Then open `index.html` in your browser.

You can also run a simple local HTTP server, for example:

```bash
python -m http.server 8000
```

Then access:

```text
http://localhost:8000
```

## File Structure

```text
AudioEQandSynthesis/
├── index.html   # Main HTML file
├── styles.css   # Layout and visual design
├── app.js       # Audio processing, drawing, and UI control
├── mix-data.js  # Embedded Music data for local-file execution
└── mix.mp3      # Built-in sample used by the Music source
```

## Note

This application is intended for educational demonstrations.
High output levels may cause discomfort or hearing damage. Always start with a low master volume, especially when using high gain, high-frequency components, or headphones.

This application uses the browser Web Audio API.
Behavior and output level may vary depending on the browser and operating system audio settings.

## License

No license has been specified yet.
Add a `LICENSE` file if necessary.
