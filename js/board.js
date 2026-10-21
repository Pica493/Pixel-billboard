  // ========== ГЛОБАЛЬНЫЙ ЗВУКОВОЙ ДВИЖОК ==========
  // Единый Web Audio движок для звуков интерфейса (кнопки, магазин,
  // профиль, игры). Не требует аудио-файлов — звуки генерируются на лету.
  (function() {
    let actx = null;
    function ctx() {
      if (!actx) {
        try { actx = new (window.AudioContext || window.webkitAudioContext)(); }
        catch(e) { return null; }
      }
      if (actx.state === 'suspended') actx.resume();
      return actx;
    }
    function tone(freq, dur, opts) {
      opts = opts || {};
      const c = ctx();
      if (!c) return;
      const t0 = c.currentTime + (opts.delay || 0);
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = opts.type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.slideTo), t0 + dur);
      const vol = opts.volume != null ? opts.volume : 0.08;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain); gain.connect(c.destination);
      osc.start(t0); osc.stop(t0 + dur + 0.02);
    }
    const S = {
      click: () => tone(720, 0.06, { type: 'triangle', volume: 0.05 }),
      toggle: () => tone(500, 0.05, { type: 'square', volume: 0.04 }),
      buy: () => { tone(660, 0.09, { type: 'triangle', volume: 0.07 }); tone(990, 0.12, { type: 'triangle', volume: 0.07, delay: 0.08 }); },
      error: () => tone(160, 0.18, { type: 'sawtooth', volume: 0.06, slideTo: 90 }),
      coin: () => { tone(1200, 0.05, { type: 'square', volume: 0.05 }); tone(1600, 0.08, { type: 'square', volume: 0.05, delay: 0.05 }); },
      hit: () => tone(950, 0.05, { type: 'square', volume: 0.06, slideTo: 500 }),
      merge: () => tone(500, 0.09, { type: 'triangle', volume: 0.06, slideTo: 800 }),
      match: () => { tone(700, 0.08, { type: 'sine', volume: 0.07 }); tone(1050, 0.1, { type: 'sine', volume: 0.07, delay: 0.07 }); },
      mismatch: () => tone(220, 0.12, { type: 'sawtooth', volume: 0.05, slideTo: 140 }),
      clear: () => { [0,1,2].forEach(i => tone(600 + i * 220, 0.09, { type: 'triangle', volume: 0.06, delay: i * 0.05 })); },
      win: () => { [660, 880, 1100].forEach((f, i) => tone(f, 0.14, { type: 'triangle', volume: 0.07, delay: i * 0.1 })); },
      gameover: () => { tone(420, 0.16, { type: 'sawtooth', volume: 0.06, slideTo: 200 }); tone(280, 0.22, { type: 'sawtooth', volume: 0.06, slideTo: 120, delay: 0.14 }); },
      open: () => tone(500, 0.07, { type: 'sine', volume: 0.05, slideTo: 750 }),
      close: () => tone(500, 0.07, { type: 'sine', volume: 0.05, slideTo: 320 }),
      // Новое сообщение в чате — мягкий двухтональный «поп», приятнее старого писка
      message: () => { tone(760, 0.08, { type: 'sine', volume: 0.06 }); tone(1140, 0.11, { type: 'sine', volume: 0.06, delay: 0.07 }); },
      // Змейка съедает пиксель
      eat: () => tone(880, 0.06, { type: 'square', volume: 0.06, slideTo: 1320 }),
      // Змейка врезается — короткий резкий удар
      crash: () => { tone(180, 0.14, { type: 'sawtooth', volume: 0.08, slideTo: 60 }); tone(90, 0.18, { type: 'sawtooth', volume: 0.06, slideTo: 40, delay: 0.05 }); },
      // Тетрис — фигура упала и встала на место
      drop: () => tone(220, 0.07, { type: 'square', volume: 0.06, slideTo: 90 })
    };
    window.pbSound = S;

    // Делегированный клик — звук на все кнопки и элементы магазина сайта.
    document.addEventListener('click', function(e) {
      const el = e.target.closest('button, .shop-item, .game-btn, .game-btn-close, #emoji-btn');
      if (el) S.click();
    }, true);
  })();

    // ========== НАСТРОЙКИ ==========
    const PIXEL_PRICE = 50; // руб за пиксель
    const MIN_BLOCK = 10;    // мин блок 10x10

    // ========== МАССИВ ПРОДАННЫХ БЛОКОВ ==========
    // Каждый объект: { x, y, w, h, img (base64), link, name }
    // Координаты x,y – левый верхний угол блока в пикселях холста (0–999)
    const soldPixels = [];

    // Подсчёт проданных пикселей
    function updateStats() {
      let totalSold = 0;
      soldPixels.forEach(block => { totalSold += block.w * block.h; });
      document.getElementById('sold-count').textContent = totalSold;
      document.getElementById('free-count').textContent = 1000000 - totalSold;
    }

    // Рендеринг холста
    const canvas = document.getElementById('pixel-canvas');
    const ctx = canvas.getContext('2d');
    const tooltip = document.getElementById('tooltip');
    const container = document.getElementById('canvas-container');

    // Заливаем белый фон и рисуем сетку 1x1
    function drawGrid() {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1000, 1000);
      // Сетка (серая линия через каждые 10 пикселей для ориентира, но не закрашиваем все)
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let i = 0; i <= 1000; i += 10) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 1000);
        ctx.moveTo(0, i);
        ctx.lineTo(1000, i);
      }
      ctx.stroke(); // один stroke() на всю сетку вместо 200 отдельных вызовов
    }

    // Кэш уже загруженных изображений блоков, чтобы не декодировать base64
    // заново при каждом redraw() (было узким местом при большом числе блоков)
    const imageCache = new Map();
    function getBlockImage(block) {
      let img = imageCache.get(block);
      if (!img) {
        img = new Image();
        img.src = block.img;
        imageCache.set(block, img);
        if (!img.complete) {
          img.onload = () => redraw();
        }
      }
      return img;
    }

    // Рисуем проданные блоки поверх сетки
    function drawSoldBlocks() {
      soldPixels.forEach(block => {
        const img = getBlockImage(block);
        if (img.complete) {
          ctx.drawImage(img, block.x, block.y, block.w, block.h);
        }
      });
    }

    // Перерисовка всего
    function redraw() {
      drawGrid();
      drawSoldBlocks();
      updateStats();
    }

    // Инициализация
    redraw();
    
    
