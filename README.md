# Myaku2Saver

## プロジェクト概要

Myaku2Saverは、Three.jsとReact Three Fiberを使用した3Dインタラクティブビジュアライゼーションアプリケーションです。「脈」をテーマにした有機的な球体（Komyaku）が画面上で動き回り、物理シミュレーションによって分裂・消滅を繰り返すアートプロジェクトです。

## 技術仕様

### フレームワーク・ライブラリ
- **Next.js 15.3.3** - Reactベースのフルスタックフレームワーク
- **React 19.0.0** - UIライブラリ
- **TypeScript 5** - 型安全な開発環境
- **Three.js 0.177.0** - 3Dグラフィックスライブラリ
- **React Three Fiber 9.1.1** - ReactでThree.jsを使用するためのライブラリ
- **React Three Drei 10.1.2** - React Three Fiberの便利なヘルパー
- **Tailwind CSS 4** - ユーティリティファーストCSSフレームワーク

### 開発環境
- **Node.js** - JavaScript実行環境
- **ESLint** - コード品質管理
- **PostCSS** - CSS処理ツール

## 機能仕様

### 1. Komyaku（脈球）システム
- **初期生成数**: 6個
- **最大数**: 15個
- **色彩**: シアン、マゼンタ、ブルー、レッドの4色
- **サイズ**: 半径0.6〜1.1の可変サイズ

### 2. 物理シミュレーション
- **移動**: 3D空間内での自由な浮遊運動
- **衝突検知**: 球体同士の衝突判定
- **重力**: 軽微な重力効果
- **ドリフト**: ランダムな方向への緩やかな移動

### 3. 生命サイクル
- **分裂**: 条件を満たした球体が2つに分裂（メタボール効果付き）
- **世代管理**: 最大4世代まで分裂、それ以上は分裂停止
- **新生児生成**: 定期的に大きな新しい子脈が自然発生
- **成長**: 時間経過による球体の成長
- **消滅**: 個体数過多時、高齢時、高世代小型個体の自然消滅
- **再生**: 消滅後の新しい個体の生成

### 4. メタボール分裂システム
- **段階的分裂**: 合体状態から完全分離まで5段階のアニメーション
- **接続部分**: 中央、メイン、ブリッジの3種類の接続要素
- **滑らかな変形**: プログレス0.1-0.9の間で滑らかな形状変化
- **透明度制御**: 各段階で適切な透明度調整

### 5. ビジュアル要素
- **目**: 各球体に白目と瞳孔を配置
- **アニメーション**: 滑らかな動きと変形
- **透明度**: 生命サイクルに応じた透明度変化
- **照明**: 環境光による立体感の演出
- **パルスエフェクト**: 新生成時の強調表示（1.5倍拡大→元サイズ）

## ファイル構成

```
myaku2saver/
├── app/
│   ├── layout.tsx          # アプリケーションレイアウト
│   ├── page.tsx            # メインページ
│   ├── globals.css         # グローバルスタイル
│   └── favicon.ico         # ファビコン
├── components/
│   ├── FluidBlobs.tsx      # メインコンポーネント
│   └── komyaku/
│       ├── Komyaku.tsx     # 個別球体コンポーネント
│       ├── physics.ts      # 物理シミュレーション
│       ├── types.ts        # 型定義
│       ├── Sphere.tsx      # 球体メッシュ
│       ├── WhiteEye.tsx    # 白目コンポーネント
│       ├── Pupil.tsx       # 瞳孔コンポーネント
│       ├── SimpleMetaball.tsx # メタボール分裂エフェクト
│       └── MetaballBackground.tsx # メタボール背景（未使用）
├── public/                 # 静的ファイル
├── package.json           # 依存関係定義
├── tsconfig.json          # TypeScript設定
├── next.config.ts         # Next.js設定
├── tailwind.config.js     # Tailwind CSS設定
└── README.md              # プロジェクト仕様書
```

## データ構造

### KomyakuData インターフェース
```typescript
interface KomyakuData {
  id: number                    // 一意識別子
  position: THREE.Vector3       // 3D座標
  velocity: THREE.Vector3       // 速度ベクトル
  radius: number               // 現在の半径
  originalRadius: number       // 初期半径
  color: string               // 色（16進数）
  mass: number                // 質量
  driftDirection: THREE.Vector3 // ドリフト方向
  eyePhase: number            // 目のアニメーション位相
  age: number                 // 年齢
  canSplit: boolean           // 分裂可能フラグ
  isSplitting: boolean        // 分裂中フラグ
  splitProgress: number       // 分裂進行度
  splitDirection: THREE.Vector3 // 分裂方向
  isDying: boolean            // 消滅中フラグ
  deathProgress: number       // 消滅進行度
  opacity: number             // 透明度
  childSphere1Offset: THREE.Vector3 // 子球体1のオフセット
  childSphere2Offset: THREE.Vector3 // 子球体2のオフセット
}
```

## 物理パラメータ

### 基本設定
- **重力**: 0.0001（Y軸負方向）
- **摩擦**: 0.98
- **反発係数**: 0.7
- **分裂閾値**: 年齢15秒
- **消滅閾値**: 個体数11個以上

### 移動範囲
- **X軸**: -7 〜 +7
- **Y軸**: -4 〜 +4  
- **Z軸**: -2 〜 +2

## 開発・実行方法

### 開発サーバーの起動
```bash
npm run dev
# または
yarn dev
# または
pnpm dev
# または
bun dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションを確認できます。

### ビルド
```bash
npm run build
```

### 本番サーバーの起動
```bash
npm run start
```

### コード品質チェック
```bash
npm run lint
```

## パフォーマンス最適化

- **SSR無効化**: Three.jsコンポーネントは動的インポートでSSRを回避
- **デバイスピクセル比制限**: 最大2倍に制限してパフォーマンスを確保
- **アンチエイリアス**: 高品質な描画のためアンチエイリアスを有効化
- **フレームレート最適化**: useFrameフックによる効率的なアニメーション更新

## ブラウザ対応

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

WebGLとES6+をサポートするモダンブラウザが必要です。

## ライセンス

このプロジェクトはプライベートプロジェクトです。

## 今後の拡張予定

- [x] メタボール分裂エフェクトの実装
- [x] パルスエフェクトの追加
- [x] 分裂時の同色保持
- [x] アニメーション速度の最適化
- [x] 世代管理システムの実装
- [x] 新生児自動生成機能
- [ ] 真のmarching cubesアルゴリズムの実装
- [ ] インタラクティブ操作の追加
- [ ] 音響効果の統合
- [ ] パフォーマンス監視機能
- [ ] 設定パネルの追加

---

*このプロジェクトは生命の脈動をデジタルアートとして表現することを目的としています。*
