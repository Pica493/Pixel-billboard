// ============================================================
// ИГРЫ: змейка, бит, 2048, тетрис, память.
// Каждая регистрируется как пасхалка через window.addEasterEgg —
// технически игры запускаются той же системой триггеров по лупе.
// ============================================================

(function() {
  // Алиасы на общие вещи, которые реально объявлены в easter-eggs-and-weather.js
  // (тот файл загружается первым и явно экспортирует их через window.X)
  const addEasterEgg = window.addEasterEgg;
  const showMessage = window.showMessage;
  const container = document.getElementById('canvas-container');
  const canvas = window.canvas; // доска пикселей — нужна играм для расчёта размеров поля

  // snake
  
 
   
    function startSnake() {
  window.pbLockCodeInput();
  // Создаём canvas для игры
  const snakeCanvas = document.createElement('canvas');
  snakeCanvas.width = canvas.width;
  snakeCanvas.height = canvas.height;
  snakeCanvas.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; z-index:250; touch-action:none;';
  container.appendChild(snakeCanvas);

  // Отключаем всё, что может вызвать фокус или клавиатуру
  snakeCanvas.setAttribute('inputmode', 'none');
  snakeCanvas.setAttribute('aria-hidden', 'true');
  snakeCanvas.style.userSelect = 'none';
  snakeCanvas.style.webkitUserSelect = 'none';
  snakeCanvas.style.touchCallout = 'none';
  snakeCanvas.removeAttribute('tabindex'); // полностью убираем фокусируемость

  // Блокируем все события, которые могут инициировать фокус
  const blockEvents = ['focus', 'focusin', 'focusout', 'touchstart', 'touchmove', 'touchend', 
                       'pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 
                       'selectstart', 'contextmenu'];
  blockEvents.forEach(evt => {
    snakeCanvas.addEventListener(evt, function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (document.activeElement === this) {
        this.blur();
      }
    }, { passive: false });
  });

  // Принудительно снимаем фокус
  snakeCanvas.blur();

  // ---------- ОСТАЛЬНАЯ ЛОГИКА ИГРЫ ----------
  const sctx = snakeCanvas.getContext('2d');
  const CELL_SIZE = 10,
        COLS = canvas.width / CELL_SIZE,
        ROWS = canvas.height / CELL_SIZE;

  let touchStartX = null, touchStartY = null;

  // Управление свайпами (уже без killFocus)
  snakeCanvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }, { passive: false });

  snakeCanvas.addEventListener('touchend', function(e) {
    if (touchStartX === null || touchStartY === null) return;
    e.preventDefault();
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx < 10 && absDy < 10) return;

    if (absDx > absDy) {
      nextDirection = dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
    } else {
      nextDirection = dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
    }
    touchStartX = null;
    touchStartY = null;
  }, { passive: false });

  // Логика игры (без изменений)
  function isCellFree(cellX, cellY) {
    const px = cellX * CELL_SIZE,
          py = cellY * CELL_SIZE;
    for (let block of window.soldPixels) {
      if (px < block.x + block.w && px + CELL_SIZE > block.x && py < block.y + block.h && py + CELL_SIZE > block.y) return false;
    }
    return cellX >= 0 && cellX < COLS && cellY >= 0 && cellY < ROWS;
  }

  function spawnFood() {
    for (let i = 0; i < 1000; i++) {
      const fx = Math.floor(Math.random() * COLS),
            fy = Math.floor(Math.random() * ROWS);
      if (isCellFree(fx, fy) && !snake.some(s => s.x === fx && s.y === fy)) return { x: fx, y: fy };
    }
    return null;
  }

  function findFreeStart() {
    const maxAttempts = 200;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const startX = Math.floor(Math.random() * (COLS - 5)) + 2;
      const startY = Math.floor(Math.random() * (ROWS - 2)) + 1;
      const cells = [
        { x: startX, y: startY },
        { x: startX - 1, y: startY },
        { x: startX - 2, y: startY }
      ];
      const allFree = cells.every(cell => isCellFree(cell.x, cell.y));
      if (allFree) return cells;
    }
    return null;
  }

  let snake = findFreeStart();
  if (!snake) {
    gameOver = true;
    drawSnake();
    showMessage('Нет места для змейки! Попробуй позже.', '#f00');
    window.pbUnlockCodeInput();
    setTimeout(() => { snakeCanvas.remove(); safeRedraw(); }, 2000);
    return;
  }

  let direction = { x: 1, y: 0 };
  let nextDirection = { x: 1, y: 0 };
  let food = spawnFood();
  let gameOver = false;
  let gameInterval;

  function drawSnake() {
    sctx.clearRect(0, 0, snakeCanvas.width, snakeCanvas.height);
    sctx.fillStyle = '#00cc00';
    snake.forEach(seg => sctx.fillRect(seg.x * CELL_SIZE, seg.y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1));
    if (food) {
      sctx.fillStyle = '#ff3333';
      sctx.fillRect(food.x * CELL_SIZE, food.y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
    }
    if (gameOver) {
      sctx.fillStyle = 'rgba(0,0,0,0.75)';
      sctx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);
      const cx = snakeCanvas.width / 2, cy = snakeCanvas.height / 2;
      const boxW = Math.min(260, snakeCanvas.width - 20), boxH = 90;
      sctx.save();
      sctx.shadowColor = 'rgba(0,204,0,0.6)';
      sctx.shadowBlur = 15;
      sctx.fillStyle = '#141428';
      sctx.strokeStyle = '#00cc00';
      sctx.lineWidth = 2;
      const bx = cx - boxW / 2, by = cy - boxH / 2, r = 12;
      sctx.beginPath();
      sctx.moveTo(bx + r, by);
      sctx.arcTo(bx + boxW, by, bx + boxW, by + boxH, r);
      sctx.arcTo(bx + boxW, by + boxH, bx, by + boxH, r);
      sctx.arcTo(bx, by + boxH, bx, by, r);
      sctx.arcTo(bx, by, bx + boxW, by, r);
      sctx.closePath();
      sctx.fill();
      sctx.stroke();
      sctx.restore();
      sctx.fillStyle = '#fff';
      sctx.font = 'bold 18px "Segoe UI", monospace';
      sctx.textAlign = 'center';
      sctx.fillText('🐍 Игра окончена!', cx, cy - 10);
      sctx.font = '14px monospace';
      sctx.fillStyle = '#0f0';
      sctx.fillText('Счёт: ' + (snake.length - 3), cx, cy + 16);
    }
  }

  function step() {
    if (gameOver) return;
    if (!(nextDirection.x === -direction.x && nextDirection.y === -direction.y)) direction = nextDirection;
    const head = snake[0],
          newHead = { x: head.x + direction.x, y: head.y + direction.y };

    if (!isCellFree(newHead.x, newHead.y) || snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
      gameOver = true;
      if (window.pbSound) window.pbSound.crash();
      const snakeScore = snake.length - 3;
      if (snakeScore > 0) {
        const coins = Math.floor(snakeScore / 3);
        if (coins > 0) window.addCoins(coins);
        if (window.updateRecord('snake', snakeScore)) window.addCoins(10);
      }
      drawSnake();
      clearInterval(gameInterval);
      window.removeEventListener('keydown', handleKey);
      window.pbUnlockCodeInput();
      setTimeout(() => { snakeCanvas.remove(); safeRedraw(); }, 2000);
      return;
    }

    snake.unshift(newHead);
    if (food && newHead.x === food.x && newHead.y === food.y) {
      if (window.pbSound) window.pbSound.eat();
      food = spawnFood();
      if (!food) {
        gameOver = true;
        drawSnake();
        clearInterval(gameInterval);
        window.removeEventListener('keydown', handleKey);
        window.pbUnlockCodeInput();
        setTimeout(() => { snakeCanvas.remove(); safeRedraw(); }, 2000);
        return;
      }
    } else {
      snake.pop();
    }
    drawSnake();
  }

  function handleKey(e) {
    e.preventDefault();
    const keyMap = {
      'ArrowUp': { x: 0, y: -1 },
      'ArrowDown': { x: 0, y: 1 },
      'ArrowLeft': { x: -1, y: 0 },
      'ArrowRight': { x: 1, y: 0 }
    };
    if (keyMap[e.key]) nextDirection = keyMap[e.key];
  }

  window.addEventListener('keydown', handleKey);
  drawSnake();
  gameInterval = setInterval(step, 150);

  // Очистка через 2 минуты
  const cleanup = () => {
    clearInterval(gameInterval);
    window.removeEventListener('keydown', handleKey);
    window.pbUnlockCodeInput();
    if (snakeCanvas.parentNode) snakeCanvas.remove();
    safeRedraw();
  };
  setTimeout(cleanup, 120000);
}
  
    

 addEasterEgg('snake', 'SNAKE', startSnake);

  // bit
  
  function startBitGame() {
  window.pbLockCodeInput();
  let score = 0, timeLeft = 30;
  const scoreEl = document.createElement('div');
  scoreEl.style.cssText = 'position:fixed; top:20px; left:50%; transform:translateX(-50%); color:#fff; background:linear-gradient(180deg,#1e1e35,#14142a); border:2px solid #4caf50; box-shadow:0 4px 18px rgba(0,0,0,0.5), 0 0 15px rgba(76,175,80,0.25); padding:8px 18px; z-index:1000; font-family:"Segoe UI",monospace; font-size:15px; border-radius:10px; text-align:center; white-space:nowrap;';
  scoreEl.innerHTML = '🎯 Попаданий: <b style="color:#4caf50">0</b> &nbsp;|&nbsp; ⏱ Время: <b style="color:#4caf50">30</b>';
  document.body.appendChild(scoreEl);

  let spawnInterval; // объявляем ДО использования

  const gameInterval = setInterval(() => {
    if (timeLeft <= 0) {
      clearInterval(gameInterval);
      clearInterval(spawnInterval);
      document.querySelectorAll('.bit-target').forEach(el => el.remove());
      scoreEl.remove();

      const best = localStorage.getItem('bitRecord') || 0;
      if (score > best) localStorage.setItem('bitRecord', score);

      const coins = Math.floor(score / 5);
      if (coins > 0) window.addCoins(coins);
      if (window.updateRecord('bit', score)) window.addCoins(10);
      if (window.pbSound) window.pbSound.gameover();
      showMessage(`Игра окончена! Попаданий: ${score}. Рекорд: ${localStorage.getItem('bitRecord')}`, '#ff0', 3000);
      window.pbUnlockCodeInput();
      return;
    }

    timeLeft--;
    scoreEl.innerHTML = `🎯 Попаданий: <b style="color:#4caf50">${score}</b> &nbsp;|&nbsp; ⏱ Время: <b style="color:#4caf50">${timeLeft}</b>`;
  }, 1000);

  spawnInterval = setInterval(() => {
    const target = document.createElement('div');
    target.className = 'bit-target';
    target.style.cssText = 'position:absolute; width:34px; height:34px; border-radius:6px; background:radial-gradient(circle at 35% 30%, #ff8a80, #e74c3c 70%); box-shadow:0 0 12px rgba(231,76,60,0.8), inset 0 0 6px rgba(255,255,255,0.4); z-index:999; cursor:pointer; animation: bitPop 0.15s ease-out;';
    target.style.left = Math.random() * (container.offsetWidth - 34) + 'px';
    target.style.top = Math.random() * (container.offsetHeight - 34) + 'px';
    container.appendChild(target);
    target.addEventListener('click', (e) => {
      e.stopPropagation();
      score++;
      if (window.pbSound) window.pbSound.hit();
      target.remove();
    });
    setTimeout(() => target.remove(), 2000);
  }, 800);

  // Запасное завершение через 31 секунду
  setTimeout(() => {
    if (timeLeft > 0) {
      clearInterval(gameInterval);
      clearInterval(spawnInterval);
      document.querySelectorAll('.bit-target').forEach(el => el.remove());
      scoreEl.remove();
      const coins = Math.floor(score / 5);
      if (coins > 0) window.addCoins(coins);
      if (window.updateRecord('bit', score)) window.addCoins(10);
      showMessage(`Игра окончена! Попаданий: ${score}. Рекорд: ${localStorage.getItem('bitRecord')}`, '#ff0', 3000);
      window.pbUnlockCodeInput();
    }
  }, 31000);
}
  addEasterEgg('bitgame', 'BIT', startBitGame);

