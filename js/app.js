import { CINEMATCH_DATA } from "./data.js";
import { Store } from "./store.js";
import { buscarCatalogo } from "./api.js";
import { Serie, criarContador, aoConcluirBusca } from "./modelo.js";
import {
  criarCardRecomendacao,
  renderizarEstado,
  validarPerfil,
  nomeGenero,
} from "./ui.js";
import { montarVideo } from "./video.js";
import { INTERVALO_BANNER } from "./config.js";

/* ============================================================
   1. ESTADO GLOBAL E SELETORES DO DOM
   ============================================================ */
const root = document.querySelector("#app");
const modal = document.querySelector("#modal");
const toastEl = document.querySelector("#toast");
const btnVoltarTopo = document.querySelector("#back-to-top");

let rotaAtual = "home";
let heroIndex = 0;
let heroTimer = null;
let heroPausado = false;
let toastTimer = null;
let pararModalVideo = () => {};

// Paginação (15 itens por página)
const ITENS_POR_PAGINA = 15;
let paginaCatalogo = 1;
let paginaMatch = 1;

// Perfil e Dados da API
let perfilAtual = null;
let estadoAPI = "inicial";
let mensagemErroAPI = "";
let resultadosMatch = [];
let tituloMatch = "Séries que combinam com você";
let totalConsultas = 0;
const contadorConsultas = criarContador();

try {
  const salvo = JSON.parse(localStorage.getItem("cinematchPerfil"));
  if (validarPerfil(salvo)) perfilAtual = salvo;
} catch (e) {
  perfilAtual = null;
}

const listaGeneros = [
  "Drama", "Comedy", "Action", "Adventure", "Romance", "Thriller",
  "Horror", "Mystery", "Crime", "Fantasy", "Science-Fiction",
  "Family", "Animation", "History", "War", "Music"
];

/* ============================================================
   2. FUNÇÕES AUXILIARES, MODAL E TOAST
   ============================================================ */