// ===== ЦЕНТРАЛЬНЫЙ БЛОК: ЛОГОТИП TELEGRAM =====
(function() {
  // Создаём временный canvas для рисования логотипа
  const bannerCanvas = document.createElement('canvas');
  bannerCanvas.width = 500;
  bannerCanvas.height = 500;
  const bctx = bannerCanvas.getContext('2d');

  // Фон
  bctx.fillStyle = '#1a1a2e';
  bctx.fillRect(0, 0, 500, 500);

  // Рамка
  bctx.strokeStyle = '#4caf50';
  bctx.lineWidth = 10;
  bctx.strokeRect(5, 5, 490, 490);

  // Заголовок
  bctx.fillStyle = '#ffffff';
  bctx.font = 'bold 60px "Segoe UI", Arial, sans-serif';
  bctx.textAlign = 'center';
  bctx.fillText('PIXEL', 250, 180);
  bctx.fillText('BILLBOARD', 250, 260);

  // Ссылка на канал
  bctx.fillStyle = '#4caf50';
  bctx.font = 'bold 30px "Segoe UI", Arial, sans-serif';
  bctx.fillText('@PixelBillboard_ru', 250, 340);

  // Иконка телеграм (белый круг с самолётиком)
  bctx.fillStyle = '#ffffff';
  bctx.beginPath();
  bctx.arc(250, 420, 25, 0, Math.PI * 2);
  bctx.fill();
  bctx.fillStyle = '#1a1a2e';
  bctx.font = 'bold 30px sans-serif';
  bctx.fillText('✈', 250, 432);

  // Получаем base64 и добавляем блок
  const bannerDataUrl = bannerCanvas.toDataURL('image/png');
  soldPixels.push({
    x: 250, y: 250,   // центр холста (1000-500)/2 = 250
    w: 500, h: 500,
    img: bannerDataUrl,
    link: 'https://t.me/PixelBillboard_ru',
    name: 'PixelBillboard Community'
  });

  // Обновляем счётчики и перерисовываем
  updateStats();
  redraw();
})();



    
    // Обработчик движения мыши для tooltip и подсветки
    canvas.addEventListener('mousemove', function(e) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;   // соотношение реальных пикселей к CSS
      const scaleY = canvas.height / rect.height;
      const mouseX = Math.floor((e.clientX - rect.left) * scaleX);
      const mouseY = Math.floor((e.clientY - rect.top) * scaleY);

      // Ищем блок под курсором
      let found = null;
      for (let i = soldPixels.length - 1; i >= 0; i--) {
        const b = soldPixels[i];
        if (mouseX >= b.x && mouseX < b.x + b.w && mouseY >= b.y && mouseY < b.y + b.h) {
          found = b;
          break;
        }
      }

      if (found) {
        tooltip.style.display = 'block';
        tooltip.textContent = found.name;
        tooltip.style.left = (e.clientX - container.getBoundingClientRect().left + 15) + 'px';
        tooltip.style.top = (e.clientY - container.getBoundingClientRect().top - 30) + 'px';
        canvas.style.cursor = 'pointer';
      } else {
        tooltip.style.display = 'none';
        canvas.style.cursor = 'crosshair';
      }
    });

    canvas.addEventListener('mouseleave', function() {
      tooltip.style.display = 'none';
    });

    // Клик по холсту: если попали в блок — открываем ссылку, иначе показываем координаты (помощник)
    canvas.addEventListener('click', function(e) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clickX = Math.floor((e.clientX - rect.left) * scaleX);
      const clickY = Math.floor((e.clientY - rect.top) * scaleY);

      // Проверяем блоки
      for (let i = soldPixels.length - 1; i>= 0; i--) {
        const b = soldPixels[i];
        if (clickX >= b.x && clickX < b.x + b.w && clickY >= b.y && clickY < b.y + b.h) {
          if (b.link) {
            window.open(b.link, '_blank');
          }
          return;
        }
      }

      // Если не попали — показываем координаты неблокирующим тултипом
      // (alert() раньше замораживал вкладку до нажатия ОК — плохо для UX)
      const coordMsg = document.createElement('div');
      coordMsg.textContent = `Свободно: x=${clickX}, y=${clickY}`;
      Object.assign(coordMsg.style, {
        position: 'fixed', top: '15%', left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.85)', color: '#4caf50', padding: '0.5rem 1.2rem',
        borderRadius: '8px', zIndex: 1500, fontWeight: 'bold', pointerEvents: 'none'
      });
      document.body.appendChild(coordMsg);
      setTimeout(() => coordMsg.remove(), 2500);
    });

    // Перерисовываем при загрузке всех изображений
    window.addEventListener('load', () => {
      redraw();
    });

    // При изменении размеров окна canvas сам адаптируется через CSS
    // Но можно принудительно перерисовать, если нужно (не обязательно)

window.canvas = canvas;
window.soldPixels = soldPixels;
window.redraw = redraw;
