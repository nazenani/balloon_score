// phina.js をグローバル領域に展開
phina.globalize();

var ASSETS = {
	// 画像
	image: {
		'tomapiko': 'img/tomapiko_ss.png',
		'balloon': 'img/balloon.png',
		'ghost': 'img/obake.png',
	},
	// フレームアニメーション情報
	spritesheet: {
		'tomapiko_ss': 'tmss/tomapiko.tmss',
		'balloon_ss': 'tmss/balloon.tmss',
		'ghost_ss': 'tmss/obake.tmss',
	}
}

// 定数
var JUMP_POWER    = 10;  // ジャンプ力
var GRAVITY       = 0.5; // 重力
var SCREEN_WIDTH  = 640; // 横幅
var SCREEN_HEIGHT = 960; // 縦幅

// TitleScene クラスを定義
phina.define('TitleScene', {
	superClass: 'DisplayScene',
	// コンストラクタ
	init: function() {
		this.superInit();
		// 背景
		this.backgroundColor = 'skyblue';

		// 縦線
		var lineY = RectangleShape({
			width: 2,
			height: this.gridY.span(16),
			fill: 'black',
		}).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center());
		lineY.alpha = 0.5;

		// タイトル
		Label({
			text:'タッチしてバルーンGET',
			fontSize: 62,
			fill: 'white',
		}).addChildTo(this).setPosition(this.gridX.center(), this.gridY.span(4));

		// 説明左
		Label({
			text:'画面の左側を\nタッチすると\n左上方向へ',
			fontSize: 32,
			fill: 'white',
		}).addChildTo(this).setPosition(this.gridX.center(-4), this.gridY.center());
		// 説明右
		Label({
			text:'画面の右側を\nタッチすると\n右上方向へ',
			fontSize: 32,
			fill: 'white',
		}).addChildTo(this).setPosition(this.gridX.center(4), this.gridY.center());
		// 説明中心
		Label({
			text:'それぞれジャンプします',
			fontSize: 32,
			fill: 'white',
		}).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(2));

		// 開始ラベル
		var start = Start().addChildTo(this);
		start.x = this.gridX.center()
		start.bottom = this.gridY.span(13);
		start.changeSize();

		// 床
		this.floor = RectangleShape({
			width: this.gridX.width,
			height: this.gridY.span(1),
			fill: 'silver',
		}).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(4));
		this.floor.alpha = 0.0;

		// プレイヤー
		this.player = Player('tomapiko').addChildTo(this).setPosition(this.gridX.center(), this.floor.top);
		// 初速度を与える
		this.player.physical.force(-3, 0);
		// 初期アニメーション
		this.player.anim.gotoAndPlay('left');

		// 画面上でタッチが離れた時
		this.onpointend = function(e) {
			// 次のシーン
			this.exit('main');
		}
	},

	update: function(app) {
		// 床とヒットしたら
		if (this.player.hitTestElement(this.floor)) {
			// y方向の速度と重力を無効にする
			this.player.physical.velocity.y = 0;
			this.player.physical.gravity.y = 0;
			// 位置調整
			this.player.bottom = this.floor.top;
			// フラグ立て
			this.player.isOnFloor = true;
			// アニメーション変更
			this.player.anim.gotoAndPlay('left');
		}

		// 100フレーム毎にジャンプ
		if ((app.ticker.frame % 100) == 0) {
			// 上方向に速度を与える（ジャンプ）
			this.player.physical.velocity.y = -JUMP_POWER;
			// 重力復活
			this.player.physical.gravity.y = GRAVITY;
			// フラグ変更
			this.player.isOnFloor = false;
			// アニメーション変更
			this.player.anim.gotoAndPlay('fly');
		}
	},
});

