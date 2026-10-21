(async function() {
  // ===== КОНФИГ =====
  const firebaseConfig = {
    apiKey: "AIzaSyCDyyer9lSbVexCJuwt8fhWoE3DPg04tS8",
    authDomain: "pixelbillboard-chat.firebaseapp.com",
    databaseURL: "https://pixelbillboard-chat-default-rtdb.firebaseio.com",
    projectId: "pixelbillboard-chat",
    storageBucket: "pixelbillboard-chat.firebasestorage.app",
    messagingSenderId: "704083995474",
    appId: "1:704083995474:web:a0e9227d94113e8a21688b"
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();
  const chatRef = db.ref('public-chat/messages');
  const bansRef = db.ref('bans');
  const spamRef = db.ref('spamProtection');
  const typingRef = db.ref('typing');
  const reportsRef = db.ref('reports');
  const moderationLogRef = db.ref('moderationLog');   // журнал модерации: кто/когда/за что
  const reporterActivityRef = db.ref('reporterActivity'); // недавние жалобы каждого пользователя — для защиты от серийных жалобщиков

  // ===== АВТОРИЗАЦИЯ =====
  // Настоящий, проверяемый сервером uid (не случайная строка в
  // localStorage, как раньше) — на нём и держатся правила безопасности
  // в Firebase: auth.uid нельзя подделать из браузера.
  let uid;
  try {
    let currentUser = firebase.auth().currentUser;
    if (!currentUser) {
      const cred = await firebase.auth().signInAnonymously();
      currentUser = cred.user;
    }
    uid = currentUser.uid;
  } catch (authError) {
    console.error('Не удалось выполнить анонимный вход в Firebase:', authError);
    // Если в консоли Firebase не включён Anonymous Sign-In — чат не сможет
    // писать/читать данные по новым правилам безопасности. Останавливаемся
    // здесь, а не продолжаем с несуществующим uid.
    return;
  }

  // ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====

  let profile = getProfile();
  const ignoredUsers = new Set(JSON.parse(localStorage.getItem('ignoredUsers') || '[]'));

  function getProfile() {
    try {
      const saved = JSON.parse(localStorage.getItem('pixelProfile'));
      return saved || { nickname: 'Гость', equipped: { avatar: 'default', frame: 'none', nickColor: '#fff' } };
    } catch(e) {
      return { nickname: 'Гость', equipped: { avatar: 'default', frame: 'none', nickColor: '#fff' } };
    }
  }

  // ===== ФИЛЬТРЫ =====
  const allowedDomains = ['pixelbillboard.ru','pixelbillboard.github.io','t.me/pixelbillboard_ru','t.me/yourtelegram'];

  // ---------- ПРОДВИНУТЫЙ ФИЛЬТР МАТА И ОСКОРБЛЕНИЙ ----------
  // Многоязычный: русский, украинский, белорусский (общий кириллический
  // пайплайн — эти языки делят большую часть бранной лексики и обходов)
  // + отдельный английский пайплайн (латиница).
  //
  // Устойчив к типичным обходам:
  //  - похожие символы вместо букв:  х->x/}{/)( , а->@/4, о->0, у->y/u, и->1/!, е->3 ...
  //  - разделители между буквами:    х.у.й, х_у_й, х-у-й, х у й
  //  - повтор букв:                  хууууй, пииииздец
  //  - буквы других славянских алфавитов: і/ї/є/ґ (укр.), ў (бел.)
  //  - маскировка эмодзи/символами с сохранением части букв: f👍ck, с..а
  //    (первая+последняя буква совпадают с корнем, а "утраченные" буквы
  //    компенсируются количеством использованных символов-разделителей)
  //
  // ВАЖНО (исправленный баг): раньше строка очищалась только до кириллицы
  // (regex вырезал вообще все латинские буквы), из-за чего английские
  // корни мата физически не могли сработать. Теперь кириллица и латиница
  // проверяются раздельными пайплайнами, не мешая друг другу.

  const COL_BAN = 'ban', COL_WARN = 'warn';

  // Приведение букв других кириллических алфавитов к общему знаменателю
  // (укр. і/ї/є/ґ, бел. ў) — чтобы один список корней ловил обходы во всех
  // языках сразу, без дублирования словарей
  function pfNormalizeCyrillicScript(text) {
    return text
      .replace(/і/g, 'и').replace(/ї/g, 'и')
      .replace(/є/g, 'е').replace(/ґ/g, 'г')
      .replace(/ў/g, 'у');
  }

  // Похожие по начертанию латинские символы -> кириллица (для обхода
  // мата русскими/укр./бел. буквами, написанными "на латинице")
  const PF_HOMOGLYPHS_CYR = {
    'a': 'а', '@': 'а', '4': 'а',
    'b': 'в', '6': 'б',
    'c': 'с', '(': 'с',
    'e': 'е', '3': 'з',
    'h': 'н',
    'k': 'к',
    'm': 'м',
    'n': 'п',
    'o': 'о', '0': 'о',
    'p': 'р',
    'r': 'г',
    't': 'т', '7': 'т',
    'u': 'у', 'y': 'у',
    'x': 'х',
    'i': 'и', '1': 'и', '!': 'и',
    'g': 'г',
    'd': 'д',
    's': 'с', '$': 'с', '5': 'с',
    'w': 'ш',
    'z': 'з'
  };
  // Лёгкий leet-обход для английских слов (не трогаем буквы — только цифры/символы)
  const PF_LEET_LAT = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '$': 's', '@': 'a' };

  const PF_ROOTS_CYR = [
    // --- мат (severity: ban), общий для ru/ua/by ---
    { root: 'хуй', severity: COL_BAN }, { root: 'хуя', severity: COL_BAN }, { root: 'хуе', severity: COL_BAN },
    { root: 'пизд', severity: COL_BAN },
    { root: 'ебат', severity: COL_BAN }, { root: 'ебал', severity: COL_BAN }, { root: 'ебан', severity: COL_BAN },
    { root: 'ебуч', severity: COL_BAN }, { root: 'ибат', severity: COL_BAN }, // ibat — після нормалізації "їбати" (укр.)
    { root: 'бляд', severity: COL_BAN }, { root: 'бля', severity: COL_BAN },
    { root: 'сука', severity: COL_BAN }, { root: 'суки', severity: COL_BAN }, { root: 'суче', severity: COL_BAN }, { root: 'сучк', severity: COL_BAN },
    { root: 'мудак', severity: COL_BAN }, { root: 'мудил', severity: COL_BAN },
    { root: 'мраз', severity: COL_BAN },
    { root: 'гандон', severity: COL_BAN },
    { root: 'долбоеб', severity: COL_BAN },
    { root: 'залуп', severity: COL_BAN },
    { root: 'манда', severity: COL_BAN },
    { root: 'пидор', severity: COL_BAN }, { root: 'пидар', severity: COL_BAN },
    { root: 'гавно', severity: COL_BAN }, { root: 'говно', severity: COL_BAN },
    { root: 'падл', severity: COL_BAN },   // падло/падлюка — оскорбление, общее для ru/ua/by

    // --- грубые/оскорбительные, не мат (severity: warn) ---
    { root: 'идиот', severity: COL_WARN },
    { root: 'дебил', severity: COL_WARN },
    { root: 'кретин', severity: COL_WARN },
    { root: 'придурок', severity: COL_WARN },
    { root: 'ублюдок', severity: COL_WARN },
    { root: 'сволоч', severity: COL_WARN },
    { root: 'тварь', severity: COL_WARN },
    { root: 'урод', severity: COL_WARN },
    { root: 'быдл', severity: COL_WARN },   // быдло/быдла
    { root: 'вирод', severity: COL_WARN },  // виродок (укр.)
    { root: 'вырад', severity: COL_WARN },  // вырадак (бел.)
    { root: 'йолоп', severity: COL_WARN },  // йолоп (укр., "дурень")
    { root: 'идыё', severity: COL_WARN }    // ідыёт (бел. написание "идиот")
  ];

  const PF_ROOTS_LAT = [
    { root: 'fuck', severity: COL_BAN }, { root: 'shit', severity: COL_BAN }, { root: 'bitch', severity: COL_BAN },
    { root: 'cunt', severity: COL_BAN }, { root: 'whore', severity: COL_BAN }, { root: 'dick', severity: COL_BAN },
    { root: 'pussy', severity: COL_BAN }, { root: 'bastard', severity: COL_BAN }, { root: 'asshole', severity: COL_BAN },
    { root: 'slut', severity: COL_BAN }, { root: 'retard', severity: COL_BAN },
    { root: 'idiot', severity: COL_WARN }, { root: 'moron', severity: COL_WARN },
    { root: 'jerk', severity: COL_WARN }, { root: 'loser', severity: COL_WARN }
  ];

  // Слова-исключения, чтобы не резать легитимные слова
  const PF_WHITELIST = ['сук', 'сучок', 'сукно', 'дурак'];

  function pfCollapseRepeats(word) { return word.replace(/(.)\1{1,}/g, '$1'); }

  // Проверка "маскировки" символами/эмодзи с сохранением части букв:
  // "с..а" -> буквы "са" — это подпоследовательность корня "сука", а
  // "утраченные" 2 буквы (у,к) правдоподобно спрятаны за 2 разделителями.
  // Применяется только к самым грубым словам (ban) и только когда в
  // токене реально что-то похоже на маскировку — иначе риск ложных срабатываний.
  function pfIsSubsequence(sub, str) {
    let i = 0;
    for (let j = 0; j < str.length && i < sub.length; j++) {
      if (str[j] === sub[i]) i++;
    }
    return i === sub.length;
  }
  function pfCheckMasked(rawToken, strippedToken, roots) {
    if (strippedToken.length < 2) return null;
    const separatorBudget = rawToken.length - strippedToken.length;
    if (separatorBudget < 1) return null;
    for (const { root, severity } of roots) {
      if (severity !== COL_BAN) continue;
      if (root.length < 4) continue;
      if (strippedToken.length + 3 < root.length) continue;
      if (root.length - strippedToken.length > separatorBudget + 1) continue;
      if (pfIsSubsequence(strippedToken, root)) return severity;
    }
    return null;
  }

  function pfCheckTokenAgainst(rawToken, strippedToken, roots) {
    if (!strippedToken || PF_WHITELIST.includes(strippedToken)) return null;
    for (const { root, severity } of roots) {
      if (strippedToken.includes(root)) return severity;
      if (root.length >= 3 && strippedToken.length >= root.length - 1 && strippedToken.length <= root.length + 2) {
        if (pfLevenshteinLE(strippedToken, root, 1)) return severity;
      }
    }
    const masked = pfCheckMasked(rawToken, strippedToken, roots);
    if (masked) return masked;
    return null;
  }

  function pfLevenshteinLE(a, b, maxDist) {
    if (Math.abs(a.length - b.length) > maxDist) return false;
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      }
    }
    return dp[a.length][b.length] <= maxDist;
  }

  // Склеивает подряд идущие очень короткие "слова" (<=2 букв) в одно —
  // ловит обход "х у й" (буквы разбиты пробелами по отдельности)
  function pfMergeShortTokens(tokens) {
    const merged = [];
    let buffer = '';
    for (const t of tokens) {
      if (t.length > 0 && t.length <= 2) {
        buffer += t;
      } else {
        if (buffer) { merged.push(buffer); buffer = ''; }
        if (t) merged.push(t);
      }
    }
    if (buffer) merged.push(buffer);
    return merged;
  }

  function pfCheckText(text) {
    if (!text) return 'clean';
    const lower = text.toLowerCase();
    let worst = 'clean';

    // ---- Пайплайн 1: кириллица (ru/ua/by) ----
    let cyrText = pfNormalizeCyrillicScript(lower);
    cyrText = cyrText.replace(/\}\{/g, 'х').replace(/\)\(/g, 'х');
    cyrText = cyrText.replace(/[a-z0-9@$!()]/g, ch => PF_HOMOGLYPHS_CYR[ch] !== undefined ? PF_HOMOGLYPHS_CYR[ch] : ch);
    const cyrRawWords = cyrText.split(/\s+/).filter(Boolean);
    const cyrStrippedWords = cyrRawWords.map(w => pfCollapseRepeats(w.replace(/[^а-яё]/gi, '')));
    const cyrMergedStripped = pfMergeShortTokens(cyrStrippedWords);
    for (let i = 0; i < cyrRawWords.length; i++) {
      const sev = pfCheckTokenAgainst(cyrRawWords[i], cyrStrippedWords[i], PF_ROOTS_CYR);
      if (sev === 'ban') return 'ban';
      if (sev === 'warn') worst = 'warn';
    }
    for (const merged of cyrMergedStripped) {
      const sev = pfCheckTokenAgainst(merged, merged, PF_ROOTS_CYR);
      if (sev === 'ban') return 'ban';
      if (sev === 'warn') worst = 'warn';
    }
    // "слипшийся" текст без пробелов — ловит "х у й" по всей строке целиком
    const cyrCompact = cyrText.replace(/[^а-яё]/gi, '');
    for (const { root, severity } of PF_ROOTS_CYR) {
      if (cyrCompact.includes(root)) { if (severity === 'ban') return 'ban'; worst = 'warn'; }
    }

    // ---- Пайплайн 2: латиница (английский) ----
    let latText = lower.replace(/[013457$@]/g, ch => PF_LEET_LAT[ch] || ch);
    const latRawWords = latText.split(/\s+/).filter(Boolean);
    const latStrippedWords = latRawWords.map(w => pfCollapseRepeats(w.replace(/[^a-z]/gi, '')));
    const latMergedStripped = pfMergeShortTokens(latStrippedWords);
    for (let i = 0; i < latRawWords.length; i++) {
      const sev = pfCheckTokenAgainst(latRawWords[i], latStrippedWords[i], PF_ROOTS_LAT);
      if (sev === 'ban') return 'ban';
      if (sev === 'warn') worst = 'warn';
    }
    for (const merged of latMergedStripped) {
      const sev = pfCheckTokenAgainst(merged, merged, PF_ROOTS_LAT);
      if (sev === 'ban') return 'ban';
      if (sev === 'warn') worst = 'warn';
    }
    const latCompact = latText.replace(/[^a-z]/gi, '');
    for (const { root, severity } of PF_ROOTS_LAT) {
      if (latCompact.includes(root)) { if (severity === 'ban') return 'ban'; worst = 'warn'; }
    }

    return worst;
  }
  // ---------- конец фильтра мата ----------

  function containsLink(text) { return /(https?:\/\/|www\.|\.(com|ru|org|net|io|gg|me|tv|info|biz|su|рф|укр))/i.test(text); }
  function isAllowedLink(text) {
    const urls = text.match(/(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(com|ru|org|net|io|gg|me|tv|info|biz|su|рф|укр)[^\s]*)/gi) || [];
    return urls.every(url => allowedDomains.some(d => url.toLowerCase().includes(d)));
  }
  

  // ===== ЭЛЕМЕНТЫ =====
  const chatBtn = document.getElementById('fire-chat-btn');
  const chatModal = document.getElementById('fire-chat-modal');
  const chatClose = document.getElementById('fire-chat-close');
  const messagesDiv = document.getElementById('fire-chat-messages');
  const input = document.getElementById('fire-chat-input');
  const sendBtn = document.getElementById('fire-chat-send');
  const typingDiv = document.getElementById('fire-chat-typing');
  const emojiBtn = document.getElementById('emoji-btn');
  const emojiPanel = document.getElementById('emoji-panel');

  // ===== ЗВУК =====
  // Мягкий двухтональный «поп» для новых сообщений (через общий звуковой
  // движок сайта). Если движок недоступен — старый писк как запасной вариант.
  function playBeep() {
    if (window.pbSound && window.pbSound.message) {
      window.pbSound.message();
      return;
    }
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 600;
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch(e) {}
  }

  // ===== ИНДИКАТОР "ПЕЧАТАЕТ" =====
  let typingTimeout = null;
  input.addEventListener('input', () => {
    if (input.value.trim() === '') return;
    typingRef.child(uid).set({
      nickname: profile.nickname || 'Гость',
      timestamp: firebase.database.ServerValue.TIMESTAMP
    });
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      typingRef.child(uid).remove();
    }, 2000);
  });

  // Обработка изменений в typing
  typingRef.on('value', (snapshot) => {
    const typings = [];
    snapshot.forEach(child => {
      const data = child.val();
      if (data && data.timestamp && Date.now() - data.timestamp < 2000) {
        typings.push(data.nickname);
      }
    });
    if (typings.length > 0) {
      typingDiv.textContent = typings.join(', ') + ' печатает...';
    } else {
      typingDiv.textContent = '';
    }
  });

  // ===== ПАНЕЛЬ ЭМОДЗИ =====
  // Бесплатные смайлики + купленные в магазине (profile.inventory: emoji_<id>)
  const freeEmojis = ['😀','😂','👍','🔥','💀','🎉','😍','🤔','😢','😡','❤️','🎁'];
  function buildEmojiPanel() {
    emojiPanel.innerHTML = '';
    freeEmojis.forEach(emoji => addEmojiButton(emoji));
    const currentProfile = getProfile();
    const owned = (currentProfile.inventory || []).filter(id => id.startsWith('emoji_'));
    if (owned.length && Array.isArray(window.SHOP_EMOJIS)) {
      owned.forEach(invId => {
        const shopId = invId.replace('emoji_', '');
        const item = window.SHOP_EMOJIS.find(e => e.id === shopId);
        if (item) addEmojiButton(item.emoji);
      });
    }
  }
  function addEmojiButton(emoji) {
    const btn = document.createElement('button');
    btn.textContent = emoji;
    btn.addEventListener('click', () => {
      input.value += emoji;
      input.focus();
      emojiPanel.style.display = 'none';
    });
    emojiPanel.appendChild(btn);
  }
  buildEmojiPanel();
  window.pbRefreshEmojiPanel = buildEmojiPanel;
  emojiBtn.addEventListener('click', () => {
    buildEmojiPanel(); // на случай покупки новых смайликов в магазине
    emojiPanel.style.display = emojiPanel.style.display === 'grid' ? 'none' : 'grid';
  });

  // ===== БАНЫ =====
  async function isBanned() {
    const snap = await bansRef.child(uid).once('value');
    const data = snap.val();
    if (!data) return false;
    if (data.permanent) return true;
    if (data.bannedUntil && data.bannedUntil > Date.now()) return true;
    return false;
  }
  // Журнал модерации: пишем каждое действие (бан, удаление) с указанием
  // кого, когда и за что — чтобы потом можно было разобрать спорные
  // случаи и найти лазейки в фильтре, а не гадать задним числом.
  function logModeration(entry) {
    moderationLogRef.push({ ...entry, timestamp: Date.now() }).catch(() => {});
  }

  async function applyBanTo(targetUid, reason) {
    const banRef = bansRef.child(targetUid);
    const snap = await banRef.once('value');
    let data = snap.val() || { count: 0, permanent: false, bannedUntil: 0 };
    data.count = (data.count || 0) + 1;
    if (data.count >= 3) { data.permanent = true; data.bannedUntil = 0; }
    else if (data.count === 1) data.bannedUntil = Date.now() + 5*60*1000;
    else if (data.count === 2) data.bannedUntil = Date.now() + 5*24*60*60*1000;
    await banRef.set(data);
    logModeration({
      action: 'ban',
      targetUid,
      strikeCount: data.count,
      permanent: !!data.permanent,
      reason: reason || 'unspecified'
    });
  }
  async function applyBan() { return applyBanTo(uid, 'own_message_flagged_on_send'); }

  // Защита от серийных жалобщиков: если один и тот же человек подал много
  // жалоб за короткое время, его СЛЕДУЮЩИЕ жалобы временно не учитываются
  // в счётчике порога (но сама жалоба всё равно фиксируется — не тайно
  // отбрасывается, просто не засчитывается, пока активность не уляжется).
  const REPORTER_WINDOW_MS = 10 * 60 * 1000;   // окно наблюдения — 10 минут
  const REPORTER_THROTTLE_AFTER = 5;           // после 5 жалоб за окно — следующие не считаются
  async function isReporterThrottled(reporterUid) {
    const now = Date.now();
    const activityRef = reporterActivityRef.child(reporterUid);
    const snap = await activityRef.once('value');
    let timestamps = snap.val() || [];
    timestamps = timestamps.filter(t => now - t < REPORTER_WINDOW_MS);
    const throttled = timestamps.length >= REPORTER_THROTTLE_AFTER;
    timestamps.push(now);
    await activityRef.set(timestamps.slice(-30)); // не храним историю бесконечно
    return throttled;
  }

  // ===== АНТИСПАМ =====
  async function isMuted() {
    const snap = await spamRef.child(uid).once('value');
    const data = snap.val();
    return data && data.mutedUntil && data.mutedUntil > Date.now();
  }
  async function updateSpamTimestamps() {
    const snap = await spamRef.child(uid).once('value');
    let data = snap.val() || { messages: [], mutedUntil: 0 };
    const now = Date.now();
    data.messages = data.messages.filter(ts => now - ts < 15000);
    data.messages.push(now);
    if (data.messages.length >= 3 && data.mutedUntil <= now) {
      data.mutedUntil = now + 60*1000;
    }
    data.messages = data.messages.slice(-10);
    await spamRef.child(uid).set(data);
  }

  // ===== ОТПРАВКА =====
  const MAX_MESSAGE_LENGTH = 80;

  async function sendMessage() {
    let text = input.value.trim();
    if (!text) return;
    if (text.length > MAX_MESSAGE_LENGTH) {
      text = text.slice(0, MAX_MESSAGE_LENGTH);
    }
    profile = getProfile(); // обновляем профиль на случай изменений

    if (profile.nickname === 'Гость') {
      alert('Установите ник в профиле, чтобы писать в чат.');
      return;
    }
    if (await isBanned()) {
      alert('Вы заблокированы в чате.');
      return;
    }
    if (await isMuted()) {
      alert('Вы временно заблокированы за спам. Подождите минуту.');
      return;
    }
    const pfResult = pfCheckText(text);
    if (pfResult === 'ban') {
      await applyBan();
      alert('Маты запрещены. Вы получили бан.');
      input.value = '';
      return;
    }
    // 'warn' — подозрительный, но не стопроцентно однозначный случай
    // (грубость, а не явный мат). Вместо мгновенной блокировки с явным
    // предупреждением — теневой мут: сообщение "отправляется" как обычно,
    // автор не замечает никакой разницы и не начинает целенаправленно
    // подбирать обход фильтра, но остальные участники чата его не видят.
    const isShadowMuted = pfResult === 'warn';
    if (isShadowMuted) {
      logModeration({ action: 'shadow_mute', targetUid: uid, reason: 'warn_severity_on_send', messageText: text });
    }

    let shouldDelete = false;
    if (containsLink(text) && !isAllowedLink(text)) {
      shouldDelete = true;
    }

    const msg = {
      uid: uid,
      nickname: profile.nickname,
      avatar: profile.equipped.avatar || 'default',
      frame: profile.equipped.frame || 'none',
      background: profile.equipped.background || 'none',
      color: profile.equipped.nickColor || '#ffffff',
      text: text,
      shadowMuted: isShadowMuted,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    const newMsgRef = await chatRef.push(msg);
    if (shouldDelete) {
      setTimeout(() => newMsgRef.remove(), 1000);
      alert('Ссылка была автоматически удалена.');
    } else {
      await updateSpamTimestamps();
    }
    input.value = '';
    typingRef.child(uid).remove();
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

  // ===== ПОЛУЧЕНИЕ СООБЩЕНИЙ =====
  chatRef.limitToLast(60).on('child_added', snapshot => {
    const msg = snapshot.val();
    msg.key = snapshot.key;
    if (ignoredUsers.has(msg.uid)) return;
    // Теневой мут: сообщение видно только самому автору — для всех
    // остальных оно как будто не существует, автор об этом не знает
    if (msg.shadowMuted && msg.uid !== uid) return;
    displayMessage(msg);
    // Звук, если чат не активен или вкладка скрыта
    if (chatModal.style.display !== 'flex' || document.hidden) {
      playBeep();
    }
  });

  // ===== ОТОБРАЖЕНИЕ =====


function displayMessage(msg) {
  const div = document.createElement('div');
  div.className = 'fire-msg';
  const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '';

  // Аватар (эмодзи)
  let avatarEmoji = '🙂';
  let avatarAnim = '';
  if (typeof AVATARS !== 'undefined') {
    const av = AVATARS.find(a => a.id === msg.avatar);
    if (av) { avatarEmoji = av.emoji; if (av.anim) avatarAnim = av.anim; }
  }

  // Рамка (класс)
  let frameClass = '';
  if (typeof FRAMES !== 'undefined') {
    const fr = FRAMES.find(f => f.id === msg.frame);
    if (fr && fr.id !== 'none') {
      frameClass = 'frame-' + fr.id;
    }
  }

  // Фон аватара — позади аватара, но внутри рамки (фон элемента рисуется
  // под текстовым содержимым, поэтому аватар всегда поверх).
  let avatarBgStyle = '';
  if (typeof window.BACKGROUNDS !== 'undefined') {
    const bg = window.BACKGROUNDS.find(b => b.id === msg.background);
    if (bg && bg.id !== 'none') avatarBgStyle = `style="background:${bg.css}"`;
  }

  // Цвет ника
  const nickColor = msg.color || '#ffffff';
  let nickClass = 'fnick';
  let colorStyle = '';
  if (nickColor === 'rainbow') {
    nickClass += ' rainbow';
  } else {
    colorStyle = `style="color:${escapeHtml(nickColor)}"`;
  }

  // Обработка упоминаний
  let textHtml = escapeHtml(msg.text);
  const currentNick = getProfile().nickname;
  textHtml = textHtml.replace(/@([а-яА-Яa-zA-Z0-9_]+)/g, (match, name) => {
    if (currentNick && name === currentNick) {
      return `<span class="mention mention-me">@${escapeHtml(name)}</span>`;
    } else {
      return `<span class="mention">@${escapeHtml(name)}</span>`;
    }
  });

  // Анимированные смайлики из магазина — оборачиваем в сообщении, чтобы они
  // были видны анимированными и в чате, а не только в магазине.
  if (Array.isArray(window.SHOP_EMOJIS)) {
    window.SHOP_EMOJIS.forEach(em => {
      if (em.anim && textHtml.indexOf(em.emoji) !== -1) {
        textHtml = textHtml.split(em.emoji).join(`<span class="${em.anim}">${em.emoji}</span>`);
      }
    });
  }

  // Контейнер для аватара с внутренним span для эмодзи
  div.innerHTML = `
    <span class="favaframe ${frameClass}" ${avatarBgStyle}>
      <span class="emoji${avatarAnim ? ' ' + avatarAnim : ''}">${avatarEmoji}</span>
    </span>
    <span class="${nickClass}" ${colorStyle}>${escapeHtml(msg.nickname)}</span>
    <span class="ftime">${time}</span>
    ${textHtml}
    <div class="msg-actions">
      <button data-action="report" data-key="${msg.key}" title="Пожаловаться: если сообщение распознано как мат/оскорбление — удалится сразу, иначе нужно 5 жалоб от разных людей">⚠️</button>
      <button data-action="ignore" data-uid="${msg.uid}" title="Заблокировать пользователя: скрыть все его сообщения у себя в чате">🚫</button>
    </div>
  `;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
  

  // ===== ЖАЛОБЫ =====
  messagesDiv.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const key = btn.dataset.key;
    const msgUid = btn.dataset.uid;

    if (action === 'report') {
      // Защита от повторной жалобы
      const reportKey = localStorage.getItem('reported_' + key);
      if (reportKey === uid) {
        alert('Вы уже жаловались на это сообщение.');
        return;
      }
      const reportsForMsg = reportsRef.child(key);
      const existing = await reportsForMsg.child(uid).once('value');
      if (existing.exists()) return;

      // Проверяем, не серийный ли это жалобщик — если да, его жалоба всё
      // равно фиксируется (не тайно отбрасывается), но временно не идёт
      // в счётчик порога для неоднозначных случаев ниже
      const throttled = await isReporterThrottled(uid);
      await reportsForMsg.child(uid).set({ time: Date.now(), throttled });
      localStorage.setItem('reported_' + key, uid);

      // Перепроверяем текст сообщения тем же фильтром, что и при отправке.
      // Если фильтр САМ распознаёт мат/оскорбление — одной жалобы достаточно
      // для немедленного удаления и бана автора (значит, что-то проскочило
      // мимо проверки при отправке — обходить фильтр смысла нет).
      const msgSnap = await chatRef.child(key).once('value');
      const msgData = msgSnap.val();
      if (msgData && msgData.text) {
        const severity = pfCheckText(msgData.text);
        if (severity !== 'clean') {
          await chatRef.child(key).remove();
          await reportsForMsg.remove();
          if (msgData.uid) await applyBanTo(msgData.uid, 'reported_and_filter_confirmed:' + severity);
          logModeration({ action: 'delete_message', messageKey: key, reason: 'filter_confirmed_on_report', reportedBy: uid });
          return;
        }
      }

      // Если фильтр не считает сообщение оскорблением — это спорный,
      // субъективный случай (не мат, а что-то другое), и для его удаления
      // нужен более широкий консенсус, а не 1-3 человека, которые решили
      // "задавить" кого-то жалобами. Порог поднят до 5, а жалобы серийных
      // жалобщиков (throttled) в счётчик не идут.
      const REPORT_THRESHOLD_UNFLAGGED = 5;
      const allReports = await reportsForMsg.once('value');
      let count = 0;
      allReports.forEach(child => { if (!child.val() || !child.val().throttled) count++; });
      if (count >= REPORT_THRESHOLD_UNFLAGGED) {
        await chatRef.child(key).remove();
        await reportsForMsg.remove();
        logModeration({ action: 'delete_message', messageKey: key, reason: 'report_threshold_reached', reportCount: count });
      }
    } else if (action === 'ignore') {
      if (msgUid === uid) return;
      ignoredUsers.add(msgUid);
      localStorage.setItem('ignoredUsers', JSON.stringify([...ignoredUsers]));
      // Удаляем сообщения этого пользователя из видимости
      const msgs = messagesDiv.children;
      for (let i = msgs.length - 1; i >= 0; i--) {
        const el = msgs[i];
        // Предполагаем, что у нас нет прямого доступа к uid в DOM, поэтому перезагрузим сообщения?
        // Проще перезагрузить все сообщения заново.
      }
      // Перезагружаем сообщения, чтобы скрыть игнорируемые
      messagesDiv.innerHTML = '';
      chatRef.limitToLast(60).once('value', snapshot => {
        snapshot.forEach(child => {
          const msg = child.val();
          msg.key = child.key;
          if (ignoredUsers.has(msg.uid)) return;
          if (msg.shadowMuted && msg.uid !== uid) return;
          displayMessage(msg);
        });
      });
    }
  });

  // ===== ОЧИСТКА СТАРЫХ СООБЩЕНИЙ (60) =====
  chatRef.on('value', snapshot => {
    const messages = [];
    snapshot.forEach(child => messages.push({ key: child.key, timestamp: child.val().timestamp }));
    if (messages.length > 60) {
      messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      const toRemove = messages.slice(0, messages.length - 60);
      toRemove.forEach(m => chatRef.child(m.key).remove());
    }
  });

  // ===== ОТКРЫТИЕ/ЗАКРЫТИЕ =====
  chatBtn.addEventListener('click', () => {
    chatModal.style.display = 'flex';
    input.focus();
  });
  chatClose.addEventListener('click', () => {
    chatModal.style.display = 'none';
  });

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
})();
