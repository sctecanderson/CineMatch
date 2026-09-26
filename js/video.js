
export function youtubeId(url) {
  try {
    const urlObj = new URL(url);

    if (urlObj.hostname === "youtu.be") {
      return urlObj.pathname.slice(1);
    }

    if (urlObj.hostname.includes("youtube.com")) {
      return urlObj.searchParams.get("v") || urlObj.pathname.split("/").pop();
    }

    return null;
  } catch (erro) {
    return null;
  }
}

/**
 * Monta o player de vídeo (YouTube ou MP4) dentro do contêiner recebido
 * @returns {Function} Função de limpeza chamada para parar o vídeo ao fechar o modal
 */
export function montarVideo(container, url, { autoplay = true, muted = false } = {}) {
  if (!container) return () => {};
  container.replaceChildren();

  // Valida se a URL é válida
  if (!url || typeof url !== "string" || !url.startsWith("http")) {
    const aviso = document.createElement("p");
    aviso.className = "api-state erro";
    aviso.textContent = "Trailer não disponível para este título.";
    container.appendChild(aviso);
    return () => {};
  }

  const idYouTube = youtubeId(url);

  // CASO 1: É um vídeo do YouTube
  if (idYouTube) {
    const iframe = document.createElement("iframe");
    iframe.className = "player";
    iframe.title = "Trailer";
    iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    iframe.allowFullscreen = true;

    // Monta a URL de incorporação oficial do YouTube
    const params = new URLSearchParams({
      autoplay: autoplay ? "1" : "0",
      mute: muted ? "1" : "0",
      rel: "0",
      enablejsapi: "1",
    });

    iframe.src = `https://www.youtube.com/embed/${idYouTube}?${params.toString()}`;
    container.appendChild(iframe);

    // Retorna a função de parada: ao fechar o modal, limpa o iframe para cortar o som
    return () => {
      container.replaceChildren();
    };
  }

  // CASO 2: É um arquivo de vídeo direto (.mp4 ou .webm)
  if (/\.(mp4|webm)($|\?)/i.test(url)) {
    const video = document.createElement("video");
    video.className = "player";
    video.src = url;
    video.controls = true;
    video.autoplay = autoplay;
    video.muted = muted;
    video.playsInline = true;

    container.appendChild(video);

    return () => {
      video.pause();
      video.removeAttribute("src");
      container.replaceChildren();
    };
  }

  // CASO 3: Link externo desconhecido
  const linkExterno = document.createElement("a");
  linkExterno.className = "button secondary";
  linkExterno.href = url;
  linkExterno.target = "_blank";
  linkExterno.rel = "noopener noreferrer";
  linkExterno.textContent = "Abrir trailer no YouTube ↗";
  container.appendChild(linkExterno);

  return () => {
    container.replaceChildren();
  };
}