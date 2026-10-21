(function() {
  const AVATARS = [
    { id: 'default', emoji: '🙂', name: 'Смайлик', price: 0 },
    { id: 'cat', emoji: '🐱', name: 'Кот', price: 100 },
    { id: 'dog', emoji: '🐶', name: 'Собака', price: 100 },
    { id: 'fox', emoji: '🦊', name: 'Лис', price: 100 },
    { id: 'wolf', emoji: '🐺', name: 'Волк', price: 100 },
    { id: 'eagle', emoji: '🦅', name: 'Орёл', price: 100 },
    { id: 'owl', emoji: '🦉', name: 'Сова', price: 100 },
    { id: 'bat', emoji: '🦇', name: 'Летучая мышь', price: 100 },
    { id: 'dino', emoji: '🦖', name: 'Динозавр', price: 100 },
    { id: 'shark', emoji: '🦈', name: 'Акула', price: 100 },
    { id: 'dragon', emoji: '🐲', name: 'Дракон', price: 100 },
    { id: 'unicorn', emoji: '🦄', name: 'Единорог', price: 100 },
    { id: 'penguin', emoji: '🐧', name: 'Пингвин', price: 100 },
    { id: 'panda', emoji: '🐼', name: 'Панда', price: 100 },
    { id: 'koala', emoji: '🐨', name: 'Коала', price: 100 },
    { id: 'lion', emoji: '🦁', name: 'Лев', price: 100 },
    { id: 'cow', emoji: '🐮', name: 'Корова', price: 100 },
    { id: 'pig', emoji: '🐷', name: 'Свинья', price: 100 },
    { id: 'monkey', emoji: '🐵', name: 'Обезьяна', price: 100 },
    { id: 'chicken', emoji: '🐔', name: 'Курица', price: 100 },
    { id: 'duck', emoji: '🦆', name: 'Утка', price: 100 },
    { id: 'frog', emoji: '🐸', name: 'Лягушка', price: 100 },
    { id: 'astronaut', emoji: '👩‍🚀', name: 'Космонавт', price: 150 },
    { id: 'mermaid', emoji: '🧜‍♀️', name: 'Русалка', price: 150 },
    { id: 'genie', emoji: '🧞', name: 'Джинн', price: 150 },
    { id: 'rockstar', emoji: '👩‍🎤', name: 'Рокер', price: 150 },
    { id: 'cook', emoji: '👩‍🍳', name: 'Повар', price: 150 },
    { id: 'mechanic', emoji: '👩‍🔧', name: 'Механик', price: 150 },
    { id: 'programmer', emoji: '👩‍💻', name: 'Программист', price: 150 },
    { id: 'artist', emoji: '👩‍🎨', name: 'Художник', price: 150 },
    { id: 'firefighter', emoji: '👩‍🚒', name: 'Пожарный', price: 150 },
    { id: 'pilot', emoji: '👩‍✈️', name: 'Пилот', price: 150 },
    { id: 'judge', emoji: '👩‍⚖️', name: 'Судья', price: 150 },
    { id: 'superman', emoji: '🦸‍♂️', name: 'Супермен', price: 150 },
    { id: 'superwoman', emoji: '🦸‍♀️', name: 'Супергероиня', price: 150 },
    { id: 'elf_m', emoji: '🧝‍♂️', name: 'Эльф', price: 150 },
    { id: 'elf_f', emoji: '🧝‍♀️', name: 'Эльфийка', price: 150 },
    { id: 'vamp_m', emoji: '🧛‍♂️', name: 'Вампир', price: 150 },
    { id: 'vamp_f', emoji: '🧛‍♀️', name: 'Вампирша', price: 150 },
    { id: 'wizard_m', emoji: '🧙‍♂️', name: 'Колдун', price: 150 },
    { id: 'witch', emoji: '🧙‍♀️', name: 'Ведьма', price: 150 },
    { id: 'zombie_m', emoji: '🧟‍♂️', name: 'Зомби-м', price: 150 },
    { id: 'zombie_f', emoji: '🧟‍♀️', name: 'Зомби-ж', price: 150 },
    { id: 'villain_m', emoji: '🦹‍♂️', name: 'Злодей', price: 150 },
    { id: 'villain_f', emoji: '👺', name: 'Тэнгу', price: 150 },
    { id: 'robot', emoji: '🤖', name: 'Робот', price: 150 },
    { id: 'alien', emoji: '👾', name: 'Инопланетянин', price: 150 },
    { id: 'ghost', emoji: '👻', name: 'Призрак', price: 150 },
    { id: 'skull', emoji: '💀', name: 'Череп', price: 150 },
    { id: 'crystal', emoji: '💎', name: 'Кристалл', price: 150 },

    // Анимированные аватары — идут после всех остальных, 250 монет каждый.
    // У каждого своя уникальная анимация/эмоция.
    { id: 'anim_cyberagent', emoji: '🦾', name: 'Кибер-рука', price: 250, anim: 'anim-laser-green' },
    { id: 'anim_ufo', emoji: '🛸', name: 'НЛО Зорг', price: 250, anim: 'anim-spin' },
    { id: 'anim_firedemon', emoji: '👹', name: 'Огняр', price: 250, anim: 'anim-flame' },
    { id: 'anim_icespirit', emoji: '🧊', name: 'Кубик льда', price: 250, anim: 'anim-shiver' },
    { id: 'anim_troll', emoji: '🗿', name: 'Моаи', price: 250, anim: 'anim-smash' },
    { id: 'anim_countvamp', emoji: '🧛', name: 'Граф Вамп', price: 250, anim: 'anim-pulse-red' },
    { id: 'anim_discophantom', emoji: '🕺', name: 'Диско-фантом', price: 250, anim: 'anim-dance' },
    { id: 'anim_zombiebob', emoji: '🧟', name: 'Зомби Боб', price: 250, anim: 'anim-wobble' },
    { id: 'anim_guardian', emoji: '👼', name: 'Хранитель Ноа', price: 250, anim: 'anim-float' },
    { id: 'anim_impbouncer', emoji: '😈', name: 'Бес Шустрик', price: 250, anim: 'anim-shake' },
    { id: 'anim_glitchbyte', emoji: '👾', name: 'Глитч-байт', price: 250, anim: 'anim-glitch' },
    { id: 'anim_dragonignis', emoji: '🐉', name: 'Дракон Игнис', price: 250, anim: 'anim-ember' },
    { id: 'anim_orbitmage', emoji: '🧚', name: 'Фея', price: 250, anim: 'anim-orbit' },
    { id: 'anim_clownhop', emoji: '🤡', name: 'Прыг-клоун', price: 250, anim: 'anim-bounce' },
    { id: 'anim_comet', emoji: '☄️', name: 'Комета Вэйл', price: 250, anim: 'anim-streak' },
    { id: 'anim_zelin', emoji: '👽', name: 'Зелин с Нибиру', price: 250, anim: 'anim-pulse-green' },
    { id: 'anim_captainstill', emoji: '🏴‍☠️', name: 'Капитан Штиль', price: 250, anim: 'anim-sway' },
    { id: 'anim_thundergod', emoji: '⚡', name: 'Молния', price: 250, anim: 'anim-lightning' },
    { id: 'anim_shadowcat', emoji: '🐈', name: 'Гуляющий кот', price: 250, anim: 'anim-walk' },
    { id: 'anim_romeo', emoji: '😍', name: 'Ромео Сердечкин', price: 250, anim: 'anim-heartbeat' }
  ];

  const FRAMES = [
    { id: 'none', name: 'Без рамки', price: 0 },
    { id: 'neon', name: 'Неон', price: 100 },
    { id: 'hearts', name: 'Розовый', price: 100 },
    { id: 'hearts-decor', name: 'Сердечки', price: 100 },
    { id: 'stars-decor', name: 'Звёздная пыль', price: 100 },
    { id: 'diamonds-decor', name: 'Бриллианты', price: 100 },
    { id: 'obsidian', name: 'Обсидиан', price: 100 },
    { id: 'skulls-decor', name: 'Красный', price: 100 },
    { id: 'cosmic', name: 'Космос', price: 100 },
    { id: 'matrix', name: 'Матрица', price: 100 },
    { id: 'ice', name: 'Лёд', price: 100 },
    { id: 'moon', name: 'Лунный свет', price: 100 },
    { id: 'chrome', name: 'Жидкий хром', price: 100 },
    { id: 'galaxy', name: 'Галактика', price: 100 },
    { id: 'darkness', name: 'Тьма', price: 100 },
    { id: 'pixel', name: 'Пиксели', price: 100 },
    { id: 'half-gold-silver', name: 'Золото-серебро', price: 150 },
    { id: 'half-purple-pink', name: 'Фиолетово-розовый', price: 150 },
    { id: 'half-fire-ice', name: 'Вода и пламя', price: 150 },
    { id: 'double-stripe', name: 'Двойная полоса', price: 150 },
    { id: 'ruby', name: 'Рубин', price: 150 },
    { id: 'sapphire', name: 'Сапфир', price: 150 },
    { id: 'fire', name: 'Огонь', price: 200 },
    { id: 'royal-gold', name: 'Королевское золото', price: 200 },
    { id: 'rainbow-wave', name: 'Радужная волна', price: 200 },
    { id: 'crystal-flash', name: 'Кристальная вспышка', price: 200 },
    { id: 'flame', name: 'Живой огонь', price: 200 },
    { id: 'cyberpunk', name: 'Киберпанк-глитч', price: 200 },
    { id: 'emerald', name: 'Изумруд', price: 200 },
    { id: 'sun', name: 'Солнечное сияние', price: 200 },
    { id: 'candy', name: 'Конфетти', price: 200 },
    { id: 'vortex', name: 'Вихрь', price: 200 },
    { id: 'lightning', name: 'Молния', price: 200 },
    { id: 'fire-ice', name: 'Огонь и лёд', price: 200 },
    { id: 'chameleon', name: 'Хамелеон', price: 200 },
    { id: 'hologram', name: 'Голограмма', price: 200 },
    { id: 'pixel-chaos', name: 'Пиксельный хаос', price: 200 },
    { id: 'light', name: 'Свет', price: 200 },
    { id: 'storm', name: 'Грозовое небо', price: 250 },
    { id: 'gold-rain', name: 'Золотой дождь', price: 250 },
    { id: 'neon-grid', name: 'Неоновая сеть', price: 250 },
    { id: 'matrix-code', name: 'Матричный код', price: 250 }
  ];

  const NICK_COLORS = [
    { id: 'default', name: 'Белый', color: '#ffffff', price: 0 },
    { id: 'red', name: 'Красный', color: '#ff0000', price: 100 },
    { id: 'blue', name: 'Синий', color: '#0066ff', price: 100 },
    { id: 'green', name: 'Зелёный', color: '#00cc00', price: 100 },
    { id: 'brown', name: 'Коричневый', color: '#8b4513', price: 100 },
    { id: 'orange', name: 'Оранжевый', color: '#ff8800', price: 100 },
    { id: 'pink', name: 'Розовый', color: '#ff69b4', price: 100 },
    { id: 'cyan', name: 'Голубой', color: '#00e5ff', price: 100 },
    { id: 'gray', name: 'Серый', color: '#aaaaaa', price: 100 },
    { id: 'black', name: 'Чёрный', color: '#222222', price: 100 },
    { id: 'beige', name: 'Бежевый', color: '#f5f5dc', price: 100 },
    { id: 'gold', name: 'Золотой', color: '#ffd700', price: 100 },
    { id: 'neon', name: 'Неоновый', color: '#0ff', price: 100 },
    { id: 'fire', name: 'Огненный', color: '#ff4500', price: 100 },
    { id: 'lime', name: 'Лаймовый', color: '#aaff00', price: 100 },
    { id: 'violet', name: 'Фиолетовый', color: '#ee82ee', price: 100 },
    { id: 'rainbow', name: 'Радужный', color: 'rainbow', price: 150 }
  ];

 // Смайлики для чата — покупаются в магазине за 100 монет каждый.
  // После покупки становятся доступны для отправки в чат наравне
  // с бесплатными (см. панель эмодзи в чате).
  const EMOJIS_SHOP = [
    { id: 'wink', emoji: '😉', name: 'Подмигивание', price: 100 },
    { id: 'laugh_tears', emoji: '🤣', name: 'До слёз', price: 100 },
    { id: 'cool', emoji: '😎', name: 'Крутой', price: 100 },
    { id: 'star_eyes', emoji: '🤩', name: 'Звёздные глаза', price: 100 },
    { id: 'kiss', emoji: '😘', name: 'Поцелуй', price: 100 },
    { id: 'party_face', emoji: '🥳', name: 'Праздник', price: 100 },
    { id: 'shy', emoji: '😳', name: 'Смущение', price: 100 },
    { id: 'wow', emoji: '😲', name: 'Удивление', price: 100 },
    { id: 'sleepy', emoji: '😴', name: 'Сон', price: 100 },
    { id: 'sick', emoji: '🤒', name: 'Болезнь', price: 100 },
    { id: 'crazy', emoji: '🤪', name: 'Безумие', price: 100 },
    { id: 'smirk', emoji: '😏', name: 'Ухмылка', price: 100 },
    { id: 'clown', emoji: '🤡', name: 'Клоун', price: 100 },
    { id: 'devil', emoji: '😈', name: 'Чертёнок', price: 100 },
    { id: 'angel', emoji: '😇', name: 'Ангел', price: 100 },
    { id: 'thinking2', emoji: '🧐', name: 'Раздумье', price: 100 },
    { id: 'muscle', emoji: '💪', name: 'Сила', price: 100 },
    { id: 'clap', emoji: '👏', name: 'Аплодисменты', price: 100 },
    { id: 'ok_hand', emoji: '👌', name: 'ОК', price: 100 },
    { id: 'wave', emoji: '👋', name: 'Привет', price: 100 },
    { id: 'point_up', emoji: '☝️', name: 'Внимание', price: 100 },
    { id: 'crown', emoji: '👑', name: 'Корона', price: 100 },
    { id: 'gem', emoji: '💎', name: 'Бриллиант', price: 100 },
    { id: 'rocket2', emoji: '🚀', name: 'Ракета', price: 100 },
    { id: 'money', emoji: '💸', name: 'Деньги', price: 100 },
    { id: 'trophy', emoji: '🏆', name: 'Трофей', price: 100 },
    { id: 'rainbow_emoji', emoji: '🌈', name: 'Радуга', price: 100 },
    { id: 'lightning2', emoji: '⚡', name: 'Молния', price: 100 },
    { id: 'confetti', emoji: '🎊', name: 'Конфетти', price: 100 },
    { id: 'flower', emoji: '🌸', name: 'Цветок', price: 100 },

    // Анимированные смайлики — идут после всех остальных, 150 монет каждый.
    { id: 'anim_target', emoji: '🎯', name: 'Точно в цель', price: 150, anim: 'anim-laser' },
    { id: 'anim_gamer', emoji: '🎮', name: 'Геймпад', price: 150, anim: 'anim-shake' },
    { id: 'anim_dice', emoji: '🎲', name: 'Кубик удачи', price: 150, anim: 'anim-spin' },
    { id: 'anim_clover', emoji: '🍀', name: 'Клевер удачи', price: 150, anim: 'anim-float' },
    { id: 'anim_superstar', emoji: '🌟', name: 'Суперзвезда', price: 150, anim: 'anim-rainbow' },
    { id: 'anim_star', emoji: '⭐', name: 'Звезда', price: 150, anim: 'anim-orbit' },
    { id: 'anim_moon', emoji: '🌙', name: 'Месяц', price: 150, anim: 'anim-moonsway' },
    { id: 'anim_sun', emoji: '☀️', name: 'Солнышко', price: 150, anim: 'anim-ember' },
    { id: 'anim_cloud', emoji: '☁️', name: 'Облачко', price: 150, anim: 'anim-sway' },
    { id: 'anim_snowman', emoji: '⛄', name: 'Снеговик', price: 150, anim: 'anim-shiver' },
    { id: 'anim_pumpkin', emoji: '🎃', name: 'Тыква-Джек', price: 150, anim: 'anim-pumpkinbite' },
    { id: 'anim_santa', emoji: '🎅', name: 'Дед Мороз', price: 150, anim: 'anim-hohoho' },
    { id: 'anim_butterfly', emoji: '🦋', name: 'Бабочка', price: 150, anim: 'anim-wobble' },
    { id: 'anim_bee', emoji: '🐝', name: 'Пчёлка', price: 150, anim: 'anim-vanish' },
    { id: 'anim_dino2', emoji: '🦖', name: 'Дино', price: 150, anim: 'anim-ember' },
    { id: 'anim_dolphin', emoji: '🐬', name: 'Дельфин', price: 150, anim: 'anim-swim' },
    { id: 'anim_parrot', emoji: '🦜', name: 'Попугай', price: 150, anim: 'anim-rainbow' },
    { id: 'anim_pizza', emoji: '🍕', name: 'Пицца-тайм', price: 150, anim: 'anim-heartbeat' },
    { id: 'anim_donut', emoji: '🍩', name: 'Пончик', price: 150, anim: 'anim-bounce' },
    { id: 'anim_firework', emoji: '🎆', name: 'Салют', price: 150, anim: 'anim-lightning' }
  ];

  // Фоны для аватара — отображаются позади аватара, но внутри рамки.
  // Покупаются в магазине за 100 монет каждый (кроме "Без фона" — бесплатно).
  const BACKGROUNDS = [
    { id: 'none', name: 'Без фона', price: 0, css: 'transparent' },
    { id: 'bg_red', name: 'Алый закат', price: 100, css: 'linear-gradient(135deg, #ff512f, #dd2476)' },
    { id: 'bg_orange', name: 'Оранж', price: 100, css: 'linear-gradient(135deg, #f7971e, #ffd200)' },
    { id: 'bg_yellow', name: 'Жёлтый зной', price: 100, css: 'linear-gradient(135deg, #ffe259, #ffa751)' },
    { id: 'bg_green', name: 'Весенняя зелень', price: 100, css: 'linear-gradient(135deg, #56ab2f, #a8e063)' },
    { id: 'bg_teal', name: 'Изумрудный', price: 100, css: 'linear-gradient(135deg, #11998e, #38ef7d)' },
    { id: 'bg_cyan', name: 'Голубой лёд', price: 100, css: 'linear-gradient(135deg, #00c6ff, #0072ff)' },
    { id: 'bg_blue', name: 'Морская волна', price: 100, css: 'linear-gradient(135deg, #2193b0, #6dd5ed)' },
    { id: 'bg_indigo', name: 'Индиго', price: 100, css: 'linear-gradient(135deg, #654ea3, #eaafc8)' },
    { id: 'bg_purple', name: 'Фиолет', price: 100, css: 'linear-gradient(135deg, #8e2de2, #4a00e0)' },
    { id: 'bg_pink', name: 'Розовый бриз', price: 100, css: 'linear-gradient(135deg, #ff6a88, #ff99ac)' },
    { id: 'bg_magenta', name: 'Маджента', price: 100, css: 'linear-gradient(135deg, #c31432, #240b36)' },
    { id: 'bg_brown', name: 'Земляной', price: 100, css: 'linear-gradient(135deg, #8b5e3c, #3e2723)' },
    { id: 'bg_gray', name: 'Графит', price: 100, css: 'linear-gradient(135deg, #757f9a, #d7dde8)' },
    { id: 'bg_black', name: 'Полночь', price: 100, css: 'linear-gradient(135deg, #232526, #414345)' },
    { id: 'bg_gold', name: 'Золото', price: 100, css: 'linear-gradient(135deg, #f7971e, #ffd700)' },
    { id: 'bg_mint', name: 'Мятный', price: 100, css: 'linear-gradient(135deg, #a8ff78, #78ffd6)' },
    { id: 'bg_sunset', name: 'Закат солнца', price: 100, css: 'linear-gradient(135deg, #ff512f, #f09819)' },
    { id: 'bg_ocean', name: 'Океан', price: 100, css: 'linear-gradient(135deg, #2e3192, #1bffff)' },
    { id: 'bg_lava', name: 'Лава', price: 100, css: 'linear-gradient(135deg, #f85032, #e73827)' },
    { id: 'bg_galaxy', name: 'Галактика', price: 100, css: 'linear-gradient(135deg, #360033, #0b8793)' }
  ];

  const DEFAULT_PROFILE = {
    nickname: 'Player',
    coins: 0,
    inventory: ['default', 'none'],
    equipped: { avatar: 'default', frame: 'none', nickColor: 'default', background: 'none' },
    records: { snake: 0, bit: 0, tetris: 0, '2048': 0, memory: 0 },
    nicknameChanges: 0,
    lastDaily: null
  };

  let profile = JSON.parse(localStorage.getItem('pixelProfile'));
  if (!profile) {
    profile = {...DEFAULT_PROFILE};
  } else {
    if (!profile.equipped) profile.equipped = {};
    if (!profile.equipped.nickColor) profile.equipped.nickColor = 'default';
    if (!profile.equipped.background) profile.equipped.background = 'none';
    if (!profile.records) profile.records = {};
    if (!profile.records.tetris) profile.records.tetris = 0;
    if (!profile.records['2048']) profile.records['2048'] = 0;
    if (!profile.records.memory) profile.records.memory = 0;
    if (!profile.inventory.includes('default')) profile.inventory.push('default');
    if (!profile.inventory.includes('none')) profile.inventory.push('none');
    const colorIds = ['gold','neon','fire','lime','violet','rainbow','red','blue','green','brown','orange','pink','cyan','gray','black','beige'];
    colorIds.forEach(id => {
      if (profile.inventory.includes(id)) {
        const idx = profile.inventory.indexOf(id);
        if (idx !== -1) profile.inventory.splice(idx, 1);
        if (!profile.inventory.includes('color_' + id)) profile.inventory.push('color_' + id);
      }
    });
  }

  function save() { localStorage.setItem('pixelProfile', JSON.stringify(profile)); }

  if (profile.lastDaily !== new Date().toDateString()) {
    profile.coins += 5;
    profile.lastDaily = new Date().toDateString();
    save();
  }

  window.addCoins = function(amount) { profile.coins += amount; save(); updateUI(); };
  window.updateRecord = function(game, score) {
    if (score > (profile.records[game] || 0)) { profile.records[game] = score; save(); return true; }
    return false;
  };

  function updateUI() {
    document.getElementById('profile-coins').textContent = profile.coins;
    document.getElementById('shop-coins').textContent = profile.coins;
    document.getElementById('profile-nickname').textContent = profile.nickname;

    const nickEl = document.getElementById('profile-nickname');
const nickColor = profile.equipped.nickColor || '#ffffff';
if (nickColor === 'rainbow') {
  nickEl.style.background = 'linear-gradient(90deg, red, orange, yellow, green, blue, violet)';
  nickEl.style.webkitBackgroundClip = 'text';
  nickEl.style.webkitTextFillColor = 'transparent';
  nickEl.style.backgroundClip = 'text';
} else {
  nickEl.style.color = nickColor;
  nickEl.style.background = '';
  nickEl.style.webkitBackgroundClip = '';
  nickEl.style.webkitTextFillColor = '';
  nickEl.style.backgroundClip = '';
}

    document.getElementById('rec-snake').textContent = profile.records.snake || 0;
    document.getElementById('rec-bit').textContent = profile.records.bit || 0;
    document.getElementById('rec-tetris').textContent = profile.records.tetris || 0;
    document.getElementById('rec-2048').textContent = profile.records['2048'] || 0;
    document.getElementById('rec-memory').textContent = profile.records.memory || 0;

    const av = AVATARS.find(a => a.id === profile.equipped.avatar) || AVATARS[0];
    const preview = document.getElementById('profile-avatar-preview');
    preview.textContent = av.emoji;
    const frame = FRAMES.find(f => f.id === profile.equipped.frame);
    preview.className = 'frame-preview';
    if (frame && frame.id !== 'none') {
      preview.classList.add('frame-' + frame.id);
    }
    if (av.anim) preview.classList.add(av.anim);
    // Фон отображается позади аватара, но внутри рамки: рисуется как фон
    // самого элемента, поэтому эмодзи (текстовое содержимое) всегда поверх.
    const bg = BACKGROUNDS.find(b => b.id === profile.equipped.background);
    preview.style.background = (bg && bg.id !== 'none') ? bg.css : '';
  }


  // ===== Тултип с названием предмета для телефонов =====
  // На ПК название видно по наведению (title=...). На телефоне hover
  // нет, поэтому первое касание показывает название во всплывающей
  // подсказке, а не сразу покупает; повторное касание того же предмета
  // (или клик на ПК) — покупает/экипирует как обычно.
  const isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  let shopTooltipEl = null;
  let armedShopItem = null;
  let armedShopTimer = null;
  function showShopTooltip(el, text) {
    if (!shopTooltipEl) {
      shopTooltipEl = document.createElement('div');
      shopTooltipEl.className = 'shop-tap-tooltip';
      document.body.appendChild(shopTooltipEl);
    }
    shopTooltipEl.textContent = text;
    const rect = el.getBoundingClientRect();
    shopTooltipEl.style.left = Math.round(rect.left + rect.width / 2) + 'px';
    shopTooltipEl.style.top = Math.round(rect.top - 8) + 'px';
    shopTooltipEl.classList.add('visible');
    clearTimeout(shopTooltipEl._hideTimer);
    shopTooltipEl._hideTimer = setTimeout(() => shopTooltipEl.classList.remove('visible'), 1600);
  }
  // Скрывает подсказку сразу — при прокрутке магазина или выходе из него,
  // чтобы название купленного предмета не «зависало» на экране.
  function hideShopTooltip() {
    armedShopItem = null;
    clearTimeout(armedShopTimer);
    if (shopTooltipEl) {
      clearTimeout(shopTooltipEl._hideTimer);
      shopTooltipEl.classList.remove('visible');
    }
  }
  window.pbHideShopTooltip = hideShopTooltip;
  function bindShopItemTap(div, label, onConfirm) {
    div.title = label; // тултип по наведению для ПК остаётся как был
    div.addEventListener('click', (e) => {
      if (isTouchDevice && armedShopItem !== div) {
        e.preventDefault();
        e.stopPropagation();
        showShopTooltip(div, label);
        armedShopItem = div;
        clearTimeout(armedShopTimer);
        armedShopTimer = setTimeout(() => { armedShopItem = null; }, 2500);
        return;
      }
      armedShopItem = null;
      clearTimeout(armedShopTimer);
      onConfirm();
    });
  }

  function populateShop() {
    const ag = document.getElementById('avatar-list');
    ag.innerHTML = '';
    AVATARS.forEach(a => {
      const div = document.createElement('div');
      div.className = 'shop-item avatar-item' + (profile.inventory.includes(a.id) ? ' owned' : '');
      div.innerHTML = `<div class="item-icon${a.anim ? ' ' + a.anim : ''}">${a.emoji}</div><div class="item-price">💰${a.price}</div>`;
      bindShopItemTap(div, a.name + ' (' + a.price + '💰)', () => buy('avatar', a));
      ag.appendChild(div);
    });

    const fg = document.getElementById('frame-list');
    fg.innerHTML = '';
    FRAMES.forEach(f => {
      const div = document.createElement('div');
      div.className = 'shop-item frame-item' + (profile.inventory.includes(f.id) ? ' owned' : '');
      if (f.id !== 'none') div.classList.add('frame-' + f.id);
      div.innerHTML = `<div class="frame-preview">🙂</div><div class="item-price">💰${f.price}</div>`;
      bindShopItemTap(div, f.name + ' (' + f.price + '💰)', () => buy('frame', f));
      fg.appendChild(div);
    });

    const cg = document.getElementById('color-list');
    cg.innerHTML = '';
    NICK_COLORS.forEach(c => {
      const div = document.createElement('div');
      const owned = profile.inventory.includes('color_' + c.id);
      div.className = 'shop-item color-item' + (owned ? ' owned' : '');
      let swatchStyle = c.color === 'rainbow' ? 'background: linear-gradient(90deg, red, orange, yellow, green, blue, violet);' : 'background: ' + c.color + ';';
      div.innerHTML = `<div class="color-swatch" style="${swatchStyle}"></div><div class="item-price">💰${c.price}</div>`;
      bindShopItemTap(div, c.name + ' (' + c.price + '💰)', () => buy('nickColor', c));
      cg.appendChild(div);
    });

    const eg = document.getElementById('emoji-list');
    if (eg) {
      eg.innerHTML = '';
      EMOJIS_SHOP.forEach(em => {
        const div = document.createElement('div');
        const owned = profile.inventory.includes('emoji_' + em.id);
        div.className = 'shop-item emoji-item' + (owned ? ' owned' : '');
        div.innerHTML = `<div class="item-icon${em.anim ? ' ' + em.anim : ''}">${em.emoji}</div><div class="item-price">${owned ? '✔ Куплено' : '💰' + em.price}</div>`;
        bindShopItemTap(div, em.name + ' (' + em.price + '💰)', () => buy('emoji', em));
        eg.appendChild(div);
      });
    }

    const bgg = document.getElementById('background-list');
    if (bgg) {
      bgg.innerHTML = '';
      BACKGROUNDS.forEach(bgItem => {
        const div = document.createElement('div');
        const owned = profile.inventory.includes(bgItem.id);
        div.className = 'shop-item background-item' + (owned ? ' owned' : '');
        div.innerHTML = `<div class="color-swatch" style="background:${bgItem.css}"></div><div class="item-price">${owned ? '✔ Куплено' : '💰' + bgItem.price}</div>`;
        bindShopItemTap(div, bgItem.name + ' (' + bgItem.price + '💰)', () => buy('background', bgItem));
        bgg.appendChild(div);
      });
    }
  }

  function buy(type, item) {
    let inventoryKey = item.id;
    if (type === 'nickColor') inventoryKey = 'color_' + item.id;
    if (type === 'emoji') inventoryKey = 'emoji_' + item.id;

    if (profile.inventory.includes(inventoryKey)) {
      if (type === 'avatar') profile.equipped.avatar = item.id;
      else if (type === 'frame') profile.equipped.frame = item.id;
      else if (type === 'nickColor') profile.equipped.nickColor = item.color;
      else if (type === 'background') profile.equipped.background = item.id;
      else if (type === 'emoji') { alert('Этот смайлик уже куплен — он доступен в чате.'); return; }
      save(); updateUI();
      alert('Экипировано: ' + item.name);
      return;
    }
    if (profile.coins < item.price) { alert('Мало монет!'); return; }
    profile.coins -= item.price;
    profile.inventory.push(inventoryKey);
    if (type === 'avatar') profile.equipped.avatar = item.id;
    else if (type === 'frame') profile.equipped.frame = item.id;
    else if (type === 'nickColor') profile.equipped.nickColor = item.color;
    else if (type === 'background') profile.equipped.background = item.id;
    save(); updateUI(); populateShop();
    if (type === 'emoji') {
      alert('Куплено: ' + item.name + '. Теперь доступен в чате 😊');
      if (typeof window.pbRefreshEmojiPanel === 'function') window.pbRefreshEmojiPanel();
    } else {
      alert('Куплено и экипировано: ' + item.name);
    }
  }

  const MAX_NICKNAME_LENGTH = 16;

  document.getElementById('change-nickname-btn').onclick = () => {
    const cost = profile.nicknameChanges === 0 ? 0 : 200;
    if (cost > 0 && profile.coins < cost) { alert('Нужно 200 монет'); return; }
    const n = prompt(`Новый ник (макс. ${MAX_NICKNAME_LENGTH} символов):`, profile.nickname);
    if (n && n.trim()) {
      const trimmed = n.trim();
      if (trimmed.length > MAX_NICKNAME_LENGTH) {
        alert(`Ник слишком длинный. Максимум ${MAX_NICKNAME_LENGTH} символов.`);
        return;
      }
      if (cost > 0) profile.coins -= cost;
      profile.nickname = trimmed;
      profile.nicknameChanges++;
      save(); updateUI();
    }
  };

  document.getElementById('profile-btn').onclick = () => {
    document.getElementById('profile-modal').classList.add('active');
    updateUI();
  };
  document.getElementById('shop-btn').onclick = () => {
    document.getElementById('shop-modal').classList.add('active');
    updateUI();
    populateShop();
  };
  document.getElementById('help-btn').onclick = () => {
    document.getElementById('help-modal').classList.add('active');
  };

  document.getElementById('close-profile').onclick = () => { document.getElementById('profile-modal').classList.remove('active'); hideShopTooltip(); };
  document.getElementById('close-shop').onclick = () => { document.getElementById('shop-modal').classList.remove('active'); hideShopTooltip(); };
  document.getElementById('close-help').onclick = () => { document.getElementById('help-modal').classList.remove('active'); hideShopTooltip(); };

  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        this.classList.remove('active');
        hideShopTooltip();
      }
    });
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.active').forEach(modal => modal.classList.remove('active'));
      hideShopTooltip();
    }
  });

  // Подсказка с названием предмета не должна «висеть» при прокрутке магазина
  const shopModalContent = document.querySelector('#shop-modal .modal-content');
  if (shopModalContent) {
    shopModalContent.addEventListener('scroll', hideShopTooltip, { passive: true });
  }

  updateUI();
  window.AVATARS = AVATARS;
window.FRAMES = FRAMES;
window.SHOP_EMOJIS = EMOJIS_SHOP;
window.BACKGROUNDS = BACKGROUNDS;
  window.PixelProfile = { addCoins: window.addCoins, updateRecord: window.updateRecord };
})();
