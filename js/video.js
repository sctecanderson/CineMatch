// YouTube exige um site servido por HTTP(S) e identificação Referer válida.
// Não há bypass de bloqueios do provedor; erros mostram a alternativa de abrir no YouTube.
export function youtubeId(url) {
  try {
    const u = new URL(url); let id = '';
    if (u.hostname === 'youtu.be') id = u.pathname.slice(1);
    else if (/^(www\.|m\.)?youtube(?:-nocookie)?\.com$/.test(u.hostname)) id = u.searchParams.get('v') || u.pathname.split('/').filter(Boolean).pop();
    return /^[\w-]{11}$/.test(id || '') ? id : null;
  } catch { return null; }
}
export function urlIncorporacao(id, origem, autoplay = true) {
  const u = new URL(`https://www.youtube.com/embed/${id}`);
  const params = {enablejsapi:'1',playsinline:'1',rel:'0',autoplay:autoplay?'1':'0',mute:'1'};
  if (/^https?:\/\//.test(origem)) params.origin = origem;
  Object.entries(params).forEach(([k,v]) => u.searchParams.set(k,v)); return u.href;
}
let pronta;
function carregarYouTube() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!pronta) pronta = new Promise((resolve,reject) => {
    const anterior = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { anterior?.(); resolve(window.YT); };
    const script = document.createElement('script'); script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = () => { pronta = null; reject(new Error('Não foi possível carregar o player.')); };
    document.head.append(script);
  });
  return pronta;
}
export function montarVideo(container, url, {autoplay = true, muted = true} = {}) {
  let player, cancelado = false, timer; const id = youtubeId(url);
  const painel = document.createElement('div'); painel.className = 'video-status'; painel.setAttribute('role','status');
  function linkExterno() { const a = document.createElement('a'); a.className = 'video-external'; a.target = '_blank'; a.rel = 'noopener'; a.href = url; a.textContent = id ? 'Abrir no YouTube ↗' : 'Abrir vídeo ↗'; return a; }
  function falhou(texto) { if(cancelado) return; painel.replaceChildren(); const p=document.createElement('p');p.textContent=texto;painel.append(p);if(/^https?:\/\//.test(url||''))painel.append(linkExterno());painel.hidden=false; }
  if (!/^https?:\/\//.test(url || '')) { falhou('Trailer não disponível para este título.');container.append(painel);return ()=>{}; }
  if (id) {
    if (!/^https?:$/.test(location.protocol)) { falhou('Abra o projeto com npm start ou Live Server para reproduzir o YouTube.');container.append(painel);return ()=>{}; }
    const frame = document.createElement('iframe'); frame.className='player';frame.title='Trailer';frame.src=urlIncorporacao(id,location.origin,autoplay);
    frame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';
    container.append(frame,painel);painel.textContent='Carregando trailer…';
    timer=setTimeout(()=>falhou('O trailer ainda não respondeu. Você pode abri-lo diretamente no YouTube.'),14000);
    carregarYouTube().then(YT=>{if(cancelado||!frame.isConnected)return;player=new YT.Player(frame,{events:{
      onReady:()=>{if(cancelado)return;if(muted)player.mute();else player.unMute();if(autoplay)player.playVideo();painel.hidden=true;clearTimeout(timer);},
      onError:event=>{clearTimeout(timer);const texto=event.data===153?'O YouTube não reconheceu a origem da página. Use npm start e verifique extensões que bloqueiam Referer.':[101,150].includes(event.data)?'O responsável pelo vídeo não permite reprodução incorporada.':'Este trailer está indisponível ou foi bloqueado pelo YouTube.';falhou(texto);},
      onAutoplayBlocked:()=>{painel.hidden=false;painel.replaceChildren();const botao=document.createElement('button');botao.textContent='Reproduzir trailer';botao.onclick=()=>{player.playVideo();painel.hidden=true;};painel.append(botao);}
    }});}).catch(()=>falhou('O player do YouTube foi bloqueado ou não carregou.'));
  } else if (/\.(mp4|webm)(\?|$)/i.test(url)) {
    const video=document.createElement('video');video.className='player';video.src=url;video.controls=true;video.playsInline=true;video.muted=muted;
    video.addEventListener('error',()=>falhou('Não foi possível carregar este arquivo de vídeo.'));container.append(video,painel);painel.hidden=true;
    if(autoplay)video.play().catch(()=>{painel.hidden=true;});player={destroy(){video.pause();video.removeAttribute('src');video.load();}};
  } else { falhou('Este endereço abre em um player externo.');container.append(painel); }
  return ()=>{cancelado=true;clearTimeout(timer);try{player?.destroy();}catch{}container.replaceChildren();};
}
