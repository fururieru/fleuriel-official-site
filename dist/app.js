(() => {
  'use strict';
  const casts = Array.isArray(window.FLEURIEL_CASTS) ? [...window.FLEURIEL_CASTS] : [];
  const nameCollator = new Intl.Collator('ja-JP', { numeric: true, sensitivity: 'base' });
  casts.sort((a,b) => nameCollator.compare(a.reading || a.name, b.reading || b.name));
  const $ = (sel) => document.querySelector(sel);
  const grid = $('#cast-grid');
  const modal = $('#cast-modal');
  const dialog = modal.querySelector('.profile-dialog');
  const favoritesKey = 'fleuriel-demo-favorites-v2';
  const validIds = new Set(casts.map(c => c.id));
  let favorites = new Set();
  try { favorites = new Set(JSON.parse(localStorage.getItem(favoritesKey) || '[]').filter(id => validIds.has(id))); } catch (_) { /* private browsing/local-file restrictions */ }
  let category = 'maid';
  let onlyFavorites = false;
  let current = null;
  let returnFocus = null;
  let audio = null;
  let playing = false;

  const e = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeLocalImage = (s) => /^assets\/casts\/[\w.\-]+\.(?:png|jpe?g|webp)$/i.test(s || '') ? s : '';
  const safeLocalAudio = (s) => /^assets\/voices\/[\w.\-]+\.(?:mp3|ogg|wav|m4a)$/i.test(s || '') ? s : '';
  const safeSocial = (s) => /^https:\/\/(?:www\.)?(?:x\.com|twitter\.com)\/[^\s]+$/i.test(s || '') ? s : '';
  const saveFavorites = () => { try {localStorage.setItem(favoritesKey, JSON.stringify([...favorites]));} catch (_) {} };
  const isFavorite = id => favorites.has(id);
  const imageOrPlaceholder = (c, prefix) => {
    const src = safeLocalImage(c.image);
    if (src) return `<img src="${e(src)}" alt="${e(c.name)}さんの立ち絵" loading="lazy" />`;
    return `<div class="portrait-placeholder" aria-hidden="true"><span class="placeholder-crown">♛</span><span class="placeholder-flower">❀</span><span class="placeholder-caption">PORTRAIT COMING SOON</span></div>`;
  };

  const render = () => {
    $('#maid-count').textContent = casts.filter(c=>c.type==='maid').length;
    $('#staff-count').textContent = casts.filter(c=>c.type==='staff').length;
    const q = $('#cast-search').value.trim().toLocaleLowerCase('ja-JP');
    const list = casts.filter(c => c.type === category && (!onlyFavorites || isFavorite(c.id)) && (!q || `${c.name} ${c.roman} ${c.reading || ""}`.toLocaleLowerCase('ja-JP').includes(q)));
    if (list.length===0) {
      grid.innerHTML = `<div class="empty-state">${onlyFavorites ? 'このカテゴリでお気に入り登録されたキャストはいません。' : '該当するキャストが見つかりませんでした。'}</div>`;
      return;
    }
    grid.innerHTML = list.map((c,i) => `<article class="cast-card">
      <button type="button" class="card-open" data-open="${e(c.id)}" aria-label="${e(c.name)}のプロフィールを開く">
        <div class="card-portrait ${e(c.color)}"><span class="portrait-upper">FLEURIEL · ${String(i+1).padStart(2,'0')}</span>${imageOrPlaceholder(c)}</div>
        <div class="card-info"><strong>${e(c.name)}</strong><small>${e(c.roman || (c.type==='maid'?'FLEURIEL MAID':'FLEURIEL STAFF'))}</small></div>
      </button>
      <button class="card-heart ${isFavorite(c.id)?'is-favorite':''}" type="button" data-favorite="${e(c.id)}" aria-label="${e(c.name)}を${isFavorite(c.id)?'お気に入りから外す':'お気に入りに登録する'}" aria-pressed="${isFavorite(c.id)}">${isFavorite(c.id)?'♥':'♡'}</button>
    </article>`).join('');
  };
  const setFavorite = id => {
    if (favorites.has(id)) favorites.delete(id); else favorites.add(id);
    saveFavorites(); render();
    if (current && current.id===id) updateModalFavorite();
  };
  const updateModalFavorite = () => {
    const b=$('#modal-favorite');
    const active=Boolean(current && isFavorite(current.id));
    b.textContent=active?'♥ お気に入り登録済み':'♡ お気に入りに登録';
    b.classList.toggle('is-favorite',active);
    b.setAttribute('aria-pressed',String(active));
  };
  const stopVoice = () => {
    if (audio) {audio.pause();audio.currentTime=0;audio=null;}
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    playing=false;
    $('#play-voice').classList.remove('is-playing');
    $('#voice-icon').textContent='▶';
    $('#voice-button-text').textContent=current && safeLocalAudio(current.voice) ? 'ご挨拶を聴く' : 'デモ音声を聴く';
  };
  const setPlaying = status => {
    playing=status;
    $('#play-voice').classList.toggle('is-playing',status);
    $('#voice-icon').textContent=status?'Ⅱ':'▶';
    $('#voice-button-text').textContent=status?'再生を止める':(current && safeLocalAudio(current.voice)?'ご挨拶を聴く':'デモ音声を聴く');
  };
  const open = id => {
    const c=casts.find(item=>item.id===id); if(!c)return;
    returnFocus=document.activeElement;
    stopVoice();current=c;
    $('#modal-category').textContent=c.type==='staff'?'FLEURIEL BLACK SUIT':'FLEURIEL MAID';
    $('#modal-name').textContent=c.name;
    $('#modal-roman').textContent=c.roman || (c.type==='maid'?'FLEURIEL MAID':'FLEURIEL STAFF');
    $('#modal-message').textContent=c.message || '自己紹介準備中';
    const portrait=$('#modal-portrait');
    portrait.className='profile-portrait '+(c.color || 'blue');
    const img=safeLocalImage(c.image);
    portrait.innerHTML=`<span class="profile-portrait-deco" aria-hidden="true">♛</span>${img?`<img src="${e(img)}" alt="${e(c.name)}さんの立ち絵" />`:'<div class="portrait-symbol" aria-hidden="true">❀</div>'}<span class="profile-portrait-label">MAID CAFE FLEURIEL</span>`;
    $('#voice-note').textContent=safeLocalAudio(c.voice) ? '本人の許可を得て公開されたサンプルボイスです。' : '仮の読み上げデモです。本人の声ではありません。';
    $('#voice-button-text').textContent=safeLocalAudio(c.voice)?'ご挨拶を聴く':'デモ音声を聴く';
    const social=$('#modal-social');
    const socialUrl=safeSocial(c.x);
    social.setAttribute('aria-disabled',socialUrl?'false':'true');
    social.textContent=socialUrl?'Xを見る ↗':'Xリンク準備中';
    social.href=socialUrl || '#casts';
    if(socialUrl) {social.target='_blank';social.rel='noopener noreferrer';} else {social.removeAttribute('target');social.removeAttribute('rel');}
    updateModalFavorite();
    modal.hidden=false;
    document.body.classList.add('modal-open');
    dialog.focus();
  };
  const close = () => {
    stopVoice();
    modal.hidden=true;
    document.body.classList.remove('modal-open');
    current=null;
    if (returnFocus && returnFocus.isConnected) returnFocus.focus();
  };
  const playVoice = async () => {
    if(!current)return;
    if(playing){stopVoice();return;}
    const src=safeLocalAudio(current.voice);
    if(src){
      audio=new Audio(src);
      audio.onended=()=>setPlaying(false);
      audio.onerror=()=>{setPlaying(false);$('#voice-note').textContent='音声ファイルを読み込めませんでした。ファイル名と配置を確認してください。';};
      try {await audio.play();setPlaying(true);} catch(_) {setPlaying(false);$('#voice-note').textContent='再生できませんでした。音声ファイルとブラウザの設定をご確認ください。';}
      return;
    }
    // 試作品限定: 本人の声ではなく、ブラウザ標準の機械読み上げで再生操作を確認
    if(!('speechSynthesis' in window)){$('#voice-note').textContent='このブラウザではデモ読み上げを利用できません。MP3を設定すると通常再生できます。';return;}
    window.speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance('お帰りなさいませ。フルリエルへようこそ。ご来館を心よりお待ちしております。');
    u.lang='ja-JP';u.rate=.93;u.pitch=1.08;
    u.onend=()=>setPlaying(false);
    u.onerror=()=>setPlaying(false);
    setPlaying(true);
    window.speechSynthesis.speak(u);
  };
  document.querySelectorAll('.segment').forEach(button=>button.addEventListener('click',()=>{
    category=button.dataset.category;
    document.querySelectorAll('.segment').forEach(b=>{const active=b===button;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));});
    render();
  }));
  $('#cast-search').addEventListener('input',render);
  $('#favorites-filter').addEventListener('click',e=>{
    onlyFavorites=!onlyFavorites;e.currentTarget.setAttribute('aria-pressed',String(onlyFavorites));render();
  });
  grid.addEventListener('click',ev=>{
    const fav=ev.target.closest('[data-favorite]');if(fav){setFavorite(fav.dataset.favorite);return;}
    const card=ev.target.closest('[data-open]');if(card)open(card.dataset.open);
  });
  $('#modal-close').addEventListener('click',close);
  modal.addEventListener('click',ev=>{if(ev.target===modal)close();});
  document.addEventListener('keydown',ev=>{
    if(modal.hidden)return;
    if(ev.key==='Escape'){close();return;}
    if(ev.key==='Tab'){
      const focusable=Array.from(dialog.querySelectorAll('button:not(:disabled),a[href]:not([aria-disabled="true"])'));
      const first=focusable[0],last=focusable[focusable.length-1];
      if(ev.shiftKey && document.activeElement===first){ev.preventDefault();last.focus();}
      else if(!ev.shiftKey && document.activeElement===last){ev.preventDefault();first.focus();}
    }
  });
  $('#modal-favorite').addEventListener('click',()=>{if(current)setFavorite(current.id);});
  $('#play-voice').addEventListener('click',playVoice);
  render();
})();
