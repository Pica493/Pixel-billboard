// ============================================================
// ПОГОДА: снег/дождь/листья (автоматически по времени суток),
// Олаф, расенган — выделено из общего блока пасхалок.
// ============================================================
(function() {
  // Алиас на общий слой эффектов — объявлен в easter-eggs.js и явно экспортирован
  const effectsLayer = window.effectsLayer;

let weatherTimeout = null;
let nextEffectTimeout = null;
let currentOlaf = null;

function clearWeather() {
  effectsLayer.querySelectorAll('.weather-particle').forEach(el => el.remove());
  if (currentOlaf) {
    currentOlaf.remove();
    currentOlaf = null;
  }
  clearTimeout(weatherTimeout);
  clearTimeout(nextEffectTimeout);
  weatherTimeout = null;
  nextEffectTimeout = null;
}

// ---------- Пиксель-арт Олаф ----------
function buildOlafSprite() {
  const OLAF_HAT = '#1a1a1a';
  const OLAF_HAT_BAND = '#c62828';
  const OLAF_SNOW = '#f5f9ff';
  const OLAF_EYE = '#141414';
  const OLAF_NOSE = '#ff8c1a';
  const OLAF_SCARF = '#d32f2f';
  const OLAF_SCARF_DARK = '#9e1414';
  const OLAF_STICK = '#6b4423';
  const OLAF_COAL = '#141414';

  const map = new Map();
  function paint(gx, gy, gw, gh, color) {
    for (let y = gy; y < gy + gh; y++) for (let x = gx; x < gx + gw; x++) map.set(x + ',' + y, color);
  }

  // тело — три "снежных кома", каждый несколькими полосами разной ширины
  paint(9, 39, 18, 2, OLAF_SNOW); paint(5, 29, 26, 10, OLAF_SNOW); paint(8, 27, 20, 2, OLAF_SNOW); // нижний ком
  paint(11, 25, 14, 2, OLAF_SNOW); paint(8, 18, 20, 7, OLAF_SNOW); paint(12, 17, 12, 1, OLAF_SNOW); // средний ком
  paint(13, 15, 10, 2, OLAF_SNOW); paint(11, 9, 14, 6, OLAF_SNOW); paint(14, 8, 8, 1, OLAF_SNOW);   // голова

  // шляпа
  paint(14, 0, 8, 6, OLAF_HAT);
  paint(14, 4, 8, 2, OLAF_HAT_BAND);
  paint(10, 6, 16, 2, OLAF_HAT);

  // лицо
  paint(14, 11, 2, 2, OLAF_EYE);
  paint(19, 11, 2, 2, OLAF_EYE);
  paint(16, 12, 3, 2, OLAF_NOSE);
  paint(13, 15, 1, 1, OLAF_EYE); paint(15, 16, 1, 1, OLAF_EYE);
  paint(18, 16, 1, 1, OLAF_EYE); paint(20, 15, 1, 1, OLAF_EYE);

  // шарф
  paint(9, 15, 18, 3, OLAF_SCARF);
  paint(14, 18, 6, 5, OLAF_SCARF);
  paint(13, 23, 1, 1, OLAF_SCARF_DARK); paint(16, 23, 1, 1, OLAF_SCARF_DARK); paint(19, 23, 1, 1, OLAF_SCARF_DARK);

  // пуговицы
  paint(17, 20, 2, 2, OLAF_COAL);
  paint(17, 24, 2, 2, OLAF_COAL);
  paint(17, 30, 2, 2, OLAF_COAL);
  paint(17, 34, 2, 2, OLAF_COAL);

  // руки-веточки
  paint(5, 19, 4, 2, OLAF_STICK); paint(1, 16, 4, 2, OLAF_STICK);
  paint(0, 13, 2, 2, OLAF_STICK); paint(3, 13, 2, 2, OLAF_STICK); paint(1, 14, 2, 2, OLAF_STICK);
  paint(27, 19, 4, 2, OLAF_STICK); paint(31, 16, 4, 2, OLAF_STICK);
  paint(30, 13, 2, 2, OLAF_STICK); paint(33, 13, 2, 2, OLAF_STICK); paint(32, 14, 2, 2, OLAF_STICK);

  // уголь под ногами
  paint(10, 41, 3, 2, OLAF_COAL); paint(14, 42, 3, 2, OLAF_COAL);
  paint(19, 42, 3, 2, OLAF_COAL); paint(23, 41, 3, 2, OLAF_COAL);

  const cells = [];
  for (const [key, color] of map) {
    const [gx, gy] = key.split(',').map(Number);
    cells.push({ gx, gy, color });
  }
  return cells;
}
const OLAF_CELLS = buildOlafSprite();
const OLAF_GRID_W = 36, OLAF_GRID_H = 44;
const OLAF_LINES = [
  'Я люблю жаркие объятия!',
  'Хочешь обниму?',
  'А снег совсем как я!',
  'Привет, снежный друг!'
];

function showOlafSpeech(olafEl) {
  const bubble = document.createElement('div');
  bubble.className = 'olaf-speech';
  bubble.textContent = OLAF_LINES[Math.floor(Math.random() * OLAF_LINES.length)];
  document.body.appendChild(bubble);
  const rect = olafEl.getBoundingClientRect();
  bubble.style.left = rect.left + 'px';
  bubble.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
  requestAnimationFrame(() => bubble.classList.add('show'));
  setTimeout(() => {
    bubble.classList.remove('show');
    setTimeout(() => bubble.remove(), 300);
  }, 2400);
}

function createOlaf() {
  const olaf = document.createElement('div');
  olaf.className = 'olaf';
  olaf.title = 'Олаф';

  const pixelSize = 3;
  const canvas = document.createElement('canvas');
  canvas.width = OLAF_GRID_W * pixelSize;
  canvas.height = OLAF_GRID_H * pixelSize;
  canvas.style.cssText = `width:${OLAF_GRID_W * pixelSize}px;height:${OLAF_GRID_H * pixelSize}px;display:block;`;
  const octx = canvas.getContext('2d');
  for (const c of OLAF_CELLS) {
    octx.fillStyle = c.color;
    octx.fillRect(c.gx * pixelSize, c.gy * pixelSize, pixelSize + 0.5, pixelSize + 0.5);
  }
  olaf.appendChild(canvas);
  olaf.addEventListener('click', () => showOlafSpeech(olaf));
  document.body.appendChild(olaf);
  return olaf;
}

// ---------- Расенган: вращающийся элемент, следующий за курсором/пальцем ----------
const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
let rasenganEl = null;
let rasenganStarTimer = null;
let rasenganMoveHandler = null;

function spawnRasenganStar(cx, cy) {
  const star = document.createElement('div');
  star.className = 'rasengan-star';
  const angle = Math.random() * Math.PI * 2;
  const dist = 46 + Math.random() * 30;
  star.style.left = (cx + Math.cos(angle) * dist) + 'px';
  star.style.top = (cy + Math.sin(angle) * dist) + 'px';
  const dur = 0.5 + Math.random() * 0.4;
  star.style.animationDuration = dur + 's';
  document.body.appendChild(star);
  setTimeout(() => star.remove(), dur * 1000);
}

function createRasengan(x, y) {
  if (rasenganEl) return;
  rasenganEl = document.createElement('div');
  rasenganEl.className = 'rasengan-el';
  rasenganEl.style.left = x + 'px';
  rasenganEl.style.top = y + 'px';
  document.body.appendChild(rasenganEl);
  rasenganStarTimer = setInterval(() => {
    if (rasenganEl) {
      const r = rasenganEl.getBoundingClientRect();
      spawnRasenganStar(r.left + r.width / 2, r.top + r.height / 2);
    }
  }, 90);
}
function moveRasengan(x, y) {
  if (rasenganEl) { rasenganEl.style.left = x + 'px'; rasenganEl.style.top = y + 'px'; }
}
function removeRasengan() {
  if (rasenganEl) { rasenganEl.remove(); rasenganEl = null; }
  if (rasenganStarTimer) { clearInterval(rasenganStarTimer); rasenganStarTimer = null; }
  if (rasenganMoveHandler) { window.removeEventListener('mousemove', rasenganMoveHandler); rasenganMoveHandler = null; }
  document.body.style.cursor = '';
}

function startSnow() {
  clearWeather();
  for (let i = 0; i < 50; i++) {
    const f = document.createElement('div');
    f.className = 'snowflake weather-particle';
    f.style.left = Math.random() * 100 + '%';
    f.style.animationDuration = (2 + Math.random() * 3) + 's';
    effectsLayer.appendChild(f);
  }
  if (Math.random() < 0.66) {
    setTimeout(() => {
      if (currentOlaf) return;
      currentOlaf = createOlaf();
    }, 2000);
  }
}

function startRain() {
  clearWeather();
  for (let i = 0; i < 40; i++) {
    const d = document.createElement('div');
    d.className = 'raindrop weather-particle';
    d.style.left = Math.random() * 100 + '%';
    d.style.animationDuration = (1 + Math.random() * 1.5) + 's';
    effectsLayer.appendChild(d);
  }
}

function startLeaves() {
  clearWeather();
  for (let i = 0; i < 25; i++) {
    const l = document.createElement('div');
    l.className = 'leaf weather-particle';
    l.style.left = Math.random() * 100 + '%';
    l.style.animationDuration = (3 + Math.random() * 4) + 's';
    effectsLayer.appendChild(l);
  }
  setTimeout(() => {
    const special = document.createElement('div');
    special.className = 'special-leaf';
    special.title = isTouchDevice ? 'Зажми, чтобы получить Расенган' : 'Нажми, чтобы получить Расенган';
    document.body.appendChild(special);
    const timeoutId = setTimeout(() => special.remove(), 30000);

    function flyAway() {
      clearTimeout(timeoutId);
      special.style.transition = 'transform 0.5s ease-out, opacity 0.5s';
      special.style.transform = 'translate(100px, -100px) rotate(720deg)';
      special.style.opacity = '0';
      setTimeout(() => special.remove(), 500);
    }

    if (!isTouchDevice) {
      // ПК: клик -> расенган 30 секунд следует за курсором мыши, вращаясь на месте
      special.addEventListener('click', function onClick(e) {
        flyAway();
        document.body.style.cursor = 'none';
        createRasengan(e.clientX, e.clientY);
        rasenganMoveHandler = ev => moveRasengan(ev.clientX, ev.clientY);
        window.addEventListener('mousemove', rasenganMoveHandler);
        setTimeout(removeRasengan, 30000);
      }, { once: true });
    } else {
      // Телефон: обычное касание ничего не делает — только нажатие и удержание
      let holdTimer = null;
      let held = false;
      special.addEventListener('touchstart', function onTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        holdTimer = setTimeout(() => {
          held = true;
          createRasengan(touch.clientX, touch.clientY);
        }, 350);
      }, { passive: false });
      special.addEventListener('touchmove', function onTouchMove(e) {
        if (held && rasenganEl) {
          const touch = e.touches[0];
          moveRasengan(touch.clientX, touch.clientY);
        }
      }, { passive: true });
      const endHold = function() {
        clearTimeout(holdTimer);
        if (held) {
          removeRasengan();
          held = false;
          flyAway();
        }
      };
      special.addEventListener('touchend', endHold);
      special.addEventListener('touchcancel', endHold);
    }
  }, 5000);
}

function startComets() {
  clearWeather();
  for (let i = 0; i < 8; i++) {
    const c = document.createElement('div');
    c.className = 'comet weather-particle';
    c.style.left = Math.random() * 90 + '%';
    c.style.top = Math.random() * 30 + '%';
    c.style.animationDuration = (1.5 + Math.random() * 1.5) + 's';
    effectsLayer.appendChild(c);
  }
}

// Псевдослучайное число на основе строки
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

// Генерация расписания для конкретного дня (по МСК)
function getDaySchedule(date) {
  const dayKey = date.toISOString().slice(0, 10);
  const seed = hashCode(dayKey);
  const intervals = [];
  let currentTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0).getTime();
  const endOfDay = currentTime + 24 * 60 * 60 * 1000;

  const firstDelay = (60 + (seed % 180)) * 60 * 1000;
  currentTime += firstDelay;

  while (currentTime < endOfDay) {
    const duration = (6 + (seed % 5)) * 60 * 1000;
    const types = ['snow', 'rain', 'leaves', 'comets'];
    const typeIndex = (seed + intervals.length) % 4;
    intervals.push({
      start: currentTime,
      end: currentTime + duration,
      type: types[typeIndex]
    });
    const pause = (60 + ((seed * (intervals.length + 1)) % 180)) * 60 * 1000;
    currentTime = currentTime + duration + pause;
  }
  return intervals;
}

