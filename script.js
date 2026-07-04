const viewport = document.getElementById('viewport');

const canvas = document.getElementById('canvas');

const minimap = document.getElementById('minimap');

const minimapViewport = document.getElementById('minimap-viewport');

 

// キャンバスの元のサイズ

const CANVAS_WIDTH = 5000;

const CANVAS_HEIGHT = 5000;

 

// 状態管理（初期位置はキャンバスの真ん中あたりが見えるように調整）

let scale = 1;

let posX = (window.innerWidth - CANVAS_WIDTH) / 2;

let posY = (window.innerHeight - CANVAS_HEIGHT) / 2;

 

let isDragging = false;

let startX, startY;

let touchStartDist = 0; // スマホのピンチ用

 

// 画面更新関数（キャンバスの位置・ズームとミニマップを同期）

function updateTransform() {

  // ズームの限界値を設定 (0.2倍 〜 3倍)

  scale = Math.max(0.2, Math.min(3, scale));

 

  // キャンバスの移動と拡大縮小を適用

  canvas.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;

 

  // --- 🧭 ミニマップの更新ロジック ---

  const mapWidth = minimap.clientWidth;

  const mapHeight = minimap.clientHeight;

 

  // キャンバスに対する現在の画面（ビューポート）のサイズと位置を計算

  const viewW = window.innerWidth / scale;

  const viewH = window.innerHeight / scale;

  const viewX = -posX / scale;

  const viewY = -posY / scale;

 

  // ミニマップ上の比率に変換

  const ratioX = mapWidth / CANVAS_WIDTH;

  const ratioY = mapHeight / CANVAS_HEIGHT;

 

  // 赤枠の位置とサイズを決定

  minimapViewport.style.width = `${viewW * ratioX}px`;

  minimapViewport.style.height = `${viewH * ratioY}px`;

  minimapViewport.style.left = `${viewX * ratioX}px`;

  minimapViewport.style.top = `${viewY * ratioY}px`;

}

 

// 初期化

updateTransform();

window.addEventListener('resize', updateTransform);

 

// --- 🖱️ マウス & タッチ操作（ドラッグとズーム） ---

 

// 1. ドラッグ開始

function pointerDown(e) {

  // テキストエリアを触っている時はドラッグしない

  if (e.target.classList.contains('memo-input')) return;

 

  if (e.touches && e.touches.length === 2) {

    // スマホで2本指ピンチの場合

    touchStartDist = Math.hypot(

      e.touches[0].clientX - e.touches[1].clientX,

      e.touches[0].clientY - e.touches[1].clientY

    );

    return;

  }

 

  isDragging = true;

  const clientX = e.touches ? e.touches[0].clientX : e.clientX;

  const clientY = e.touches ? e.touches[0].clientY : e.clientY;

  startX = clientX - posX;

  startY = clientY - posY;

}

 

// 2. ドラッグ中

function pointerMove(e) {

  if (e.touches && e.touches.length === 2) {

    // スマホでのピンチズーム処理

    const dist = Math.hypot(

      e.touches[0].clientX - e.touches[1].clientX,

      e.touches[0].clientY - e.touches[1].clientY

    );

    const delta = dist / touchStartDist;

    scale *= delta;

    touchStartDist = dist;

    updateTransform();

    return;

  }

 

  if (!isDragging) return;

  const clientX = e.touches ? e.touches[0].clientX : e.clientX;

  const clientY = e.touches ? e.touches[0].clientY : e.clientY;

  posX = clientX - startX;

  posY = clientY - startY;

  updateTransform();

}

 

// 3. ドラッグ終了

function pointerUp() {

  isDragging = false;

}

 

// イベント登録（PC・スマホ両対応）

viewport.addEventListener('mousedown', pointerDown);

window.addEventListener('mousemove', pointerMove);

window.addEventListener('mouseup', pointerUp);

 

viewport.addEventListener('touchstart', pointerDown, { passive: false });

window.addEventListener('touchmove', pointerMove, { passive: false });

window.addEventListener('touchend', pointerUp);

 

// 4. PCのマウスホイールでのズーム

viewport.addEventListener('wheel', (e) => {

  e.preventDefault();

  const zoomFactor = 1.1;

  if (e.deltaY < 0) {

    scale *= zoomFactor;

  } else {

    scale /= zoomFactor;

  }

  updateTransform();

}, { passive: false });

 

 

// --- 📝 メモの追加機能 ---

 

canvas.addEventListener('click', (e) => {

  // キャンバス自体をクリックしたときだけ反応（ドラッグ直後は発火させない）

  if (e.target !== canvas) return;

  if (isDragging) return;

 

  // クリックされた正確なキャンバス内の座標を計算

  const rect = canvas.getBoundingClientRect();

  const x = (e.clientX - rect.left) / scale;

  const y = (e.clientY - rect.top) / scale;

 

  createMemo(x, y);

});

 

function createMemo(x, y) {

  // メモ要素（textarea）の生成

  const input = document.createElement('textarea');

  input.className = 'memo-input';

  input.style.left = `${x}px`;

  input.style.top = `${y}px`;

  input.placeholder = "殴り書き...";

 

  // 🧭 ミニマップに連動するドットを生成

  const dot = document.createElement('div');

  dot.className = 'minimap-dot';

  const ratioX = minimap.clientWidth / CANVAS_WIDTH;

  const ratioY = minimap.clientHeight / CANVAS_HEIGHT;

  dot.style.left = `${x * ratioX}px`;

  dot.style.top = `${y * ratioY}px`;

  minimap.appendChild(dot);

 

  // 文字が空のままフォーカスが外れたら消す

  input.addEventListener('blur', () => {

    if (input.value.trim() === "") {

      input.remove();

      dot.remove(); // ミニマップの点も消す

    }

  });

 

  canvas.appendChild(input);

  // キーボードを即座に立ち上げるためのディレイ

  setTimeout(() => input.focus(), 50);

}

 
