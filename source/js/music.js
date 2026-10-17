/* =========================================================
   Juice WRLD 背景音乐播放器（APlayer）
   ---------------------------------------------------------
   播放策略（每首歌双源，自动择优）：
     local   : /music/xxx.mp3   —— 你放进 source/music/ 的完整版音频
     preview : Apple iTunes 官方公开试听（30 秒片段，合规兜底）
   加载时探测本地文件是否存在：
     存在 -> 播放完整版；不存在 -> 自动回落官方试听，页面不会报「音频加载失败」。
   新增歌曲：往TRACKS 里加一项即可，name / artist / cover / local 必填，
             preview 可留空（但那样该曲必须存在本地文件才能播放）。
   ========================================================= */
(function () {
  'use strict';

  var BASE = ''; // 若站点部署在子路径（如 /blog），改成 '/blog'

  var TRACKS = [
    {
      name: 'Wasted (feat. Lil Uzi Vert)',
      artist: 'Juice WRLD',
      cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/f8/6c/2a/f86c2ae0-b4eb-578c-1f02-3acb8409b815/21UMGIM53733.rgb.jpg/300x300bb.jpg',
      local: BASE + '/music/wasted.mp3',
      preview: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/02/20/6e/02206eef-fd7e-11b3-1e91-2446f33ed18d/mzaf_1249860897453288795.plus.aac.p.m4a'
    },
    {
      name: 'Lucid Dreams',
      artist: 'Juice WRLD',
      cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/75/9b/af/759baf5f-f3c9-b8c7-d3cf-55a3079914b9/18UMGIM24792.rgb.jpg/300x300bb.jpg',
      local: BASE + '/music/lucid_dreams.mp3',
      preview: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/9c/cb/87/9ccb87b5-cfd0-a77c-94fb-fe6fa124bcef/mzaf_7202917834670087023.plus.aac.p.m4a'
    },
    {
      name: 'Wishing Well',
      artist: 'Juice WRLD',
      cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/39/b1/1e/39b11eef-4709-bf53-2b5b-7954d2782496/20UMGIM58296.rgb.jpg/300x300bb.jpg',
      local: BASE + '/music/wishing_well.mp3',
      preview: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/06/13/5d/06135d4e-ea6f-39f9-24c1-828b285e90db/mzaf_17132896124065690258.plus.aac.p.m4a'
    },
    {
      name: 'Legends',
      artist: 'Juice WRLD',
      cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/5a/18/b6/5a18b6f3-61cc-2ccc-3d59-874d3a7a2603/21UM1IM54284.rgb.jpg/300x300bb.jpg',
      local: BASE + '/music/legends.mp3',
      preview: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/82/73/6d/82736d90-e8e2-f309-0631-0f2589afd91d/mzaf_5015466109723664233.plus.aac.p.m4a'
    },
    {
      name: 'Empty Out Your Pockets',
      artist: 'Juice WRLD',
      cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/56/d0/78/56d07815-71f2-5700-6514-db44613b00fa/24UM1IM10948.rgb.jpg/300x300bb.jpg',
      local: BASE + '/music/empty_out_your_pockets.mp3',
      preview: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/09/8e/9e/098e9e63-1154-7e82-5329-737ad53ab92c/mzaf_7140453741549644619.plus.aac.p.m4a'
    },
    {
      name: 'Hide (feat. Seezyn)',
      artist: 'Juice WRLD',
      cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/4b/30/2c/4b302cb6-7a14-5464-4e97-0577e9d0be49/18UMGIM82277.rgb.jpg/300x300bb.jpg',
      local: BASE + '/music/hide.mp3',
      preview: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/ad/bb/a9/adbba913-eb3e-0bce-8372-608a1506e596/mzaf_17328764545139236064.plus.aac.p.m4a'
    },
    {
      name: 'The Light',
      artist: 'Juice WRLD',
      cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/bd/c5/98/bdc59829-5375-1c98-da74-04bd7674f8bd/23UMGIM27251.rgb.jpg/300x300bb.jpg',
      local: BASE + '/music/the_light.mp3',
      preview: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/28/1b/0d/281b0dee-231c-7a2d-fa1e-36d891ec93ff/mzaf_3546009225338704140.plus.aac.p.m4a'
    },
    {
      name: 'Face 2 Face',
      artist: 'Juice WRLD',
      cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/26/d3/5b/26d35b06-e087-28ec-58c8-df00a178c8fe/22UM1IM39211.rgb.jpg/300x300bb.jpg',
      local: BASE + '/music/face_2_face.mp3',
      preview: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/c1/1a/66/c11a661e-8c64-9253-509e-e64e46f51d00/mzaf_14787315432038276388.plus.aac.p.m4a'
    }
  ];

  /* 探测本地完整版是否存在：HEAD 请求，200 且长度 > 10KB 视为可用 */
  function localExists(url) {
    return fetch(url, { method: 'HEAD', cache: 'no-cache' })
      .then(function (res) {
        if (!res.ok) return false;
        var len = res.headers.get('content-length');
        if (len && parseInt(len, 10) < 10240) return false;
        return true;
      })
      .catch(function () { return false; });
  }

  function buildPlaylist() {
    return Promise.all(TRACKS.map(function (t) {
      if (!t.local) return Promise.resolve(Object.assign({}, t, { url: t.preview }));
      return localExists(t.local).then(function (ok) {
        return Object.assign({}, t, { url: ok ? t.local : t.preview });
      });
    })).then(function (list) {
      return list.filter(function (t) { return !!t.url; });
    });
  }

  function initMusic(list) {
    if (typeof APlayer === 'undefined') {
      console.warn('[music] APlayer 未加载');
      return;
    }

    var container = document.createElement('div');
    container.id = 'jw-player';
    container.className = 'jw-player';
    document.body.appendChild(container);

    var player = new APlayer({
      container: container,
      fixed: true,
      mini: true,
      autoplay: true,
      theme: '#6366f1',
      loop: 'all',
      order: 'random',
      preload: 'metadata',
      volume: 0.35,
      mutex: true,
      listFolded: true,
      listMaxHeight: '260px',
      lrcType: 0,
      audio: list
    });

    // 浏览器通常拦截带声音的自动播放：首次交互时补播一次
    var started = false;
    function tryPlay() {
      if (started) return;
      started = true;
      try { player.play(); } catch (e) { /* 忽略 */ }
    }
    document.addEventListener('click', tryPlay, { once: true });
    document.addEventListener('touchstart', tryPlay, { once: true });

    window.__jwPlayer = player;
  }

  function boot() {
    buildPlaylist().then(function (list) {
      if (!list.length) {
        console.warn('[music] 播放列表为空');
        return;
      }
      initMusic(list);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();