// Основная функция применения погоды по времени
function applyWeatherByTime() {
  clearTimeout(weatherTimeout);
  clearTimeout(nextEffectTimeout);

  const now = new Date();
  const msk = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
  const schedule = getDaySchedule(msk);
  const nowTime = msk.getTime();
  const GRACE_PERIOD = 3000; // 3 секунды запас до начала эффекта

  let activeInterval = null;
  let nextInterval = null;

  for (let i = 0; i < schedule.length; i++) {
    const interval = schedule[i];
    // Проверяем, находимся ли мы внутри интервала или в пределах GRACE_PERIOD до его начала
    if (nowTime >= interval.start - GRACE_PERIOD && nowTime < interval.end) {
      activeInterval = interval;
      nextInterval = schedule[i + 1] || null;
      break;
    } else if (nowTime < interval.start - GRACE_PERIOD) {
      nextInterval = interval;
      break;
    }
  }

  if (activeInterval) {
    const type = activeInterval.type;
    clearWeather();

    // Если мы попали в "льготный" период до начала, подождём несколько миллисекунд и запустим точно в start
    const delay = Math.max(0, activeInterval.start - nowTime);

    setTimeout(() => {
      // Запускаем эффект (уже внутри интервала)
      if (type === 'snow') startSnow();
      else if (type === 'rain') startRain();
      else if (type === 'leaves') startLeaves();
      else if (type === 'comets') startComets();

      // Таймер на окончание эффекта
      const timeLeft = activeInterval.end - Date.now();
      if (timeLeft > 0) {
        weatherTimeout = setTimeout(() => {
          scheduleNextEffect(nextInterval);
        }, timeLeft);
      }
    }, delay);

  } else if (nextInterval) {
    // Ожидаем следующий эффект
    const timeToNext = nextInterval.start - nowTime;
    if (timeToNext > 0) {
      nextEffectTimeout = setTimeout(() => {
        applyWeatherByTime();
      }, timeToNext);
    } else {
      applyWeatherByTime();
    }
  } else {
    // Ждём полуночи
    const nextDay = new Date(msk.getFullYear(), msk.getMonth(), msk.getDate() + 1);
    const msToMidnight = nextDay.getTime() - nowTime;
    nextEffectTimeout = setTimeout(() => {
      applyWeatherByTime();
    }, msToMidnight);
  }
}

function scheduleNextEffect(nextInterval) {
  clearWeather();
  if (!nextInterval) {
    const now = new Date();
    const msk = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
    const nextDay = new Date(msk.getFullYear(), msk.getMonth(), msk.getDate() + 1);
    const msToMidnight = nextDay.getTime() - msk.getTime();
    nextEffectTimeout = setTimeout(() => applyWeatherByTime(), msToMidnight);
    return;
  }
  const now = new Date();
  const msk = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
  const nowTime = msk.getTime();
  const timeToNext = nextInterval.start - nowTime;
  if (timeToNext > 0) {
    nextEffectTimeout = setTimeout(() => applyWeatherByTime(), timeToNext);
  } else {
    applyWeatherByTime();
  }
}

// Запуск при загрузке
applyWeatherByTime();


})();
