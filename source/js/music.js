/* =========================================================
   背景音乐播放器（完全自绘，不使用 APlayer UI）
   ---------------------------------------------------------
   为什么不用 APlayer 自带 UI：
     APlayer 会把 aplayer 类直接挂到传入容器上，并对 .aplayer-info
     注入 transform:scaleX(0)，导致歌名区宽度为 0（歌名看不见）；
     它还强制白底 #fff，与深色站点冲突。
   方案：原生 <audio> + 自绘 UI，外观与行为完全可控。

   自动播放：
     浏览器硬性拦截有声自动播放。策略：
       1. 首次访问 -> 显示「开启音乐」按钮 + 呼吸光环引导
       2. 用户点一次 -> 播放，偏好写入 localStorage
       3. 之后访问 -> 静音自动播放（浏览器允许），随后恢复音量
   ========================================================= */
(function () {
  'use strict';

  var STORE_KEY = 'blog_music_on';
  var VOLUME = 0.45;

  var TRACKS = [
    {
      name: 'Wasted (feat. Lil Uzi Vert)',
      artist: 'Juice WRLD',
      url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/02/20/6e/02206eef-fd7e-11b3-1e91-2446f33ed18d/mzaf_1249860897453288795.plus.aac.p.m4a',
      cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/f8/6c/2a/f86c2ae0-b4eb-578c-1f02-3acb8409b815/21UMGIM53733.rgb.jpg/300x300bb.jpg'
    },
    {
      name: 'Lucid Dreams',
      artist: 'Juice WRLD',
      url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/9c/cb/87/9ccb87b5-cfd0-a77c-94fb-fe6fa124bcef/mzaf_7202917834670087023.plus.aac.p.m4a',
      cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/75/9b/af/759baf5f-f3c9-b8c7-d3cf-55a3079914b9/18UMGIM24792.rgb.jpg/300x300bb.jpg'
    },
    {
      name: 'Wishing Well',
      artist: 'Juice WRLD',
      url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/06/13/5d/06135d4e-ea6f-39f9-24c1-828b285e90db/mzaf_17132896124065690258.plus.aac.p.m4a',
      cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/39/b1/1e/39b11eef-4709-bf53-2b5b-7954d2782496/20UMGIM58296.rgb.jpg/300x300bb.jpg'
    },
    {
      name: 'Legends',
      artist: 'Juice WRLD',
      url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/82/73/6d/82736d90-e8e2-f309-0631-0f2589afd91d/mzaf_5015466109723664233.plus.aac.p.m4a',
      cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/5a/18/b6/5a18b6f3-61cc-2ccc-3d59-874d3a7a2603/21UM1IM54284.rgb.jpg/300x300bb.jpg'
    },
    {
      name: 'Empty Out Your Pockets',
      artist: 'Juice WRLD',
      url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/09/8e/9e/098e9e63-1154-7e82-5329-737ad53ab92c/mzaf_7140453741549644619.plus.aac.p.m4a',
      cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/56/d0/78/56d07815-71f2-5700-6514-db44613b00fa/24UM1IM10948.rgb.jpg/300x300bb.jpg'
    },
    {
      name: 'The Light',
      artist: 'Juice WRLD',
      url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/28/1b/0d/281b0dee-231c-7a2d-fa1e-36d891ec93ff/mzaf_3546009225338704140.plus.aac.p.m4a',
      cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/bd/c5/98/bdc59829-5375-1c98-da74-04bd7674f8bd/23UMGIM27251.rgb.jpg/300x300bb.jpg'
    },
    {
      name: 'Face 2 Face',
      artist: 'Juice WRLD',
      url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/c1/1a/66/c11a661e-8c64-9253-509e-e64e46f51d00/mzaf_14787315432038276388.plus.aac.p.m4a',
      cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/26/d3/5b/26d35b06-e087-28ec-58c8-df00a178c8fe/22UM1IM39211.rgb.jpg/300x300bb.jpg'
    }
  ];

  function readPref() {
    try { return localStorage.getItem(STORE_KEY) === '1'; } catch (e) { return false; }
  }
  function writePref(v) {
    try {
      if (v) localStorage.setItem(STORE_KEY, '1');
      else localStorage.removeItem(STORE_KEY);
    } catch (e) { /* 隐私模式 */ }
  }
  function fmt(s) {
    if (!s || isNaN(s) || s < 0) s = 0;
    var m = Math.floor(s / 60), x = Math.floor(s % 60);
    return m + ':' + (x < 10 ? '0' : '') + x;
  }

  function init() {
    /* ---------- 真实音频元素 ---------- */
    var audio = document.createElement('audio');
    audio.id = 'jw-audio';
    audio.preload = 'metadata';
    document.body.appendChild(audio);

    var idx = 0;

    /* ---------- UI ---------- */
    var ui = document.createElement('div');
    ui.id = 'jw-player';
    ui.className = 'jw-player';
    ui.innerHTML =
      '<div class="jw-cover">' +
        '<img class="jw-cover-img" alt="">' +
        '<span class="jw-cover-mask"></span>' +
        '<span class="jw-cover-bars"><i></i><i></i><i></i><i></i></span>' +
        '<button class="jw-bigplay" aria-label="播放或暂停"></button>' +
      '</div>' +
      '<div class="jw-body">' +
        '<div class="jw-meta">' +
          '<div class="jw-title">—</div>' +
          '<div class="jw-artist">—</div>' +
        '</div>' +
        '<div class="jw-ctrl">' +
          '<button class="jw-btn jw-prev" aria-label="上一首" title="上一首">' +
            '<svg viewBox="0 0 24 24"><path d="M7 6h2.5v12H7zM20 6v12l-9.5-6z"/></svg></button>' +
          '<button class="jw-btn jw-play" aria-label="播放" title="播放">' +
            '<svg class="ic-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>' +
            '<svg class="ic-pause" viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg></button>' +
          '<button class="jw-btn jw-next" aria-label="下一首" title="下一首">' +
            '<svg viewBox="0 0 24 24"><path d="M14.5 6H17v12h-2.5zM4 6v12l9.5-6z"/></svg></button>' +
          '<button class="jw-btn jw-mode" aria-label="播放模式" title="列表循环">' +
            '<span class="mt-mode-ic">&#x21BB;</span></button>' +
        '</div>' +
      '</div>' +
      '<div class="jw-foot">' +
        '<span class="jw-time jw-cur">0:00</span>' +
        '<div class="jw-prog"><div class="jw-prog-fill"></div></div>' +
        '<span class="jw-time jw-dur">0:00</span>' +
        '<span class="jw-vol">' +
          '<span class="jw-vol-ico">&#x1F50A;</span>' +
          '<input class="jw-vol-in" type="range" min="0" max="100" value="' + Math.round(VOLUME * 100) + '" aria-label="音量">' +
        '</span>' +
      '</div>' +
      '<div class="jw-list"></div>';
    document.body.appendChild(ui);

    var q = function (s) { return ui.querySelector(s); };
    var elCover = q('.jw-cover-img');
    var elTitle = q('.jw-title');
    var elArtist = q('.jw-artist');
    var elFill = q('.jw-prog-fill');
    var elCur = q('.jw-cur');
    var elDur = q('.jw-dur');
    var elList = q('.jw-list');
    var elPlay = q('.jw-play');
    var elProg = q('.jw-prog');
    var elMode = q('.jw-mode');
    var elVolIn = q('.jw-vol-in');

    var html = '';
    TRACKS.forEach(function (t, i) {
      html += '<div class="jw-item' + (i === 0 ? ' on' : '') + '" data-i="' + i + '">' +
        '<span class="jw-n">' + (i + 1) + '</span>' +
        '<span class="jw-t">' + t.name + '</span>' +
        '<span class="jw-a">' + t.artist + '</span></div>';
    });
    elList.innerHTML = html;

    var modes = ['all', 'one', 'shuffle'];
    var modeIcs = ['&#x21BB;', '&#x267B;', '&#x1F500;'];
    var modeNames = ['列表循环', '单曲循环', '随机播放'];
    var mode = 'all';

    function paintTrack() {
      var t = TRACKS[idx];
      elTitle.textContent = t.name;
      elArtist.textContent = t.artist;
      elCover.src = t.cover;
      Array.prototype.forEach.call(elList.children, function (c, i) {
        c.classList.toggle('on', i === idx);
      });
    }

    function setPlaying(on) {
      ui.classList.toggle('is-playing', !!on);
      elPlay.title = on ? '暂停' : '播放';
      elPlay.setAttribute('aria-label', on ? '暂停' : '播放');
      writePref(!!on);
    }

    function load(i, autoplay) {
      idx = (i + TRACKS.length) % TRACKS.length;
      audio.src = TRACKS[idx].url;
      audio.volume = VOLUME;
      paintTrack();
      elCur.textContent = '0:00';
      elFill.style.width = '0%';
      if (autoplay) audio.play().catch(function () { setPlaying(false); });
    }

    function play() {
      audio.play().then(function () { setPlaying(true); })
        .catch(function () { setPlaying(false); });
    }
    function pause() { audio.pause(); setPlaying(false); }

    elPlay.addEventListener('click', function () {
      if (audio.paused) play(); else pause();
    });
    q('.jw-bigplay').addEventListener('click', function () {
      if (audio.paused) play(); else pause();
    });
    q('.jw-prev').addEventListener('click', function () { load(idx - 1, !audio.paused); });
    q('.jw-next').addEventListener('click', function () { load(idx + 1, true); });

    elMode.addEventListener('click', function () {
      var i = (modes.indexOf(mode) + 1) % modes.length;
      mode = modes[i];
      q('.mt-mode-ic').innerHTML = modeIcs[i];
      elMode.title = modeNames[i];
    });

    elVolIn.addEventListener('input', function () {
      VOLUME = this.value / 100;
      audio.volume = VOLUME;
      audio.muted = false;
    });

    function seek(e) {
      var rect = elProg.getBoundingClientRect();
      var ratio = (e.clientX - rect.left) / rect.width;
      if (ratio < 0) ratio = 0;
      if (ratio > 1) ratio = 1;
      if (audio.duration) audio.currentTime = ratio * audio.duration;
    }
    var dragging = false;
    elProg.addEventListener('mousedown', function (e) { dragging = true; seek(e); });
    document.addEventListener('mousemove', function (e) { if (dragging) seek(e); });
    document.addEventListener('mouseup', function () { dragging = false; });

    elList.addEventListener('click', function (e) {
      var it = e.target.closest('.jw-item');
      if (it) load(parseInt(it.dataset.i, 10), true);
    });

    q('.jw-cover').addEventListener('click', function (e) {
      if (e.target.closest('.jw-bigplay')) return;
      ui.classList.toggle('list-open');
    });

    audio.addEventListener('timeupdate', function () {
      if (!audio.duration) return;
      elFill.style.width = (audio.currentTime / audio.duration * 100) + '%';
      elCur.textContent = fmt(audio.currentTime);
    });
    audio.addEventListener('loadedmetadata', function () {
      elDur.textContent = fmt(audio.duration);
    });
    audio.addEventListener('play', function () { setPlaying(true); });
    audio.addEventListener('pause', function () { setPlaying(false); });
    audio.addEventListener('ended', function () {
      if (mode === 'one') { audio.currentTime = 0; play(); return; }
      var next;
      if (mode === 'shuffle') {
        do { next = Math.floor(Math.random() * TRACKS.length); } while (next === idx);
      } else {
        next = idx + 1;
      }
      load(next, true);
    });

    /* ---------- 自动播放 ---------- */
    var wanted = readPref();
    load(0, false);

    if (wanted) {
      audio.volume = 0.0001;      // 静音起播，浏览器允许
      audio.muted = false;
      audio.play().then(function () {
        audio.volume = VOLUME;     // 立刻恢复有声
        setPlaying(true);
      }).catch(function () {
        setPlaying(false);         // 被拦截，等用户点
      });
    } else {
      setPlaying(false);
    }

    // 首次任意交互时，若偏好是开的，立刻恢复有声
    var armed = false;
    function arm() {
      if (armed) return;
      armed = true;
      if (!wanted) return;
      audio.volume = VOLUME;
      audio.muted = false;
      if (audio.paused) audio.play().catch(function () {});
    }
    ['click', 'touchstart', 'keydown'].forEach(function (ev) {
      document.addEventListener(ev, arm, { once: true, passive: true });
    });

    window.__jwAudio = audio;
    window.__jwPlayer = ui;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();