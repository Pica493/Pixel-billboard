/* PixelGames: рисует карточки из window.PIXEL_GAMES и запускает игры.
   Этот файл трогать не нужно — игры добавляются в js/pixelgames-list.js */
(function () {
  'use strict';

  var games = Array.isArray(window.PIXEL_GAMES) ? window.PIXEL_GAMES : [];
  var grid = document.getElementById('games-grid');
  var empty = document.getElementById('games-empty');
  var player = document.getElementById('game-player');
  var frame = document.getElementById('game-frame');
  var titleEl = document.getElementById('game-player-title');

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function render() {
    grid.innerHTML = '';
    var seen = {};
    games.forEach(function (g) {
      if (!g || !g.id || !g.url || seen[g.id]) return; // пропускаем битые и дубли
      seen[g.id] = true;

      var card = el('div', 'game-card');

      var cover = el('div', 'game-cover');
      if (g.cover) {
        var img = new Image();
        img.alt = g.title || g.id;
        img.loading = 'lazy';
        img.src = g.cover;
        img.onerror = function () { img.remove(); cover.classList.add('no-cover'); cover.textContent = '🎮'; };
        cover.appendChild(img);
      } else {
        cover.classList.add('no-cover');
        cover.textContent = '🎮';
      }

      var btn = el('button', 'game-play');
      btn.type = 'button';
      btn.appendChild(el('span', 'game-play-icon', '▶'));
      btn.appendChild(document.createTextNode(' Играть'));
      btn.addEventListener('click', function () { launch(g); });

      card.appendChild(cover);
      card.appendChild(el('div', 'game-title', g.title || g.id));
      card.appendChild(el('div', 'game-desc', g.description || ''));
      card.appendChild(btn);
      grid.appendChild(card);
    });
    empty.style.display = grid.children.length ? 'none' : 'block';
  }

  function find(id) {
    for (var i = 0; i < games.length; i++) if (games[i] && games[i].id === id) return games[i];
    return null;
  }

  function launch(g) {
    if (g.newTab) { window.open(g.url, '_blank', 'noopener'); return; }
    if (location.hash !== '#' + g.id) location.hash = g.id; // откроет hashchange
    else openPlayer(g);
  }

  function openPlayer(g) {
    titleEl.textContent = g.title || g.id;
    frame.src = g.url;
    player.classList.add('active');
    document.body.classList.add('player-open');
  }

  function closePlayer() {
    player.classList.remove('active');
    document.body.classList.remove('player-open');
    frame.src = 'about:blank'; // останавливает игру и звук
  }

  function route() {
    var id = decodeURIComponent(location.hash.slice(1));
    var g = id && find(id);
    if (g && !g.newTab) openPlayer(g); else closePlayer();
  }

  document.getElementById('game-player-close').addEventListener('click', function () {
    if (location.hash) history.back(); else closePlayer();
    // если страницу открыли сразу по ссылке #id, back уведёт со страницы — закрываем вручную
    setTimeout(function () { if (player.classList.contains('active')) { history.replaceState(null, '', location.pathname); closePlayer(); } }, 50);
  });

  document.getElementById('game-player-fs').addEventListener('click', function () {
    var t = frame;
    var f = t.requestFullscreen || t.webkitRequestFullscreen;
    if (f) f.call(t);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && player.classList.contains('active') && !document.fullscreenElement) {
      document.getElementById('game-player-close').click();
    }
  });

  window.addEventListener('hashchange', route);
  render();
  route();
})();