// MainScene クラスを定義
phina.define('MainScene', {
	superClass: 'DisplayScene',
	// コンストラクタ
	init: function() {
		this.superInit();
		// 背景
		this.backgroundColor = 'skyblue';

		// スコア
		this.score = 0;

		// ゲーム開始フラグ
		this.gameFlg = true;

		// ラベル
		this.label = Label({
			text: this.score + '',
			fontSize: 24,
			fill: 'gray',
		}).addChildTo(this).setPosition(this.gridX.center(), this.gridY.span(3));

		// バルーングループ
		this.balloonGroup = DisplayElement().addChildTo(this);

		// ゴーストグループ
		this.ghostGroup = DisplayElement().addChildTo(this);

		// 床
		this.floor = RectangleShape({
			width: this.gridX.width,
			height: this.gridY.span(1),
			fill: 'silver',
		}).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(2));

		// プレイヤー
		this.player = Player('tomapiko').addChildTo(this).setPosition(this.gridX.center(), this.floor.top);

		// 画面タッチ時処理
		this.onpointend = function(e) {
			if (this.gameFlg) {
				// シーンの中心を基準に力の加え方を変化させて向きを変化させる
				if (Math.round(e.pointer.x) / (SCREEN_WIDTH / 2) > 1) {
					this.player.physical.force(3, 0);
					this.player.scaleX *= (this.player.scaleX == 1) ? -1 : 1;
				} else {
					this.player.physical.force(-3, 0);
					this.player.scaleX *= (this.player.scaleX == 1) ? 1 : -1;
				}
				// 上方向に速度を与える（ジャンプ）
				this.player.physical.velocity.y = -JUMP_POWER;
				// 重力復活
				this.player.physical.gravity.y = GRAVITY;
				// 床上フラグ変更
				this.player.isOnFloor = false;
				// アニメーション変更
				this.player.anim.gotoAndPlay('fly');
				// 床フォードアウト
				this.floor.tweener.clear().fadeOut(200);
			}
		}
	},

	// ゲームオーバー処理
	gameover: function() {
		var self = this;
		// ゲーム開始フラグ変更
		this.gameFlg = false;
		// 床上フラグ変更
		this.player.isOnFloor = true;
		// スコアラベル削除
		this.label.remove();
		// ゲームオーバー
		var label = Label({
			text: 'GAME OVER',
			fill: 'yellow',
			fontSize: 64,
		}).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center());
		// 少し待ってからタイトルへ遷移
		label.tweener.clear()
			.wait(2000)
			.call(function() {
				self.nextLabel = 'result';
				self.exit({
					score: self.score
				});
			});
	},

	// 毎フレーム処理
	update: function(app) {
		var player = this.player;
		var balloon = this.balloon;
		var self = this;

		// 200フレーム毎にバルーンを生成
		if ((app.ticker.frame % 200) == 0) {
			// バルーングループに追加
			var balloon = Balloon('balloon').addChildTo(this.balloonGroup);
			// 初期配置
			balloon.point();
		}

		// 100フレーム毎にゴーストを生成
		if ((app.ticker.frame % 200) == 0) {
			// ゴースト
			var ghost = Ghost('ghost').addChildTo(this.ghostGroup);
			// 初期配置
			pointX = (app.ticker.frame % 400) ? 0 : SCREEN_WIDTH;
			ghost.point(pointX);
		}

		// 床から離れた場合に判定処理を行う
		if (!player.isOnFloor) {
			// 落下判定
			if (player.top > SCREEN_HEIGHT) {
				// Y方向の速度と重力を無効にする
				player.physical.velocity.y = 0;
				player.physical.gravity.y = 0;
				// 位置調整
				player.bottom = this.floor.top;
				player.x = self.gridX.center();
				player.physical.force(0, 0);
				// アニメーション変更
				player.anim.gotoAndPlay('down');
				// ゲームオーバー
				this.gameover();
			}

			// プレイヤーとゴーストの衝突判定
			this.ghostGroup.children.some(function(ghost) {
				if (player.hitTestElement(ghost)) {
					// Y方向の速度と重力を無効にする
					player.physical.velocity.y = 0;
					player.physical.gravity.y = 0;
					// 位置調整
					player.bottom = self.floor.top;
					player.x = self.gridX.center();
					player.physical.force(0, 0);
					// アニメーション変更
					player.anim.gotoAndPlay('down');
					// ゲームオーバー
					self.gameover();
				}
			});

			// プレイヤーとバルーンの衝突判定
			this.balloonGroup.children.some(function(balloon) {
				if (!balloon.isBreak) {
					if (player.hitTestElement(balloon)) {
						self.score++
						self.label.text = self.score;
						balloon.isBreak = true;
						balloon.anim.gotoAndPlay('end');
						balloon.tweener.clear()
							.fadeOut(200)
							.call(function() {
								this.remove();
							}, self);
					}
				}
			});
		}
	}
});

