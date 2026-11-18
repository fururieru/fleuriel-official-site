/* Fleuriel official YouTube: inline, initially silent, editable URL via Pages CMS. */
(() => {
  'use strict';
  const settings = window.FLEURIEL_SITE || {};
  const id = typeof settings.youtube_id === 'string' ? settings.youtube_id : '';
  if (!settings.youtube_enabled || !/^[A-Za-z0-9_-]{11}$/.test(id)) return;
  const section = document.getElementById('fleuriel-movie');
  const mount = document.getElementById('fleuriel-youtube-player');
  const link = document.getElementById('youtube-feature-link');
  const heading = document.getElementById('youtube-feature-title');
  const sound = document.getElementById('youtube-feature-audio');
  const fallback = document.getElementById('youtube-feature-fallback');
  if (!section || !mount || !link || !heading || !sound || !fallback) return;
  heading.textContent = String(settings.youtube_title || 'フルリエル公式CM');
  link.href = `https://www.youtube.com/watch?v=${id}`;
  section.hidden = false;

  // Native YouTube controls remain available even if the JavaScript API cannot load.
  const iframe = document.createElement('iframe');
  iframe.title = `${heading.textContent}（YouTube）`;
  iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
  iframe.setAttribute('allowfullscreen', '');
  iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  iframe.loading = 'lazy';
  iframe.src = `https://www.youtube-nocookie.com/embed/${id}?enablejsapi=1&playsinline=1&controls=1&mute=1&autoplay=0&origin=${encodeURIComponent(location.origin)}`;
  mount.replaceWith(iframe);
  iframe.id = 'fleuriel-youtube-player';

  let player = null;
  let listening = false;
  let started = false;
  let visible = false;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const autoPlayIfVisible = () => {
    if (player && visible && !started && !reducedMotion) {
      started = true;
      try { player.mute(); player.setVolume(15); player.playVideo(); }
      catch { /* Visitors can always use YouTube's controls. */ }
    }
  };
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
    autoPlayIfVisible();
  }, { threshold: 0.35 }) : null;
  if (observer) observer.observe(section);
  else visible = true;

  window.onYouTubeIframeAPIReady = () => {
    if (!window.YT || !window.YT.Player) return;
    try {
      player = new window.YT.Player('fleuriel-youtube-player', {
        events: {
          onReady: () => {
            try { player.mute(); player.setVolume(15); } catch { /* ignore */ }
            sound.disabled = false;
            autoPlayIfVisible();
          },
          onError: () => { fallback.hidden = false; sound.disabled = true; }
        }
      });
    } catch { fallback.hidden = false; }
  };
  sound.addEventListener('click', () => {
    if (!player) return;
    try {
      if (listening) {
        player.mute();
        listening = false;
      } else {
        player.setVolume(15);
        player.unMute();
        player.playVideo();
        started = true;
        listening = true;
      }
      sound.setAttribute('aria-pressed', String(listening));
      sound.textContent = listening ? '♫ 音声OFFにする' : '♫ 小音量で聴く（15%）';
    } catch { /* Native YouTube controls remain usable. */ }
  });
  const script = document.createElement('script');
  script.src = 'https://www.youtube.com/iframe_api';
  script.async = true;
  script.onerror = () => { fallback.hidden = false; sound.disabled = true; };
  document.head.appendChild(script);
})();