// ================= 2048 =================
addEasterEgg('2048', '2048', function() {
  window.pbLockCodeInput();
  // Создаём модальное окно
  const overlay = document.createElement('div');
  overlay.className = 'game-overlay';
  document.body.appendChild(overlay);

  const gameContainer = document.createElement('div');
  gameContainer.className = 'game-panel';
  overlay.appendChild(gameContainer);

  const titleDiv = document.createElement('div');
  titleDiv.className = 'game-panel-title';
  titleDiv.textContent = '🔢 2048';
  gameContainer.appendChild(titleDiv);

// Запрещаем pull-to-refresh на время игры
gameContainer.addEventListener('touchmove', function(e) {
  e.preventDefault();
}, { passive: false });

  
  const scoreDiv = document.createElement('div');
  scoreDiv.style.cssText = 'color:#fff;font-family:monospace;font-size:20px;margin-bottom:10px;';
  scoreDiv.textContent = 'Счёт: 0';
  gameContainer.appendChild(scoreDiv);

  // Размер клетки подбирается под экран, чтобы поле не выходило за пределы
  const cell2048 = Math.max(46, Math.min(
    80,
    Math.floor((Math.min(window.innerWidth, 420) - 70) / 4),
    Math.floor((window.innerHeight - 260) / 4)
  ));
  const grid = document.createElement('div');
  grid.style.cssText = `display:grid;grid-template-columns:repeat(4,${cell2048}px);grid-gap:5px;`;
  gameContainer.appendChild(grid);

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕ Закрыть';
  closeBtn.className = 'game-btn-close';
  gameContainer.appendChild(closeBtn);

  let board = Array(4).fill().map(() => Array(4).fill(0));
  let gameScore = 0, gameOver = false;

  function spawnTile() {
    const empty = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (board[r][c] === 0) empty.push({r, c});
    if (empty.length === 0) return;
    const {r, c} = empty[Math.floor(Math.random() * empty.length)];
    board[r][c] = Math.random() < 0.9 ? 2 : 4;
  }

  function drawBoard() {
    grid.innerHTML = '';
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const cell = document.createElement('div');
        cell.style.cssText = `width:${cell2048}px;height:${cell2048}px;background:#333;display:flex;align-items:center;justify-content:center;font-size:${Math.round(cell2048*0.35)}px;font-weight:bold;color:#fff;border-radius:5px;`;
        if (board[r][c] > 0) {
          cell.textContent = board[r][c];
          const hue = Math.log2(board[r][c]) * 15 % 360;
          cell.style.background = `hsl(${hue}, 70%, 50%)`;
        }
        grid.appendChild(cell);
      }
    }
    scoreDiv.textContent = `Счёт: ${gameScore}`;
  }

  function slide(row) {
    let arr = row.filter(v => v);
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] === arr[i + 1]) {
        arr[i] *= 2;
        gameScore += arr[i];
        if (window.pbSound) window.pbSound.merge();
        arr.splice(i + 1, 1);
        arr.push(0);
      }
    }
    while (arr.length < 4) arr.push(0);
    return arr;
  }

  function move(dir) {
    if (gameOver) return;
    let moved = false;
    if (dir === 'left' || dir === 'right') {
      for (let r = 0; r < 4; r++) {
        let row = board[r];
        if (dir === 'right') row = row.reverse();
        let newRow = slide(row);
        if (dir === 'right') newRow = newRow.reverse();
        if (board[r].join() !== newRow.join()) moved = true;
        board[r] = newRow;
      }
    } else {
      for (let c = 0; c < 4; c++) {
        let col = [board[0][c], board[1][c], board[2][c], board[3][c]];
        if (dir === 'down') col = col.reverse();
        let newCol = slide(col);
        if (dir === 'down') newCol = newCol.reverse();
        for (let r = 0; r < 4; r++) {
          if (board[r][c] !== newCol[r]) moved = true;
          board[r][c] = newCol[r];
        }
      }
    }

    if (moved) {
      spawnTile();
      drawBoard();
      if (isGameOver()) {
        gameOver = true;
        end2048();
      }
    }
  }

  function isGameOver() {
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      if (board[r][c] === 0) return false;
      if (c < 3 && board[r][c] === board[r][c + 1]) return false;
      if (r < 3 && board[r][c] === board[r + 1][c]) return false;
    }
    return true;
  }

  let scored2048 = false;
  function finalizeScore2048() {
    if (scored2048) return { maxTile: Math.max(...board.flat()), coinsEarned: 0 };
    scored2048 = true;
    const maxTile = Math.max(...board.flat());
    let coinsEarned = 0;
    if (maxTile >= 1024) coinsEarned += Math.floor(maxTile / 1024);
    if (coinsEarned > 0 && typeof window.addCoins === 'function') window.addCoins(coinsEarned);
    if (typeof window.updateRecord === 'function') {
      const isNewRecord = window.updateRecord('2048', maxTile);
      if (isNewRecord) window.addCoins(10);
    }
    if (window.pbSound) window.pbSound.gameover();
    return { maxTile, coinsEarned };
  }

  function end2048() {
    const { maxTile, coinsEarned } = finalizeScore2048();
    if (typeof showMessage === 'function') showMessage(`Игра окончена! Макс. плитка: ${maxTile}. Монет: ${coinsEarned}`, '#ff0');
    window.removeEventListener('keydown', handleKey);
    window.pbUnlockCodeInput();
    setTimeout(() => { overlay.remove(); if (typeof safeRedraw === 'function') safeRedraw(); }, 2000);
  }