function escaparHTML(texto) {
  return String(texto ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function mostrarToast(mensagem) {
  if (!toastEl) return;
  toastEl.textContent = mensagem;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 3500);
}

function abrirModal(titulo, conteudoHTML) {
  pararModalVideo();
  modal.innerHTML = `
    <div class="modal-head">
      <h2>${escaparHTML(titulo)}</h2>
      <button type="button" class="icon" data-action="fechar-modal">✕</button>
    </div>
    <div class="modal-body">${conteudoHTML}</div>
  `;
  if (!modal.open) modal.showModal();
}

function fecharModal() {
  pararModalVideo();
  pararModalVideo = () => {};
  if (modal.open) modal.close();
  modal.innerHTML = "";
}

function reproduzirTrailer(idTitulo) {
  const item = Store.catalog().find((m) => m.id === idTitulo);
  if (!item || !item.trailer) {
    mostrarToast("Trailer não disponível para este título.");
    return;
  }
  abrirModal(item.name, '<div class="modal-video"></div>');
  const containerVideo = modal.querySelector(".modal-video");
  pararModalVideo = montarVideo(containerVideo, item.trailer, {
    autoplay: true,
    muted: false,
  });
}

/* ============================================================
   3. TEMPLATES DOS CARDS (TOP 10 SEM TEXTO AO LADO)
   ============================================================ */
function renderizarCard(item, ranking = 0) {
  const salvo = Store.favourites().includes(item.id);
  const nota = item.rating ? `<span class="rating">★ ${item.rating}</span>` : "";

  // Card do Top 10 (Cartaz Grande com Número Sobreposto, sem texto espremendo)
  if (ranking > 0) {
    return `
      <article class="movie-card rank-card" data-card="${escaparHTML(item.id)}">
        <span class="rank">${ranking}</span>
        <a class="poster-link" href="#/detail/${escaparHTML(item.id)}" aria-label="${escaparHTML(item.name)}">
          <img src="${escaparHTML(item.image)}" alt="${escaparHTML(item.name)}" loading="lazy">
          ${nota}
        </a>
      </article>
    `;
  }

  // Card Padrão de Filmes e Séries
  return `
    <article class="movie-card" data-card="${escaparHTML(item.id)}">
      <a class="poster-link" href="#/detail/${escaparHTML(item.id)}">
        <img src="${escaparHTML(item.image)}" alt="${escaparHTML(item.name)}" loading="lazy">
        ${nota}
      </a>
      <div class="card-overlay">
        ${item.trailer ? `<button type="button" class="icon circle" data-action="assistir-trailer" data-id="${item.id}">▶</button>` : ""}
        <button type="button" class="icon circle" data-action="toggle-favorito" data-id="${item.id}">
          ${salvo ? "✓" : "+"}
        </button>
      </div>
      <div class="card-name">${escaparHTML(item.name)}</div>
    </article>
  `;
}

function gerarBotoesPaginacao(paginaAtual, totalPaginas, acao) {
  if (totalPaginas <= 1) return "";
  let html = `<nav class="row wrap" style="margin:28px 0;gap:8px" aria-label="Paginação">`;
  html += `<button type="button" class="secondary" data-action="${acao}" data-page="${paginaAtual - 1}" ${paginaAtual === 1 ? "disabled" : ""}>Anterior</button>`;

  for (let i = 1; i <= totalPaginas; i++) {
    const ativo = i === paginaAtual;
    html += `<button type="button" class="${ativo ? "" : "secondary"}" data-action="${acao}" data-page="${i}">${i}</button>`;
  }

  html += `<button type="button" class="secondary" data-action="${acao}" data-page="${paginaAtual + 1}" ${paginaAtual === totalPaginas ? "disabled" : ""}>Próxima</button>`;
  html += `</nav>`;
  return html;
}

function renderizarCarrossel(titulo, itens, rotaVerTodos = "movies", comRanking = false) {
  if (!itens || !itens.length) return "";
  const cardsHTML = itens.map((item, i) => renderizarCard(item, comRanking ? i + 1 : 0)).join("");

  return `
    <section class="shelf">
      <div class="section-title">
        <h2>${escaparHTML(titulo)}</h2>
        <a href="#/${rotaVerTodos}">Ver todos →</a>
      </div>
      <div class="carousel-shell">
        <div class="carousel">${cardsHTML}</div>
        <button type="button" class="carousel-arrow prev" data-action="scroll-left">‹</button>
        <button type="button" class="carousel-arrow next" data-action="scroll-right">›</button>
      </div>
    </section>
  `;
}

function renderizarHeader() {
  const nomeUsuario = perfilAtual?.nome ? escaparHTML(perfilAtual.nome) : "Criar perfil";
  return `
    <header class="site-header">
      <button type="button" class="icon mobile-menu" data-action="toggle-menu" aria-label="Menu">☰</button>
      <a class="logo" href="#/home"><img src="assets/logo.png" alt="CineMatch"></a>
      <nav class="main-nav">
        <a href="#/home" class="${rotaAtual === "home" ? "active" : ""}">Início</a>
        <a href="#/recomendacoes" class="${rotaAtual === "recomendacoes" ? "active" : ""}">Meu match</a>
        <details class="dropdown">
          <summary>Catálogo</summary>
          <div class="dropdown-menu">
            <a href="#/movies">Filmes</a>
            <a href="#/tv-shows">Séries (TVMaze)</a>
            <a href="#/watchlist">Minha lista</a>
          </div>
        </details>
      </nav>
      <div class="header-actions">
        <button type="button" class="icon" data-action="ir-busca" aria-label="Buscar">🔍</button>
        <button type="button" class="secondary" data-action="trocar-perfil">👤 ${nomeUsuario}</button>
      </div>
    </header>
  `;
}

function renderizarFooter() {
  return `
    <footer class="site-footer">
      <div class="footer-grid">
        <div>
          <a class="logo" href="#/home"><img src="assets/logo.png" alt="CineMatch"></a>
          <p>Seu próximo favorito começa com um match de gêneros.</p>
        </div>
        <div>
          <h3>Explorar</h3>
          <a href="#/tv-shows">Séries da TVMaze</a>
          <a href="#/movies">Filmes</a>
          <a href="#/watchlist">Minha lista</a>
        </div>
        <div>
          <h3>Sobre</h3>
          <p>Projeto acadêmico com JavaScript puro e TVMaze API.</p>
        </div>
      </div>
      <p class="copyright">© ${new Date().getFullYear()} CineMatch</p>
    </footer>
  `;
}

function renderizarHero() {
  const destaques = CINEMATCH_DATA.heroes.home || [];
  if (!destaques.length) return "";

  const slidesHTML = destaques.map((item, i) => `
    <div class="hero-slide ${i === heroIndex ? "active" : ""}">
      <img class="hero-bg" src="${item.image}" alt="${escaparHTML(item.name)}">
      <div class="hero-content">
        <span class="hero-eyebrow">EM DESTAQUE NO CINEMATCH</span>
        <h1 class="hero-title">${escaparHTML(item.name)}</h1>
        <p>Explore o catálogo e descubra novas séries para assistir.</p>
        <div class="row">
          <a class="button" href="#/detail/${escaparHTML(item.name.toLowerCase().replace(/ /g, '-'))}">Explorar título</a>
        </div>
      </div>
    </div>
  `).join("");

  const botoesHTML = destaques.map((item, i) => `
    <button type="button" class="hero-menu-item ${i === heroIndex ? "active" : ""}" data-action="trocar-slide" data-index="${i}">
      <img src="${item.image}" alt="">
      <span><small>0${i + 1}</small> ${escaparHTML(item.name)}</span>
      <i class="hero-progress"></i>
    </button>
  `).join("");

  return `
    <section class="hero cinematic-hero">
      <div class="hero-slides">${slidesHTML}</div>
      <div class="hero-menu">
        ${botoesHTML}
        <button type="button" class="hero-pause button ghost" data-action="pausar-hero">${heroPausado ? "Retomar" : "Pausar"}</button>
      </div>
    </section>
  `;
}

/* ============================================================
   4. TELAS PRINCIPAIS (CATÁLOGO, RECOMENDAÇÕES E DETALHES)
   ============================================================ */
function renderizarTelaCatalogo(tipo) {
  let titulos = Store.catalog();
  if (tipo === "movies") titulos = titulos.filter((c) => c.type === "movie");
  if (tipo === "tv-shows") titulos = titulos.filter((c) => c.type === "tvshow");
  if (tipo === "watchlist") titulos = titulos.filter((c) => Store.favourites().includes(c.id));

  const totalPaginas = Math.max(1, Math.ceil(titulos.length / ITENS_POR_PAGINA));
  paginaCatalogo = Math.min(paginaCatalogo, totalPaginas);

  const inicio = (paginaCatalogo - 1) * ITENS_POR_PAGINA;
  const visiveis = titulos.slice(inicio, inicio + ITENS_POR_PAGINA);
  const cards = visiveis.map((item) => renderizarCard(item)).join("");
  const paginacaoHTML = gerarBotoesPaginacao(paginaCatalogo, totalPaginas, "mudar-pagina-catalogo");

  return `
    <main class="page">
      <h1>${tipo === "watchlist" ? "Minha Lista" : tipo === "tv-shows" ? "Séries (TVMaze)" : "Catálogo de Filmes"}</h1>
      <div class="filterbar">
        <input type="search" id="input-busca" placeholder="Buscar por título..." aria-label="Buscar">
      </div>
      <p class="muted">${titulos.length} títulos · Página ${paginaCatalogo} de ${totalPaginas}</p>
      <div id="grid-catalogo" class="catalog-grid">
        ${cards || '<p class="empty">Nenhum título encontrado.</p>'}
      </div>
      ${paginacaoHTML}
    </main>
  `;
}

function renderizarTelaDetalhes(id) {
  const item = Store.catalog().find((c) => c.id === id);
  if (!item) {
    return `<main class="page"><h1>Título não encontrado</h1><a class="button" href="#/home">Voltar ao início</a></main>`;
  }

  const jaFavorito = Store.favourites().includes(item.id);

  return `
    <section class="hero detail-hero">
      <img class="hero-bg" src="${escaparHTML(item.image)}" alt="${escaparHTML(item.name)}">
      <div class="hero-content">
        <span class="pill">${escaparHTML((item.type || "SÉRIE").toUpperCase())}</span>
        <h1>${escaparHTML(item.name)}</h1>
        <div class="metadata">
          <span>Ano: ${escaparHTML(item.release?.slice(0, 4) || "Recente")}</span>
          <span>${escaparHTML(item.duration || "Duração flexível")}</span>
          <span>★ ${escaparHTML(item.rating || "Sem nota")}</span>
        </div>
        <div class="row wrap">
          ${item.trailer ? `<button type="button" data-action="assistir-trailer" data-id="${item.id}">Assistir trailer</button>` : ""}
          <button type="button" class="secondary" data-action="toggle-favorito" data-id="${item.id}">
            ${jaFavorito ? "✓ Na minha lista" : "+ Adicionar à lista"}
          </button>
        </div>
      </div>
    </section>
    <main class="page detail-body">
      <h2>Sinopse</h2>
      <p>${escaparHTML(item.description || "Sinopse disponível no catálogo.")}</p>
      <p><b>Gêneros:</b> ${item.genres ? item.genres.map(nomeGenero).join(", ") : "Geral"}</p>
    </main>
  `;
}

function renderizarTelaPerfil() {
  return `
    <main class="profile-page">
      <section class="profile-intro">
        <span class="hero-eyebrow">HISTÓRIAS QUE COMBINAM COM VOCÊ</span>
        <h1>Seu próximo favorito<br>começa com um <em>match.</em></h1>
        <p>Conte um pouco sobre você. Nós encontramos séries com os gêneros que você mais gosta.</p>
      </section>
      <form id="form-perfil" class="profile-form">
        <h2>Crie seu perfil</h2>
        <p class="muted">Salvo neste navegador.</p>
        <div class="form-grid">
          <label class="field">Nome<input type="text" id="perfil-nome" name="nome" required minlength="2"></label>
          <label class="field">Idade<input type="number" id="perfil-idade" name="idade" required min="1" max="120"></label>
        </div>
        <fieldset>
          <legend>Quais gêneros você mais gosta?</legend>
          <div class="genre-choices">
            ${listaGeneros.map((g) => `
              <label><input type="checkbox" name="generos" value="${g}"><span>${nomeGenero(g)}</span></label>
            `).join("")}
          </div>
        </fieldset>
        <p id="perfil-erro" role="alert"></p>
        <button type="submit">Encontrar meu match →</button>
      </form>
    </main>
  `;
}

/* ============================================================
   5. ATUALIZAÇÃO DO DOM E API (TVMAZE)
   ============================================================ */
function renderizarTela() {
  clearInterval(heroTimer);
  rotaAtual = location.hash.replace(/^#\/?/, "") || "home";

  if (!perfilAtual) {
    root.innerHTML = renderizarHeader() + renderizarTelaPerfil() + renderizarFooter();
    return;
  }

  let conteudoHTML = "";

  if (rotaAtual === "home") {
    const catalogo = Store.catalog();
    const filmes = catalogo.filter((c) => c.type === "movie");
    const series = catalogo.filter((c) => c.type === "tvshow");

    conteudoHTML = `
      ${renderizarHero()}
      <main class="home-sections">
        <section class="shelf recommendations">
          <div class="section-title">
            <h2>${escaparHTML(tituloMatch)}</h2>
            <a href="#/recomendacoes">Ver todos →</a>
          </div>
          <div id="match-cards" class="carousel"></div>
        </section>
        ${renderizarCarrossel("Top 10 Destaques", filmes.slice(0, 10), "movies", true)}
        ${renderizarCarrossel("Séries em Destaque", series.slice(0, 10), "tv-shows")}
        ${renderizarCarrossel("Filmes Populares", filmes.slice(5, 15), "movies")}
      </main>
    `;
  } else if (rotaAtual === "recomendacoes") {
    const totalPaginas = Math.max(1, Math.ceil(resultadosMatch.length / ITENS_POR_PAGINA));
    paginaMatch = Math.min(paginaMatch, totalPaginas);
    const paginacaoHTML = gerarBotoesPaginacao(paginaMatch, totalPaginas, "mudar-pagina-match");

    conteudoHTML = `
      <main class="page">
        <h1>${escaparHTML(tituloMatch)}</h1>
        <p class="muted">${resultadosMatch.length} séries · Página ${paginaMatch} de ${totalPaginas}</p>
        <div id="match-cards" class="catalog-grid"></div>
        ${paginacaoHTML}
      </main>
    `;
  } else if (rotaAtual.startsWith("detail/")) {
    conteudoHTML = renderizarTelaDetalhes(rotaAtual.replace("detail/", ""));
  } else if (["movies", "tv-shows", "watchlist"].includes(rotaAtual)) {
    conteudoHTML = renderizarTelaCatalogo(rotaAtual);
  } else {
    conteudoHTML = `<main class="page"><h1>Página não encontrada</h1><a class="button" href="#/home">Voltar ao início</a></main>`;
  }

  root.innerHTML = renderizarHeader() + conteudoHTML + renderizarFooter();
  preencherCardsMatch();
  sincronizarHero();
}

function preencherCardsMatch() {
  const container = document.querySelector("#match-cards");
  if (!container) return;

  if (estadoAPI !== "pronto") {
    renderizarEstado(
      container,
      estadoAPI === "erro" ? "erro" : "carregando",
      estadoAPI === "erro" ? mensagemErroAPI : "Consultando séries na TVMaze…",
      carregarCatalogoTVMaze
    );
    return;
  }

  if (!resultadosMatch.length) {
    renderizarEstado(container, "vazio", "Nenhuma série com afinidade suficiente.");
    return;
  }

  container.replaceChildren();

  const todos = rotaAtual === "recomendacoes";
  const inicio = todos ? (paginaMatch - 1) * ITENS_POR_PAGINA : 0;
  const fim = todos ? inicio + ITENS_POR_PAGINA : 12;

  resultadosMatch.slice(inicio, fim).forEach((res) => {
    const cardEl = criarCardRecomendacao(res, (id) => {
      const item = Store.catalog().find((m) => m.id === id);
      if (!item) return null;
      const t = document.createElement("template");
      t.innerHTML = renderizarCard(item);
      return t.content.firstElementChild;
    });

    if (cardEl) container.appendChild(cardEl);
  });
}

async function carregarCatalogoTVMaze() {
  if (!perfilAtual) return;
  estadoAPI = "carregando";
  preencherCardsMatch();

  try {
    const dados = await buscarCatalogo();
    totalConsultas = contadorConsultas();

    const seriesModelos = dados.map((d) => new Serie(d));
    resultadosMatch = seriesModelos
      .map((s) => s.calcularAfinidade(perfilAtual.generosFavoritos))
      .sort((a, b) => b.percentual - a.percentual || (b.serie.nota || 0) - (a.serie.nota || 0));

    Store.setSeries(
      dados.map((d) => ({
        id: d.id,
        name: d.titulo,
        type: "tvshow",
        image: d.imagem,
        language: d.idioma,
        duration: d.duracaoMinutos ? `${d.duracaoMinutos} min` : "45 min",
        rating: d.nota,
        release: d.estreia,
        genres: d.generos,
        access: "free",
        status: true,
        trailer: "",
        description: d.resumo ? d.resumo.replace(/<[^>]*>/g, "") : "",
      }))
    );

    aoConcluirBusca(perfilAtual.nome, (texto) => {
      tituloMatch = texto;
    });

    estadoAPI = "pronto";
    renderizarTela();
  } catch (erro) {
    estadoAPI = "erro";
    mensagemErroAPI = erro.message || "Falha ao consultar a TVMaze.";
    preencherCardsMatch();
  }
}

/* ============================================================
   6. TEMPORIZADOR DO HERO (SLIDER AUTOMÁTICO)
   ============================================================ */
function sincronizarHero() {
  clearInterval(heroTimer);
  if (!heroPausado && document.querySelector(".cinematic-hero")) {
    heroTimer = setInterval(() => {
      trocarSlideHero(1);
    }, 6500);
  }
}

function trocarSlideHero(passo) {
  const slides = document.querySelectorAll(".hero-slide");
  const botoes = document.querySelectorAll(".hero-menu-item");
  if (!slides.length) return;

  heroIndex = (heroIndex + passo + slides.length) % slides.length;

  slides.forEach((slide, i) => slide.classList.toggle("active", i === heroIndex));
  botoes.forEach((btn, i) => btn.classList.toggle("active", i === heroIndex));
}

/* ============================================================
   EXTRA coloquei o gif no carregamento da home.
   ============================================================ */

// Exibe a tela preta com o GIF animado e executa o callback ao terminar
function mostrarCarregamento(aoFinalizar) {
  // Evita abrir duas telas de carregamento ao mesmo tempo
  if (document.querySelector(".camada-carregamento")) return;

  const camada = document.createElement("div");
  camada.className = "camada-carregamento";
  camada.setAttribute("role", "status");
  camada.setAttribute("aria-label", "Carregando CineMatch");

  const imagem = document.createElement("img");
  imagem.alt = "Carregando CineMatch";
  imagem.src = "assets/logo-gif.gif";

  // Função que faz o fade-out e chama o callback
  function encerrar() {
    camada.classList.add("saindo"); // Aplica o fade-out do CSS
    setTimeout(() => {
      camada.remove();
      if (typeof aoFinalizar === "function") {
        aoFinalizar(); // Executa o callback que você passou!
      }
    }, 350);
  }

  // Duração do GIF na tela (2.5 segundos)
  const timer = setTimeout(encerrar, 2500);

  imagem.addEventListener("error", () => {
    clearTimeout(timer);
    camada.remove();
    if (typeof aoFinalizar === "function") aoFinalizar();
  }, { once: true });

  camada.appendChild(imagem);
  document.body.appendChild(camada);
}

/* ============================================================
   7. ESCUTA DE EVENTOS (addEventListener)
   ============================================================ */
  document.addEventListener("click", (evento) => {
  // Intercepta cliques no Logo ou no link "Início"
  const linkHome = evento.target.closest('a.logo');
  if (linkHome) {
    evento.preventDefault();
    mostrarCarregamento(() => {
      location.hash = "#/home";
      renderizarTela();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    return;
  }

  const elemento = evento.target.closest("[data-action]");
  if (!elemento) return; 

  switch (acao) {
    case "fechar-modal":
      fecharModal();
      break;

    case "assistir-trailer":
      if (id) reproduzirTrailer(id);
      break;

    case "toggle-favorito":
      if (id) {
        const adicionou = Store.toggleFavourite(id);
        mostrarToast(adicionou ? "Adicionado à sua lista!" : "Removido da lista.");
        renderizarTela();
      }
      break;

    case "trocar-perfil":
      perfilAtual = null;
      localStorage.removeItem("cinematchPerfil");
      renderizarTela();
      break;

    case "voltar-topo":
      window.scrollTo({ top: 0, behavior: "smooth" });
      break;

    case "scroll-left":
    case "scroll-right": {
      const carrossel = elemento.closest(".shelf")?.querySelector(".carousel");
      if (carrossel) {
        const dir = acao === "scroll-left" ? -1 : 1;
        carrossel.scrollBy({ left: dir * 420, behavior: "smooth" });
      }
      break;
    }

    case "trocar-slide": {
      const idx = Number(elemento.dataset.index);
      if (!isNaN(idx)) {
        heroIndex = idx;
        trocarSlideHero(0);
        sincronizarHero();
      }
      break;
    }

    case "pausar-hero":
      heroPausado = !heroPausado;
      sincronizarHero();
      elemento.textContent = heroPausado ? "Retomar" : "Pausar";
      break;

    case "toggle-menu":
      document.querySelector(".main-nav")?.classList.toggle("open");
      break;

    case "ir-busca":
      location.hash = "#/movies";
      setTimeout(() => document.querySelector("#input-busca")?.focus(), 150);
      break;

    case "mudar-pagina-catalogo": {
      const p = Number(elemento.dataset.page);
      if (!isNaN(p) && p >= 1) {
        paginaCatalogo = p;
        renderizarTela();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      break;
    }

    case "mudar-pagina-match": {
      const p = Number(elemento.dataset.page);
      if (!isNaN(p) && p >= 1) {
        paginaMatch = p;
        renderizarTela();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      break;
    }
  }
});

// Envio do Perfil
document.addEventListener("submit", (evento) => {
  if (evento.target.id !== "form-perfil") return;
  evento.preventDefault();

  const formData = new FormData(evento.target);
  const novoPerfil = {
    nome: String(formData.get("nome") || "").trim(),
    idade: Number(formData.get("idade")),
    generosFavoritos: formData.getAll("generos"),
  };

  const erroEl = document.querySelector("#perfil-erro");
  if (!validarPerfil(novoPerfil)) {
    if (erroEl) erroEl.textContent = "Preencha seu nome, idade e ao menos um gênero.";
    return;
  }

  localStorage.setItem("cinematchPerfil", JSON.stringify(novoPerfil));
  perfilAtual = novoPerfil;
  renderizarTela();
  carregarCatalogoTVMaze();
});

// Busca em Tempo Real
document.addEventListener("input", (evento) => {
  if (evento.target.id !== "input-busca") return;
  const termo = evento.target.value.toLowerCase().trim();
  const cards = document.querySelectorAll("#grid-catalogo .movie-card");
  cards.forEach((card) => {
    const nome = card.querySelector(".card-name")?.textContent.toLowerCase() || "";
    card.style.display = nome.includes(termo) ? "" : "none";
  });
});

window.addEventListener("scroll", () => {
  if (btnVoltarTopo) btnVoltarTopo.hidden = window.scrollY < 350;
}, { passive: true });

window.addEventListener("hashchange", () => {
  paginaCatalogo = 1;
  paginaMatch = 1;
  renderizarTela();
});

/* ============================================================
   8. INICIALIZAÇÃO COM O GIF DE CARREGAMENTO
   ============================================================ */
mostrarCarregamento(() => {
  renderizarTela();
  if (perfilAtual) {
    carregarCatalogoTVMaze();
  }
});