/* =========================================================
   博客背景音乐播放器（APlayer）
   音频来源：Apple iTunes 官方公开试听（30 秒片段）

   自动播放策略：
     浏览器对「有声自动播放」有硬性拦截，脚本无法绕过。
     本方案流程：
       1. 首次访问 -> 显示一个不遮挡内容的音乐开关按钮
       2. 用户点一次 -> 播放，并把偏好写入 localStorage
       3. 以后访问 -> 静音自动播放（浏览器允许 muted autoplay）
       4. 随时点按钮 -> 暂停/ 恢复
   ========================================================= */
(function () {
  'use strict';

  var STORE_KEY = 'blog_music_on';

  var PLAYLIST = [
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
    } catch (e) { /* 隐私模式忽略 */ }
  }

  /* ---------- 悬浮开关按钮 ---------- */
  function buildToggle(onClick) {
    var btn = document.createElement('button');
    btn.id = 'music-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', '背景音乐开关');
    btn.title = '背景音乐';
    btn.innerHTML =
      '<span class="mt-ring"></span>' +
      '<span class="mt-ico"><span class="mt-bars"><i></i><i></i><i></i><i></i></span></span>' +
      '<span class="mt-tip">开启音乐</span>';
    document.body.appendChild(btn);
    btn.addEventListener('click', onClick);
    return btn;
  }

  function setToggleState(btn, playing) {
    btn.classList.toggle('is-playing', !!playing);
    var tip = btn.querySelector('.mt-tip');
    if (tip) tip.textContent = playing ? '暂停音乐' : '开启音乐';
    btn.setAttribute('aria-pressed', playing ? 'true' : 'false');
  }

  function init() {
    if (typeof APlayer === 'undefined') {
      console.warn('[music] APlayer 未加载');
      return;
    }

    var container = document.createElement('div');
    container.id = 'music-player';
    container.className = 'music-player';
    document.body.appendChild(container);

    var wanted = readPref();   // 用户此前是否开过音乐
    var playing = false;

    var player = new APlayer({
      container: container,
      fixed: true,
      mini: true,
      autoplay: false,
      theme: '#6366f1',
      loop: 'all',
      order: 'random',
      preload: 'metadata',
      volume: 0.35,
      mutex: true,
      listFolded: true,
      listMaxHeight: '260px',
      lrcType: 0,
      audio: PLAYLIST
    });

    var toggle = buildToggle(function () {
      if (playing) {
        player.pause();
        playing = false;
        writePref(false);
        setToggleState(toggle, false);
        return;
      }
      try {
        player.volume(0.35, true);
        player.play();
        playing = true;
        writePref(true);
        setToggleState(toggle, true);
      } catch (e) { /* 忽略 */ }
    });

    player.on('play', function () { playing = true; setToggleState(toggle, true); });
    player.on('pause', function () { playing = false; setToggleState(toggle, false); });
    player.on('canplay', function () {
      if (wanted) { playing = true; setToggleState(toggle, true); }
    });

    // 用户此前开过音乐 -> 静音自动播放（浏览器允许 muted autoplay）
    if (wanted) {
      player.volume(0.0001, false);
      try { player.play(); } catch (e) { /* noop */ }
    }
    setToggleState(toggle, wanted);

    // 兜底：已有过页面交互但因策略没播成时，补一次
    var armed = false;
    function arm() {
      if (armed) return;
      armed = true;
      if (wanted && !playing) {
        try { player.volume(0.35, true); player.play(); } catch (e) { /* noop */ }
      }
    }
    document.addEventListener('click', arm, { once: true });
    document.addEventListener('touchstart', arm, { once: true });

    window.__musicPlayer = player;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();