// Разрешаем прокрутку обратно
document.body.style.overflow = '';

  
  function handleKey(e) {
    if (gameOver) return;
    e.preventDefault();
    if (e.key === 'ArrowLeft') move('left');
    else if (e.key === 'ArrowRight') move('right');
    else if (e.key === 'ArrowUp') move('up');
    else if (e.key === 'ArrowDown') move('down');
  }
  window.addEventListener('keydown', handleKey);

  let touchX, touchY;
  gameContainer.addEventListener('touchstart', e => {
    touchX = e.touches[0].clientX; touchY = e.touches[0].clientY;
  });
  gameContainer.addEventListener('touchend', e => {
    if (!touchX || !touchY) return;
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left');
    else move(dy > 0 ? 'down' : 'up');
  });

  closeBtn.addEventListener('click', () => {
    gameOver = true;
    finalizeScore2048();
    window.removeEventListener('keydown', handleKey);
    window.pbUnlockCodeInput();
    overlay.remove();
    if (typeof safeRedraw === 'function') safeRedraw();
  });

  spawnTile(); spawnTile();
  drawBoard();

  setTimeout(() => {
    window.removeEventListener('keydown', handleKey);
    window.pbUnlockCodeInput();
    if (overlay.parentNode) overlay.remove();
  }, 300000);
});



