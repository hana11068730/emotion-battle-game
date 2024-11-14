import React, { useState, useEffect } from 'react';

const EmotionBattle = () => {
  // ゲームの状態を管理するステート
  const [playerPosition, setPlayerPosition] = useState(150);  // プレイヤーのX座標
  const [bullets, setBullets] = useState([]);                // 発射された弾の配列
  const [enemies, setEnemies] = useState([]);               // 敵の配列
  const [score, setScore] = useState(0);                    // スコア
  const [gameOver, setGameOver] = useState(false);          // ゲームオーバーフラグ
  const [hitEnemies, setHitEnemies] = useState([]);         // 撃破された敵の配列（エフェクト用）
  const [level, setLevel] = useState(1);                    // 現在のレベル
  const [enemiesDefeated, setEnemiesDefeated] = useState(0); // 倒した敵の数
  const [playerMood, setPlayerMood] = useState('normal');    // プレイヤーの感情状態
  const [backgroundMood, setBackgroundMood] = useState('happy'); // 背景の雰囲気
  const [powerUpActive, setPowerUpActive] = useState(false);  // パワーアップ状態
  const [powerUpType, setPowerUpType] = useState(null);      // パワーアップの種類
  const [comboCount, setComboCount] = useState(0);           // コンボ数
  const [lastKillTime, setLastKillTime] = useState(Date.now()); // 最後に敵を倒した時間

  // 敵の種類と特性を定義
  const enemyTypes = {
    angry: {
      kaomoji: ['(╬ಠ益ಠ)', '(｀Д´)', '(°Д°)', '(ﾉ`Д´)ﾉ', '( #`Д´)'],  // 怒った顔文字
      color: 'text-red-600',    // 敵の色
      points: 100,              // 倒した時の得点
      speed: 1                  // 基本移動速度
    }
  };

  // プレイヤーの感情状態に応じた顔文字
  const playerMoods = {
    normal: '(っ･ω･)っ',
    power: '(੭•̀ω•́)੭',
    happy: '(ﾉ´ヮ`)ﾉ*:･ﾟ✧',
    focused: '(●•̀ᴗ•́●)و ̑̑'
  };

  // 背景の雰囲気に応じたスタイル
  const backgroundStyles = {
    happy: 'bg-gradient-to-b from-pink-100 to-blue-100',
    excited: 'bg-gradient-to-b from-yellow-100 to-red-100',
    peaceful: 'bg-gradient-to-b from-blue-100 to-green-100',
    intense: 'bg-gradient-to-b from-purple-100 to-red-100'
  };

  // レベルが変わるたびに敵を生成
  useEffect(() => {
    const createEnemies = () => {
      const initialEnemies = [];
      // レベルに応じて敵の数を増やす（最大5行8列）
      const rows = Math.min(3 + Math.floor(level / 2), 5);
      const cols = Math.min(6 + Math.floor(level / 3), 8);

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          // ランダムな顔文字を選択
          const kaomoji = enemyTypes.angry.kaomoji[Math.floor(Math.random() * enemyTypes.angry.kaomoji.length)];

          initialEnemies.push({
            x: i * 60 + 30,
            y: j * 50 + 20,
            id: `enemy-${i}-${j}`,
            type: 'angry',
            kaomoji,
            // 30%の確率でジグザグ移動パターンを適用
            movementPattern: Math.random() < 0.3 ? 'zigzag' : 'normal'
          });
        }
      }
      return initialEnemies;
    };

    setEnemies(createEnemies());
  }, [level]);

  // キーボード入力の処理
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameOver) return;

      // 左右移動（パワーアップ時は移動速度上昇）
      if (e.key === 'ArrowLeft' && playerPosition > 10) {
        setPlayerPosition(prev => prev - (powerUpActive ? 15 : 10));
      }
      if (e.key === 'ArrowRight' && playerPosition < 290) {
        setPlayerPosition(prev => prev + (powerUpActive ? 15 : 10));
      }
      // スペースキーで弾を発射
      if (e.key === ' ') {
        setBullets(prev => [...prev, { x: playerPosition + 15, y: 360 }]);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [playerPosition, gameOver, powerUpActive]);

  // メインゲームループ
  useEffect(() => {
    const gameLoop = setInterval(() => {
      if (gameOver) return;

      // 弾の移動処理
      setBullets(prev =>
        prev.map(bullet => ({ ...bullet, y: bullet.y - 5 }))
          .filter(bullet => bullet.y > 0)
      );

      // 敵の移動処理（移動パターンに応じた動き）
      setEnemies(prev =>
        prev.map(enemy => ({
          ...enemy,
          x: enemy.x + (enemy.movementPattern === 'zigzag'
            ? Math.sin(Date.now() / 500) * 3  // ジグザグ移動
            : Math.sin(Date.now() / 1000 + enemy.y) * 2),  // 通常移動
          y: enemy.y + enemyTypes.angry.speed * (0.2 + level * 0.05)  // レベルに応じて速度上昇
        }))
      );

      // コンボの時間切れチェック
      if (Date.now() - lastKillTime > 1000) {
        setComboCount(0);
      }

      // ランダムに背景の雰囲気を変更（0.5%の確率）
      if (Math.random() < 0.005) {
        const moods = Object.keys(backgroundStyles);
        setBackgroundMood(moods[Math.floor(Math.random() * moods.length)]);
      }

      // 衝突判定
      bullets.forEach(bullet => {
        enemies.forEach(enemy => {
          if (
            Math.abs(bullet.x - enemy.x) < 30 &&
            Math.abs(bullet.y - enemy.y) < 20
          ) {
            // 敵を撃破した時のエフェクト
            setHitEnemies(prev => [...prev, {
              ...enemy,
              kaomoji: '(≧▽≦)',  // 笑顔に変化
              hit: true,
              timestamp: Date.now()
            }]);

            // コンボシステム
            if (Date.now() - lastKillTime < 1000) {
              setComboCount(prev => prev + 1);
            } else {
              setComboCount(1);
            }
            setLastKillTime(Date.now());

            // 敵と弾を削除し、スコアを加算
            setEnemies(prev => prev.filter(e => e.id !== enemy.id));
            setBullets(prev => prev.filter(b => b !== bullet));
            setScore(prev => prev + enemyTypes.angry.points * (1 + comboCount * 0.5));
            setEnemiesDefeated(prev => prev + 1);
          }
        });
      });

      // レベルアップの判定
      if (enemiesDefeated >= 15 + (level * 3)) {
        setLevel(prev => prev + 1);
        setEnemiesDefeated(0);
        setPlayerMood('happy');  // レベルアップ時に一時的に喜ぶ
        setTimeout(() => setPlayerMood('normal'), 2000);
      }

      // 撃破エフェクトの削除（1秒後）
      setHitEnemies(prev =>
        prev.filter(enemy => Date.now() - enemy.timestamp < 1000)
      );

      // ゲームオーバー判定（敵が下端に到達）
      if (enemies.some(enemy => enemy.y > 350)) {
        setGameOver(true);
      }
    }, 50);  // 20FPS

    return () => clearInterval(gameLoop);
  }, [bullets, enemies, gameOver, level, powerUpActive, powerUpType, lastKillTime, comboCount]);

  // UIのレンダリング
  return (
    <div className={`relative w-96 h-96 ${backgroundStyles[backgroundMood]} border-2 border-gray-200 mx-auto overflow-hidden rounded-lg shadow-lg transition-all duration-1000`}>
      {/* スコアとレベルの表示 */}
      <div className="absolute top-2 left-2 text-gray-600 font-semibold">
        Score: {score} | Level: {level}
      </div>
      {/* コンボ表示 */}
      <div className="absolute top-8 left-2 text-gray-500 text-sm">
        Combo: x{comboCount}
      </div>

      {/* プレイヤーキャラクター */}
      <div
        className={`absolute bottom-4 text-xl ${powerUpActive ? 'text-purple-600' : 'text-blue-600'}`}
        style={{ left: `${playerPosition}px` }}
      >
        {playerMoods[playerMood]}
      </div>

      {/* 弾の描画 */}
      {bullets.map((bullet, index) => (
        <div
          key={index}
          className="absolute text-red-400"
          style={{
            left: `${bullet.x}px`,
            top: `${bullet.y}px`,
            fontSize: '16px',
            transform: 'rotate(-30deg)'
          }}
        >
          ♥
        </div>
      ))}

      {/* 敵の描画 */}
      {enemies.map(enemy => (
        <div
          key={enemy.id}
          className={`absolute ${enemyTypes.angry.color} text-sm ${
            enemy.movementPattern === 'zigzag' ? 'animate-bounce' : 'animate-pulse'
          }`}
          style={{
            left: `${enemy.x}px`,
            top: `${enemy.y}px`,
            whiteSpace: 'nowrap'
          }}
        >
          {enemy.kaomoji}
        </div>
      ))}

      {/* 撃破エフェクトの描画 */}
      {hitEnemies.map(enemy => (
        <div
          key={enemy.id}
          className="absolute text-rose-500 text-sm"
          style={{
            left: `${enemy.x}px`,
            top: `${enemy.y}px`,
            whiteSpace: 'nowrap',
            animation: 'fadeInOut 1s forwards'
          }}
        >
          {enemy.kaomoji}
        </div>
      ))}

      {/* ゲームオーバー画面 */}
      {gameOver && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
          <div className="text-gray-800 text-center">
            <h2 className="text-xl mb-2 font-bold">GAME OVER (╬`Д´)</h2>
            <p>Final Score: {score}</p>
            <p className="mt-2">Level Reached: {level}</p>
            <p className="mt-1">Max Combo: {comboCount}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmotionBattle;