// スタートラベル
phina.define('Start', {
	// 親クラス指定
	superClass: 'Label',
	// コンストラクタ
	init: function() {
		// 親クラス初期化
		this.superInit({
			text:'画面をタッチしてスタート',
			fontSize: 42,
			fill: 'white',
		});
	},

	changeSize: function() {
		this.tweener.clear()
			.scaleTo(1.1, 300)
			.scaleTo(0.9, 300)
			.call(function() {
				this.changeSize();
			}, this);
	},
});

// プレイヤー
phina.define('Player', {
	// 親クラス指定
	superClass: 'Sprite',
	// コンストラクタ
	init: function(image) {
		// 親クラス初期化
		this.superInit(image, 64, 64);
		// フレームアニメーションをアタッチ
		this.anim = FrameAnimation('tomapiko_ss').attachTo(this);
		// 初期アニメーション
		this.anim.gotoAndPlay('stand');
		// 床上フラグ
		this.isOnFloor = true;
	},

	// 毎フレーム処理
	update: function() {
		// 画面橋で速度と向き反転
		if (this.left < 0 || this.right > SCREEN_WIDTH) {
			this.physical.velocity.x *= -1;
			this.scaleX *= -1;
		}
	}
});

// バルーン
phina.define('Balloon', {
	// 親クラス指定
	superClass: 'Sprite',
	// コンストラクタ
	init: function(image) {
		// 親クラス初期化
		this.superInit(image, 32, 32);
		// フレームアニメーションをアタッチ
		this.anim = FrameAnimation('balloon_ss').attachTo(this);
		// 初期アニメーション
		this.anim.gotoAndPlay('start');
		// 初速度を与える
		this.physical.force(0, -2);
		// 32pxなので1.5倍の大きさに調整する
		this.setScale(1.5);
		// 割れるフラグ
		this.isBreak = false;
	},

	point: function() {
		var x = Math.randint(30, SCREEN_WIDTH - 30);
		var y = Math.randint(SCREEN_HEIGHT / 2, SCREEN_HEIGHT);
		this.x = x;
		this.bottom = y;
	},

	// 毎フレーム処理
	update: function() {
		if (this.top < 10) {
			if (!this.isBreak) {
				// 初期アニメーション
				this.isBreak = true;
				this.tweener.clear()
					.fadeOut(200)
					.call(function() {
						this.remove();
					}, this);
			}
		}
	}
});

// ゴースト
phina.define('Ghost', {
	// 親クラス指定
	superClass: 'Sprite',
	// コンストラクタ
	init: function(image) {
		// 親クラス初期化
		this.superInit(image, 32, 32);
		// フレームアニメーションをアタッチ
		this.anim = FrameAnimation('ghost_ss').attachTo(this);
		// 32pxなので1.5倍の大きさに調整する
		this.setScale(1.5);
	},

	point: function(x) {
		var y = Math.randint(0, (SCREEN_HEIGHT / 3) * 2);
		this.x = x;
		this.top = y;
		var forceX = 1;
		var animation = 'right';
		if (x == SCREEN_WIDTH) {
			forceX = -1;
			animation = 'left';
		}
		this.anim.gotoAndPlay(animation);
		this.physical.force(forceX, 0);
	},

});

// メイン処理
phina.main(function() {
	// アプリケーション生成
	var app = GameApp({
		startLabel: 'title',
		// title: 'Touch To Jump',
		assets: ASSETS,
		width: SCREEN_WIDTH,
		height: SCREEN_HEIGHT,
		debug: true
	});

	// fps変更
	app.fps = 60;

	// 有効
	app.enableStats();

	// アプリケーション実行
	app.run();
});
