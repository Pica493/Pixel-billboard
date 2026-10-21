(function(){
  const effectsLayer = document.getElementById('effects-layer');
  const easterInput = document.getElementById('easter-input');

  // ===== Блокировка поля ввода кода на время игры =====
  // Раньше на телефоне поле "Код..." оставалось в фокусе после ввода
  // команды (SNAKE, TETRIS и т.д.), и любое касание/свайп по игровому
  // полю снова открывало экранную клавиатуру. Эти функции принудительно
  // снимают фокус и временно блокируют поле на время игры.
  let easterInputLockCount = 0;
  window.pbLockCodeInput = function() {
    easterInputLockCount++;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    easterInput.blur();
    easterInput.setAttribute('readonly', 'readonly');
    easterInput.style.pointerEvents = 'none';
  };
  window.pbUnlockCodeInput = function() {
    easterInputLockCount = Math.max(0, easterInputLockCount - 1);
    if (easterInputLockCount === 0) {
      easterInput.removeAttribute('readonly');
      easterInput.style.pointerEvents = '';
    }
  };

  const canvas = window.canvas;
  if (!canvas) { console.warn('canvas не найден'); return; }
  const ctx = canvas.getContext('2d');
  const container = document.getElementById('canvas-container');

  function safeRedraw() {
    if (typeof window.redraw === 'function') window.redraw();
    else {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
      if (typeof window.soldPixels !== 'undefined') {
        window.soldPixels.forEach(b => {
          const img = new Image(); img.src = b.img;
          img.onload = () => ctx.drawImage(img, b.x, b.y, b.w, b.h);
        });
      }
    }
  }

  function showMessage(text, color = '#fff', duration = 3000) {
    const msg = document.createElement('div'); msg.textContent = text;
    Object.assign(msg.style, {
      position: 'fixed', top: '10%', left: '50%', transform: 'translateX(-50%)',
      color: color, background: 'rgba(0,0,0,0.8)', padding: '0.5rem 1.5rem',
      borderRadius: '8px', zIndex: 1500, fontWeight: 'bold', pointerEvents: 'none'
    });
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), duration);
  }

  const GLOBAL_COOLDOWN = 15000, INDIVIDUAL_COOLDOWN = 15000;
  let lastGlobalActivation = 0, cooldowns = {};
  function canActivate(name) {
    const now = Date.now();
    if (now - lastGlobalActivation < GLOBAL_COOLDOWN) return false;
    if (cooldowns[name] && now - cooldowns[name] < INDIVIDUAL_COOLDOWN) return false;
    return true;
  }
  function setActivated(name) { lastGlobalActivation = Date.now(); cooldowns[name] = Date.now(); }

  const easterEggs = [];
  function addEasterEgg(name, combo, action) {
    easterEggs.push({ name, combo: combo.toUpperCase(), action });
  }

  // Глобальная функция активации (должна быть объявлена до обработчиков)
window.activateCombo = function(combo) {
  for (let egg of easterEggs) {
    if (combo.includes(egg.combo)) {
      if (canActivate(egg.name)) {
        setActivated(egg.name);
        egg.action();
        return true;
      }
    }
  }
  return false;
};

