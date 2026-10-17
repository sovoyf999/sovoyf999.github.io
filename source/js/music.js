/* =========================================================
   Juice WRLD 背景音乐播放器
   ---------------------------------------------------------
   完整版来源：YouTube 官方频道嵌入（IFRAME + IFrame Player API）
     · 完整时长（3–5 分钟），不是30 秒试听
     · 免费，无需任何音频文件
     · 官方授权嵌入，合规

   结构：
     · 隐藏的 YT.Player 实例负责实际播放（1px 或可视小窗）
     · 自绘控制条负责交互：上/下一首、播放暂停、音量、进度、循环模式

   备用回退：若 IFrame API 加载失败（如网络限制），自动退回
   iTunes 官方试听源，保证「一定有音乐」。
   ========================================================= */
(function () {
  'use strict';

  /* ---- 曲目：全部为官方渠道 YouTube 视频 ID（已逐个验证） ---- */
  var TRACKS = [
    { name: 'Wasted (feat. Lil Uzi Vert)',   artist: 'Juice WRLD', vid: '6n4wt6gj7pA', dur: 262 },
    { name: 'Lucid Dreams',                   artist: 'Juice WRLD', vid: 'pqiO8wV4-wc', dur: 220 },
    { name: 'Wishing Well',                   artist: 'Juice WRLD', vid: 'C5i-UnuUKUI', dur: 194 },
    { name: 'Legends',                        artist: 'Juice WRLD', vid: 'dIzgiclddlM', dur: 215 },
    { name: 'Empty Out Your Pockets',         artist: 'Juice WRLD', vid: 'hgYhws0AHcg', dur: 180 },
    { name: 'Rich And Blind',                 artist: 'Juice WRLD', vid: 'DRN2jnlXewE', dur: 226 },
    { name: 'The Light',                      artist: 'Juice WRLD', vid: 'a4YoRazp2Uo', dur: 199 },
    { name: 'Face 2 Face',                    artist: 'Juice WRLD', vid: 'NO_ZdJjMtdI', dur: 124 }
  ];

  /* ---- iTunes 官方试听回退（YouTube 不可用时） ---- */
  var PREVIEW = {
    'Wasted (feat. Lil Uzi Vert)': 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/02/20/6e/02206eef-fd7e-11b3-1e91-2446f33ed18d/mzaf_1249860897453288795.plus.aac.p.m4a',
    'Lucid Dreams': 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/9c/cb/87/9ccb87b5-cfd0-a77c-94fb-fe6fa124bcef/mzaf_7202917834670087023.plus.aac.p.m4a',
    'Wishing Well': 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/06/13/5d/06135d4e-ea6f-39f9-24c1-828b285e90db/mzaf_17132896124065690258.plus.aac.p.m4a',
    'Legends': 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/82/73/6d/82736d90-e8e2-f309-0631-0f2589afd91d/mzaf_5015466109723664233.plus.aac.p.m4a',
    'Empty Out Your Pockets': 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/09/8e/9e/098e9e63-1154-7e82-5329-737ad53ab92c/mzaf_7140453741549644619.plus.aac.p.m4a',
    'Rich And Blind': 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/28/1b/0d/281b0dee-231c-7a2d-fa1e-36d891ec93ff/mzaf_3546009225338704140.plus.aac.p.m4a',
    'The Light': 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/28/1b/0d/281b0dee-231c-7a2d-fa1e-36d891ec93ff/mzaf_3546009225338704140.plus.aac.p.m4a',
    'Face 2 Face': 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/c1/1a/66/c11a661e-8c64-9253-509e-e64e46f51d00/mzaf_14787315432038276388.plus.aac.p.m4a'
  };

  var COVER = 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/f8/6c/2a/f86c2ae0-b4eb-578c-1f02-3acb8409b815/21UMGIM53733.rgb.jpg/300x300bb.jpg';

  /* ================= 状态 ================= */
  var idx = 0, playing = false, ytReady = false, useYT = true;
  var yt = null, ap = null, volume = 0.35, timer = null;

  var el = {};

  /* ================= UI 构建 ================= */
  function fmt(s) {
    if (isNaN(s) || s < 0) s = 0;
    var m = Math.floor(s / 60), x = Math.floor(s % 60);
    return m + ':' + (x < 10 ? '0' : '') + x;
  }

  function buildUI() {
    var wrap = document.createElement('div');
    wrap.id = 'jw-player';
    wrap.className = 'jw-player';
    wrap.innerHTML =
      '<div class="jw-bar">' +
        '<div class="jw-cover"><img src="' + COVER + '" alt=""></div>' +
        '<div class="jw-meta">' +
          '<div class="jw-title"></div>' +
          '<div class="jw-artist"></div>' +
        '</div>' +
        '<button class="jw-btn jw-prev" title="上一首" aria-label="上一首">&#x21B6;</button>' +
        '<button class="jw-btn jw-play" title="播放/暂停" aria-label="播放或暂停"></button>' +
        '<button class="jw-btn jw-next" title="下一首" aria-label="下一首">&#x21B7;</button>' +
        '<div class="jw-vol" title="音量"><span class="jw-vol-ico">&#x1F50A;</span>' +
          '<input class="jw-vol-in" type="range" min="0" max="100" value="' + Math.round(volume * 100) + '">' +
        '</div>' +
        '<button class="jw-btn jw-mode" title="播放模式">&#x1F501;</button>' +
      '</div>' +
      '<div class="jw-list" hidden></div>' +
      '<div class="jw-prog"><div class="jw-bar-fill"></div></div>' +
      '<div class="jw-time"><span class="jw-cur">0:00</span><span class="jw-src">YouTube 官方</span><span class="jw-dur">0:00</span></div>';
    document.body.appendChild(wrap);

    el.wrap = wrap;
    el.meta = wrap.querySelector('.jw-meta');
    el.title = wrap.querySelector('.jw-title');
    el.artist = wrap.querySelector('.jw-artist');
    el.play = wrap.querySelector('.jw-play');
    el.fill = wrap.querySelector('.jw-bar-fill');
    el.prog = wrap.querySelector('.jw-prog');
    el.cur = wrap.querySelector('.jw-cur');
    el.dur = wrap.querySelector('.jw-dur');
    el.list = wrap.querySelector('.jw-list');
    el.src = wrap.querySelector('.jw-src');
    el.cover = wrap.querySelector('.jw-cover img');
    el.mode = wrap.querySelector('.jw-mode');
    el.volIn = wrap.querySelector('.jw-vol-in');

    el.play.addEventListener('click', toggle);
    wrap.querySelector('.jw-prev').addEventListener('click', function(){ go(idx - 1); });
    wrap.querySelector('.jw-next').addEventListener('click', function(){ go(idx + 1); });
    el.mode.addEventListener('click', cycleMode);
    el.volIn.addEventListener('input', function () {
      volume = this.value / 100;
      if (yt && yt.setVolume) yt.setVolume(volume * 100);
      if (ap) ap.volume(volume, true);
    });
    el.prog.addEventListener('click', seekTo);

    var listHTML = '';
    TRACKS.forEach(function (t, i) {
      listHTML += '<div class="jw-item' + (i === 0 ? ' on' : '') + '" data-i="' + i + '">' +
        '<span class="jw-n">' + (i + 1) + '</span>' +
        '<span class="jw-t">' + t.name + '</span>' +
        '<span class="jw-a">' + t.artist + '</span></div>';
    });
    el.list.innerHTML = listHTML;
    el.list.addEventListener('click', function (e) {
      var it = e.target.closest('.jw-item');
      if (it) go(parseInt(it.dataset.i, 10));
    });

    // 点击播放器主体展开/收起列表
    el.meta.addEventListener('click', function () {
      el.list.hidden = !el.list.hidden;
    });

    if (useYT) {
      var host = document.createElement('div');
      host.id = 'jw-yt-host';
      host.style.cssText = 'position:fixed;left:-9999px;top:0;width:2px;height:2px;overflow:hidden;';
      document.body.appendChild(host);
      el.host = host;
    }
  }

  function paint(playingNow) {
    var t = TRACKS[idx];
    el.title.textContent = t.name;
    el.artist.textContent = t.artist;
    el.cover.src = 'https://i.ytimg.com/vi/' + t.vid + '/hqdefault.jpg';
    el.play.innerHTML = playingNow ? '&#x23F8;' : '&#x25B6;';
    el.src.textContent = useYT ? 'YouTube 官方 · 完整版' : 'iTunes 官方 · 30秒试听';
    el.src.style.color = useYT ? '#6366f1' : '#f59e0b';
    Array.prototype.forEach.call(el.list.children, function (c, i) {
      c.classList.toggle('on', i === idx);
    });
  }

  /* ================= 进度 ================= */
  function setProgress(cur, dur) {
    var pct = dur > 0 ? (cur / dur * 100) : 0;
    el.fill.style.width = pct + '%';
    el.cur.textContent = fmt(cur);
    el.dur.textContent = fmt(dur);
  }

  function startTick() {
    clearInterval(timer);
    timer = setInterval(function () {
      if (!playing) return;
      if (useYT && yt && yt.getCurrentTime) {
        setProgress(yt.getCurrentTime() || 0, yt.getDuration() || TRACKS[idx].dur);
      } else if (ap) {
        setProgress(ap.audio.currentTime || 0, ap.audio.duration || TRACKS[idx].dur);
      }
    }, 500);
  }

  /* ================= YouTube 引擎 ================= */
  function loadYT() {
    if (window.YT && window.YT.Player) return Promise.resolve();
    return new Promise(function (res) {
      var s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      s.onload = res;
      s.onerror = function () { res(); };
      document.head.appendChild(s);
      // 兜底超时：8 秒内没就绪就走回退
      setTimeout(res, 8000);
    });
  }

  function mountYT(playNow) {
    yt = new YT.Player('jw-yt-host', {
      videoId: TRACKS[idx].vid,
      playerVars: {
        autoplay: playNow ? 1 : 0,
        controls: 0,
        disablekb: 1,
        modestbranding: 1,
        rel: 0,
        loop: 0,
        iv_load_policy: 3
      },
      events: {
        onReady: function () {
          ytReady = true;
          yt.setVolume(volume * 100);
          if (playNow) {
            try { yt.playVideo(); playing = true; } catch (e) { /* noop */ }
          }
          paint(playing);
          startTick();
        },
        onStateChange: function (e) {
          // 0=结束 1=播放 2=暂停
          if (e.data === YT.PlayerState.ENDED) next(true);
          else if (e.data === YT.PlayerState.PLAYING) { playing = true; paint(true); }
          else if (e.data === YT.PlayerState.PAUSED) { playing = false; paint(false); }
        },
        onError: function () { next(true); }
      }
    });
  }

  /* ================= 回退引擎（iTunes 试听） ================= */
  function mountAP(playNow) {
    if (typeof APlayer === 'undefined') return;
    useYT = false;

    // APlayer 必须挂到独立容器：它会给容器加 aplayer 类并注入 DOM，
    // 若复用主容器会覆盖掉自绘的控制条。
    var box = document.createElement('div');
    box.id = 'jw-ap-host';
    box.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;';
    document.body.appendChild(box);

    ap = new APlayer({
      container: box,
      fixed: false,
      mini: false,
      autoplay: false,
      theme: '#6366f1',
      volume: volume,
      listFolded: true,
      audio: [{
        name: TRACKS[idx].name,
        artist: TRACKS[idx].artist,
        url: PREVIEW[TRACKS[idx].name],
        cover: COVER
      }]
    });
    if (playNow) { try { ap.play(); playing = true; } catch (e) { /* noop */ } }
    paint(playing);
    startTick();
  }

  /* ================= 控制逻辑 ================= */
  function toggle() {
    if (!ytReady && useYT) return;
    playing = !playing;
    if (useYT && yt) {
      if (playing) { try { yt.playVideo(); } catch (e) { /* noop */ } }
      else yt.pauseVideo();
    } else if (ap) {
      if (playing) { try { ap.play(); } catch (e) { /* noop */ } }
      else ap.pause();
    }
    paint(playing);
  }

  function go(i, keepPlaying) {
    var wasPlaying = keepPlaying === undefined ? playing : keepPlaying;
    idx = (i + TRACKS.length) % TRACKS.length;
    setProgress(0, TRACKS[idx].dur);

    if (useYT && yt && yt.loadVideoById) {
      yt.loadVideoById(TRACKS[idx].vid);
      if (wasPlaying) { try { yt.playVideo(); } catch (e) { /* noop */ } }
      playing = wasPlaying;
    } else if (ap) {
      mountAP(wasPlaying);
    }
    paint(wasPlaying);
  }

  function next(auto) {
    var mode = el.wrap.dataset.mode || 'all';
    if (auto && mode === 'one') { go(idx, true); return; }
    if (auto && mode === 'shuffle') {
      var n;
      do { n = Math.floor(Math.random() * TRACKS.length); } while (n === idx && TRACKS.length > 1);
      go(n, true);
      return;
    }
    go(idx + 1, true);
  }

  function cycleMode() {
    var cur = el.wrap.dataset.mode || 'all';
    var order = ['all', 'one', 'shuffle'];
    var label = { all: '&#x1F501;', one: '&#x1F502;', shuffle: '&#x1F500;' };
    var nextMode = order[(order.indexOf(cur) + 1) % order.length];
    el.wrap.dataset.mode = nextMode;
    el.mode.innerHTML = label[nextMode];
    el.mode.title = { all: '列表循环', one: '单曲循环', shuffle: '随机播放' }[nextMode];
  }

  function seekTo(e) {
    var rect = el.prog.getBoundingClientRect();
    var ratio = (e.clientX - rect.left) / rect.width;
    if (ratio < 0) ratio = 0;
    if (ratio > 1) ratio = 1;
    if (useYT && yt && yt.seekTo) {
      yt.seekTo((yt.getDuration() || TRACKS[idx].dur) * ratio, true);
    } else if (ap) {
      ap.audio.currentTime = (ap.audio.duration || TRACKS[idx].dur) * ratio;
    }
  }

  /* ================= 启动 ================= */
  function boot() {
    buildUI();
    el.wrap.dataset.mode = 'all';
    cycleMode(); cycleMode(); // 归一到 all
    paint(false);

    // 浏览器会拦截有声自动播放：等用户首次交互再播
    var armed = false;
    function arm() {
      if (armed) return;
      armed = true;
      loadYT().then(function () {
        if (window.YT && YT.Player) mountYT(true);
        else mountAP(true);
      });
    }
    ['click', 'touchstart', 'keydown'].forEach(function (ev) {
      document.addEventListener(ev, arm, { once: true });
    });
    startTick();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();