// ================= ТЕТРИС (компактный, с превью) =================
addEasterEgg('tetris', 'TETRIS', function() {
  window.pbLockCodeInput();
  const overlay = document.createElement('div');
  overlay.className = 'game-overlay';
  document.body.appendChild(overlay);
  overlay.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

  const gameContainer = document.createElement('div');
  gameContainer.className = 'game-panel';
  overlay.appendChild(gameContainer);

  const titleDiv = document.createElement('div');
  titleDiv.className = 'game-panel-title';
  titleDiv.textContent = '🧱 Тетрис';
  gameContainer.appendChild(titleDiv);

  // Верхняя панель: очки и следующая фигура
  const topPanel = document.createElement('div');
  topPanel.style.cssText = 'display:flex;justify-content:space-between;width:100%;margin-bottom:10px;color:#fff;font-family:monospace;gap:16px;';
  gameContainer.appendChild(topPanel);

  // Очки
  const scoreDiv = document.createElement('div');
  scoreDiv.innerHTML = 'Очки:<br><span id="tetris-score" style="font-size:20px;">0</span>';
  topPanel.appendChild(scoreDiv);

  // Превью следующей фигуры
  const previewDiv = document.createElement('div');
  previewDiv.innerHTML = 'Следующая:<br>';
  const previewCanvas = document.createElement('canvas');
  previewCanvas.width = 80; previewCanvas.height = 80;
  previewCanvas.style.cssText = 'border:1px solid #fff;background:#111;';
  previewDiv.appendChild(previewCanvas);
  topPanel.appendChild(previewDiv);
  const pctx = previewCanvas.getContext('2d');

  // Игровое поле — размер клетки подбирается и по ширине, и по высоте
  // экрана, чтобы поле целиком помещалось на экране вместе с кнопками.
  const COLS = 10, ROWS = 15;
  const reservedHeight = 230; // заголовок + панель очков + кнопки + отступы
  const cellSize = Math.max(14, Math.min(
    30,
    Math.floor((Math.min(window.innerWidth, 420) - 40) / COLS),
    Math.floor((window.innerHeight - reservedHeight) / ROWS)
  ));
  const canvas = document.createElement('canvas');
  canvas.width = cellSize * COLS;
  canvas.height = cellSize * ROWS;
  canvas.style.cssText = 'border:2px solid #fff;background:#111;';
  gameContainer.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // Кнопки управления
  const controls = document.createElement('div');
  controls.className = 'game-controls-row';
  gameContainer.appendChild(controls);
  const btnLeft = document.createElement('button'); btnLeft.textContent = '◀';
  const btnRight = document.createElement('button'); btnRight.textContent = '▶';
  const btnDown = document.createElement('button'); btnDown.textContent = '▼';
  const btnRotate = document.createElement('button'); btnRotate.textContent = '↻';
  const btnHardDrop = document.createElement('button'); btnHardDrop.textContent = '⏬';
  [btnLeft, btnRight, btnDown, btnRotate, btnHardDrop].forEach(b => {
    b.className = 'game-btn';
    controls.appendChild(b);
  });
  const btnClose = document.createElement('button'); btnClose.textContent = '✕ Закрыть';
  btnClose.className = 'game-btn-close';
  gameContainer.appendChild(btnClose);

  // Игровые переменные
  const tetrominos = [
    [[1,1,1,1]], [[1,1],[1,1]], [[0,1,1],[1,1,0]], [[1,1,0],[0,1,1]],
    [[1,0,0],[1,1,1]], [[0,0,1],[1,1,1]], [[0,1,0],[1,1,1]]
  ];
  const colors = ['#0ff','#ff0','#0f0','#f00','#00f','#f90','#90f'];

  let board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
  let currentPiece, currentColor, currentX, currentY;
  let nextPiece, nextColor;
  let linesCleared = 0, level = 1, score = 0, gameOver = false, dropInterval;

  function randomPiece() {
    const idx = Math.floor(Math.random() * tetrominos.length);
    return { shape: tetrominos[idx], color: colors[idx] };
  }

  function nextPreview() {
    const p = randomPiece();
    nextPiece = p.shape; nextColor = p.color;
    drawPreview();
  }

  function drawPreview() {
    pctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    if (!nextPiece) return;
    const shape = nextPiece;
    const cols = shape[0].length, rows = shape.length;
    const size = Math.min(20, Math.floor(60 / Math.max(cols, rows)));
    const offsetX = (previewCanvas.width - cols * size) / 2;
    const offsetY = (previewCanvas.height - rows * size) / 2;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
      if (shape[r][c]) {
        pctx.fillStyle = nextColor;
        pctx.fillRect(offsetX + c * size, offsetY + r * size, size-1, size-1);
      }
  }

  function spawnPiece() {
    if (!nextPiece) nextPreview();
    currentPiece = nextPiece; currentColor = nextColor;
    nextPreview();
    currentX = Math.floor((COLS - currentPiece[0].length) / 2);
    currentY = 0;
    if (!isValid(currentX, currentY, currentPiece)) endGame();
  }

  function isValid(x, y, piece) {
    for (let r = 0; r < piece.length; r++) for (let c = 0; c < piece[0].length; c++)
      if (piece[r][c]) {
        const nx = x + c, ny = y + r;
        if (nx < 0 || nx >= COLS || ny >= ROWS || (ny >= 0 && board[ny][nx])) return false;
      }
    return true;
  }

  function placePiece() {
    for (let r = 0; r < currentPiece.length; r++) for (let c = 0; c < currentPiece[0].length; c++)
      if (currentPiece[r][c]) board[currentY + r][currentX + c] = currentColor;
    if (window.pbSound) window.pbSound.drop();
    clearLines(); spawnPiece();
  }

  function clearLines() {
    let cleared = 0;
    for (let row = ROWS - 1; row >= 0; row--) {
      if (board[row].every(v => v)) {
        board.splice(row, 1); board.unshift(Array(COLS).fill(0));
        cleared++; row++;
      }
    }
    if (cleared) {
      linesCleared += cleared;
      level = Math.floor(linesCleared / 10) + 1;
      score += cleared * 10 * level;
      if (window.pbSound) window.pbSound.clear();
      clearInterval(dropInterval);
      dropInterval = setInterval(() => { if (!gameOver) moveDown(); }, Math.max(100, 500 - (level-1)*40));
    }
  }

  function moveDown() { if (gameOver) return; if (isValid(currentX, currentY+1, currentPiece)) currentY++; else placePiece(); draw(); }
  function moveLeft() { if (gameOver) return; if (isValid(currentX-1, currentY, currentPiece)) { currentX--; draw(); } }
  function moveRight() { if (gameOver) return; if (isValid(currentX+1, currentY, currentPiece)) { currentX++; draw(); } }
  function rotate() {
    if (gameOver) return;
    const rot = currentPiece[0].map((_, i) => currentPiece.map(row => row[i]).reverse());
    if (isValid(currentX, currentY, rot)) { currentPiece = rot; draw(); }
  }
  function hardDrop() { if (gameOver) return; while (isValid(currentX, currentY+1, currentPiece)) currentY++; placePiece(); draw(); }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++)
      if (board[r][c]) { ctx.fillStyle = board[r][c]; ctx.fillRect(c*cellSize, r*cellSize, cellSize-1, cellSize-1); }
    if (currentPiece && !gameOver)
      for (let r = 0; r < currentPiece.length; r++) for (let c = 0; c < currentPiece[0].length; c++)
        if (currentPiece[r][c]) {
          ctx.fillStyle = currentColor;
          ctx.fillRect((currentX+c)*cellSize, (currentY+r)*cellSize, cellSize-1, cellSize-1);
        }
    document.getElementById('tetris-score').textContent = score;
  }

  let scoredTetris = false;
  function finalizeTetris() {
    if (scoredTetris) return;
    scoredTetris = true;
    gameOver = true; clearInterval(dropInterval);
    const coins = Math.floor(linesCleared / 5);
    if (coins > 0 && window.addCoins) window.addCoins(coins);
    if (window.updateRecord && window.updateRecord('tetris', linesCleared)) window.addCoins(10);
    if (window.pbSound) window.pbSound.gameover();
  }

  function endGame() {
    finalizeTetris();
    if (typeof showMessage === 'function') showMessage(`Тетрис окончен! Линий: ${linesCleared}. Монет: ${Math.floor(linesCleared / 5)}`, '#0ff');
    window.removeEventListener('keydown', handleKey);
    window.pbUnlockCodeInput();
    setTimeout(() => { overlay.remove(); if (typeof safeRedraw === 'function') safeRedraw(); }, 2000);
  }

  function handleKey(e) {
    if (gameOver) return; e.preventDefault();
    if (e.key === 'ArrowLeft') moveLeft(); else if (e.key === 'ArrowRight') moveRight();
    else if (e.key === 'ArrowDown') moveDown(); else if (e.key === 'ArrowUp') rotate(); else if (e.key === ' ') hardDrop();
  }
  window.addEventListener('keydown', handleKey);

  btnLeft.onclick = moveLeft; btnRight.onclick = moveRight; btnDown.onclick = moveDown;
  btnRotate.onclick = rotate; btnHardDrop.onclick = hardDrop;
  btnClose.onclick = () => {
    finalizeTetris();
    window.removeEventListener('keydown', handleKey);
    window.pbUnlockCodeInput();
    overlay.remove();
    if (typeof safeRedraw === 'function') safeRedraw();
  };

  nextPreview(); spawnPiece(); draw();
  dropInterval = setInterval(() => { if (!gameOver) moveDown(); }, 500);

  setTimeout(() => { clearInterval(dropInterval); window.removeEventListener('keydown', handleKey); window.pbUnlockCodeInput(); overlay.remove(); }, 300000);
});
  
  