// Лупа
let inputTimer;
easterInput.addEventListener('input', function() {
  clearTimeout(inputTimer);
  const val = easterInput.value.trim().toUpperCase();
  if (val.length > 0) {
    inputTimer = setTimeout(() => { window.activateCombo(val); easterInput.value = ''; }, 800);
  }
});
easterInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    clearTimeout(inputTimer);
    const val = easterInput.value.trim().toUpperCase();
    if (val.length > 0) { window.activateCombo(val); easterInput.value = ''; }
  }
});



  // ================= ПАСХАЛКИ =================

  // matrix
  function triggerMatrixRain() {
    const matrixCanvas = document.createElement('canvas');
    matrixCanvas.width = canvas.width; matrixCanvas.height = canvas.height;
    matrixCanvas.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; z-index:300;';
    container.appendChild(matrixCanvas);
    const mctx = matrixCanvas.getContext('2d');
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789';
    const fontSize = 15, columns = Math.floor(matrixCanvas.width / fontSize);
    const drops = Array(columns).fill(0);
    const draw = () => {
      mctx.fillStyle = 'rgba(0, 0, 0, 0.05)'; mctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
      mctx.fillStyle = '#0f0'; mctx.font = fontSize + 'px monospace';
      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        mctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > matrixCanvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    };
    const interval = setInterval(draw, 40);
    setTimeout(() => { clearInterval(interval); matrixCanvas.remove(); safeRedraw(); }, 4000);
  }
  addEasterEgg('matrix', 'MATRIX', triggerMatrixRain);

  // bleach – врата Сенкаймон открываются, из проёма вылетают адские бабочки. 5 секунд.
  function triggerBleachPortal() {
    const w = window.innerWidth, h = window.innerHeight;
    const bcanvas = document.createElement('canvas');
    bcanvas.width = w; bcanvas.height = h;
    bcanvas.style.cssText = 'position:fixed;top:0;left:0;z-index:300000;pointer-events:none;background:transparent;';
    document.body.appendChild(bcanvas);
    const bctx = bcanvas.getContext('2d');

    const clamp01 = t => Math.max(0, Math.min(1, t));
    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
    const easeInCubic = t => t * t * t;

    // высота ворот ограничена не только высотой экрана, но и шириной —
    // на узких телефонах ворота не должны вылезать за края экрана
    const gateH = Math.min(560, h * 0.74, (w * 0.82) / 0.62);
    const gateW = gateH * 0.62;
    const gateCX = w / 2;
    // на узких телефонах опускаем центр ворот ниже — иначе крыша и дымка
    // сверху упираются в край экрана и верх ворот плохо видно
    const gateCenterY = w < 700 ? h * 0.56 : h * 0.5;
    const gateTopY = gateCenterY - gateH / 2;
    const gateBottomY = gateCenterY + gateH / 2;
    const pillarW = gateW * 0.13;
    const leftPillarX = gateCX - gateW / 2;
    const rightPillarX = gateCX + gateW / 2 - pillarW;
    const openingX0 = leftPillarX + pillarW;
    const openingX1 = rightPillarX;
    const openingCX = (openingX0 + openingX1) / 2;

    function drawPillar(px) {
      const grad = bctx.createLinearGradient(px, 0, px + pillarW, 0);
      grad.addColorStop(0, '#8f8672');
      grad.addColorStop(0.15, '#d9d0b8');
      grad.addColorStop(0.5, '#efe8d4');
      grad.addColorStop(0.85, '#c9c0a6');
      grad.addColorStop(1, '#847b66');
      bctx.fillStyle = grad;
      bctx.fillRect(px, gateTopY, pillarW, gateBottomY - gateTopY);
      // горизонтальные членения
      bctx.strokeStyle = 'rgba(90,80,60,0.35)';
      bctx.lineWidth = 1.5;
      for (let i = 1; i < 5; i++) {
        const y = gateTopY + (gateBottomY - gateTopY) * (i / 5);
        bctx.beginPath(); bctx.moveTo(px, y); bctx.lineTo(px + pillarW, y); bctx.stroke();
      }
      // золотая пластина-эмблема
      const plateY = gateTopY + (gateBottomY - gateTopY) * 0.62;
      bctx.fillStyle = '#8a6a2a';
      bctx.fillRect(px + pillarW * 0.22, plateY, pillarW * 0.56, pillarW * 0.56);
      bctx.strokeStyle = '#4a3510';
      bctx.lineWidth = 1.5;
      bctx.strokeRect(px + pillarW * 0.22, plateY, pillarW * 0.56, pillarW * 0.56);
    }

    function drawRoof(riseT) {
      const roofY = gateTopY - 10 * riseT;
      const overhang = gateW * 0.14;
      const roofH = gateH * 0.09;
      bctx.save();
      bctx.globalAlpha = riseT;
      const grad = bctx.createLinearGradient(0, roofY - roofH, 0, roofY + roofH * 0.3);
      grad.addColorStop(0, '#2a2015');
      grad.addColorStop(1, '#100c08');
      bctx.fillStyle = grad;
      bctx.beginPath();
      bctx.moveTo(leftPillarX - overhang, roofY + roofH * 0.35);
      bctx.quadraticCurveTo(gateCX, roofY - roofH * 1.1, rightPillarX + pillarW + overhang, roofY + roofH * 0.35);
      bctx.lineTo(rightPillarX + pillarW + overhang * 0.7, roofY + roofH * 0.7);
      bctx.quadraticCurveTo(gateCX, roofY - roofH * 0.5, leftPillarX - overhang * 0.7, roofY + roofH * 0.7);
      bctx.closePath();
      bctx.fill();
      // бахрома-рейки снизу перемычки
      bctx.strokeStyle = 'rgba(0,0,0,0.5)';
      bctx.lineWidth = 1;
      const slats = 26;
      for (let i = 0; i <= slats; i++) {
        const t = i / slats;
        const x = leftPillarX - overhang * 0.7 + (rightPillarX + pillarW + overhang * 0.7 - (leftPillarX - overhang * 0.7)) * t;
        const yTop = roofY + roofH * 0.7 - Math.sin(t * Math.PI) * roofH * 0.15;
        bctx.beginPath(); bctx.moveTo(x, yTop); bctx.lineTo(x, yTop + roofH * 0.35); bctx.stroke();
      }
      bctx.restore();
    }

    function drawMist(tsec, alpha) {
      bctx.save();
      bctx.globalAlpha = alpha;
      const wisps = [
        { x: leftPillarX - gateW * 0.25, y: gateBottomY - gateH * 0.35, r: gateW * 0.5, speed: 0.4, seed: 0 },
        { x: rightPillarX + pillarW + gateW * 0.25, y: gateBottomY - gateH * 0.3, r: gateW * 0.55, speed: 0.35, seed: 2 },
        { x: leftPillarX - gateW * 0.1, y: gateTopY + gateH * 0.15, r: gateW * 0.35, speed: 0.5, seed: 4 },
        { x: rightPillarX + pillarW + gateW * 0.15, y: gateTopY + gateH * 0.2, r: gateW * 0.38, speed: 0.45, seed: 6 }
      ];
      for (const wsp of wisps) {
        const ox = Math.sin(tsec * wsp.speed + wsp.seed) * 18;
        const oy = Math.cos(tsec * wsp.speed * 0.7 + wsp.seed) * 12;
        const g = bctx.createRadialGradient(wsp.x + ox, wsp.y + oy, 0, wsp.x + ox, wsp.y + oy, wsp.r);
        g.addColorStop(0, 'rgba(255,255,255,0.5)');
        g.addColorStop(0.6, 'rgba(240,245,250,0.18)');
        g.addColorStop(1, 'rgba(240,245,250,0)');
        bctx.fillStyle = g;
        bctx.beginPath();
        bctx.arc(wsp.x + ox, wsp.y + oy, wsp.r, 0, Math.PI * 2);
        bctx.fill();
      }
      bctx.restore();
    }

    function drawOpening(openT, alpha) {
      if (openT <= 0) return;
      const halfW = ((openingX1 - openingX0) / 2) * openT;
      const grad = bctx.createLinearGradient(openingCX - halfW, 0, openingCX + halfW, 0);
      grad.addColorStop(0, 'rgba(210,225,255,0.15)');
      grad.addColorStop(0.5, 'rgba(255,255,255,0.98)');
      grad.addColorStop(1, 'rgba(210,225,255,0.15)');
      bctx.save();
      bctx.globalAlpha = alpha;
      bctx.fillStyle = grad;
      bctx.fillRect(openingCX - halfW, gateTopY + 4, halfW * 2, (gateBottomY - gateTopY) - 8);
      // мягкое свечение по краям проёма
      bctx.globalAlpha = alpha * 0.6;
      const glow = bctx.createRadialGradient(openingCX, gateCenterY, 0, openingCX, gateCenterY, halfW * 1.6 + 40);
      glow.addColorStop(0, 'rgba(255,255,255,0.55)');
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      bctx.fillStyle = glow;
      bctx.fillRect(openingCX - halfW * 2 - 40, gateTopY - 40, halfW * 4 + 80, (gateBottomY - gateTopY) + 80);
      bctx.restore();
    }

    // ---- Адская бабочка (Hell Butterfly): тёмные крылья с прожилками,
    // пурпурно-розовая волнистая кайма, длинный хвост-шлейф ----
    function drawHellButterfly(x, y, angle, wingPhase, size, alpha) {
      const flap = Math.sin(wingPhase);
      const spread = 0.62 + Math.abs(flap) * 0.34;

      const wingGrad = bctx.createRadialGradient(0, 0, 0, 0, 0, size);
      wingGrad.addColorStop(0, 'rgba(60,58,68,0.95)');
      wingGrad.addColorStop(1, 'rgba(24,23,30,0.92)');

      bctx.save();
      bctx.globalAlpha = alpha;
      bctx.translate(x, y);
      bctx.rotate(angle);

      function wingHalf(side) {
        // верхнее крыло — широкий веер с прожилками
        bctx.save();
        bctx.rotate(side * 0.12 * (1 - spread * 0.25));
        bctx.beginPath();
        bctx.moveTo(0, 0);
        bctx.bezierCurveTo(side * size * 0.3, -size * 0.75 * spread, side * size * 0.85, -size * 0.7 * spread, side * size * 0.95, -size * 0.15);
        bctx.bezierCurveTo(side * size * 0.85, size * 0.15, side * size * 0.55, size * 0.32, side * size * 0.15, size * 0.08);
        bctx.closePath();
        bctx.fillStyle = wingGrad;
        bctx.fill();
        bctx.strokeStyle = 'rgba(8,8,12,0.55)';
        bctx.lineWidth = 0.7;
        for (let i = 1; i <= 4; i++) {
          bctx.beginPath();
          bctx.moveTo(0, 0);
          bctx.lineTo(side * size * (0.22 + i * 0.17), -size * (0.08 + i * 0.14) * spread);
          bctx.stroke();
        }
        bctx.restore();

        // нижнее крыло — волнистая пурпурная кайма + хвост
        bctx.save();
        bctx.rotate(side * 0.32);
        bctx.beginPath();
        bctx.moveTo(0, 0);
        bctx.bezierCurveTo(side * size * 0.22, size * 0.32 * spread, side * size * 0.48, size * 0.5 * spread, side * size * 0.5, size * 0.6);
        const waves = 3;
        for (let i = 0; i <= waves; i++) {
          const t = i / waves;
          const wx = side * size * (0.5 - t * 0.32);
          const wy = size * (0.6 + Math.sin(t * Math.PI * 2) * 0.05 + t * 0.13);
          bctx.lineTo(wx, wy);
        }
        bctx.closePath();
        bctx.fillStyle = wingGrad;
        bctx.fill();
        bctx.strokeStyle = 'rgba(215,60,165,0.6)';
        bctx.lineWidth = 1.2;
        bctx.stroke();

        // хвост-шлейф
        bctx.beginPath();
        bctx.moveTo(side * size * 0.28, size * 0.5);
        bctx.quadraticCurveTo(side * size * 0.14, size * 1.0, side * size * 0.04, size * 1.35);
        bctx.strokeStyle = 'rgba(30,29,36,0.65)';
        bctx.lineWidth = 1;
        bctx.stroke();
        bctx.restore();
      }

      wingHalf(-1);
      wingHalf(1);

      // тело, голова, усики
      bctx.fillStyle = '#1a1a20';
      bctx.beginPath();
      bctx.ellipse(0, 0, size * 0.055, size * 0.15, 0, 0, Math.PI * 2);
      bctx.fill();
      bctx.beginPath();
      bctx.arc(0, -size * 0.13, size * 0.045, 0, Math.PI * 2);
      bctx.fill();
      bctx.strokeStyle = '#2c2c34';
      bctx.lineWidth = 0.6;
      bctx.beginPath();
      bctx.moveTo(0, -size * 0.15); bctx.quadraticCurveTo(-size * 0.09, -size * 0.25, -size * 0.13, -size * 0.28);
      bctx.moveTo(0, -size * 0.15); bctx.quadraticCurveTo(size * 0.09, -size * 0.25, size * 0.13, -size * 0.28);
      bctx.stroke();

      bctx.restore();
    }

    // ---- Таймлайн ----
    const total = 5000;
    const riseEnd = 800;
    const openEnd = 1500;
    const flightStart = 1300, flightEnd = 4300;
    const fadeStart = 4300;

    const flies = [];
    const flyCount = 40;
    for (let i = 0; i < flyCount; i++) {
      flies.push({
        spawnDelay: Math.random() * (flightEnd - flightStart - 400),
        offsetOnGate: Math.random(),
        angle: -Math.PI / 2 + (Math.random() - 0.5) * 1.6,
        speed: 70 + Math.random() * 90,
        wobble: 0.4 + Math.random() * 0.8,
        wobbleFreq: 1 + Math.random() * 1.8,
        size: 16 + Math.random() * 14,
        wingPhase: Math.random() * Math.PI * 2
      });
    }

    let startTime = null;

    function animate(ts) {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      const tsec = elapsed / 1000;
      bctx.clearRect(0, 0, w, h);

      const structAlpha = elapsed > fadeStart ? clamp01(1 - (elapsed - fadeStart) / (total - fadeStart)) : 1;
      const riseT = easeOutCubic(clamp01(elapsed / riseEnd));

      if (riseT > 0) {
        drawMist(tsec, structAlpha * 0.85);
        drawPillar(leftPillarX);
        drawPillar(rightPillarX);
        drawRoof(riseT);
      }

      const openT = easeOutCubic(clamp01((elapsed - riseEnd * 0.4) / (openEnd - riseEnd * 0.4)));
      drawOpening(openT, structAlpha);

      for (const f of flies) {
        const localT = elapsed - flightStart - f.spawnDelay;
        if (localT < 0) continue;
        const spawnX = openingX0 + (openingX1 - openingX0) * f.offsetOnGate;
        const spawnY = gateTopY + (gateBottomY - gateTopY) * (0.3 + Math.random() * 0);
        const dist = f.speed * (localT / 1000);
        const wob = Math.sin(localT / 1000 * f.wobbleFreq) * f.wobble * 22;
        const dirX = Math.cos(f.angle), dirY = Math.sin(f.angle);
        const perpX = -dirY, perpY = dirX;
        const x = spawnX + dirX * dist + perpX * wob;
        const y = spawnY + dirY * dist + perpY * wob;
        const flyAngle = Math.atan2(dirY, dirX) + Math.PI / 2 + Math.sin(localT / 1000 * f.wobbleFreq) * 0.2;
        const spawnAlpha = clamp01(localT / 200);
        const edgeAlpha = (x < -60 || x > w + 60 || y < -60 || y > h + 60) ? 0 : 1;
        const alpha = Math.min(spawnAlpha, edgeAlpha) * structAlpha;
        if (alpha > 0.01) drawHellButterfly(x, y, flyAngle, f.wingPhase + localT * 0.01, f.size, alpha);
      }

      if (elapsed < total) {
        requestAnimationFrame(animate);
      } else {
        bcanvas.remove();
      }
    }

    requestAnimationFrame(animate);
  }
  addEasterEgg('bleach', 'BLEACH', triggerBleachPortal);

  // terminator – отсылка на финал "Терминатор 2": лава поднимается снизу
  // сайта до середины экрана, из неё выпрыгивают искры, через 2 секунды
  // резко поднимается кулак терминатора (запястье остаётся в лаве),
  // держится секунду и опускается обратно, растворяясь в лаве.
  function triggerTerminator() {
    const w = window.innerWidth, h = window.innerHeight;
    const tcanvas = document.createElement('canvas');
    tcanvas.width = w; tcanvas.height = h;
    tcanvas.style.cssText = 'position:fixed;top:0;left:0;z-index:300000;pointer-events:none;background:transparent;';
    document.body.appendChild(tcanvas);
    const tctx = tcanvas.getContext('2d');

    const clamp01 = t => Math.max(0, Math.min(1, t));
    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
    const easeInCubic = t => t * t * t;
    const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const restY = h + 20;         // лава полностью скрыта (ниже экрана)
    const settledY = h * 0.5;     // лава "до середины сайта"
    const armX = w / 2 + (Math.random() - 0.5) * w * 0.12;
    // общая "длина" механической руки и то, насколько высоко над лавой
    // должна подниматься видимая часть (кисть+палец), пока предплечье
    // остаётся у поверхности лавы
    const ARM_LEN = Math.min(300, h * 0.38);
    const ARM_RISE_OFFSET = ARM_LEN * 0.55;

    const total = 6900;
    const lavaRiseEnd = 1200;
    const armStart = 2000, armRiseEnd = 2450;
    const armHoldEnd = 3450, armSinkEnd = 5150; // погружение теперь заметно медленнее (1700мс вместо 700)
    const lavaRecedeStart = 5300, lavaRecedeEnd = 6300;

    function lavaSurfaceY(elapsed) {
      if (elapsed < lavaRiseEnd) return restY + (settledY - restY) * easeOutCubic(clamp01(elapsed / lavaRiseEnd));
      if (elapsed < lavaRecedeStart) return settledY;
      if (elapsed < lavaRecedeEnd) return settledY + (restY - settledY) * easeInCubic(clamp01((elapsed - lavaRecedeStart) / (lavaRecedeEnd - lavaRecedeStart)));
      return restY;
    }

    function drawLava(surfaceY, tsec, alpha) {
      if (surfaceY >= h + 5 || alpha <= 0.01) return;
      tctx.save();
      tctx.globalAlpha = alpha;
      const segments = 44;
      tctx.beginPath();
      tctx.moveTo(0, h);
      tctx.lineTo(0, surfaceY);
      for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * w;
        const wob = Math.sin(x * 0.018 + tsec * 1.4) * 8 + Math.sin(x * 0.05 - tsec * 2.1) * 4;
        tctx.lineTo(x, surfaceY + wob);
      }
      tctx.lineTo(w, h);
      tctx.closePath();
      const grad = tctx.createLinearGradient(0, surfaceY - 10, 0, h);
      grad.addColorStop(0, '#fff2b0');
      grad.addColorStop(0.08, '#ffcf3d');
      grad.addColorStop(0.25, '#ff8a1f');
      grad.addColorStop(0.55, '#c62f0a');
      grad.addColorStop(1, '#4a0d05');
      tctx.fillStyle = grad;
      tctx.fill();
      tctx.restore();

      tctx.save();
      tctx.globalAlpha = alpha * 0.55;
      const glow = tctx.createLinearGradient(0, surfaceY - 70, 0, surfaceY + 10);
      glow.addColorStop(0, 'rgba(255,180,60,0)');
      glow.addColorStop(1, 'rgba(255,180,60,0.55)');
      tctx.fillStyle = glow;
      tctx.fillRect(0, surfaceY - 70, w, 80);
      tctx.restore();
    }

    // рука терминатора: механическая, с открытым каркасом предплечья
    // (видны красные/синие "жилы"-провода), суставами-кольцами на
    // пальцах и поднятым вверх большим пальцем — по референсу
    // Рука — цельный непрерывный контур (как на референсе), а не набор
    // отдельных блоков: палец с выемкой у основания, ступенчатые
    // костяшки кулака, плавный переход в предплечье. Металлическая
    // заливка с бегущим диагональным бликом по всей форме.
    // Полностью механическая, явно роботическая рука: отдельные
    // сегменты пальцев с суставами-кольцами, блочный корпус кулака,
    // шаровой сустав запястья и труба предплечья с кольцами-поршнями.
    // Показывает "лайк" (большой палец вверх) и заметно ЗАХОДИТ в лаву
    // (не зависает над ней) — точка касания подсвечивается отдельно.
    // Рука полностью удалена и пересобрана как честный пиксель-арт
    // (сетка отдельных квадратов, двухтоновая штриховка светлый/тёмный
    // серый) — та же техника, что у робота-трансформера, ворона и Олафа,
    // а не гладкие векторные кривые. Большой палец вверх, кулак с
    // зубчатым краем костяшек слева, предплечье уходит в лаву.
    function buildTerminatorHandSprite() {
      const LIGHT = '#c2c6ca', MID = '#8a8f94', DARK = '#5c6166', DARKER = '#34373a';
      const map = new Map();
      function paint(gx, gy, gw, gh, color) {
        for (let y = gy; y < gy + gh; y++) for (let x = gx; x < gx + gw; x++) map.set(x + ',' + y, color);
      }

      // большой палец — узкий, двухтоновый (светлый слева, тёмный справа),
      // с лёгкой "лесенкой" по краям, как в пиксель-арте
      paint(14, 0, 3, 2, LIGHT);
      paint(13, 2, 2, 3, LIGHT); paint(15, 2, 2, 3, MID);
      paint(13, 5, 2, 3, LIGHT); paint(15, 5, 3, 3, MID);
      paint(12, 8, 3, 2, LIGHT); paint(15, 8, 3, 2, DARK);

      // кулак — двухтоновый блок, с зубчатым (костяшки) левым краем
      paint(6, 9, 6, 11, LIGHT);
      paint(12, 9, 6, 11, DARK);
      paint(4, 10, 2, 2, LIGHT);
      paint(4, 13, 2, 2, LIGHT);
      paint(4, 16, 2, 2, LIGHT);
      paint(4, 19, 2, 2, MID);
      paint(5, 12, 1, 1, DARKER);
      paint(5, 15, 1, 1, DARKER);
      paint(5, 18, 1, 1, DARKER);

      // предплечье — тот же двухтоновый блок, слегка сужается книзу,
      // уходит в лаву
      paint(7, 20, 5, 5, LIGHT); paint(12, 20, 5, 5, DARK);
      paint(8, 25, 4, 6, LIGHT); paint(12, 25, 4, 6, DARK);
      paint(8, 31, 3, 3, LIGHT); paint(11, 31, 3, 3, DARK);

      const cells = [];
      for (const [key, color] of map) {
        const [gx, gy] = key.split(',').map(Number);
        cells.push({ gx, gy, color });
      }
      return cells;
    }
    const TERMINATOR_HAND_CELLS = buildTerminatorHandSprite();
    const TERMINATOR_GRID_H = 34;

    function drawTerminatorArm(x, tipY, alpha) {
      if (alpha <= 0.01) return;
      const pixelSize = ARM_LEN / TERMINATOR_GRID_H;

      tctx.save();
      tctx.globalAlpha = alpha;
      tctx.translate(x, tipY);

      for (const c of TERMINATOR_HAND_CELLS) {
        tctx.fillStyle = c.color;
        tctx.fillRect(
          (c.gx - 12.5) * pixelSize,
          c.gy * pixelSize,
          pixelSize + 0.6,
          pixelSize + 0.6
        );
      }

      tctx.restore();
    }



    const embers = [];
    function spawnEmber(surfaceY) {
      embers.push({
        x: Math.random() * w, y: surfaceY,
        vx: (Math.random() - 0.5) * 30, vy: -(50 + Math.random() * 60),
        life: 0, maxLife: 450 + Math.random() * 350, size: 2 + Math.random() * 3
      });
    }

    let startTime = null, lastEmberSpawn = 0;

    function animate(ts) {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      const tsec = elapsed / 1000;
      tctx.clearRect(0, 0, w, h);

      const surfaceY = lavaSurfaceY(elapsed);
      const lavaAlpha = 1;

      // рука: поднимается быстро в 2.0-2.45с, держится до 3.45с,
      // затем медленно и плавно тонет до 5.15с — видна только часть выше
      // поверхности лавы (клип). Предплечье намеренно заходит В лаву
      // (не зависает над ней) — запястье и кулак целиком видны сверху.
      let fistTipY = surfaceY + ARM_LEN;
      if (elapsed >= armStart && elapsed < armRiseEnd) {
        const t = easeOutCubic(clamp01((elapsed - armStart) / (armRiseEnd - armStart)));
        fistTipY = (surfaceY + ARM_LEN) + ((surfaceY - ARM_RISE_OFFSET) - (surfaceY + ARM_LEN)) * t;
      } else if (elapsed >= armRiseEnd && elapsed < armHoldEnd) {
        fistTipY = surfaceY - ARM_RISE_OFFSET;
      } else if (elapsed >= armHoldEnd && elapsed < armSinkEnd) {
        const t = easeInOutCubic(clamp01((elapsed - armHoldEnd) / (armSinkEnd - armHoldEnd)));
        fistTipY = (surfaceY - ARM_RISE_OFFSET) + ((surfaceY + ARM_LEN) - (surfaceY - ARM_RISE_OFFSET)) * t;
      }

      if (elapsed >= armStart && elapsed < armSinkEnd + 200) {
        tctx.save();
        tctx.beginPath();
        tctx.rect(0, 0, w, surfaceY + 4);
        tctx.clip();
        drawTerminatorArm(armX, fistTipY, 1);
        tctx.restore();

        // яркое свечение ровно в точке, где рука пересекает лаву —
        // подчёркивает, что она в неё заходит, а не висит над ней
        tctx.save();
        tctx.globalAlpha = 0.5 + 0.15 * Math.sin(tsec * 8);
        const contactGlow = tctx.createRadialGradient(armX, surfaceY, 0, armX, surfaceY, ARM_LEN * 0.22);
        contactGlow.addColorStop(0, 'rgba(255,230,150,0.85)');
        contactGlow.addColorStop(1, 'rgba(255,150,40,0)');
        tctx.fillStyle = contactGlow;
        tctx.beginPath();
        tctx.arc(armX, surfaceY, ARM_LEN * 0.22, 0, Math.PI * 2);
        tctx.fill();
        tctx.restore();
      }

      drawLava(surfaceY, tsec, lavaAlpha);

      // искры из лавы, пока она присутствует
      if (surfaceY < h - 5 && elapsed - lastEmberSpawn > 70 && elapsed < lavaRecedeEnd) {
        spawnEmber(surfaceY);
        lastEmberSpawn = elapsed;
      }
      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i];
        e.life += 16.7;
        e.x += e.vx * 0.0167; e.y += e.vy * 0.0167;
        e.vy += 220 * 0.0167; // гравитация — искры не взлетают высоко и падают обратно
        if (e.life >= e.maxLife || e.y > h + 10) { embers.splice(i, 1); continue; }
        const a = 1 - e.life / e.maxLife;
        tctx.save();
        tctx.globalAlpha = a;
        tctx.fillStyle = a > 0.5 ? '#ffcf4d' : '#ff6a1f';
        tctx.shadowColor = '#ff8a20';
        tctx.shadowBlur = 6;
        tctx.beginPath();
        tctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        tctx.fill();
        tctx.restore();
      }

      if (elapsed < total) {
        requestAnimationFrame(animate);
      } else {
        tcanvas.remove();
      }
    }

    requestAnimationFrame(animate);
  }
  addEasterEgg('terminator', 'TERMINATOR', triggerTerminator);

      
      

  // pikachu
  function pikachuRun() {
    const pika = document.createElement('div');
    pika.className = 'pikachu-container';
    pika.innerHTML = `
      <div class="pikachu-head">
        <div class="pikachu-ear-left"></div>
        <div class="pikachu-ear-right"></div>
        <div class="pikachu-eye eye-left"></div>
        <div class="pikachu-eye eye-right"></div>
        <div class="pikachu-cheek cheek-left"></div>
        <div class="pikachu-cheek cheek-right"></div>
        <div class="pikachu-mouth"></div>
      </div>
    `;
    document.body.appendChild(pika);
    pika.addEventListener('click', (e) => {
      e.stopPropagation();
      showMessage('Pika-pika!', '#ff0');
    });
    pika.addEventListener('animationend', () => pika.remove());
  }
  addEasterEgg('pikachu', 'PIKACHU', pikachuRun);

  // pokeball
  function pokeball() {
    const ball = document.createElement('div');
    ball.className = 'pokeball';
    ball.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); z-index:500;';
    document.body.appendChild(ball);
    setTimeout(() => ball.remove(), 3000);
  }
  addEasterEgg('pokeball', 'POKEBALL', pokeball);

  // mario block
  function marioBlock() {
    const block = document.createElement('div');
    block.className = 'mario-block';
    block.textContent = '?';
    let hits = 0;
    block.addEventListener('click', function(e) {
      e.stopPropagation();
      hits++;
      const coin = document.createElement('div');
      coin.className = 'mario-coin';
      coin.style.left = '50%';
      coin.style.top = '50%';
      coin.style.transform = 'translate(-50%, -50%)';
      block.appendChild(coin);
      setTimeout(() => coin.remove(), 500);
      if (hits >= 5) block.remove();
    });
    document.body.appendChild(block);
  }
  addEasterEgg('mario', 'MARIO', marioBlock);

  // igni
  // ============================================================
  // igni – живой огонь, который 10 секунд следует за курсором мыши
  // (а на телефоне — за пальцем при касании экрана).
  // ============================================================
  addEasterEgg('igni', 'IGNI', () => {
    const w = window.innerWidth, h = window.innerHeight;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.style.cssText = 'position:fixed;top:0;left:0;z-index:300000;pointer-events:none;background:transparent;';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let pointerX = w / 2, pointerY = h / 2, hasPointer = false;
    function onMove(e) { pointerX = e.clientX; pointerY = e.clientY; hasPointer = true; }
    function onTouch(e) {
      if (e.touches && e.touches.length > 0) {
        pointerX = e.touches[0].clientX; pointerY = e.touches[0].clientY; hasPointer = true;
      }
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });

    const particles = [];
    function spawnParticle() {
      if (!hasPointer) return;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.1;
      const speed = 40 + Math.random() * 70;
      particles.push({
        x: pointerX + (Math.random() - 0.5) * 10,
        y: pointerY + (Math.random() - 0.5) * 6,
        vx: Math.cos(angle) * speed * 0.3,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 450 + Math.random() * 350,
        size: 6 + Math.random() * 10,
        wobbleSeed: Math.random() * 10
      });
    }

    const total = 10000;
    let startTime = null, lastSpawn = 0;

    function animate(ts) {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      ctx.clearRect(0, 0, w, h);

      if (elapsed < total && elapsed - lastSpawn > 10) {
        for (let i = 0; i < 3; i++) spawnParticle();
        lastSpawn = elapsed;
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += 16.7;
        p.x += p.vx * 0.0167;
        p.y += p.vy * 0.0167;
        p.vy -= 32 * 0.0167; // конвекция — огонь ускоряется вверх
        p.vx += Math.sin(p.life / 80 + p.wobbleSeed) * 4;
        if (p.life >= p.maxLife) { particles.splice(i, 1); continue; }

        const t = p.life / p.maxLife;
        const size = p.size * (1 - t * 0.7);
        const alpha = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;

        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha) * 0.9;
        ctx.globalCompositeOperation = 'lighter';
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(1, size));
        if (t < 0.3) {
          grad.addColorStop(0, '#fff7cc');
          grad.addColorStop(0.4, '#ffd23f');
          grad.addColorStop(1, 'rgba(255,150,20,0)');
        } else if (t < 0.65) {
          grad.addColorStop(0, '#ffb020');
          grad.addColorStop(0.5, '#ff5a1f');
          grad.addColorStop(1, 'rgba(200,20,10,0)');
        } else {
          grad.addColorStop(0, '#ff3d1f');
          grad.addColorStop(0.5, '#8a1a10');
          grad.addColorStop(1, 'rgba(60,10,10,0)');
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, size), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (elapsed < total || particles.length > 0) {
        requestAnimationFrame(animate);
      } else {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('touchstart', onTouch);
        window.removeEventListener('touchmove', onTouch);
        canvas.remove();
      }
    }

    requestAnimationFrame(animate);
  });

  // aard (сдувание пикселей)
  addEasterEgg('aard', 'AARD', () => {
    for (let i = 0; i < 200; i++) {
      const particle = document.createElement('div');
      particle.className = 'pixel-particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 30 + '%';
      particle.style.animationDelay = Math.random() * 0.5 + 's';
      document.body.appendChild(particle);
      setTimeout(() => particle.remove(), 1500);
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    showMessage('Aard! Пиксели сдуло!', '#0ff', 2000);
    setTimeout(() => safeRedraw(), 2000);
  });

  // witcher
  addEasterEgg('witcher', 'WITCHER', () => showMessage('Заплатите чеканной монетой','silver',3000));

  // tardis
  addEasterEgg('tardis', 'TARDIS', () => {
    const w = window.innerWidth, h = window.innerHeight;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.style.cssText = 'position:fixed;top:0;left:0;z-index:300000;pointer-events:none;background:transparent;';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const clamp01 = t => Math.max(0, Math.min(1, t));
    const easeOutBack = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

    const T_DARK = '#0a0a0a';
    const T_BLUE = '#1d3f8f';
    const T_WHITE = '#f2f4f8';
    const T_GREY = '#8b8b8b';
    const T_LIGHT_GREY = '#c9cdd6';
    const T_GLOW = '#f4e6a8';

    function paint(map, gx, gy, gw, gh, color) {
      for (let y = gy; y < gy + gh; y++) for (let x = gx; x < gx + gw; x++) map.set(x + ',' + y, color);
    }
    function paintWindow6(map, gx, gy) {
      paint(map, gx, gy, 10, 7, T_DARK);
      paint(map, gx + 1, gy + 1, 2, 2, T_WHITE);
      paint(map, gx + 4, gy + 1, 2, 2, T_WHITE);
      paint(map, gx + 7, gy + 1, 2, 2, T_WHITE);
      paint(map, gx + 1, gy + 4, 2, 2, T_WHITE);
      paint(map, gx + 4, gy + 4, 2, 2, T_WHITE);
      paint(map, gx + 7, gy + 4, 2, 2, T_WHITE);
    }

    const tardisMap = new Map();
    // фонарь на крыше
    paint(tardisMap, 17, 0, 6, 3, T_DARK);
    paint(tardisMap, 18, 1, 4, 1, T_GLOW);
    paint(tardisMap, 15, 3, 10, 1, T_DARK);
    // вывеска "POLICE BOX" (текст рисуется отдельно поверх)
    paint(tardisMap, 8, 4, 24, 5, T_DARK);
    // корпус будки
    paint(tardisMap, 8, 9, 24, 54, T_DARK);
    paint(tardisMap, 9, 10, 22, 52, T_BLUE);
    // центральная перегородка между дверьми + ручка
    paint(tardisMap, 19, 10, 2, 52, T_DARK);
    paint(tardisMap, 19, 30, 2, 3, T_GREY);
    // окна (левая и правая дверь)
    paintWindow6(tardisMap, 9, 11);
    paintWindow6(tardisMap, 21, 11);
    // доска объявлений слева — белая панель с сеткой
    paint(tardisMap, 10, 19, 8, 8, T_DARK);
    paint(tardisMap, 11, 20, 6, 6, T_WHITE);
    paint(tardisMap, 14, 20, 1, 6, T_LIGHT_GREY);
    paint(tardisMap, 11, 23, 6, 1, T_LIGHT_GREY);
    // синяя панель справа с крестом
    paint(tardisMap, 25, 20, 2, 6, T_WHITE);
    paint(tardisMap, 23, 22, 6, 2, T_WHITE);
    // нижние панели — левая дверь
    paint(tardisMap, 10, 30, 8, 13, T_DARK);
    paint(tardisMap, 11, 31, 6, 11, T_BLUE);
    paint(tardisMap, 10, 45, 8, 13, T_DARK);
    paint(tardisMap, 11, 46, 6, 11, T_BLUE);
    // нижние панели — правая дверь
    paint(tardisMap, 22, 30, 8, 13, T_DARK);
    paint(tardisMap, 23, 31, 6, 11, T_BLUE);
    paint(tardisMap, 22, 45, 8, 13, T_DARK);
    paint(tardisMap, 23, 46, 6, 11, T_BLUE);
    // цоколь
    paint(tardisMap, 7, 63, 26, 2, T_DARK);

    const tardisCells = [];
    for (const [key, color] of tardisMap) {
      const [gx, gy] = key.split(',').map(Number);
      tardisCells.push({ gx, gy, color });
    }

    const gridW = 40, gridH = 66;
    const pixelSize = Math.max(4, Math.min(8, Math.floor(h / (gridH * 1.35))));
    const originX = w / 2 - (gridW * pixelSize) / 2;
    const originY = h / 2 - (gridH * pixelSize) / 2;

    const total = 4200;
    const inEnd = 550;
    const fadeStart = 3300;

    let startTime = null;

    function animate(ts) {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      ctx.clearRect(0, 0, w, h);

      const inT = clamp01(elapsed / inEnd);
      const scale = elapsed < inEnd ? 0.6 + 0.4 * easeOutBack(inT) : 1;
      const alphaIn = easeOutCubic(clamp01(elapsed / 300));
      const alphaOut = elapsed > fadeStart ? clamp01(1 - (elapsed - fadeStart) / (total - fadeStart)) : 1;
      const alpha = Math.min(alphaIn, alphaOut);

      const centerX = w / 2, centerY = h / 2;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(centerX, centerY);
      ctx.scale(scale, scale);
      ctx.translate(-centerX, -centerY);

      for (const c of tardisCells) {
        const x = originX + c.gx * pixelSize;
        const y = originY + c.gy * pixelSize;
        ctx.fillStyle = c.color;
        ctx.fillRect(x, y, pixelSize + 0.5, pixelSize + 0.5);
      }

      // мягкое пульсирующее свечение фонаря
      const glowPulse = 0.5 + 0.5 * Math.sin(elapsed / 260);
      ctx.save();
      ctx.globalAlpha = alpha * 0.5 * glowPulse;
      const glowX = originX + 20 * pixelSize, glowY = originY + 1.5 * pixelSize;
      const g = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, pixelSize * 6);
      g.addColorStop(0, 'rgba(244,230,168,0.9)');
      g.addColorStop(1, 'rgba(244,230,168,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(glowX, glowY, pixelSize * 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // текст на вывеске
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = T_WHITE;
      ctx.font = `bold ${Math.round(pixelSize * 2.6)}px Arial, sans-serif`;
      const signCenterX = originX + (8 + 24 / 2) * pixelSize;
      const signCenterY = originY + (4 + 5 / 2) * pixelSize;
      ctx.fillText('POLICE BOX', signCenterX, signCenterY + 1);

      ctx.restore();

      if (elapsed < total) {
        requestAnimationFrame(animate);
      } else {
        canvas.remove();
      }
    }

    requestAnimationFrame(animate);
  });

  // Гарри Поттер lumos/nox
  let lumosActive = false;
  addEasterEgg('lumos', 'LUMOS', () => {
    if (lumosActive) return;
    lumosActive = true;
    ctx.save();
    ctx.fillStyle = 'rgba(255,215,0,0.3)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
  });
  addEasterEgg('nox', 'NOX', () => {
    if (!lumosActive) return;
    lumosActive = false;
    ctx.restore();
    safeRedraw();
    showMessage('Nox!', '#aaa');
  });

  // Шляпа Хайзенберга
  addEasterEgg('heisenberg', 'HEISENBERG', () => {
    const hat = document.createElement('div');
    hat.className = 'heisenberg-hat';
    hat.innerHTML = `<div class="hat-crown"><div class="hat-band"></div></div><div class="hat-brim"></div>`;
    hat.style.cssText = 'position:fixed; top:40%; left:50%; transform:translate(-50%, -50%); z-index:1000;';
    document.body.appendChild(hat);
    setTimeout(() => hat.remove(), 5000);
  });

  // Supernatural
  addEasterEgg('impala', 'SUPERNATURAL', () => {
    const pentagram = document.createElement('div');
    pentagram.className = 'pentagram';
    pentagram.innerHTML = `
      <div class="blue-flame"></div>
      <svg viewBox="0 0 200 200">
        <defs>
          <clipPath id="circle">
            <circle cx="100" cy="100" r="90"/>
          </clipPath>
        </defs>
        <circle cx="100" cy="100" r="90" fill="none" stroke="#ffd700" stroke-width="3"/>
        <polygon points="100,10 120,80 190,80 130,125 150,195 100,155 50,195 70,125 10,80 80,80"
                 fill="none" stroke="#ffd700" stroke-width="4" clip-path="url(#circle)"/>
      </svg>
      <div class="pentagram-text">SUPERNATURAL</div>
    `;
    document.body.appendChild(pentagram);
    setTimeout(() => pentagram.remove(), 4000);
  });

  


// ================= БАНКАЙ (Сенбонзакура) =================
addEasterEgg('bankai', 'BANKAI', function() {
  // --- Меч ---
  const sword = document.createElement('div');
  sword.style.cssText = `
    position: fixed; top: 50%; left: 50%;
    width: 80px; height: 80vh; max-height: 700px;
    transform: translate(-50%, -50%);
    z-index: 300000; pointer-events: none;
    display: flex; flex-direction: column; align-items: center;
  `;
  document.body.appendChild(sword);

  // Клинок
  const blade = document.createElement('div');
  blade.style.cssText = `
    width: 12px; height: 80%;
    background: linear-gradient(135deg, #e0e0e0 0%, #ffffff 30%, #b0b0b0 100%);
    border-radius: 2px 2px 0 0;
    box-shadow: 0 0 20px rgba(255,200,200,0.8);
  `;
  sword.appendChild(blade);

  // Гарда
  const guard = document.createElement('div');
  guard.style.cssText = `
    width: 50px; height: 10px;
    background: #444;
    border-radius: 3px;
    box-shadow: 0 0 10px rgba(0,0,0,0.5);
  `;
  sword.appendChild(guard);

  // Рукоять
  const handle = document.createElement('div');
  handle.style.cssText = `
    width: 16px; height: 15%;
    background: #1a1a2e;
    border-radius: 0 0 4px 4px;
    box-shadow: inset 0 0 10px #000;
  `;
  sword.appendChild(handle);

  // Через 1 секунду меч исчезает и появляются лепестки
  setTimeout(() => {
    sword.remove();

    const petals = [];
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    for (let i = 0; i < 200; i++) {
      const petal = document.createElement('div');
      const size = 6 + Math.random() * 10;
      petal.style.cssText = `
        position: fixed;
        left: ${centerX - size/2}px;
        top: ${centerY - size/2}px;
        width: ${size}px;
        height: ${size}px;
        background: #ffb6c1;
        border-radius: 50% 0 50% 50%;
        z-index: 299999;
        pointer-events: none;
        opacity: 1;
        transition: all 4s ease-out;
      `;
      document.body.appendChild(petal);

      const targetX = centerX + (Math.random() - 0.5) * window.innerWidth * 1.5;
      const targetY = centerY + (Math.random() - 0.5) * window.innerHeight * 1.5;
      const targetRotate = Math.random() * 720 - 360;

      setTimeout(() => {
        petal.style.left = (targetX - size/2) + 'px';
        petal.style.top = (targetY - size/2) + 'px';
        petal.style.transform = `rotate(${targetRotate}deg)`;
        petal.style.opacity = '0';
      }, 50);

      setTimeout(() => petal.remove(), 4500);
    }
  }, 1000);
});

// ================= НАЗАД В БУДУЩЕЕ: ЧАСЫ НА БАШНЕ (дверь вплотную к порогу) =================
addEasterEgg('backtothefuture', 'BACKTOTHEFUTURE', function() {
  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.cssText = 'position:fixed;top:0;left:0;z-index:300000;pointer-events:none;background:transparent;';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const centerX = canvas.width / 2, centerY = canvas.height / 2;
  let startTime = null;
  const totalDuration = 5000;

  const buildingWidth = 480;
  const mainBodyHeight = 250;
  const roofHeight = 180;
  const columnHeight = 200;
  const columnRadius = 16;
  const columnBaseWidth = 26;
  const columnGap = 100;
  const columnsX = [
    centerX - columnGap * 1.5,
    centerX - columnGap * 0.5,
    centerX + columnGap * 0.5,
    centerX + columnGap * 1.5
  ];

  const columnTopY = centerY - mainBodyHeight / 2 + 30;
  const columnBottomY = columnTopY + columnHeight;
  const facadeTopY = columnBottomY - columnHeight - 6;
  const facadeBottomY = columnBottomY + 6;

  // Дверь: низ примыкает к верхней ступени порога
  const doorHeight = 80;
  const startStepY = columnBottomY + 2; // верхняя ступень порога
  const doorY = startStepY - doorHeight; // дверь над ступенью

  const clockCenterX = centerX;
  const clockCenterY = centerY - mainBodyHeight / 2 - roofHeight * 0.35;
  const clockRadius = 65;

  function drawColumn(x, topY, bottomY) {
    const shaftRadius = columnRadius;
    const baseWidth = columnBaseWidth;
    const baseHeight = 14, capitalHeight = 16;

    // База
    ctx.fillStyle = '#d4c5a9';
    ctx.fillRect(x - baseWidth/2, bottomY - baseHeight, baseWidth, baseHeight);
    ctx.strokeStyle = '#b0a090'; ctx.lineWidth = 2;
    ctx.strokeRect(x - baseWidth/2, bottomY - baseHeight, baseWidth, baseHeight);

    // Ствол
    ctx.fillStyle = '#e6dcc8';
    ctx.beginPath();
    ctx.moveTo(x - shaftRadius, topY);
    ctx.lineTo(x - shaftRadius, bottomY - baseHeight);
    ctx.arcTo(x - shaftRadius, bottomY - baseHeight + shaftRadius, x, bottomY - baseHeight + shaftRadius, shaftRadius);
    ctx.arcTo(x + shaftRadius, bottomY - baseHeight + shaftRadius, x + shaftRadius, bottomY - baseHeight, shaftRadius);
    ctx.lineTo(x + shaftRadius, topY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#b0a090'; ctx.lineWidth = 1.5; ctx.stroke();

    // Капитель
    ctx.fillStyle = '#d4c5a9';
    ctx.fillRect(x - baseWidth/2, topY - capitalHeight, baseWidth, capitalHeight);
    ctx.strokeRect(x - baseWidth/2, topY - capitalHeight, baseWidth, capitalHeight);
    ctx.fillStyle = '#b0a090';
    ctx.beginPath(); ctx.arc(x - baseWidth/2 + 6, topY - capitalHeight/2, 5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + baseWidth/2 - 6, topY - capitalHeight/2, 5, 0, Math.PI*2); ctx.fill();
  }

  function drawRoof() {
    const roofBaseY = columnTopY - 8;
    ctx.fillStyle = '#6b5b4f';
    ctx.beginPath();
    ctx.moveTo(centerX - buildingWidth/2 - 15, roofBaseY);
    ctx.lineTo(centerX, roofBaseY - roofHeight);
    ctx.lineTo(centerX + buildingWidth/2 + 15, roofBaseY);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#3e362c'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#5d4e3d';
    ctx.fillRect(centerX - buildingWidth/2 - 25, roofBaseY - 8, buildingWidth + 50, 15);
  }

  function drawHorizontalBands() {
    const y1 = columnTopY, y2 = columnTopY + 12, y3 = columnTopY + 24;
    ctx.fillStyle = '#8b7d6b';
    ctx.fillRect(centerX - buildingWidth/2, y1, buildingWidth, 8);
    ctx.fillRect(centerX - buildingWidth/2, y2, buildingWidth, 6);
    ctx.fillRect(centerX - buildingWidth/2, y3, buildingWidth, 6);
  }

  function drawVerticalWindow(x, y, w = 30, h = 60) {
    ctx.fillStyle = '#aed6f1'; ctx.fillRect(x - w/2, y, w, h);
    ctx.strokeStyle = '#5d4e3d'; ctx.lineWidth = 3; ctx.strokeRect(x - w/2, y, w, h);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h);
    ctx.moveTo(x - w/2, y + h/2); ctx.lineTo(x + w/2, y + h/2); ctx.stroke();
  }

  function drawDoor(x, y) {
    ctx.fillStyle = '#5b2c22'; ctx.fillRect(x - 20, y, 40, 80);
    ctx.strokeStyle = '#3e362c'; ctx.lineWidth = 3; ctx.strokeRect(x - 20, y, 40, 80);
    ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(x + 12, y + 40, 5, 0, Math.PI*2); ctx.fill();
  }

  function drawClockFace() {
    ctx.beginPath(); ctx.arc(clockCenterX, clockCenterY, clockRadius, 0, Math.PI*2);
    ctx.fillStyle = '#f5f0e6'; ctx.fill();
    ctx.strokeStyle = '#4a3c2c'; ctx.lineWidth = 6; ctx.stroke();
    ctx.beginPath(); ctx.arc(clockCenterX, clockCenterY, clockRadius - 8, 0, Math.PI*2);
    ctx.strokeStyle = '#b0a090'; ctx.lineWidth = 2; ctx.stroke();
    const numerals = ['XII','III','VI','IX'];
    const angles = [-Math.PI/2, 0, Math.PI/2, Math.PI];
    ctx.font = 'bold 16px "Times New Roman", serif';
    ctx.fillStyle = '#1a1a1a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let i=0; i<4; i++) {
      const x = clockCenterX + Math.cos(angles[i])*(clockRadius-18);
      const y = clockCenterY + Math.sin(angles[i])*(clockRadius-18);
      ctx.fillText(numerals[i], x, y);
    }
    for (let i=0; i<12; i++) {
      if (i%3===0) continue;
      const angle = (i*30 - 90)*Math.PI/180;
      const dx = clockCenterX + Math.cos(angle)*(clockRadius-14);
      const dy = clockCenterY + Math.sin(angle)*(clockRadius-14);
      ctx.beginPath(); ctx.arc(dx, dy, 3, 0, Math.PI*2); ctx.fillStyle = '#333'; ctx.fill();
    }
  }

  function drawHands(hourAngle, minuteAngle) {
    ctx.save(); ctx.translate(clockCenterX, clockCenterY); ctx.rotate(hourAngle);
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(-3, -clockRadius*0.45, 6, clockRadius*0.45); ctx.restore();
    ctx.save(); ctx.translate(clockCenterX, clockCenterY); ctx.rotate(minuteAngle);
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(-2, -clockRadius*0.65, 4, clockRadius*0.65); ctx.restore();
    ctx.beginPath(); ctx.arc(clockCenterX, clockCenterY, 5, 0, Math.PI*2); ctx.fillStyle = '#b22222'; ctx.fill();
  }

  function drawLightning(progress) {
    if (progress<=0) return;
    const alpha = Math.sin(progress*Math.PI)*0.9;
    ctx.save(); ctx.globalAlpha = alpha;
    const startX = centerX - 150 + Math.random()*50;
    const startY = columnTopY - roofHeight - 20;
    const endX = clockCenterX + (Math.random()-0.5)*20;
    const endY = clockCenterY - clockRadius + 10;
    ctx.strokeStyle = '#ffff80'; ctx.lineWidth = 4; ctx.shadowColor = '#ffff00'; ctx.shadowBlur = 15;
    let x=startX, y=startY;
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let i=1; i<=12; i++) {
      const t = i/12;
      const tx = startX + (endX-startX)*t;
      const ty = startY + (endY-startY)*t;
      x = tx + (Math.random()-0.5)*40*(1-t);
      y = ty + (Math.random()-0.5)*30*(1-t);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(endX, endY); ctx.stroke();
    for (let j=0; j<4; j++) {
      ctx.beginPath();
      const bx = startX + (endX-startX)*(0.3+Math.random()*0.5);
      const by = startY + (endY-startY)*(0.3+Math.random()*0.3);
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + (Math.random()-0.5)*60, by + (Math.random()-0.2)*80);
      ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.restore();
  }

  function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / totalDuration, 1);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Фасад
    ctx.fillStyle = '#8b7d6b';
    ctx.fillRect(centerX - buildingWidth/2, facadeTopY, buildingWidth, facadeBottomY - facadeTopY);
    ctx.strokeStyle = '#5d4e3d'; ctx.lineWidth = 2;
    ctx.strokeRect(centerX - buildingWidth/2, facadeTopY, buildingWidth, facadeBottomY - facadeTopY);

    // Окна (подняты выше)
    const windowW = 30, windowH = 60;
    const windowY = columnTopY + 30;
    const sec1X = columnsX[0] + (columnsX[1]-columnsX[0])/2;
    drawVerticalWindow(sec1X, windowY, windowW, windowH);
    const secCenterX = columnsX[1] + (columnsX[2]-columnsX[1])/2;
    drawVerticalWindow(secCenterX, windowY, windowW, 50);
    const sec2X = columnsX[2] + (columnsX[3]-columnsX[2])/2;
    drawVerticalWindow(sec2X, windowY, windowW, windowH);

    const buildingLeft = centerX - buildingWidth/2;
    const buildingRight = centerX + buildingWidth/2;
    drawVerticalWindow((buildingLeft + columnsX[0]) / 2, windowY, windowW, windowH);
    drawVerticalWindow((columnsX[3] + buildingRight) / 2, windowY, windowW, windowH);

    drawHorizontalBands();
    drawRoof();
    drawClockFace();

    // Ступени порога (начинаются от стволов колонн, расширяются книзу)
    const leftEdge = columnsX[0] - columnRadius;
    const rightEdge = columnsX[3] + columnRadius;
    const baseWidth = rightEdge - leftEdge;
    const steps = 3;
    const stepHeight = 8;
    const widths = [baseWidth, baseWidth + 20, baseWidth + 40];

    for (let i = 0; i < steps; i++) {
      const w = widths[i];
      const x = (leftEdge + rightEdge) / 2 - w / 2;
      const y = startStepY + i * stepHeight;
      ctx.fillStyle = '#bdc3c7';
      ctx.fillRect(x, y, w, stepHeight);
      ctx.strokeStyle = '#7f8c8d'; ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, stepHeight);
    }

    // Дверь (низ примыкает к верхней ступени)
    drawDoor(secCenterX, doorY);

    // Колонны (передний план)
    columnsX.forEach(x => drawColumn(x, columnTopY, columnBottomY));

    // Стрелки часов
    let hourAngle, minuteAngle;
    if (progress < 0.4) {
      const rot = progress * 360 * 5;
      hourAngle = (rot - 90) * Math.PI / 180;
      minuteAngle = (rot * 12 - 90) * Math.PI / 180;
    } else if (progress < 0.7) {
      const t = (progress - 0.4) / 0.3;
      hourAngle = (360*5 - 90 + (-60 - (360*5 - 90)) * t) * Math.PI / 180;
      minuteAngle = (360*5*12 - 90 + (24 - (360*5*12 - 90)) * t) * Math.PI / 180;
    } else {
      hourAngle = (-60) * Math.PI / 180;
      minuteAngle = 24 * Math.PI / 180;
    }
    drawHands(hourAngle, minuteAngle);

    // Молния
    if (progress > 0.7 && progress < 0.9) {
      drawLightning((progress - 0.7) / 0.2);
    } else if (progress >= 0.9) {
      canvas.style.opacity = 1 - (progress - 0.9) / 0.1;
    }

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  }

  requestAnimationFrame(animate);
});

  
  

  
// ================= СОНИК: ЗОЛОТОЕ КОЛЬЦО (вращение слева направо) =================
addEasterEgg('sonic', 'SONIC', function() {
  const size = 200;
  // Контейнер с перспективой для 3D-эффекта
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    top: 50%; left: 50%;
    width: 0; height: 0;
    perspective: 600px;
    z-index: 300000;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.5s;
  `;
  document.body.appendChild(container);

  // Само кольцо
  const ring = document.createElement('div');
  ring.style.cssText = `
    position: absolute;
    top: 50%; left: 50%;
    width: ${size}px;
    height: ${size}px;
    margin: -${size/2}px 0 0 -${size/2}px;
    border: 30px solid #ffd700;
    border-radius: 50%;
    box-shadow: 0 0 0 4px #b8860b, inset 0 0 10px rgba(0,0,0,0.5);
    background: radial-gradient(circle at 40% 40%, rgba(255,255,255,0.5) 0%, transparent 70%);
    animation: sonicSpin 2s linear infinite;
  `;
  container.appendChild(ring);

  // Анимация вращения вокруг вертикальной оси
  const style = document.createElement('style');
  style.textContent = '@keyframes sonicSpin { 0% { transform: rotateY(0deg); } 100% { transform: rotateY(360deg); } }';
  document.head.appendChild(style);

  // Появление
  requestAnimationFrame(() => { container.style.opacity = '1'; });

  // Исчезновение через 4 секунды
  setTimeout(() => {
    container.style.opacity = '0';
    setTimeout(() => {
      container.remove();
      style.remove();
    }, 500);
  }, 4000);
});



  // ================= БЭТМЕН: ЖИЖА И НАДПИСЬ =================
addEasterEgg('batman', 'BATMAN', function() {
  // Затемнённый фон
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.85);
    z-index: 300000; pointer-events: none;
    opacity: 0; transition: opacity 0.8s ease;
  `;
  document.body.appendChild(overlay);

  // CSS-анимации
  const style = document.createElement('style');
  style.textContent = `
    @keyframes batWings {
      0%, 100% { transform: rotate(-5deg) scale(1); }
      50% { transform: rotate(5deg) scale(1.1); }
    }
    .flying-bat {
      animation: batWings 0.2s ease-in-out infinite alternate;
    }
    @keyframes gooExpand {
      0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
      60% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.8; }
      100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }
    @keyframes titleReveal {
      0% { transform: translate(-50%, -50%) scaleY(0); opacity: 0; }
      100% { transform: translate(-50%, -50%) scaleY(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  // Генерация точек для контура букв
  const fontSize = Math.min(80, window.innerWidth / 6);
  const canvasWidth = 600, canvasHeight = 200;
  const textCanvas = document.createElement('canvas');
  textCanvas.width = canvasWidth;
  textCanvas.height = canvasHeight;
  const tctx = textCanvas.getContext('2d');
  tctx.fillStyle = '#ffffff';
  tctx.font = `bold ${fontSize}px "Arial Black", sans-serif`;
  tctx.textAlign = 'center';
  tctx.textBaseline = 'middle';
  tctx.fillText('BATMAN', canvasWidth/2, canvasHeight/2);

  const imageData = tctx.getImageData(0, 0, canvasWidth, canvasHeight).data;
  const points = [];
  const step = 4;
  for (let y = 0; y < canvasHeight; y += step) {
    for (let x = 0; x < canvasWidth; x += step) {
      const idx = (y * canvasWidth + x) * 4;
      if (imageData[idx] > 128) {
        points.push({
          x: x - canvasWidth/2,
          y: y - canvasHeight/2
        });
      }
    }
  }

  // Выбираем до 80 мышей
  const totalBats = Math.min(points.length, 80);
  const selectedPoints = [];
  for (let i = 0; i < totalBats; i++) {
    const idx = Math.floor(Math.random() * points.length);
    selectedPoints.push(points[idx]);
    points.splice(idx, 1);
  }

  const bats = [];
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  selectedPoints.forEach((point) => {
    const bat = document.createElement('div');
    bat.textContent = '🦇';
    bat.className = 'flying-bat';
    bat.style.cssText = `
      position: fixed;
      font-size: 22px;
      z-index: 300001;
      pointer-events: none;
      transform: translate(-50%, -50%);
    `;

    // Случайная стартовая позиция с одной из сторон экрана
    let startX, startY;
    const side = Math.floor(Math.random() * 4);
    switch(side) {
      case 0: startX = Math.random() * window.innerWidth; startY = -100; break;
      case 1: startX = window.innerWidth + 100; startY = Math.random() * window.innerHeight; break;
      case 2: startX = Math.random() * window.innerWidth; startY = window.innerHeight + 100; break;
      case 3: startX = -100; startY = Math.random() * window.innerHeight; break;
    }

    bat.dataset.startX = startX;
    bat.dataset.startY = startY;
    bat.dataset.endX = centerX + point.x;
    bat.dataset.endY = centerY + point.y;
    bat.dataset.midX = Math.random() * window.innerWidth;
    bat.dataset.midY = Math.random() * window.innerHeight;
    bat.dataset.t = 0;
    bat.dataset.speed = 0.01 + Math.random() * 0.015;
    bat.dataset.delay = Math.random() * 1.2;

    bat.style.left = startX + 'px';
    bat.style.top = startY + 'px';
    overlay.appendChild(bat);
    bats.push(bat);
  });

  let startTime = null;
  let settled = false;

  function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = (timestamp - startTime) / 1000;

    let allSettled = true;
    bats.forEach(bat => {
      if (bat.dataset.arrived === 'true') return;

      const delay = parseFloat(bat.dataset.delay);
      if (elapsed < delay) { allSettled = false; return; }

      const t = Math.min(parseFloat(bat.dataset.t), 1);
      if (t >= 1) {
        bat.style.opacity = '0';
        bat.dataset.arrived = 'true';
        return;
      }

      const startX = parseFloat(bat.dataset.startX);
      const startY = parseFloat(bat.dataset.startY);
      const midX = parseFloat(bat.dataset.midX);
      const midY = parseFloat(bat.dataset.midY);
      const endX = parseFloat(bat.dataset.endX);
      const endY = parseFloat(bat.dataset.endY);

      const invT = 1 - t;
      const x = invT * invT * startX + 2 * invT * t * midX + t * t * endX;
      const y = invT * invT * startY + 2 * invT * t * midY + t * t * endY;

      bat.style.left = x + 'px';
      bat.style.top = y + 'px';

      const newT = t + parseFloat(bat.dataset.speed);
      bat.dataset.t = Math.min(newT, 1);
      if (newT < 1) allSettled = false;
      else bat.dataset.arrived = 'true';
    });

    if (allSettled && !settled) {
      settled = true;
      // Все мыши собрались – создаём жижу
      const goo = document.createElement('div');
      goo.style.cssText = `
        position: absolute;
        top: 50%; left: 50%;
        width: ${fontSize * 5.5}px;
        height: ${fontSize * 1.5}px;
        background: radial-gradient(ellipse at center, #1a1a1a 0%, #000 100%);
        border-radius: 50%;
        transform: translate(-50%, -50%) scale(0);
        opacity: 0;
        z-index: 300002;
        animation: gooExpand 0.6s ease-out forwards;
        box-shadow: 0 0 30px rgba(0,0,0,0.5);
      `;
      overlay.appendChild(goo);

      // Через 0.8 секунды после появления жижи показываем надпись
      setTimeout(() => {
        // Удаляем мышей окончательно
        bats.forEach(b => b.remove());

        const title = document.createElement('div');
        title.textContent = 'BATMAN';
        title.style.cssText = `
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%) scaleY(0);
          font-family: 'Arial Black', sans-serif;
          font-size: ${fontSize}px;
          color: #0a0a0a;
          text-shadow: 0 0 20px #ffd700, 0 0 40px #ffaa00;
          letter-spacing: 4px;
          z-index: 300003;
          animation: titleReveal 0.5s ease-out forwards;
          white-space: nowrap;
        `;
        overlay.appendChild(title);

        // Исчезновение всей сцены через 2.5 секунды после появления надписи
        setTimeout(() => {
          overlay.style.opacity = '0';
          setTimeout(() => {
            overlay.remove();
            style.remove();
          }, 800);
        }, 2500);
      }, 800);
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    requestAnimationFrame(animate);
  });
});

       
// ================= СКОРПИОН: ЦЕПЬ С КУНАЕМ (финальная версия) =================
addEasterEgg('scorpion', 'SCORPION', function() {
  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.cssText = `
    position: fixed; top: 0; left: 0;
    z-index: 300000; pointer-events: none;
  `;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  let startTime = null;
  const duration = 4000; // 4 секунды

  const originalTransform = document.body.style.transform || '';
  const originalTransition = document.body.style.transition || '';

  // Кунай (остриём влево)
  function drawKunai(x, y, angle, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Лезвие
    ctx.fillStyle = '#888';
    ctx.beginPath();
    ctx.moveTo(-45, 0);
    ctx.lineTo(15, -12);
    ctx.lineTo(15, 12);
    ctx.closePath();
    ctx.fill();

    // Блик
    ctx.fillStyle = '#ccc';
    ctx.beginPath();
    ctx.moveTo(-35, 0);
    ctx.lineTo(8, -7);
    ctx.lineTo(8, 7);
    ctx.closePath();
    ctx.fill();

    // Кольцо
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(35, 0, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(35, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Цепь
  function drawChain(startX, startY, endX, endY, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);

    ctx.translate(startX, startY);
    ctx.rotate(angle);

    // Трос
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(distance, 0);
    ctx.stroke();

    
   
// Звенья
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 6;
    for (let i = 0; i < distance; i += 25) {
      ctx.beginPath();
      ctx.arc(i, 0, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(i + 12, 0, 7, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const kunaiStartX = window.innerWidth + 100;
    const kunaiStartY = centerY;
    const kunaiEndX = centerX;
    const kunaiEndY = centerY;

    // Этап 1: кунай летит (0–0.15)
    if (progress <= 0.15) {
      const t = progress / 0.15;
      const x = kunaiStartX + (kunaiEndX - kunaiStartX) * t;
      const y = kunaiStartY + (kunaiEndY - kunaiStartY) * t;
      drawChain(kunaiStartX, kunaiStartY, x, y);
      drawKunai(x, y, 0);
    }
    // Этап 2: кунай зацепился, сайт едет вправо (0.15–0.5)
    else if (progress <= 0.5) {
      const t = (progress - 0.15) / 0.35;
      const pullDistance = t * 300;
      document.body.style.transform = `translateX(${pullDistance}px)`;
      document.body.style.transition = 'none';
      const currentX = centerX + pullDistance;
      drawChain(kunaiStartX, centerY, currentX, centerY);
      drawKunai(currentX, centerY, 0);
    }
    // Этап 3: кунай и цепь исчезают, сайт возвращается (0.5–1.0)
    else {
      const t = (progress - 0.5) / 0.5;
      // Кунай и цепь затухают в первой половине этого этапа (t=0..0.3)
      const fadeAlpha = t < 0.3 ? 1 - (t / 0.3) : 0;
      // Сайт возвращается плавно на протяжении всего этапа
      const returnDistance = 300 * (1 - t);
      document.body.style.transform = `translateX(${returnDistance}px)`;
      document.body.style.transition = 'none';

      if (fadeAlpha > 0) {
        const currentX = centerX + returnDistance;
        drawChain(kunaiStartX, centerY, currentX, centerY, fadeAlpha);
        drawKunai(currentX, centerY, 0, fadeAlpha);
      }

      // Когда возврат завершён, восстанавливаем body
      if (returnDistance < 1) {
        document.body.style.transform = originalTransform;
        document.body.style.transition = originalTransition;
      }
    }

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      document.body.style.transform = originalTransform;
      document.body.style.transition = originalTransition;
      canvas.remove();
    }
  }

  requestAnimationFrame(animate);
});


// ================= ВВЕРХ: ДОМ НА ШАРАХ (труба исправлена окончательно) =================
addEasterEgg('up', 'UP', function() {
  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.cssText = `
    position: fixed; top: 0; left: 0;
    z-index: 300000; pointer-events: none;
  `;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // Параметры анимации
  const centerX = canvas.width / 2;
  let startY = canvas.height + 300; // старт за нижней границей
  const endY = -600; // финиш за верхней границей
  let currentY = startY;
  const speed = 80; // пикселей в секунду
  let startTime = null;
  const swayAmplitude = 20; // амплитуда покачивания

  // Генерация связки шаров (позиции относительно центра связки)
  const balloonColors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#ff69b4'];
  const balloons = [];
  const balloonCount = 45;
  const clusterWidth = 180;
  const clusterHeight = 160;
  for (let i = 0; i < balloonCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * (clusterWidth / 2);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * 0.6 - clusterHeight * 0.4; // смещаем вверх
    balloons.push({
      offsetX: x,
      offsetY: y,
      radius: 16 + Math.random() * 10,
      color: balloonColors[Math.floor(Math.random() * balloonColors.length)]
    });
  }

  // Рисование дома
  function drawHouse(x, y, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Тень
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;

    // Основание дома
    const w = 140, h = 120;
    ctx.fillStyle = '#f4d03f';
    ctx.fillRect(-w/2, -h/2, w, h);
    // Деревянная обшивка (полосы)
    ctx.fillStyle = '#e67e22';
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(-w/2, -h/2 + i * 25, w, 4);
    }

    // Крыша (треугольник)
    ctx.fillStyle = '#7b241c';
    ctx.beginPath();
    ctx.moveTo(-w/2 - 10, -h/2);
    ctx.lineTo(0, -h/2 - 80);
    ctx.lineTo(w/2 + 10, -h/2);
    ctx.closePath();
    ctx.fill();
    // Козырёк крыши (полоска)
    ctx.fillStyle = '#5b2c22';
    ctx.fillRect(-w/2 - 10, -h/2 - 10, w + 20, 15);

    // Труба (исправлено: основание заходит на крышу с обеих сторон, труба короче)
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#888';
    // Основание трубы (трапеция, заходящая на крышу)
    const tubeBaseY = -h/2 - 30; // верхний край основания (ближе к крыше)
    const tubeBaseWidth = 40;    // ширина у основания
    const tubeTopWidth = 30;     // ширина наверху
    const tubeHeight = 40;       // высота трубы
    ctx.beginPath();
    ctx.moveTo(w/4 - tubeBaseWidth/2, tubeBaseY);          // левый верх
    ctx.lineTo(w/4 + tubeBaseWidth/2, tubeBaseY);          // правый верх
    ctx.lineTo(w/4 + tubeTopWidth/2, tubeBaseY - tubeHeight); // правый низ трубы
    ctx.lineTo(w/4 - tubeTopWidth/2, tubeBaseY - tubeHeight); // левый низ трубы
    ctx.closePath();
    ctx.fill();
    // "Шапка" трубы
    ctx.fillStyle = '#666';
    ctx.fillRect(w/4 - tubeTopWidth/2 - 4, tubeBaseY - tubeHeight - 10, tubeTopWidth + 8, 12);
    ctx.restore();

    // Дверь
    ctx.fillStyle = '#5b2c22';
    ctx.fillRect(-20, h/2 - 70, 40, 70);
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(12, h/2 - 35, 5, 0, Math.PI * 2);
    ctx.fill();



// Окна
    function drawWindow(wx, wy) {
      ctx.fillStyle = '#aed6f1';
      ctx.fillRect(wx, wy, 35, 35);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 4;
      ctx.strokeRect(wx, wy, 35, 35);
      ctx.beginPath();
      ctx.moveTo(wx + 17, wy);
      ctx.lineTo(wx + 17, wy + 35);
      ctx.moveTo(wx, wy + 17);
      ctx.lineTo(wx + 35, wy + 17);
      ctx.stroke();
    }
    drawWindow(-60, -10);
    drawWindow(25, -10);

    // Крыльцо
    ctx.fillStyle = '#bdc3c7';
    ctx.fillRect(-35, h/2, 70, 15);
    ctx.fillStyle = '#95a5a6';
    ctx.fillRect(-25, h/2 + 10, 10, 20);
    ctx.fillRect(15, h/2 + 10, 10, 20);

    ctx.restore();
  }

  // Рисование нитей от шаров к точке крепления на доме
  function drawStrings(houseX, houseY, clusterX, clusterY) {
    ctx.save();
    ctx.strokeStyle = '#ecf0f1';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 2;
    // Точка крепления на крыше
    const anchorX = houseX;
    const anchorY = houseY - 140;
    balloons.forEach(b => {
      ctx.beginPath();
      ctx.moveTo(anchorX, anchorY);
      ctx.lineTo(clusterX + b.offsetX, clusterY + b.offsetY);
      ctx.stroke();
    });
    ctx.restore();
  }

  // Рисование связки шаров
  function drawBalloons(clusterX, clusterY) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 6;
    balloons.forEach(b => {
      const bx = clusterX + b.offsetX;
      const by = clusterY + b.offsetY;
      // Основной шар
      const grad = ctx.createRadialGradient(bx - 2, by - 2, b.radius * 0.1, bx, by, b.radius);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, b.color);
      grad.addColorStop(1, '#333');
      ctx.beginPath();
      ctx.arc(bx, by, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      // Блик
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.arc(bx - b.radius*0.2, by - b.radius*0.25, b.radius*0.3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  // Анимация
  function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    const deltaTime = (timestamp - startTime) / 1000;
    startTime = timestamp;

    // Обновление позиции
    currentY -= speed * deltaTime;

    // Легкое покачивание по X (синусоида)
    const sway = Math.sin(timestamp * 0.003) * swayAmplitude;
    const houseX = centerX + sway;
    const houseY = currentY + 60; // центр дома
    const clusterX = centerX + sway * 0.8;
    const clusterY = currentY - 160; // связка шаров выше дома

    // Очистка и рисование
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Порядок: нити -> шары -> дом (нити за шарами)
    drawStrings(houseX, houseY, clusterX, clusterY);
    drawBalloons(clusterX, clusterY);
    drawHouse(houseX, houseY);

    // Проверка завершения
    if (currentY > endY) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  }

  requestAnimationFrame(animate);
});

  // ============================================================
  // dexter – нож режет сайт, из раны капает кровь, попадает между
  // двух предметных стёкол (как трофеи Декстера Моргана)
  // ============================================================
  addEasterEgg('dexter', 'DEXTER', function() {
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.cssText = 'position:fixed;top:0;left:0;z-index:300000;pointer-events:none;background:transparent;';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
    const clamp01 = t => Math.max(0, Math.min(1, t));

    // Линия разреза — слегка неровная, идёт по диагонали через центр сайта
    const cutLen = 340;
    const cutAngle = -18 * Math.PI / 180;
    const cutStart = { x: cx - Math.cos(cutAngle) * cutLen / 2, y: cy - Math.sin(cutAngle) * cutLen / 2 };
    const cutEnd = { x: cx + Math.cos(cutAngle) * cutLen / 2, y: cy + Math.sin(cutAngle) * cutLen / 2 };
    // Точки-неровности вдоль разреза (для "рваного" края раны)
    const jitterSeed = [];
    for (let i = 0; i <= 20; i++) jitterSeed.push((Math.random() - 0.5) * 6);

    function pointOnCut(t) {
      return { x: cutStart.x + (cutEnd.x - cutStart.x) * t, y: cutStart.y + (cutEnd.y - cutStart.y) * t };
    }

    function drawWound(revealT) {
      // revealT 0..1 — насколько далеко вдоль разреза уже раскрылась рана
      // (рана "тянется" следом за ножом, а не появляется сразу по всей длине)
      if (revealT <= 0) return;
      const steps = 20;
      const activeSteps = Math.max(1, Math.round(revealT * steps));
      const upper = [], lower = [];
      const perpX = -Math.sin(cutAngle), perpY = Math.cos(cutAngle);
      const maxGap = 8;
      for (let i = 0; i <= activeSteps; i++) {
        const t = i / steps;
        const p = pointOnCut(t);
        // у самого "хвоста" (там, где рана только что раскрылась) сводим её на нет —
        // получается заострённый, недавно прорезанный кончик
        const tipTaper = i >= activeSteps - 2 ? Math.max(0, (activeSteps - i) / 2) : 1;
        const gap = maxGap * tipTaper;
        const j = jitterSeed[i] * tipTaper;
        upper.push({ x: p.x + perpX * gap + perpX * j, y: p.y + perpY * gap + perpY * j });
        lower.push({ x: p.x - perpX * gap - perpX * j, y: p.y - perpY * gap - perpY * j });
      }
      // Тёмная глубина раны
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(upper[0].x, upper[0].y);
      for (const p of upper) ctx.lineTo(p.x, p.y);
      for (let i = lower.length - 1; i >= 0; i--) ctx.lineTo(lower[i].x, lower[i].y);
      ctx.closePath();
      const grad = ctx.createLinearGradient(cutStart.x, cutStart.y, cutEnd.x, cutEnd.y);
      grad.addColorStop(0, 'rgba(40,0,0,0.85)');
      grad.addColorStop(0.5, 'rgba(70,0,0,0.9)');
      grad.addColorStop(1, 'rgba(40,0,0,0.85)');
      ctx.fillStyle = grad;
      ctx.fill();
      // Яркие кровавые края раны
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(200,20,20,0.8)';
      ctx.beginPath();
      ctx.moveTo(upper[0].x, upper[0].y);
      for (const p of upper) ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(lower[0].x, lower[0].y);
      for (const p of lower) ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.restore();
    }

    function drawKnife(t, alpha) {
      // t: 0..1 положение вдоль разреза; нож движется точно по линии реза,
      // без смещения — рана появляется ровно там, где проходит кончик лезвия
      const p = pointOnCut(t);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(cutAngle);
      // тень
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
      // рукоять
      ctx.fillStyle = '#2b1d14';
      ctx.beginPath();
      ctx.roundRect(-58, -8, 34, 16, 4);
      ctx.fill();
      // ограничитель
      ctx.fillStyle = '#555';
      ctx.fillRect(-24, -10, 5, 20);
      // клинок с градиентом металла
      const bladeGrad = ctx.createLinearGradient(0, -9, 0, 9);
      bladeGrad.addColorStop(0, '#e8ecef');
      bladeGrad.addColorStop(0.45, '#ffffff');
      bladeGrad.addColorStop(0.55, '#aeb6bd');
      bladeGrad.addColorStop(1, '#7c848b');
      ctx.fillStyle = bladeGrad;
      ctx.beginPath();
      ctx.moveTo(-19, -7);
      ctx.lineTo(55, -2);
      ctx.lineTo(68, 0);
      ctx.lineTo(55, 3);
      ctx.lineTo(-19, 7);
      ctx.closePath();
      ctx.fill();
      // блик на лезвии
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-14, -1);
      ctx.lineTo(58, -0.5);
      ctx.stroke();
      ctx.restore();
    }

    // Капля крови, стекающая из раны
    let drop = null;
    function spawnDrop() {
      const t = 0.5 + (Math.random() - 0.5) * 0.3;
      const p = pointOnCut(t);
      drop = { x: p.x, y: p.y, vy: 0, born: null, landed: false };
    }

    // Стёкла-трофей
    const slideW = 90, slideH = 34;
    const slideCX = cx, slideCY = cy + 170;

    function drawGlassSlide(offsetY, tilt) {
      ctx.save();
      ctx.translate(slideCX, slideCY + offsetY);
      ctx.rotate(tilt);
      ctx.fillStyle = 'rgba(200,225,235,0.28)';
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-slideW / 2, -slideH / 2, slideW, slideH, 3);
      ctx.fill();
      ctx.stroke();
      // блик стекла
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.moveTo(-slideW / 2 + 8, -slideH / 2 + 5);
      ctx.lineTo(-slideW / 2 + 20, slideH / 2 - 5);
      ctx.stroke();
      ctx.restore();
    }

    function drawBloodSmear(squeeze) {
      // squeeze 0..1 — капля растекается в тонкое пятно между стёклами
      ctx.save();
      ctx.translate(slideCX, slideCY);
      const rx = 6 + squeeze * 16;
      const ry = 6 - squeeze * 3.5;
      ctx.fillStyle = '#a10f0f';
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, Math.max(2.5, ry), 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    let startTime = null;
    const total = 5000;

    function animate(ts) {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Фаза 1 (0–300): нож появляется у начала разреза
      // Фаза 2 (300–1300): нож проходит вдоль разреза
      // Фаза 3 (следует сразу за ножом, с отставанием ~120мс): рана раскрывается по мере прохода лезвия
      // Фаза 4 (1500): нижнее стекло уже лежит на месте — заранее, до падения капли
      // Фаза 5 (1900–~2600): капля крови стекает и падает на нижнее стекло
      // Фаза 6 (после приземления капли): верхнее стекло опускается и закрывает её
      // Фаза 7 (4500–5000): всё плавно растворяется

      const knifeAppear = clamp01(elapsed / 300);
      const slideProgress = clamp01((elapsed - 300) / 1000);
      const woundLag = 120; // рана раскрывается сразу вслед за ножом, не опережая его
      const woundReveal = easeInOutCubic(clamp01((elapsed - 300 - woundLag) / 1000));
      const knifeAlpha = elapsed < 1300
        ? knifeAppear
        : clamp01(1 - (elapsed - 1300) / 400);

      if (elapsed < 1700) {
        drawWound(woundReveal);
        const t = easeInOutCubic(clamp01(slideProgress));
        drawKnife(0.08 + t * 0.84, knifeAlpha);
      } else {
        drawWound(1);
      }

      // Нижнее стекло появляется заранее и уже лежит на месте к моменту падения капли
      const bottomSlideIn = easeOutCubic(clamp01((elapsed - 1500) / 500));
      if (bottomSlideIn > 0) {
        drawGlassSlide(18 + (1 - bottomSlideIn) * 20, 0.03);
      }

      if (elapsed >= 1900 && elapsed < 4600) {
        if (!drop) spawnDrop();
        if (drop && !drop.landed) {
          if (drop.born === null) drop.born = elapsed;
          const dt = (elapsed - drop.born) / 1000;
          drop.vy += 900 * dt * 0.016;
          drop.y += drop.vy * 0.9;
          const stretch = clamp01(drop.vy / 12);
          if (drop.y >= slideCY - 2) {
            drop.landed = true;
            drop.landTime = elapsed;
          } else {
            ctx.save();
            ctx.fillStyle = '#c31414';
            ctx.beginPath();
            ctx.ellipse(drop.x, drop.y, 4, 5 + stretch * 4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            ctx.ellipse(drop.x - 1.2, drop.y - 3, 1.2, 1.8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
      }

      // Капля приземлилась на нижнее стекло — теперь сверху опускается второе и закрывает её
      if (drop && drop.landed) {
        const sinceLand = elapsed - drop.landTime;
        const topDelay = 250;
        const topDur = 700;
        const topProgress = easeOutCubic(clamp01((sinceLand - topDelay) / topDur));
        drawBloodSmear(topProgress);
        if (sinceLand >= topDelay) {
          const topOffset = -18 + (1 - topProgress) * 90;
          drawGlassSlide(topOffset, -0.03);
        }
      }

      if (elapsed < total) {
        if (elapsed > total - 500) {
          canvas.style.opacity = String(clamp01((total - elapsed) / 500));
        }
        requestAnimationFrame(animate);
      } else {
        canvas.remove();
      }
    }

    requestAnimationFrame(animate);
  });

  // ============================================================
  // sharingan – один крупный глаз Шарингана в центре сайта, весь сайт
  // "плывёт" под гендзюцу, затем плавно восстанавливается
  // ============================================================
  addEasterEgg('sharingan', 'SHARINGAN', function() {
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.cssText = 'position:fixed;top:0;left:0;z-index:300000;pointer-events:none;background:transparent;';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const eyeR = Math.min(130, canvas.width * 0.16);

    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
    const easeInOutSine = t => -(Math.cos(Math.PI * t) - 1) / 2;
    const clamp01 = t => Math.max(0, Math.min(1, t));

    function drawTomoe(radius, angle) {
      // "запятая" шарингана: голова (кружок) + хвост, изогнутый к центру
      const hx = Math.cos(angle) * radius;
      const hy = Math.sin(angle) * radius;
      ctx.save();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(hx, hy, radius * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      const midAngle = angle - 0.9;
      const mx = Math.cos(midAngle) * radius * 0.55;
      const my = Math.sin(midAngle) * radius * 0.55;
      ctx.quadraticCurveTo(mx, my, 0, 0);
      ctx.quadraticCurveTo(mx * 1.15, my * 1.15, hx, hy);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function drawSharinganEye(x, y, radius, openness, tomoeAngle, glow) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1, Math.max(0.02, openness));

      // внешнее свечение
      if (glow > 0) {
        ctx.save();
        ctx.globalAlpha = glow * 0.6;
        const g = ctx.createRadialGradient(0, 0, radius * 0.3, 0, 0, radius * 1.8);
        g.addColorStop(0, 'rgba(200,0,0,0.55)');
        g.addColorStop(1, 'rgba(200,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // чёрное веко/обводка
      ctx.fillStyle = '#0a0a0a';
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();

      // радужка — красный градиент
      const irisR = radius * 0.86;
      const irisGrad = ctx.createRadialGradient(0, 0, irisR * 0.1, 0, 0, irisR);
      irisGrad.addColorStop(0, '#c60b0b');
      irisGrad.addColorStop(0.75, '#8f0000');
      irisGrad.addColorStop(1, '#5c0000');
      ctx.fillStyle = irisGrad;
      ctx.beginPath();
      ctx.arc(0, 0, irisR, 0, Math.PI * 2);
      ctx.fill();

      // три томоэ
      for (let i = 0; i < 3; i++) {
        drawTomoe(irisR * 0.6, tomoeAngle + i * (Math.PI * 2 / 3));
      }

      // зрачок
      ctx.fillStyle = '#050505';
      ctx.beginPath();
      ctx.arc(0, 0, irisR * 0.16, 0, Math.PI * 2);
      ctx.fill();

      // блик
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.arc(-irisR * 0.32, -irisR * 0.32, irisR * 0.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    let startTime = null;
    const total = 5000;
    const openIn = 700;      // открытие глаз
    const closeStart = 4300; // начало закрытия
    const wobbleFadeStart = 3600; // когда амплитуда "плавания" начинает падать

    function animate(ts) {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      const t = elapsed / 1000;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // --- глаза ---
      let openness;
      if (elapsed < openIn) openness = easeOutCubic(elapsed / openIn);
      else if (elapsed < closeStart) openness = 1;
      else openness = 1 - easeOutCubic(clamp01((elapsed - closeStart) / (total - closeStart)));

      const glow = elapsed < openIn
        ? clamp01(elapsed / openIn)
        : (elapsed < closeStart ? 1 : Math.max(0, 1 - (elapsed - closeStart) / (total - closeStart)));

      const tomoeAngle = t * 1.3; // медленное вращение томоэ

      drawSharinganEye(cx, cy, eyeR, openness, tomoeAngle, glow);

      // --- "поплывший" сайт: комбинация нескольких синусоид для органичного покачивания ---
      let wobbleAmp = 1;
      if (elapsed < openIn) wobbleAmp = clamp01(elapsed / openIn);
      else if (elapsed >= wobbleFadeStart) wobbleAmp = Math.max(0, 1 - (elapsed - wobbleFadeStart) / (total - wobbleFadeStart));

      const rot = (Math.sin(t * 1.7) * 1.6 + Math.sin(t * 3.1 + 1) * 0.8) * wobbleAmp;
      const skx = (Math.sin(t * 2.3 + 0.5) * 2.2) * wobbleAmp;
      const scl = 1 + (Math.sin(t * 1.9) * 0.015) * wobbleAmp;
      const tx = Math.sin(t * 2.6) * 6 * wobbleAmp;
      const ty = Math.cos(t * 2.1) * 4 * wobbleAmp;

      document.body.style.transformOrigin = '50% 50%';
      document.body.style.transform =
        `translate(${tx}px, ${ty}px) rotate(${rot}deg) skewX(${skx}deg) scale(${scl})`;
      document.body.style.filter = `blur(${0.6 * wobbleAmp}px) saturate(${1 + 0.35 * wobbleAmp})`;

      // красная виньетка гендзюцу
      if (wobbleAmp > 0) {
        ctx.save();
        ctx.globalAlpha = 0.25 * wobbleAmp;
        const vg = ctx.createRadialGradient(cx, cy, canvas.height * 0.25, cx, cy, canvas.height * 0.75);
        vg.addColorStop(0, 'rgba(120,0,0,0)');
        vg.addColorStop(1, 'rgba(120,0,0,0.6)');
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      if (elapsed < total) {
        requestAnimationFrame(animate);
      } else {
        document.body.style.transform = '';
        document.body.style.filter = '';
        canvas.remove();
      }
    }

    requestAnimationFrame(animate);
  });

  // ============================================================
  // itachi – отсылка на Итачи Учиха: экран целиком чёрный (одна
  // сплошная заливка, без деления на клетки), тьма держится дольше,
  // затем стая — настоящие вороны — медленно и постепенно разлетается
  // из случайных точек экрана в разные стороны, понемногу открывая свет. 12 секунд.
  // ============================================================
  addEasterEgg('itachi', 'ITACHI', function() {
    const w = window.innerWidth, h = window.innerHeight;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.style.cssText = 'position:fixed;top:0;left:0;z-index:300000;pointer-events:none;background:transparent;';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const clamp01 = t => Math.max(0, Math.min(1, t));
    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

    const total = 12000;
    const appearEnd = 400;
    const departStart = 1600;      // тьма держится дольше, прежде чем кто-то улетит
    const departWindow = 9600;     // окно вылетов растянуто — раскрытие идёт медленно
    const forceClearAt = total - 500; // страховка: гарантированно открыть весь экран к финалу

    // Постоянная чёрная маска — реально сплошная заливка на старте,
    // без единого зазора. Вороны прогрызают в ней дыры на лету.
    const mask = document.createElement('canvas');
    mask.width = w; mask.height = h;
    const mctx = mask.getContext('2d');
    mctx.fillStyle = '#000';
    mctx.fillRect(0, 0, w, h);

    function punchHole(x, y, radius) {
      mctx.save();
      mctx.globalCompositeOperation = 'destination-out';
      const g = mctx.createRadialGradient(x, y, 0, x, y, radius);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(0.7, 'rgba(0,0,0,0.85)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      mctx.fillStyle = g;
      mctx.beginPath();
      mctx.arc(x, y, radius, 0, Math.PI * 2);
      mctx.fill();
      mctx.restore();
    }

    // Стая из случайных точек экрана — никакой сетки/клеток
    const crowCount = Math.max(90, Math.min(170, Math.round((w * h) / 13000)));
    const crows = [];
    for (let i = 0; i < crowCount; i++) {
      crows.push({
        x: Math.random() * w,
        y: Math.random() * h,
        angle: Math.random() * Math.PI * 2,
        speed: 210 + Math.random() * 300,
        wobble: 0.3 + Math.random() * 0.9,
        wobbleFreq: 1 + Math.random() * 2.2,
        size: 46 + Math.random() * 34,
        departTime: departStart + Math.random() * departWindow,
        wingPhase: Math.random() * Math.PI * 2,
        holePunched: false
      });
    }

    // Пиксель-арт ворон (по образцу референса): собран из отдельных
    // квадратов-"пикселей", как честная пиксельная графика, а не векторный
    // силуэт. Строится один раз и переиспользуется для всей стаи.
    const CROW_BLACK = '#0a0a0f';
    const CROW_BLACK_SOFT = '#241c33';
    const CROW_INDIGO = '#3a2a5c';
    const CROW_ORANGE = '#ff9a2e';
    const CROW_DARK = '#161616';
    const CROW_DARKER = '#0d0d0d';
    const CROW_LEG_BACK = '#050508';

    function buildCrowSprite() {
      const body = new Map();
      const wing = new Map();
      function paint(map, gx, gy, gw, gh, color) {
        for (let y = gy; y < gy + gh; y++) for (let x = gx; x < gx + gw; x++) map.set(x + ',' + y, color);
      }
      // крыло (анимируется отдельно от тела — взмахивает)
      paint(wing, 12, 2, 7, 5, CROW_INDIGO);
      paint(wing, 10, 5, 4, 3, CROW_INDIGO);
      paint(wing, 16, 1, 5, 2, CROW_BLACK);
      paint(wing, 19, 0, 3, 2, CROW_BLACK);
      // тело, хвост, голова, клюв, лапки — неподвижная часть
      paint(body, 6, 7, 12, 5, CROW_BLACK);
      paint(body, 8, 7, 8, 1, CROW_BLACK_SOFT);
      paint(body, 3, 8, 4, 2, CROW_BLACK);
      paint(body, 1, 7, 3, 1, CROW_BLACK);
      paint(body, 1, 10, 3, 1, CROW_BLACK);
      paint(body, 17, 8, 4, 4, CROW_BLACK);
      paint(body, 19, 9, 1, 1, CROW_ORANGE);
      paint(body, 20, 10, 3, 1, CROW_DARK);
      paint(body, 22, 11, 2, 1, CROW_DARKER);
      paint(body, 13, 12, 1, 3, CROW_LEG_BACK);
      paint(body, 12, 15, 3, 1, CROW_LEG_BACK);
      paint(body, 10, 12, 1, 3, CROW_BLACK);
      paint(body, 9, 15, 3, 1, CROW_BLACK);
      paint(body, 9, 16, 1, 1, CROW_BLACK);
      paint(body, 11, 16, 1, 1, CROW_BLACK);

      function flatten(map) {
        const arr = [];
        for (const [key, color] of map) {
          const [gx, gy] = key.split(',').map(Number);
          arr.push({ gx, gy, color });
        }
        return arr;
      }
      return { bodyCells: flatten(body), wingCells: flatten(wing) };
    }
    const CROW_SPRITE = buildCrowSprite();
    const CROW_PIVOT_X = 12.5, CROW_PIVOT_Y = 8.5;   // примерный центр тела — точка вращения
    const CROW_WING_BASE_X = 13, CROW_WING_BASE_Y = 6; // основание крыла — точка взмаха
    const CROW_GRID_SPAN = 23; // ширина спрайта в "пикселях" для масштабирования под нужный размер

    // Красивый, узнаваемый ворон — теперь честный пиксель-арт вместо
    // векторного силуэта: чётко видны клюв, глаз, крылья с фиолетовым
    // отливом (как на референсе) и лапки с коготками
    function drawCrow(x, y, angle, wingPhase, size, alpha) {
      const cell = size / CROW_GRID_SPAN;
      const flap = Math.sin(wingPhase);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y);
      ctx.rotate(angle);

      // неподвижная часть: тело, хвост, голова, клюв, лапки
      for (const c of CROW_SPRITE.bodyCells) {
        const lx = (c.gx - CROW_PIVOT_X) * cell;
        const ly = (c.gy - CROW_PIVOT_Y) * cell;
        ctx.fillStyle = c.color;
        ctx.fillRect(lx, ly, cell + 0.6, cell + 0.6);
      }

      // крыло — взмахивает вокруг своего основания
      const wingBaseLX = (CROW_WING_BASE_X - CROW_PIVOT_X) * cell;
      const wingBaseLY = (CROW_WING_BASE_Y - CROW_PIVOT_Y) * cell;
      ctx.save();
      ctx.translate(wingBaseLX, wingBaseLY);
      ctx.rotate(-flap * 0.55 - 0.15);
      ctx.translate(-wingBaseLX, -wingBaseLY);
      for (const c of CROW_SPRITE.wingCells) {
        const lx = (c.gx - CROW_PIVOT_X) * cell;
        const ly = (c.gy - CROW_PIVOT_Y) * cell;
        ctx.fillStyle = c.color;
        ctx.fillRect(lx, ly, cell + 0.6, cell + 0.6);
      }
      ctx.restore();

      ctx.restore();
    }

    let startTime = null;

    function animate(ts) {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      ctx.clearRect(0, 0, w, h);

      if (elapsed >= forceClearAt) {
        if (elapsed < total) {
          if (elapsed > total - 300) canvas.style.opacity = String(clamp01((total - elapsed) / 300));
          requestAnimationFrame(animate);
        } else {
          canvas.remove();
        }
        return;
      }

      const appearAlpha = easeOutCubic(clamp01(elapsed / appearEnd));

      // сплошная маска — честный весь чёрный экран, без клеток
      ctx.save();
      ctx.globalAlpha = appearAlpha;
      ctx.drawImage(mask, 0, 0);
      ctx.restore();

      for (const crow of crows) {
        if (elapsed < crow.departTime) continue; // ещё часть общей тьмы — уже нарисована маской выше

        if (!crow.holePunched) {
          punchHole(crow.x, crow.y, crow.size * 1.15);
          crow.holePunched = true;
        }

        const localT = elapsed - crow.departTime;
        const dist = crow.speed * (localT / 1000);
        const wob = Math.sin(localT / 1000 * crow.wobbleFreq) * crow.wobble * 16;
        const dirX = Math.cos(crow.angle), dirY = Math.sin(crow.angle);
        const perpX = -dirY, perpY = dirX;
        const x = crow.x + dirX * dist + perpX * wob;
        const y = crow.y + dirY * dist + perpY * wob;

        if (x < -100 || x > w + 100 || y < -100 || y > h + 100) continue; // улетела совсем

        const flyAngle = Math.atan2(dirY, dirX) + Math.sin(localT / 1000 * crow.wobbleFreq) * 0.15;
        drawCrow(x, y, flyAngle, crow.wingPhase + localT * 0.012, crow.size, appearAlpha);
      }

      if (elapsed < total) {
        if (elapsed > total - 300) {
          canvas.style.opacity = String(clamp01((total - elapsed) / 300));
        }
        requestAnimationFrame(animate);
      } else {
        canvas.remove();
      }
    }

    requestAnimationFrame(animate);
  });

  // ============================================================
  // amaterasu – отсылка на Итачи Учиха: сначала по контуру занимаются
  // кнопки сайта одна за другой, а затем настоящее пламя (тёплые
  // чёрно-багрово-оранжевые тона, а не абстрактные шипы) медленно
  // заползает на сайт сразу с четырёх сторон экрана и сливается
  // в центре, полностью охватывая сайт. Не менее 10 секунд.
  // ============================================================
  addEasterEgg('amaterasu', 'AMATERASU', function() {
    const w = window.innerWidth, h = window.innerHeight;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.style.cssText = 'position:fixed;top:0;left:0;z-index:300000;pointer-events:none;background:transparent;';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const clamp01 = t => Math.max(0, Math.min(1, t));
    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
    const easeInCubic = t => t * t * t;
    const easeInOutSine = t => -(Math.cos(Math.PI * t) - 1) / 2;

    // Реальные кнопки сайта — занимаются по очереди
    const buttonIds = ['shop-btn', 'profile-btn', 'fire-chat-btn'];
    const buttonEls = buttonIds.map(id => document.getElementById(id)).filter(Boolean);
    const buttonStartGap = 1000;
    const buttonBurnDuration = 1500;
    const buttons = buttonEls.map((el, i) => {
      const r = el.getBoundingClientRect();
      return { rect: { x: r.left, y: r.top, width: r.width, height: r.height }, startTime: i * buttonStartGap };
    });

    const total = 13200;                 // медленно и надолго — точно не меньше 10 секунд
    const frontsStart = 1600;            // огонь с краёв экрана начинает заползать внутрь
    const frontsFullAt = 9200;           // медленное заполнение — почти 7.5 секунды на весь путь
    const holdEnd = 11000;
    const retractEnd = 13000;

    const tongueSeeds = Array.from({ length: 90 }, () => ({
      phase: Math.random() * Math.PI * 2,
      freq: 2.2 + Math.random() * 2.6,
      freq2: 5 + Math.random() * 6,
      lean: (Math.random() - 0.5) * 0.5
    }));

    // Один язык пламени: база (baseX,baseY) + направление наружу (nx,ny).
    // Тёплый чёрно-багрово-оранжевый градиент — то, чего не хватало
    // прошлой версии, чтобы выглядеть именно как огонь.
    function drawTongueAt(baseX, baseY, nx, ny, len, halfW, tsec, seedIndex, alphaMul) {
      const seed = tongueSeeds[seedIndex % tongueSeeds.length];
      const tanX = -ny, tanY = nx;
      const lean = seed.lean * (0.6 + 0.4 * Math.sin(tsec * 1.3 + seed.phase));
      const tipX = baseX + nx * len + tanX * len * lean;
      const tipY = baseY + ny * len + tanY * len * lean;
      const leftX = baseX + tanX * halfW, leftY = baseY + tanY * halfW;
      const rightX = baseX - tanX * halfW, rightY = baseY - tanY * halfW;
      const midX = baseX + nx * len * 0.55, midY = baseY + ny * len * 0.55;

      ctx.save();
      ctx.globalAlpha = alphaMul;
      ctx.beginPath();
      ctx.moveTo(leftX, leftY);
      ctx.lineTo(midX + tanX * halfW * 0.4, midY + tanY * halfW * 0.4);
      ctx.lineTo(tipX, tipY);
      ctx.lineTo(midX - tanX * halfW * 0.4, midY - tanY * halfW * 0.4);
      ctx.lineTo(rightX, rightY);
      ctx.closePath();
      const g = ctx.createLinearGradient(baseX, baseY, tipX, tipY);
      g.addColorStop(0, 'rgba(8,2,2,0.95)');
      g.addColorStop(0.45, 'rgba(46,10,8,0.9)');
      g.addColorStop(0.75, 'rgba(130,42,10,0.78)');
      g.addColorStop(0.92, 'rgba(255,140,30,0.6)');
      g.addColorStop(1, 'rgba(255,210,90,0)');
      ctx.fillStyle = g;
      ctx.fill();

      const sparkle = Math.sin(tsec * seed.freq2 * 2 + seed.phase * 3);
      if (sparkle > 0.94) {
        ctx.globalAlpha = alphaMul * (sparkle - 0.94) / 0.06;
        ctx.fillStyle = '#fff3c4';
        ctx.beginPath();
        ctx.arc(tipX, tipY, Math.max(2, len * 0.1), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // ---- Огонь по контуру конкретной кнопки ----
    function perimeterPoint(rect, t) {
      const perim = 2 * (rect.width + rect.height);
      let d = clamp01(t) * perim;
      if (d < rect.width) return { px: rect.x + d, py: rect.y, nx: 0, ny: -1 };
      d -= rect.width;
      if (d < rect.height) return { px: rect.x + rect.width, py: rect.y + d, nx: 1, ny: 0 };
      d -= rect.height;
      if (d < rect.width) return { px: rect.x + rect.width - d, py: rect.y + rect.height, nx: 0, ny: 1 };
      d -= rect.width;
      return { px: rect.x, py: rect.y + rect.height - d, nx: -1, ny: 0 };
    }

    function drawButtonFire(btn, tsec, burnAlphaMul) {
      const progress = clamp01((tsec * 1000 - btn.startTime) / buttonBurnDuration);
      if (progress <= 0) return;
      const rect = btn.rect;
      const perim = 2 * (rect.width + rect.height);
      const tongueCount = Math.max(10, Math.round(perim / 13));

      ctx.save();
      ctx.globalAlpha = Math.min(1, progress * 1.3) * 0.85 * burnAlphaMul;
      ctx.fillStyle = '#0d0503';
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
      ctx.restore();

      for (let i = 0; i < tongueCount; i++) {
        const t = i / tongueCount;
        if (t > progress) continue;
        const edgeFade = t > progress - 0.05 ? clamp01((progress - t) / 0.05) : 1;
        if (edgeFade <= 0.02) continue;
        const pt = perimeterPoint(rect, t);
        const flicker = 0.5 + 0.5 * Math.sin(tsec * (2.5 + i * 0.1) + i) + 0.15 * Math.sin(tsec * 7 - i);
        const len = Math.max(4, 13 * Math.max(0.2, flicker) * edgeFade);
        drawTongueAt(pt.px, pt.py, pt.nx, pt.ny, len, 4.5, tsec, i, edgeFade * burnAlphaMul);
      }
    }

    // ---- Четыре фронта пламени, медленно заползающие с краёв экрана ----
    const maxDepthH = h * 0.58, maxDepthW = w * 0.58; // с запасом за половину — гарантирует слияние без просветов
    function frontDepth(coverage, maxDepth) { return maxDepth * coverage; }

    function drawFront(edge, depth, tsec, seedBase, alphaMul) {
      if (depth <= 1) return;
      const horizontal = edge === 'top' || edge === 'bottom';
      const length = horizontal ? w : h;
      const waveAmp = Math.min(26, depth * 0.35);
      const segments = 30;

      function boundaryAt(pos) {
        return Math.sin(pos * 0.007 + tsec * 0.9 + seedBase) * waveAmp +
          Math.sin(pos * 0.019 - tsec * 0.55 + seedBase) * waveAmp * 0.4;
      }

      // выжженная область позади фронта
      ctx.save();
      ctx.globalAlpha = alphaMul;
      ctx.beginPath();
      if (edge === 'top') {
        ctx.moveTo(0, 0); ctx.lineTo(w, 0);
        for (let i = segments; i >= 0; i--) { const x = (i / segments) * w; ctx.lineTo(x, depth + boundaryAt(x)); }
      } else if (edge === 'bottom') {
        ctx.moveTo(0, h); ctx.lineTo(w, h);
        for (let i = segments; i >= 0; i--) { const x = (i / segments) * w; ctx.lineTo(x, h - depth + boundaryAt(x)); }
      } else if (edge === 'left') {
        ctx.moveTo(0, 0); ctx.lineTo(0, h);
        for (let i = segments; i >= 0; i--) { const y = (i / segments) * h; ctx.lineTo(depth + boundaryAt(y), y); }
      } else {
        ctx.moveTo(w, 0); ctx.lineTo(w, h);
        for (let i = segments; i >= 0; i--) { const y = (i / segments) * h; ctx.lineTo(w - depth + boundaryAt(y), y); }
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(9,2,3,0.96)';
      ctx.fill();
      ctx.restore();

      // языки пламени вдоль кромки фронта, "лижущие" ещё не тронутую область
      const tongueCount = Math.max(14, Math.round(length / 30));
      for (let i = 0; i < tongueCount; i++) {
        const pos = (i / tongueCount) * length;
        const wob = boundaryAt(pos);
        let baseX, baseY, nx, ny;
        if (edge === 'top') { baseX = pos; baseY = depth + wob; nx = 0; ny = 1; }
        else if (edge === 'bottom') { baseX = pos; baseY = h - depth + wob; nx = 0; ny = -1; }
        else if (edge === 'left') { baseX = depth + wob; baseY = pos; nx = 1; ny = 0; }
        else { baseX = w - depth + wob; baseY = pos; nx = -1; ny = 0; }

        const flicker = 0.5 + 0.5 * Math.sin(tsec * (2.4 + seedBase) + i * 1.4) + 0.18 * Math.sin(tsec * 5.5 - i);
        const len = 16 + 30 * Math.max(0.2, flicker);
        drawTongueAt(baseX, baseY, nx, ny, len, 8, tsec, i + Math.round(seedBase * 100), alphaMul);
      }
    }

    const embers = [];
    function spawnEmber(x, y) {
      const angle = Math.random() * Math.PI * 2;
      embers.push({
        x, y,
        vx: (Math.random() - 0.5) * 20, vy: -25 - Math.random() * 40,
        life: 0, maxLife: 900 + Math.random() * 700, size: 1.5 + Math.random() * 2.5
      });
    }

    let startTime = null;
    let lastEmberSpawn = 0;

    function animate(ts) {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      const tsec = elapsed / 1000;
      ctx.clearRect(0, 0, w, h);

      let burnAlphaMul = 1;
      if (elapsed >= holdEnd) {
        burnAlphaMul = elapsed < retractEnd ? 1 - easeInCubic(clamp01((elapsed - holdEnd) / (retractEnd - holdEnd))) : 0;
      }

      // 1. кнопки занимаются по очереди
      for (const btn of buttons) drawButtonFire(btn, tsec, burnAlphaMul);

      // 2. медленное заполнение сайта пламенем сразу с четырёх сторон
      let coverage = 0;
      if (elapsed >= frontsStart) {
        coverage = elapsed < frontsFullAt
          ? easeInOutSine(clamp01((elapsed - frontsStart) / (frontsFullAt - frontsStart)))
          : 1;
      }
      if (elapsed >= holdEnd) coverage *= burnAlphaMul;

      if (coverage > 0.003) {
        drawFront('top', frontDepth(coverage, maxDepthH), tsec, 0.3, burnAlphaMul);
        drawFront('bottom', frontDepth(coverage, maxDepthH), tsec, 1.9, burnAlphaMul);
        drawFront('left', frontDepth(coverage, maxDepthW), tsec, 3.1, burnAlphaMul);
        drawFront('right', frontDepth(coverage, maxDepthW), tsec, 4.6, burnAlphaMul);
      }

      // синхронное обесцвечивание сайта пропорционально охвату пламени
      const grayAmount = easeInOutSine(clamp01(coverage));
      document.body.style.filter = grayAmount > 0.01
        ? `grayscale(${grayAmount}) brightness(${1 - grayAmount * 0.16}) contrast(${1 + grayAmount * 0.06})`
        : '';

      // угольки — от кнопок и вдоль кромки фронтов
      if (elapsed < retractEnd && elapsed - lastEmberSpawn > 55) {
        for (const btn of buttons) {
          const progress = clamp01((elapsed - btn.startTime) / buttonBurnDuration);
          if (progress > 0.1 && progress < 1) {
            spawnEmber(btn.rect.x + btn.rect.width / 2, btn.rect.y + btn.rect.height / 2);
          }
        }
        if (coverage > 0.05 && coverage < 0.98) {
          const edges = [
            { x: Math.random() * w, y: frontDepth(coverage, maxDepthH) },
            { x: Math.random() * w, y: h - frontDepth(coverage, maxDepthH) },
            { x: frontDepth(coverage, maxDepthW), y: Math.random() * h },
            { x: w - frontDepth(coverage, maxDepthW), y: Math.random() * h }
          ];
          const p = edges[Math.floor(Math.random() * edges.length)];
          spawnEmber(p.x, p.y);
        }
        lastEmberSpawn = elapsed;
      }
      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i];
        e.life += 16.7;
        e.x += e.vx * 0.0167; e.y += e.vy * 0.0167;
        e.vy *= 0.985;
        if (e.life >= e.maxLife) { embers.splice(i, 1); continue; }
        const a = (1 - e.life / e.maxLife) * burnAlphaMul;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle = a > 0.5 ? '#ff8a35' : '#4a2a20';
        ctx.shadowColor = '#ff6a20';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (elapsed < total) {
        requestAnimationFrame(animate);
      } else {
        document.body.style.filter = '';
        canvas.remove();
      }
    }

    requestAnimationFrame(animate);
  });

  // ============================================================
  // transformers – пиксельная фигура-трансформер с эмблемой PB на
  // груди собирается из ВСЕХ видимых кнопок и надписей сайта, затем
  // поблочно перестраивается в спорткар и плавно уезжает за кадр вправо,
  // без бликов и следов позади. 10 секунд.
  // ============================================================
  addEasterEgg('transformers', 'TRANSFORMERS', function() {
    const w = window.innerWidth, h = window.innerHeight;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.style.cssText = 'position:fixed;top:0;left:0;z-index:300000;pointer-events:none;background:transparent;';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const clamp01 = t => Math.max(0, Math.min(1, t));
    const easeInCubic = t => t * t * t;
    const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const easeOutBack = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

    const COL = {
      dark: '#141414', dark2: '#262626', yellow: '#f6c418', yellowLight: '#ffdf5c', yellowDark: '#c9930e',
      glow: '#7be8ff', glowDark: '#2a95b8', blue: '#1560d4', blueLight: '#3f8bf0', white: '#f5f7ff', grey: '#9aa0a6', greyDark: '#5b6066', red: '#ff3b30'
    };

    function paint(map, gx, gy, gw, gh, color) {
      for (let y = gy; y < gy + gh; y++) for (let x = gx; x < gx + gw; x++) map.set(x + ',' + y, color);
    }
    const P_BITMAP = ['111', '101', '111', '100', '100'];
    const B_BITMAP = ['111', '101', '111', '101', '111'];
    function paintLetter(map, bitmap, gx, gy, color) {
      for (let ry = 0; ry < bitmap.length; ry++)
        for (let rx = 0; rx < bitmap[ry].length; rx++)
          if (bitmap[ry][rx] === '1') map.set((gx + rx) + ',' + (gy + ry), color);
    }

    // ---- РОБОТ: гуманоид с эмблемой "PB" на груди, с лёгкой светотенью ----
    const robotMap = new Map();
    paint(robotMap, 17, 1, 6, 5, COL.dark);
    paint(robotMap, 18, 3, 4, 1, COL.glow);
    paint(robotMap, 13, 6, 14, 2, COL.dark2);
    paint(robotMap, 9, 7, 5, 4, COL.yellow);
    paint(robotMap, 9, 7, 1, 4, COL.yellowLight);
    paint(robotMap, 13, 7, 1, 4, COL.yellowDark);
    paint(robotMap, 26, 7, 5, 4, COL.yellow);
    paint(robotMap, 26, 7, 1, 4, COL.yellowLight);
    paint(robotMap, 30, 7, 1, 4, COL.yellowDark);
    paint(robotMap, 14, 7, 12, 11, COL.yellow);
    paint(robotMap, 14, 7, 1, 11, COL.dark);
    paint(robotMap, 25, 7, 1, 11, COL.dark);
    paint(robotMap, 15, 9, 10, 8, COL.blue);
    paint(robotMap, 15, 9, 1, 8, COL.blueLight);
    paint(robotMap, 16, 10, 8, 6, COL.white);
    paintLetter(robotMap, P_BITMAP, 16, 11, COL.dark2);
    paintLetter(robotMap, B_BITMAP, 20, 11, COL.dark2);
    paint(robotMap, 15, 18, 10, 2, COL.dark2);
    paint(robotMap, 7, 8, 3, 6, COL.yellow);
    paint(robotMap, 7, 8, 1, 6, COL.yellowLight);
    paint(robotMap, 6, 14, 3, 4, COL.dark2);
    paint(robotMap, 6, 18, 3, 2, COL.dark);
    paint(robotMap, 30, 8, 3, 6, COL.yellow);
    paint(robotMap, 32, 8, 1, 6, COL.yellowDark);
    paint(robotMap, 31, 14, 3, 4, COL.dark2);
    paint(robotMap, 31, 18, 3, 2, COL.dark);
    paint(robotMap, 16, 20, 4, 7, COL.yellow);
    paint(robotMap, 16, 20, 1, 7, COL.yellowLight);
    paint(robotMap, 15, 27, 6, 3, COL.dark);
    paint(robotMap, 20, 20, 4, 7, COL.yellow);
    paint(robotMap, 23, 20, 1, 7, COL.yellowDark);
    paint(robotMap, 19, 27, 6, 3, COL.dark);

    // ---- МАШИНА: спорткар в духе Бамблби, с бликами кузова для объёма ----
    const carMap = new Map();
    paint(carMap, 4, 20, 32, 6, COL.yellow);
    paint(carMap, 4, 20, 32, 1, COL.yellowLight);
    paint(carMap, 4, 24, 32, 2, COL.yellowDark);
    paint(carMap, 12, 14, 14, 7, COL.yellow);
    paint(carMap, 12, 14, 14, 1, COL.yellowLight);
    paint(carMap, 13, 15, 4, 4, COL.glow);
    paint(carMap, 13, 15, 4, 1, COL.white);
    paint(carMap, 22, 15, 4, 4, COL.glow);
    paint(carMap, 22, 18, 4, 1, COL.glowDark);
    paint(carMap, 11, 14, 2, 12, COL.dark);
    paint(carMap, 26, 14, 2, 12, COL.dark);
    paint(carMap, 2, 23, 3, 3, COL.dark);
    paint(carMap, 36, 23, 3, 3, COL.dark);
    paint(carMap, 3, 21, 2, 2, COL.white);
    paint(carMap, 37, 21, 2, 2, COL.red);
    paint(carMap, 7, 24, 6, 6, COL.dark);
    paint(carMap, 8, 25, 4, 4, COL.grey);
    paint(carMap, 9, 26, 2, 2, COL.greyDark);
    paint(carMap, 27, 24, 6, 6, COL.dark);
    paint(carMap, 28, 25, 4, 4, COL.grey);
    paint(carMap, 29, 26, 2, 2, COL.greyDark);
    paint(carMap, 17, 21, 6, 4, COL.blue);
    paint(carMap, 18, 22, 4, 2, COL.white);

    function flatten(map) {
      const arr = [];
      for (const [key, color] of map) {
        const [gx, gy] = key.split(',').map(Number);
        arr.push({ gx, gy, color });
      }
      arr.sort((a, b) => a.gy - b.gy || a.gx - b.gx);
      return arr;
    }
    const robotCells = flatten(robotMap);
    const carCells = flatten(carMap);
    const n = Math.max(robotCells.length, carCells.length);

    const pixelSize = Math.max(6, Math.min(11, Math.floor(w / 70)));
    const gridW = 40, gridH = 34;
    const originX = w / 2 - (gridW * pixelSize) / 2;
    const originY = h / 2 - (gridH * pixelSize) / 2;
    function gridToScreen(gx, gy) {
      return { x: originX + gx * pixelSize, y: originY + gy * pixelSize };
    }

    // Трансформер собирается из ВСЕХ видимых кнопок и надписей сайта —
    // не только магазина: заголовок, подзаголовок и каждая кнопка на
    // экране (модалки, скрытые в данный момент, естественно не попадают,
    // потому что у них нулевой размер и они вне области видимости).
    // Все они на время анимации плавно исчезают и появляются снова в конце.
    const candidateEls = Array.from(document.querySelectorAll('button, h1, .subtitle'));
    const sourceEls = candidateEls.filter(el => {
      const r = el.getBoundingClientRect();
      return r.width > 4 && r.height > 4 &&
        r.bottom > 0 && r.top < window.innerHeight &&
        r.right > 0 && r.left < window.innerWidth;
    });
    const sourceRects = sourceEls.map(el => el.getBoundingClientRect());
    sourceEls.forEach(el => { el.style.transition = 'opacity 0.4s ease'; el.style.opacity = '0'; });

    const particles = [];
    for (let i = 0; i < n; i++) {
      const from = robotCells[i % robotCells.length];
      const to = carCells[i % carCells.length];
      const startPos = gridToScreen(from.gx, from.gy);
      let spawnX, spawnY;
      if (sourceRects.length > 0) {
        const rect = sourceRects[i % sourceRects.length];
        spawnX = rect.left + Math.random() * rect.width;
        spawnY = rect.top + Math.random() * rect.height;
      } else {
        const edgeAngle = Math.random() * Math.PI * 2;
        const edgeDist = Math.max(w, h) * (0.7 + Math.random() * 0.5);
        spawnX = w / 2 + Math.cos(edgeAngle) * edgeDist;
        spawnY = h / 2 + Math.sin(edgeAngle) * edgeDist;
      }
      particles.push({
        spawnX, spawnY,
        robotX: startPos.x, robotY: startPos.y,
        carGX: to.gx, carGY: to.gy,
        fromColor: from.color, toColor: to.color,
        staggerA: Math.random() * 350,
        staggerB: Math.random() * 700
      });
    }

    function hexToRgb(hex) {
      const num = parseInt(hex.slice(1), 16);
      return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
    }
    const colorCache = {};
    function lerpColor(c1, c2, t) {
      const key = c1 + '|' + c2;
      if (!colorCache[key]) colorCache[key] = [hexToRgb(c1), hexToRgb(c2)];
      const [a, b] = colorCache[key];
      return `rgb(${Math.round(a.r + (b.r - a.r) * t)},${Math.round(a.g + (b.g - a.g) * t)},${Math.round(a.b + (b.b - a.b) * t)})`;
    }

    const total = 10000;
    const assembleEnd = 1700;
    const morphStart = 2700;
    const morphEnd = 5600;
    const driveEnd = 9000;
    const exitFadeEnd = 9500; // машина плавно скрывается за кадром, без следов и бликов

    const sparks = [];
    function spawnSpark(x, y) {
      const a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 160;
      sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, maxLife: 300 + Math.random() * 300, size: 1 + Math.random() * 2 });
    }

    let startTime = null;

    function animate(ts) {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      ctx.clearRect(0, 0, w, h);

      let driveOffsetX = 0, driveOffsetY = 0;
      if (elapsed > morphEnd) {
        const t = clamp01((elapsed - morphEnd) / (exitFadeEnd - morphEnd));
        driveOffsetX = easeInCubic(t) * (w * 0.95);
        driveOffsetY = elapsed < driveEnd ? Math.sin(elapsed / 90) * 1.4 : 0;
      }

      for (const p of particles) {
        let x, y, color, alpha = 1, rot = 0;

        if (elapsed < assembleEnd) {
          const localElapsed = Math.max(0, elapsed - p.staggerA);
          const dur = assembleEnd - 300;
          const t = clamp01(localElapsed / dur);
          const te = easeOutBack(t);
          x = p.spawnX + (p.robotX - p.spawnX) * te;
          y = p.spawnY + (p.robotY - p.spawnY) * te;
          alpha = clamp01(localElapsed / 200);
          rot = (1 - t) * Math.PI * 2;
          color = p.fromColor;
        } else if (elapsed < morphStart) {
          x = p.robotX; y = p.robotY; color = p.fromColor;
        } else if (elapsed < morphEnd) {
          const localElapsed = Math.max(0, elapsed - morphStart - p.staggerB);
          const dur = (morphEnd - morphStart) - 700;
          const t = clamp01(localElapsed / dur);
          const te = easeInOutCubic(t);
          const carPos = gridToScreen(p.carGX, p.carGY);
          x = p.robotX + (carPos.x - p.robotX) * te;
          y = p.robotY + (carPos.y - p.robotY) * te - Math.sin(te * Math.PI) * 14;
          color = lerpColor(p.fromColor, p.toColor, te);
          rot = te * Math.PI * 3;
          if (Math.random() < 0.012 && te > 0.15 && te < 0.9) spawnSpark(x, y);
        } else {
          const carPos = gridToScreen(p.carGX, p.carGY);
          x = carPos.x + driveOffsetX;
          y = carPos.y + driveOffsetY;
          color = p.toColor;
          // машина плавно растворяется, уходя за правый край — без бликов и следов позади
          if (elapsed > driveEnd) alpha = clamp01(1 - (elapsed - driveEnd) / (exitFadeEnd - driveEnd));
          if (x > w + 20) alpha = 0;
        }

        if (alpha <= 0.01) continue;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(x + pixelSize / 2, y + pixelSize / 2);
        if (rot) ctx.rotate(rot);
        ctx.fillStyle = color;
        ctx.fillRect(-pixelSize / 2, -pixelSize / 2, pixelSize, pixelSize);
        ctx.restore();
      }

      // вспышка света в момент начала трансформации
      if (elapsed > morphStart && elapsed < morphStart + 260) {
        const ft = 1 - clamp01((elapsed - morphStart) / 260);
        ctx.save();
        ctx.globalAlpha = ft * 0.5;
        const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.4);
        g.addColorStop(0, 'rgba(255,255,255,0.9)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life += 16.7;
        s.x += s.vx * 0.0167; s.y += s.vy * 0.0167;
        s.vx *= 0.94; s.vy *= 0.94;
        if (s.life >= s.maxLife) { sparks.splice(i, 1); continue; }
        const a = 1 - s.life / s.maxLife;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle = '#bfefff';
        ctx.shadowColor = '#7be8ff';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (elapsed < total) {
        requestAnimationFrame(animate);
      } else {
        sourceEls.forEach(el => { el.style.opacity = ''; });
        canvas.remove();
      }
    }

    requestAnimationFrame(animate);
  });

  // ============================================================
  // sixseven – отсылка на мем "67": две крупные цифры 6 и 7, под каждой —
  // раскрытая ладонь, развёрнутая тыльной стороной вниз и пальцами вверх,
  // к зрителю (как будто на ней что-то держат/показывают). Сначала
  // статика, затем покачивание вверх-вниз ВРАЗНОБОЙ — левая и правая
  // сторона трясутся по очереди, в противофазе — и постепенно ускоряется.
  // Активируется словом SIXSEVEN или просто числом 67. ~4 секунды.
  // ============================================================
  function sixSevenAction() {
    const w = window.innerWidth, h = window.innerHeight;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.style.cssText = 'position:fixed;top:0;left:0;z-index:300000;pointer-events:none;background:transparent;';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const clamp01 = t => Math.max(0, Math.min(1, t));
    const easeInCubic = t => t * t * t;
    const easeOutBack = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

    const cx = w / 2, cy = h / 2;
    const digitH = Math.min(220, h * 0.32);
    const digitW = digitH * 0.55;
    const gap = digitW * 0.9;
    const leftCX = cx - gap / 2 - digitW / 2;
    const rightCX = cx + gap / 2 + digitW / 2;
    const digitCY = cy - digitH * 0.15;
    const thickness = digitW * 0.16;

    function drawDigit(dcx, dcy, dw, dh, segments, color) {
      const halfW = dw / 2, halfH = dh / 2, th = thickness;
      const segs = {
        top: [dcx - halfW + th, dcy - halfH, dw - 2 * th, th],
        topLeft: [dcx - halfW, dcy - halfH + th * 0.5, th, halfH - th * 0.5],
        topRight: [dcx + halfW - th, dcy - halfH + th * 0.5, th, halfH - th * 0.5],
        middle: [dcx - halfW + th, dcy - th / 2, dw - 2 * th, th],
        bottomLeft: [dcx - halfW, dcy + th * 0.5, th, halfH - th * 0.5],
        bottomRight: [dcx + halfW - th, dcy + th * 0.5, th, halfH - th * 0.5],
        bottom: [dcx - halfW + th, dcy + halfH - th, dw - 2 * th, th]
      };
      ctx.fillStyle = color;
      for (const key of segments) {
        const s = segs[key];
        ctx.fillRect(s[0], s[1], s[2], s[3]);
      }
    }
    const DIGIT_6 = ['top', 'topLeft', 'middle', 'bottomLeft', 'bottomRight', 'bottom'];
    const DIGIT_7 = ['top', 'topRight', 'bottomRight'];

    // Раскрытая ладонь, повёрнутая лицом к зрителю (как на референсе):
    // широкая округлая чаша ладони снизу, четыре слегка согнутых пальца
    // сверху и отставленный большой палец сбоку.
    function drawHand(hcx, hcy, width, tilt) {
      const palmW = width, palmH = width * 0.6;
      const fingerW = width * 0.11;

      ctx.save();
      ctx.translate(hcx, hcy);
      ctx.rotate(tilt);
      ctx.fillStyle = '#e8c49a';
      ctx.strokeStyle = '#2a1a10';
      ctx.lineWidth = Math.max(1.4, width * 0.018);

      // ладонь
      ctx.beginPath();
      ctx.moveTo(-palmW * 0.46, palmH * 0.05);
      ctx.quadraticCurveTo(-palmW * 0.5, palmH * 0.5, 0, palmH * 0.5);
      ctx.quadraticCurveTo(palmW * 0.5, palmH * 0.5, palmW * 0.46, palmH * 0.05);
      ctx.quadraticCurveTo(palmW * 0.4, -palmH * 0.12, palmW * 0.26, -palmH * 0.04);
      ctx.quadraticCurveTo(0, palmH * 0.06, -palmW * 0.26, -palmH * 0.04);
      ctx.quadraticCurveTo(-palmW * 0.4, -palmH * 0.12, -palmW * 0.46, palmH * 0.05);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // четыре пальца сверху, слегка согнуты внутрь на кончиках
      for (let i = 0; i < 4; i++) {
        const fx = -palmW * 0.34 + (i / 3) * palmW * 0.68;
        const fLen = width * 0.32 * (i === 1 || i === 2 ? 1.1 : 0.9);
        ctx.save();
        ctx.translate(fx, -palmH * 0.02);
        ctx.beginPath();
        ctx.moveTo(-fingerW / 2, 0);
        ctx.lineTo(-fingerW / 2, -fLen * 0.68);
        ctx.quadraticCurveTo(-fingerW / 2, -fLen, 0, -fLen);
        ctx.quadraticCurveTo(fingerW / 2, -fLen, fingerW / 2, -fLen * 0.68);
        ctx.lineTo(fingerW / 2, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // большой палец сбоку, под углом
      ctx.save();
      ctx.translate(palmW * 0.48, palmH * 0.12);
      ctx.rotate(0.95);
      ctx.beginPath();
      ctx.moveTo(-fingerW * 0.6, 0);
      ctx.lineTo(-fingerW * 0.6, -width * 0.24);
      ctx.quadraticCurveTo(-fingerW * 0.6, -width * 0.3, 0, -width * 0.3);
      ctx.quadraticCurveTo(fingerW * 0.6, -width * 0.3, fingerW * 0.6, -width * 0.24);
      ctx.lineTo(fingerW * 0.6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.restore();
    }

    const total = 4000;
    const popEnd = 150;
    const staticEnd = 800;
    const slowBobEnd = 2400;

    let startTime = null, lastTs = null, bobPhase = 0;

    function animate(ts) {
      if (!startTime) { startTime = ts; lastTs = ts; }
      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;
      const elapsed = ts - startTime;
      ctx.clearRect(0, 0, w, h);

      // темп покачивания: сначала статика, потом ровный медленный темп,
      // затем плавно разгоняется до очень быстрого
      let freq = 0;
      if (elapsed > staticEnd) {
        freq = elapsed < slowBobEnd
          ? 1.8
          : 1.8 + (8.5 - 1.8) * easeInCubic(clamp01((elapsed - slowBobEnd) / (total - slowBobEnd)));
      }
      bobPhase += 2 * Math.PI * freq * dt;

      let amp = 0;
      if (elapsed > staticEnd) {
        amp = elapsed < slowBobEnd
          ? 16
          : 16 + (36 - 16) * clamp01((elapsed - slowBobEnd) / (total - slowBobEnd));
      }
      // левая и правая сторона качаются в противофазе — не вместе, а вразнобой
      const leftOffsetY = Math.sin(bobPhase) * amp;
      const rightOffsetY = Math.sin(bobPhase + Math.PI) * amp;
      const leftTilt = Math.sin(bobPhase) * 0.05;
      const rightTilt = Math.sin(bobPhase + Math.PI) * 0.05;

      const scale = elapsed < popEnd ? 0.8 + 0.2 * easeOutBack(clamp01(elapsed / popEnd)) : 1;

      function drawColumn(dcx, segments, offsetY, tilt) {
        ctx.save();
        ctx.translate(dcx, digitCY + offsetY);
        ctx.rotate(tilt);
        ctx.scale(scale, scale);
        drawDigit(0, 0, digitW, digitH, segments, '#f6c418');
        ctx.restore();
        drawHand(dcx, digitCY + offsetY + digitH / 2 + digitW * 0.18, digitW * 0.82, tilt);
      }

      drawColumn(leftCX, DIGIT_6, leftOffsetY, leftTilt);
      drawColumn(rightCX, DIGIT_7, rightOffsetY, rightTilt);

      if (elapsed < total) {
        requestAnimationFrame(animate);
      } else {
        canvas.remove();
      }
    }

    requestAnimationFrame(animate);
  }
  addEasterEgg('sixseven', 'SIXSEVEN', sixSevenAction);
  addEasterEgg('sixseven', '67', sixSevenAction);

  // ============================================================
  // 42brotha – "42 братуха": число 52 с мерцающей гирляндой, НЛО
  // похищает цифру 5, на её месте материализуется 4 (получается 42),
  // снизу печатается "братуха". 5 секунд. Активация: число 42.
  // ============================================================
  addEasterEgg('42brotha', '42', function() {
    const w = window.innerWidth, h = window.innerHeight;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.style.cssText = 'position:fixed;top:0;left:0;z-index:300000;pointer-events:none;background:transparent;';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const clamp01 = t => Math.max(0, Math.min(1, t));
    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
    const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const cx = w / 2, cy = h / 2;
    // высота цифры ограничена не только высотой экрана, но и шириной —
    // на узких телефонах суммарная ширина двух цифр с зазором не должна вылезать за экран
    const digitH = Math.min(300, h * 0.34, (w * 0.82) / (2.45 * (200 / 300)));
    const digitW = digitH * (200 / 300);
    const gap = digitW * 0.45;
    const leftCX = cx - gap / 2 - digitW / 2;   // тут сначала 5, потом 4
    const rightCX = cx + gap / 2 + digitW / 2;  // тут всегда 2
    const digitCY = cy - digitH * 0.18;
    const thickness = digitW * 0.15;

    function drawDigit(dcx, dcy, dw, dh, segments, alpha) {
      const halfW = dw / 2, halfH = dh / 2, th = thickness;
      const segs = {
        top: [dcx - halfW + th, dcy - halfH, dw - 2 * th, th],
        topLeft: [dcx - halfW, dcy - halfH + th * 0.5, th, halfH - th * 0.5],
        topRight: [dcx + halfW - th, dcy - halfH + th * 0.5, th, halfH - th * 0.5],
        middle: [dcx - halfW + th, dcy - th / 2, dw - 2 * th, th],
        bottomLeft: [dcx - halfW, dcy + th * 0.5, th, halfH - th * 0.5],
        bottomRight: [dcx + halfW - th, dcy + th * 0.5, th, halfH - th * 0.5],
        bottom: [dcx - halfW + th, dcy + halfH - th, dw - 2 * th, th]
      };
      ctx.save();
      ctx.globalAlpha = alpha;
      for (const key of segments) {
        const s = segs[key];
        // лёгкая "пиксельная" обводка каждого сегмента для чёткости
        ctx.fillStyle = '#111';
        ctx.fillRect(s[0] - 1.5, s[1] - 1.5, s[2] + 3, s[3] + 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(s[0], s[1], s[2], s[3]);
      }
      ctx.restore();
    }
    const DIGIT_5 = ['top', 'topLeft', 'middle', 'bottomRight', 'bottom'];
    const DIGIT_2 = ['top', 'topRight', 'middle', 'bottomLeft', 'bottom'];
    const DIGIT_4 = ['topLeft', 'topRight', 'middle', 'bottomRight'];

    // ---- Гирлянда: цепочка лампочек по контуру цифры, мигает каждые 0.2с ----
    const GARLAND_COLORS = ['#ffd400', '#ff3b30', '#2f6fff', '#34c759', '#ffffff', '#b455ff'];
    const GARLAND_COUNT = 18;
    function garlandPointsForRect(dcx, dcy, dw, dh) {
      const pad = 10;
      const rw = dw + pad * 2, rh = dh + pad * 2;
      const perim = 2 * (rw + rh);
      const pts = [];
      for (let i = 0; i < GARLAND_COUNT; i++) {
        let d = (i / GARLAND_COUNT) * perim;
        let x, y;
        if (d < rw) { x = dcx - rw / 2 + d; y = dcy - rh / 2; }
        else if (d < rw + rh) { d -= rw; x = dcx + rw / 2; y = dcy - rh / 2 + d; }
        else if (d < 2 * rw + rh) { d -= rw + rh; x = dcx + rw / 2 - d; y = dcy + rh / 2; }
        else { d -= 2 * rw + rh; x = dcx - rw / 2; y = dcy + rh / 2 - d; }
        pts.push({ x, y });
      }
      return pts;
    }
    function drawGarland(dcx, dcy, dw, dh, elapsed, alpha) {
      const pts = garlandPointsForRect(dcx, dcy, dw, dh);
      ctx.save();
      ctx.globalAlpha = alpha * 0.5;
      ctx.strokeStyle = '#2a5c2a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      pts.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      const tick = Math.floor(elapsed / 200);
      pts.forEach((p, i) => {
        const colorIdx = Math.abs((tick * 97 + i * 131) % GARLAND_COLORS.length);
        const color = GARLAND_COLORS[colorIdx];
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    // ---- НЛО ----
    function drawUFO(x, y, tsec, scale) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      const domeGrad = ctx.createLinearGradient(0, -40, 0, -6);
      domeGrad.addColorStop(0, '#d5f1ff');
      domeGrad.addColorStop(1, '#5fa8d8');
      ctx.fillStyle = domeGrad;
      ctx.beginPath();
      ctx.ellipse(0, -14, 26, 26, 0, Math.PI, 0);
      ctx.fill();
      const bodyGrad = ctx.createLinearGradient(-70, -10, 70, 20);
      bodyGrad.addColorStop(0, '#8f96a3');
      bodyGrad.addColorStop(0.5, '#e4e8ee');
      bodyGrad.addColorStop(1, '#6b7280');
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 70, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#565c66';
      ctx.beginPath();
      ctx.ellipse(0, 11, 46, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const lx = Math.cos(a) * 62, ly = Math.sin(a) * 15;
        const on = Math.sin(tsec * 6 + i * 1.3) > 0;
        ctx.fillStyle = on ? '#fff59d' : '#6a5a20';
        ctx.beginPath();
        ctx.arc(lx, ly, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    function drawBeam(ufoX, ufoY, targetX, targetY, extendProgress, alpha) {
      const bottomY = ufoY + (targetY - ufoY) * extendProgress;
      const topHalfW = 12, bottomHalfW = 10 + 55 * extendProgress;
      ctx.save();
      ctx.globalAlpha = alpha * 0.5;
      const grad = ctx.createLinearGradient(ufoX, ufoY, ufoX, bottomY);
      grad.addColorStop(0, 'rgba(90,255,140,0.05)');
      grad.addColorStop(1, 'rgba(90,255,140,0.55)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(ufoX - topHalfW, ufoY + 8);
      ctx.lineTo(ufoX + topHalfW, ufoY + 8);
      ctx.lineTo(targetX + bottomHalfW, bottomY);
      ctx.lineTo(targetX - bottomHalfW, bottomY);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // ---- Таймлайн (мс), точно по раскадровке ----
    const total = 6000;   // +1 секунда в самом конце (дольше держится статичная сцена)
    const overlayInEnd = 300;
    const digitsInStart = 300, digitsInEnd = 500;
    const ufoStart = 1000, ufoArrive = 1600;
    const beamExtendEnd = 1900;
    const abductEnd = 2300;
    const ufoDepartEnd = 2500;
    const materializeAt = 2500, flashEnd = 2800;
    const textStart = 3000, textEnd = 3500;
    const fadeOutStart = 5600;

    const digit5Top = digitCY - digitH / 2;
    const ufoTargetX = leftCX, ufoTargetY = digit5Top - 90;
    const ufoStartPos = { x: -180, y: -140 };

    const TEXT = 'братуха';
    let startTime = null;

    function animate(ts) {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      const tsec = elapsed / 1000;
      ctx.clearRect(0, 0, w, h);

      // 1. overlay
      const overlayAlpha = 0.72 * (elapsed < overlayInEnd
        ? easeOutCubic(clamp01(elapsed / overlayInEnd))
        : 1) * (elapsed > fadeOutStart ? clamp01(1 - (elapsed - fadeOutStart) / (total - fadeOutStart)) : 1);
      ctx.save();
      ctx.fillStyle = `rgba(0,0,0,${overlayAlpha})`;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      const globalAlpha = elapsed > fadeOutStart ? clamp01(1 - (elapsed - fadeOutStart) / (total - fadeOutStart)) : 1;
      if (globalAlpha <= 0.01) {
        if (elapsed < total) { requestAnimationFrame(animate); } else { canvas.remove(); }
        return;
      }

      // 2. цифры проявляются
      const digitsAlpha = clamp01((elapsed - digitsInStart) / (digitsInEnd - digitsInStart)) * globalAlpha;
      if (digitsAlpha > 0) {
        // правая цифра "2" — присутствует всегда с момента появления
        drawDigit(rightCX, digitCY, digitW, digitH, DIGIT_2, digitsAlpha);
        drawGarland(rightCX, digitCY, digitW, digitH, elapsed, digitsAlpha);

        // левая позиция: "5" до похищения, пусто во время полёта НЛО, "4" после материализации
        if (elapsed < abductEnd) {
          // во время похищения (1900-2300) цифра 5 поднимается по лучу и уменьшается
          if (elapsed >= beamExtendEnd) {
            const at = clamp01((elapsed - beamExtendEnd) / (abductEnd - beamExtendEnd));
            const riseT = easeInOutCubic(at);
            const dy = -(digit5Top - ufoTargetY - 10) * riseT;
            const scale = 1 - riseT * 0.85;
            const alpha5 = digitsAlpha * (1 - riseT * 0.9);
            ctx.save();
            ctx.translate(leftCX, digitCY + dy);
            ctx.scale(scale, scale);
            drawDigit(0, 0, digitW, digitH, DIGIT_5, alpha5);
            ctx.restore();
          } else {
            drawDigit(leftCX, digitCY, digitW, digitH, DIGIT_5, digitsAlpha);
            drawGarland(leftCX, digitCY, digitW, digitH, elapsed, digitsAlpha);
          }
        } else if (elapsed >= materializeAt) {
          drawDigit(leftCX, digitCY, digitW, digitH, DIGIT_4, digitsAlpha);
          drawGarland(leftCX, digitCY, digitW, digitH, elapsed, digitsAlpha);
          // вспышка материализации
          if (elapsed < flashEnd) {
            const ft = 1 - clamp01((elapsed - materializeAt) / (flashEnd - materializeAt));
            ctx.save();
            ctx.globalAlpha = ft * 0.85 * globalAlpha;
            const g = ctx.createRadialGradient(leftCX, digitCY, 0, leftCX, digitCY, digitW * 0.9);
            g.addColorStop(0, 'rgba(255,255,255,0.95)');
            g.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
          }
        }
        // между abductEnd и materializeAt (2300-2500) слева пусто — НЛО улетает с добычей
      }

      // 3. НЛО: прилёт по дуге -> луч -> похищение -> быстрый улёт вверх
      if (elapsed >= ufoStart && elapsed < ufoDepartEnd) {
        let ux, uy, uScale = 1;
        if (elapsed < ufoArrive) {
          const t = easeOutCubic(clamp01((elapsed - ufoStart) / (ufoArrive - ufoStart)));
          ux = ufoStartPos.x + (ufoTargetX - ufoStartPos.x) * t;
          uy = ufoStartPos.y + (ufoTargetY - ufoStartPos.y) * t - Math.sin(t * Math.PI) * 70;
        } else if (elapsed < ufoDepartEnd) {
          ux = ufoTargetX; uy = ufoTargetY;
          if (elapsed >= abductEnd) {
            const dt = clamp01((elapsed - abductEnd) / (ufoDepartEnd - abductEnd));
            uy = ufoTargetY - dt * dt * (h * 0.9 + 200);
            uScale = 1 - dt * 0.15;
          }
        }
        const ufoAlpha = globalAlpha;
        ctx.save();
        ctx.globalAlpha = ufoAlpha;
        if (elapsed >= ufoArrive && elapsed < beamExtendEnd) {
          const bt = clamp01((elapsed - ufoArrive) / (beamExtendEnd - ufoArrive));
          drawBeam(ux, uy, ufoTargetX, digit5Top + 6, bt, ufoAlpha);
        } else if (elapsed >= beamExtendEnd && elapsed < abductEnd) {
          drawBeam(ux, uy, ufoTargetX, digit5Top + 6, 1, ufoAlpha);
        }
        ctx.restore();
        drawUFO(ux, uy, tsec, uScale);
      }

      // 4. надпись "братуха" — печатная машинка
      if (elapsed >= textStart) {
        const chars = Math.round(clamp01((elapsed - textStart) / (textEnd - textStart)) * TEXT.length);
        const shown = TEXT.slice(0, chars);
        const textAlpha = globalAlpha;
        ctx.save();
        ctx.globalAlpha = textAlpha;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${Math.round(digitH * 0.16)}px "Courier New", monospace`;
        const textY = digitCY + digitH / 2 + digitH * 0.22;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillText(shown, cx + 3, textY + 3);
        ctx.fillStyle = '#ff9a2e';
        ctx.fillText(shown, cx, textY);
        ctx.restore();
      }

      if (elapsed < total) {
        requestAnimationFrame(animate);
      } else {
        canvas.remove();
      }
    }

    requestAnimationFrame(animate);
  });

  // ============================================================
  // spiderman – отсылка на "Человек-паук 2" (сцена с поездом): сайт
  // буквально разделяется по вертикали на левую и правую половину и
  // САМ начинает разъезжаться в стороны, затем из центра вылетает
  // паутина, летит к краям, догоняет и сдерживает дальнейшее расхождение,
  // а после стягивает половины обратно с эффектом упругой отдачи.
  // Обе половины — настоящий контент сайта (клон DOM), а не рисунок.
  // ============================================================
  addEasterEgg('spiderman', 'SPIDERMAN', function() {
    const w = window.innerWidth, h = window.innerHeight;

    // Настоящие половины сайта — клоны body, обрезанные clip-path'ом.
    // Canvas не умеет копировать содержимое других canvas при cloneNode,
    // поэтому вручную переносим пиксели каждого canvas на сайте в клон.
    const originalCanvases = Array.from(document.body.querySelectorAll('canvas'));
    function cloneHalf(clipPath) {
      const clone = document.body.cloneNode(true);
      clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
      clone.style.cssText = `position:fixed;top:0;left:0;width:100vw;height:100vh;margin:0;pointer-events:none;overflow:hidden;z-index:299000;clip-path:${clipPath};-webkit-clip-path:${clipPath};background:inherit;`;
      const clonedCanvases = clone.querySelectorAll('canvas');
      clonedCanvases.forEach((cc, i) => {
        const orig = originalCanvases[i];
        if (orig && orig.width > 0 && orig.height > 0) {
          try { cc.getContext('2d').drawImage(orig, 0, 0); } catch (e) { /* игнорируем недоступные canvas */ }
        }
      });
      return clone;
    }
    const leftClone = cloneHalf('inset(0 50% 0 0)');
    const rightClone = cloneHalf('inset(0 0 0 50%)');
    document.body.appendChild(leftClone);
    document.body.appendChild(rightClone);

    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.style.cssText = 'position:fixed;top:0;left:0;z-index:300000;pointer-events:none;background:transparent;';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const clamp01 = t => Math.max(0, Math.min(1, t));
    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
    const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const cx = w / 2, cy = h / 2;
    const maxOffset = w * 0.16;

    // Точки крепления — углы и середины боковых краёв: левые тянутся
    // с левой половиной, правые — с правой
    const corners = [
      { baseX: 0, baseY: 0, side: 'left' },
      { baseX: 0, baseY: h, side: 'left' },
      { baseX: 0, baseY: h / 2, side: 'left' },
      { baseX: w, baseY: 0, side: 'right' },
      { baseX: w, baseY: h, side: 'right' },
      { baseX: w, baseY: h / 2, side: 'right' }
    ];

    function drawWeb(offsetX, reach, alpha) {
      const leftOffset = -offsetX, rightOffset = offsetX;
      const tension = clamp01(Math.abs(offsetX) / maxOffset);
      const pts = corners.map(c => ({
        x: c.baseX + (c.side === 'left' ? leftOffset : rightOffset),
        y: c.baseY
      }));
      // нить летит к текущему (уже смещённому) положению угла — паутина словно
      // "догоняет" разъезжающиеся половины, а не бьёт в их исходную позицию
      const reachPts = pts.map(p => ({
        x: cx + (p.x - cx) * reach,
        y: cy + (p.y - cy) * reach
      }));

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 1.4;
      ctx.shadowColor = 'rgba(255,255,255,0.6)';
      ctx.shadowBlur = 4;

      // просто нити, выстреленные из центра к краям — без колец и без
      // замкнутых фигур, как настоящая паутина Человека-паука
      for (const p of reachPts) {
        const dx = p.x - cx, dy = p.y - cy;
        const len = Math.hypot(dx, dy) || 1;
        const perpX = -dy / len, perpY = dx / len;
        const sag = (1 - tension) * 20;
        const midX = (cx + p.x) / 2 + perpX * sag;
        const midY = (cy + p.y) / 2 + perpY * sag;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.quadraticCurveTo(midX, midY, p.x, p.y);
        ctx.stroke();
      }

      // светящийся кончик на растущей нити, пока она ещё летит к краю
      if (reach < 0.98) {
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.shadowBlur = 10;
        for (const p of reachPts) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // центральный узел паутины
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Таймлайн: сайт САМ начинает расходиться в стороны -> из центра
    // вылетает паутина и летит к краям, догоняя разъезжающиеся половины ->
    // натягивается и сдерживает дальнейшее расхождение -> стягивает половины
    // обратно с упругой отдачей -> удержание -> исчезновение
    const total = 5800;
    const freeDriftEnd = 1000;      // сайт расходится сам, паутины ещё нет
    const webShootStart = 900, webShootEnd = 1500; // паутина летит к краям
    const restrainedEnd = 2500;     // паутина сдерживает — расхождение продолжается, но медленно, до предела
    const holdPeakEnd = 3000;       // натянута, держит на пределе
    const pullBackEnd = 3900;       // стягивает половины обратно
    const overshootEnd = 4300;
    const bounceEnd = 4600;
    const settleEnd = 4900;
    const fadeStart = 5200;

    const preWebOffset = maxOffset * 0.55; // насколько сайт успевает разъехаться сам, до натяжения паутины

    let startTime = null;

    function animate(ts) {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      ctx.clearRect(0, 0, w, h);

      let offset;
      if (elapsed < freeDriftEnd) {
        // свободное расхождение — паутины ещё нет
        offset = preWebOffset * easeOutCubic(clamp01(elapsed / freeDriftEnd));
      } else if (elapsed < restrainedEnd) {
        // паутина уже поймала края и сдерживает, но расхождение по инерции
        // ещё чуть продолжается — медленно, до предела
        const t = easeOutCubic(clamp01((elapsed - freeDriftEnd) / (restrainedEnd - freeDriftEnd)));
        offset = preWebOffset + (maxOffset - preWebOffset) * t;
      } else if (elapsed < holdPeakEnd) {
        offset = maxOffset; // натянута до предела, держит
      } else if (elapsed < pullBackEnd) {
        const t = easeInOutCubic(clamp01((elapsed - holdPeakEnd) / (pullBackEnd - holdPeakEnd)));
        offset = maxOffset * (1 - t); // стягивает обратно к центру
      } else if (elapsed < overshootEnd) {
        const t = easeInOutCubic(clamp01((elapsed - pullBackEnd) / (overshootEnd - pullBackEnd)));
        offset = -maxOffset * 0.22 * t; // лёгкий перелёт мимо центра
      } else if (elapsed < bounceEnd) {
        const t = easeInOutCubic(clamp01((elapsed - overshootEnd) / (bounceEnd - overshootEnd)));
        offset = -maxOffset * 0.22 + (maxOffset * 0.07 - (-maxOffset * 0.22)) * t;
      } else if (elapsed < settleEnd) {
        const t = easeInOutCubic(clamp01((elapsed - bounceEnd) / (settleEnd - bounceEnd)));
        offset = maxOffset * 0.07 * (1 - t);
      } else {
        offset = 0;
      }

      leftClone.style.transform = `translateX(${-offset}px)`;
      rightClone.style.transform = `translateX(${offset}px)`;

      const fadeAlpha = elapsed > fadeStart ? clamp01(1 - (elapsed - fadeStart) / (total - fadeStart)) : 1;
      leftClone.style.opacity = String(fadeAlpha);
      rightClone.style.opacity = String(fadeAlpha);

      // в зазоре между разъехавшимися половинами раньше было видно исходный,
      // несмещённый сайт под клонами (выглядело как "дубликат") — теперь там тьма
      const gapHalfWidth = Math.max(0, offset);
      if (gapHalfWidth > 0.5) {
        ctx.save();
        ctx.globalAlpha = fadeAlpha;
        ctx.fillStyle = '#000';
        ctx.fillRect(cx - gapHalfWidth, 0, gapHalfWidth * 2, h);
        ctx.restore();
      }

      const webReach = clamp01((elapsed - webShootStart) / (webShootEnd - webShootStart));
      if (webReach > 0) drawWeb(offset, webReach, fadeAlpha);

      if (elapsed < total) {
        requestAnimationFrame(animate);
      } else {
        leftClone.remove();
        rightClone.remove();
        canvas.remove();
      }
    }

    requestAnimationFrame(animate);
  });

  
  
  // ---------- КАЛЕНДАРЬ И ВРЕМЯ ----------
  function updateClock() {
    const now = new Date();
    const msk = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
    const dateStr = msk.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = msk.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    let clockEl = document.getElementById('msk-clock');
    if (!clockEl) {
      clockEl = document.createElement('div'); clockEl.id = 'msk-clock';
      clockEl.className = 'msk-clock-widget';
      const pill = document.getElementById('chat-time-pill');
      (pill || document.body).appendChild(clockEl);
    }
    clockEl.innerHTML = `${dateStr}<br>${timeStr} MSK`;
  }
  setInterval(updateClock, 1000); updateClock();

  // ---------- НОЧНОЙ РЕЖИМ ----------
  function checkNightMode() {
    const now = new Date();
    const msk = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
    if (msk.getHours() >= 22 || msk.getHours() < 6) document.body.classList.add('night-mode');
    else document.body.classList.remove('night-mode');
  }
  setInterval(checkNightMode, 60000); checkNightMode();
  
    
  // ---------- ПОГОДА (короткие эффекты 6–10 мин, пауза 1–3 часа, единая по МСК, надёжный запуск) ----------
  // ---------- DVD-ЗАСТАВКА ----------
  let inactivityTimer;
  const DVD_COLORS = ['#ff0055','#00e5ff','#ffee00','#39ff14','#ff8800','#c400ff','#00ff9d','#ff2e63'];
  function resetInactivity() {
    clearTimeout(inactivityTimer);
    const dvd = document.getElementById('dvd-logo'); if (dvd) dvd.remove();
    inactivityTimer = setTimeout(() => {
      const logo = document.createElement('div'); logo.id = 'dvd-logo'; logo.textContent = 'Купи пиксель';
      let colorIdx = 0;
      logo.style.cssText = `position:fixed; top:0; left:0; background:${DVD_COLORS[0]}; color:#000; padding:10px 16px; font-family:monospace; font-weight:bold; z-index:600; border-radius:5px; white-space:nowrap; box-shadow:0 0 12px rgba(0,0,0,0.5); will-change:transform;`;
      document.body.appendChild(logo);

      // Координаты x,y — это ВЕРХНИЙ ЛЕВЫЙ угол блока (без transform-смещения),
      // поэтому отскок от стенок происходит ровно по видимым краям экрана,
      // как в настоящей DVD-заставке.
      const w = logo.offsetWidth, h = logo.offsetHeight;
      let x = Math.random() * Math.max(1, window.innerWidth - w);
      let y = Math.random() * Math.max(1, window.innerHeight - h);
      let dx = (Math.random() < 0.5 ? 1 : -1) * 1.6;
      let dy = (Math.random() < 0.5 ? 1 : -1) * 1.6;

      function nextColor() {
        colorIdx = (colorIdx + 1) % DVD_COLORS.length;
        logo.style.background = DVD_COLORS[colorIdx];
      }

      function animate() {
        x += dx; y += dy;
        const maxX = window.innerWidth - logo.offsetWidth;
        const maxY = window.innerHeight - logo.offsetHeight;
        let bounced = false;

        if (x <= 0) { x = 0; dx = Math.abs(dx); bounced = true; }
        else if (x >= maxX) { x = maxX; dx = -Math.abs(dx); bounced = true; }

        if (y <= 0) { y = 0; dy = Math.abs(dy); bounced = true; }
        else if (y >= maxY) { y = maxY; dy = -Math.abs(dy); bounced = true; }

        if (bounced) {
          nextColor();
          checkCorner(x, y, maxX, maxY);
        }

        logo.style.transform = `translate(${x}px, ${y}px)`;
        if (document.getElementById('dvd-logo')) requestAnimationFrame(animate);
      }
      function checkCorner(x, y, maxX, maxY) {
        if ((x <= 0 || x >= maxX) && (y <= 0 || y >= maxY)) {
          const msg = document.createElement('div'); msg.textContent = '🎯 Точно в угол!';
       Object.assign(msg.style, { position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', color: '#ff0', background: 'rgba(0,0,0,0.8)', padding: '0.3rem 1rem', borderRadius: '5px', zIndex: 700, fontWeight: 'bold', pointerEvents: 'none' });
          document.body.appendChild(msg); setTimeout(() => msg.remove(), 1000);
        }
      }
      animate();
      window.addEventListener('mousemove', () => logo.remove(), { once: true });
    }, 30000);
  }
  window.addEventListener('mousemove', resetInactivity);
  window.addEventListener('keydown', resetInactivity);
  resetInactivity();

  // Экспортируем то, что нужно играм (games.js) и остальному коду —
  // они теперь в отдельном файле/замыкании и не видят эти переменные напрямую
  window.addEasterEgg = addEasterEgg;
  window.showMessage = showMessage;
  window.effectsLayer = effectsLayer;
})();