// ================= MEMORY (Мемори) =================
addEasterEgg('memory', 'MEMORY', function() {
  window.pbLockCodeInput();
  // Модальное окно
  const overlay = document.createElement('div');
  overlay.className = 'game-overlay';
  document.body.appendChild(overlay);

  // Блокируем pull-to-refresh
  overlay.addEventListener('touchmove', function(e) { e.preventDefault(); }, { passive: false });

  const gameContainer = document.createElement('div');
  gameContainer.className = 'game-panel';
  overlay.appendChild(gameContainer);

  const titleDiv = document.createElement('div');
  titleDiv.className = 'game-panel-title';
  titleDiv.textContent = '🧠 Мемори';
  gameContainer.appendChild(titleDiv);

  // Информация
  const infoDiv = document.createElement('div');
  infoDiv.style.cssText = 'color:#fff;font-family:monospace;font-size:16px;margin-bottom:10px;text-align:center;';
  infoDiv.textContent = 'Уровень: 1 | Пары: 4 | Время: 45с';
  gameContainer.appendChild(infoDiv);

  // Сетка карточек
  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid;justify-content:center;gap:8px;margin-bottom:10px;';
  gameContainer.appendChild(grid);

  // Кнопка закрытия
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕ Закрыть';
  closeBtn.className = 'game-btn-close';
  gameContainer.appendChild(closeBtn);

  // Эмодзи для карточек (более 30 штук)
  const emojis = ['🍎','🍊','🍇','🍒','🍋','🍉','🍑','🍌','🍓','🥝','🍍','🥭','🍈','🥑','🌽','🥕','🍔','🍕','🍦','🍩','🍪','🧁','🎂','🍭','🍿','🥨','🍫','🍬','🥜','🍯','🧸','🎈','⚽','🚗','✈️','🚀','🗼','🎵','📚','💡'];

  let level = 1;
  let pairs = 4;               // количество пар
  let totalCards = pairs * 2;
  let timeLimit = 45;          // секунд на уровень
  let timerInterval;
  let timeLeft = timeLimit;
  let canClick = true;
  let openedCards = [];
  let matchedPairs = 0;
  let levelsCleared = 0;
  let gameOver = false;

  // Создание колоды для текущего уровня
  function createDeck() {
    const selectedEmojis = [];
    const shuffled = emojis.slice().sort(() => Math.random() - 0.5);
    for (let i = 0; i < pairs; i++) {
      selectedEmojis.push(shuffled[i]);
    }
    const deck = [];
    selectedEmojis.forEach(emoji => {
      deck.push({ emoji, id: emoji + Math.random() });
      deck.push({ emoji, id: emoji + Math.random() });
    });
    return deck.sort(() => Math.random() - 0.5);
  }

  let deck = createDeck();

  // Отрисовка сетки
  function renderGrid() {
    grid.innerHTML = '';
    const cols = Math.ceil(Math.sqrt(totalCards));
    const rows = Math.ceil(totalCards / cols);
    // Размер карточки подбирается под ширину и высоту экрана, чтобы
    // поле любого уровня целиком помещалось на экране.
    const cardSize = Math.max(34, Math.min(
      60,
      Math.floor((Math.min(window.innerWidth, 420) - 60) / cols),
      Math.floor((window.innerHeight - 260) / rows)
    ));
    grid.style.gridTemplateColumns = `repeat(${cols}, ${cardSize}px)`;

    deck.forEach((card, index) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'memory-card';
      cardEl.style.cssText = `
        width:${cardSize}px; height:${cardSize}px;
        background:#333;
        border-radius:10px;
        display:flex; align-items:center; justify-content:center;
        font-size:${Math.round(cardSize*0.5)}px; cursor:pointer;
        transform: scale(1);
        transition: transform 0.2s;
        user-select: none;
      `;
      cardEl.dataset.index = index;
      cardEl.dataset.emoji = card.emoji;

      // Если карта уже открыта (угадана), показываем эмодзи
      if (card.opened) {
        cardEl.textContent = card.emoji;
        cardEl.style.background = '#555';
      } else {
        cardEl.textContent = '❓';
      }

      cardEl.addEventListener('click', () => flipCard(cardEl, card));
      grid.appendChild(cardEl);
    });
  }

  function flipCard(cardEl, card) {
    if (!canClick || gameOver) return;
    if (card.opened || openedCards.length >= 2) return;

    cardEl.textContent = card.emoji;
    cardEl.style.background = '#555';
    card.opened = true;
    if (window.pbSound) window.pbSound.click();
    openedCards.push({ cardEl, card });

    if (openedCards.length === 2) {
      canClick = false;
      const [first, second] = openedCards;
      if (first.card.emoji === second.card.emoji) {
        // Угадана пара
        matchedPairs++;
        if (window.pbSound) window.pbSound.match();
        openedCards = [];
        canClick = true;
        if (matchedPairs === pairs) {
          levelComplete();
        }
      } else {
        // Не угадана – переворачиваем обратно через 600 мс
        if (window.pbSound) window.pbSound.mismatch();
        setTimeout(() => {
          first.cardEl.textContent = '❓';
          first.cardEl.style.background = '#333';
          first.card.opened = false;
          second.cardEl.textContent = '❓';
          second.cardEl.style.background = '#333';
          second.card.opened = false;
          openedCards = [];
          canClick = true;
        }, 600);
      }
    }
  }

  function levelComplete() {
    levelsCleared++;
    if (window.pbSound) window.pbSound.win();
    if (window.addCoins) window.addCoins(1); // +1 монеты за уровень

    // Усложнение: каждые 2 уровня увеличиваем количество пар и уменьшаем время
    level++;
    if (levelsCleared % 2 === 0) {
      pairs = Math.min(pairs + 2, 16); // макс 16 пар (32 карточки)
      totalCards = pairs * 2;
    }
    timeLimit = Math.max(15, 45 - (level - 1) * 2); // уменьшаем до минимума 15 секунд
    timeLeft = timeLimit;
    matchedPairs = 0;
    openedCards = [];
    deck = createDeck();
    renderGrid();
    updateInfo();
    resetTimer();
  }

  function updateInfo() {
    infoDiv.textContent = `Уровень: ${level} | Пары: ${pairs} | Время: ${timeLeft}с`;
  }

  function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timeLeft--;
      updateInfo();
      if (timeLeft <= 0) {
        endGame();
      }
    }, 1000);
  }

  let scoredMemory = false;
  function finalizeMemory() {
    if (scoredMemory) return;
    scoredMemory = true;
    gameOver = true;
    clearInterval(timerInterval);
    canClick = false;
    // Монеты за рекорд
    if (window.updateRecord && window.updateRecord('memory', levelsCleared)) {
      if (window.addCoins) window.addCoins(10);
    }
    if (window.pbSound) window.pbSound.gameover();
  }

  function endGame() {
    finalizeMemory();
    if (typeof showMessage === 'function') {
      showMessage(`Мемори окончено! Пройдено уровней: ${levelsCleared}. Монет: ${levelsCleared * 2}`, '#ff0');
    }
    window.pbUnlockCodeInput();
    setTimeout(() => {
      overlay.remove();
      if (typeof safeRedraw === 'function') safeRedraw();
    }, 2000);
  }

  // Закрытие по кнопке — закрывается сразу, без задержки
  closeBtn.addEventListener('click', () => {
    finalizeMemory();
    window.pbUnlockCodeInput();
    overlay.remove();
    if (typeof safeRedraw === 'function') safeRedraw();
  });

  // Старт
  renderGrid();
  resetTimer();
});


})();
