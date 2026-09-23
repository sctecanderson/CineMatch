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
/* CineMatch reference reconstruction — plain browser JavaScript, no build step. */
("use strict");
(() => {
  const D = CINEMATCH_DATA,
    S = Store,
    root = document.querySelector("#app"),
    modal = document.querySelector("#modal");
  const e = (v) =>
    String(v ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const slug = (v) =>
    String(v)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const safeURL = (v) => {
    try {
      const u = new URL(v, location.href);
      return ["https:", "http:"].includes(u.protocol) ||
        String(v).startsWith("data:image/")
        ? e(v)
        : "";
    } catch {
      return "";
    }
  };
  const paths = {
    play: "m9 5 11 7-11 7Z",
    plus: "M12 5v14M5 12h14",
    check: "m5 12 4 4 10-10",
    search: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
    menu: "M3 6h18M3 12h18M3 18h18",
    close: "m6 6 12 12M6 18 18 6",
    left: "m15 5-7 7 7 7",
    right: "m9 5 7 7-7 7",
    down: "m6 9 6 6 6-6",
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
    film: "M3 4h18v16H3zM7 4v16M17 4v16M3 9h4m-4 6h4m10-6h4m-4 6h4",
    tv: "M3 6h18v13H3zM8 22h8M8 2l4 4 4-4",
    user: "M20 21a8 8 0 0 0-16 0M17 7a5 5 0 1 1-10 0 5 5 0 0 1 10 0",
    users:
      "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M22 21v-2a4 4 0 0 0-3-4M17 3a4 4 0 0 1 0 8",
    image: "M3 3h18v18H3zM3 16l6-6 5 5 3-3 4 4M15 7h.01",
    tag: "m3 3 9 0 10 10-9 9L3 12ZM7 7h.01",
    settings:
      "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2",
    bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
    clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v6h4",
    star: "m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z",
    edit: "m15 4 5 5M3 21l5-1L21 7l-5-5L3 15Z",
    trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7",
    download: "M12 3v12m-5-5 5 5 5-5M3 15v6h18v-6",
    upload: "M12 16V4m-5 5 5-5 5 5M3 16v5h18v-5",
    share:
      "M17 5 7 10m0 4 10 5M21 4a3 3 0 1 1-6 0 3 3 0 0 1 6 0M8 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0M21 20a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
    mail: "M3 5h18v14H3ZM3 5l9 8 9-8",
    logout: "M9 3H3v18h6M9 12h13m-5-5 5 5-5 5",
    money: "M2 5h20v14H2zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
    folder: "M2 6V3h7l3 3h10v15H2Z",
    calendar: "M3 5h18v17H3zM7 2v6m10-6v6M3 11h18",
  };
  const icon = (name) =>
    `<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.grid}"/></svg>`;
  const img = (url, alt = "", cls = "") =>
    `<img class="${cls}" src="${safeURL(url)}" alt="${e(alt)}" loading="lazy" referrerpolicy="no-referrer">`;
  // Gera a logo com um link para a página inicial.
  const logo = () => `
    <a
        class="logo cinematch-logo"
        href="#/home"
        aria-label="CineMatch — início"
    >
        <img
            src="assets/logo.png"
            alt="CineMatch"
        >
    </a>
`;
  const btn = (action, label, ico = "", cls = "", attrs = "") =>
    `<button type="button" class="${cls}" data-action="${action}" ${attrs}>${ico ? icon(ico) : ""}${label}</button>`;
  const link = (route, label, cls = "") =>
    `<a class="${cls}" href="#/${route}">${label}</a>`;
  const options = (arr, current) =>
    arr
      .map(
        (x) =>
          `<option value="${e(x)}" ${String(x) === String(current) ? "selected" : ""}>${e(x)}</option>`,
      )
      .join("");
  let current = "",
    heroIndex = 0,
    heroTimer,
    tablePage = 1,
    tableQuery = "",
    tableStatus = "",
    sortKey = "",
    sortDir = 1,
    shortIndex = 0,
    lastFocus = null;
  let toastTimer;
  function toast(message) {
    const el = document.querySelector("#toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 4000);
  }
  function mostrarCarregamento(aoFinalizar) {
    if (document.querySelector(".camada-carregamento")) return;

    const camada = document.createElement("div");
    camada.className = "camada-carregamento";
    camada.setAttribute("role", "status");
    camada.setAttribute("aria-label", "Carregando CineMatch");

    const imagem = document.createElement("img");
    imagem.alt = "Carregando CineMatch";

    imagem.addEventListener(
      "load",
      () => {
        window.setTimeout(() => {
          camada.classList.add("saindo");

          window.setTimeout(() => {
            camada.remove();
            aoFinalizar();
          }, 350);
        }, 3200);
      },
      { once: true },
    );

    imagem.addEventListener(
      "error",
      () => {
        camada.remove();
        aoFinalizar();
      },
      { once: true },
    );

    imagem.src = "assets/logo-gif.gif";
    camada.append(imagem);
    document.body.append(camada);
  }
  let pararModalVideo = () => {};
  function openModal(title, body) {
    pararModalVideo();
    fecharPreview();
    lastFocus = document.activeElement;
    modal.innerHTML = `<div class="modal-head"><h2>${e(title)}</h2>${btn("close-modal", "", "close", "icon", 'aria-label="Close dialog"')}</div><div class="modal-body">${body}</div>`;
    if (!modal.open) modal.showModal();
  }
  function closeModal() {
    pararModalVideo();
    pararModalVideo = () => {};
    modal.close();
    modal.innerHTML = "";
    lastFocus?.focus?.();
  }
  modal.addEventListener("cancel", () => {
    pararModalVideo();
    modal.innerHTML = "";
  });
  const getTitle = (id) => S.catalog().find((m) => m.id === id);
  const favButton = (id, cls = "icon circle") =>
    btn(
      "favourite",
      "",
      S.favourites().includes(id) ? "check" : "plus",
      cls,
      `data-id="${e(id)}" aria-label="${S.favourites().includes(id) ? "Remove from" : "Add to"} watchlist" aria-pressed="${S.favourites().includes(id)}"`,
    );
  function header() {
    return `<header class="site-header">${btn("mobile-menu", "", "menu", "icon mobile-menu", 'aria-label="Abrir navegação"')}${logo()}<nav class="main-nav" aria-label="Navegação principal">${link("home", "Início", current === "home" ? "active" : "")}${link("recomendacoes", "Meu match", current === "recomendacoes" ? "active" : "")}<details class="dropdown"><summary>Catálogo</summary><div class="dropdown-menu">${link("movies", "Filmes de referência")}${link("tv-shows", "Séries · TVMaze")}${link("videos", "Vídeos")}${link("watchlist", "Minha lista")}</div></details>${link("comingsoon", "Em breve")}${link("short-drama", "Shorts", "shorts-link")}</nav><div class="header-actions">${btn("search", "", "search", "icon", 'aria-label="Buscar títulos"')}<span class="language pill">PT-BR</span>${btn("trocar-perfil", perfilAtual?.nome ? e(perfilAtual.nome) : "Criar perfil", "user", "secondary")}</div></header>`;
  }
  function footer() {
    return `<footer class="site-footer"><div class="footer-grid"><div>${logo()}<p>Seu próximo favorito começa com um match.</p><p>Explore histórias, descubra novos gêneros e encontre séries que combinam com você.</p></div><div><h3>Explorar</h3>${link("tv-shows", "Séries da TVMaze")}${link("movies", "Filmes de referência")}${link("recomendacoes", "Minhas recomendações")}</div><div><h3>Seu CineMatch</h3>${link("watchlist", "Minha lista")}${btn("trocar-perfil", "Trocar perfil", "", "ghost")}${link("admin/dashboard", "Painel local")}</div><div><h3>Sobre o projeto</h3><p>HTML, CSS e JavaScript puro. Projeto acadêmico SCTEC.</p><a href="https://www.tvmaze.com/" target="_blank" rel="noopener">Dados de séries: TVMaze · CC BY-SA ↗</a><p class="help-text">Imagens e trailers pertencem aos respectivos titulares.</p></div></div><div class="footer-links">${link("about-us", "Sobre")}${link("faq", "Dúvidas")}${link("help-and-support", "Ajuda")}</div><p class="copyright">© ${new Date().getFullYear()} CineMatch · Descubra sua próxima história.</p></footer>`;
  }
  function card(m, rank) {
    return `<article class="movie-card ${rank ? "rank-card" : ""}" data-card="${e(m.id)}">${rank ? `<span class="rank">${rank}</span>` : ""}<a class="poster-link" href="#/detail/${e(m.id)}" aria-label="${e(m.name)}">${img(m.image, m.name)}${m.access !== "free" ? `<span class="access">${m.access === "pay-per-view" ? "♧ RENT" : "♛"}</span>` : ""}${m.rating ? `<span class="rating">☆ ${e(m.rating)}</span>` : ""}</a>${!rank ? `<div class="card-overlay"><div>${m.trailer ? btn("trailer", "Trailer", "play", "", `data-id="${e(m.id)}"`) : link("detail/" + m.id, icon("play"), "button")}</div>${btn("preview", "", "search", "icon", `data-id="${e(m.id)}" aria-label="Prévia de ${e(m.name)}"`)}${favButton(m.id)}</div><div class="card-name">${e(m.name)}</div>` : ""}</article>`;
  }
  function shelf(title, items, route = "movies", rank = false) {
    if (!items.length) return "";
    return `<section class="shelf"><div class="section-title"><h2>${e(title)}</h2>${link(route, "Ver todos →")}</div><div class="carousel-shell"><div class="carousel">${items.map((m, i) => card(m, rank ? i + 1 : 0)).join("")}</div>${btn("shelf-left", "", "left", "carousel-arrow prev", `aria-label="Anterior em ${e(title)}"`)}${btn("shelf-right", "", "right", "carousel-arrow next", `aria-label="Próximo em ${e(title)}"`)}</div></section>`;
  }
  function collectionShelf(title, type, round = false) {
    const a = D.collections[type] || [];
    if (!a.length) return "";
    return `<section class="shelf"><div class="section-title"><h2>${title}</h2>${link(type, "View All →")}</div><div class="carousel">${a.map((c) => `<a class="${round ? "round-collection" : "landscape-card"}" href="#/${type === "channels" ? "channel/" + c.id : type === "actors" ? "person/" + c.id : "browse/" + type + "/" + encodeURIComponent(c.name)}">${img(c.image, c.name)}${round ? `<p>${e(c.name)}</p>` : `<span>${e(c.name)}</span>`}</a>`).join("")}</div></section>`;
  }
  function hero(key = "home") {
    const a = D.heroes[key] || D.heroes.home;
    return `<section class="hero cinematic-hero" data-hero-key="${key}" aria-roledescription="carrossel" aria-label="Destaques"><div class="hero-slides">${a
      .map((h, i) => {
        const m = S.catalog().find(
          (c) => c.name.toLowerCase() === h.name.toLowerCase(),
        );
        return `<div class="hero-slide ${i === heroIndex % a.length ? "active" : ""}" aria-hidden="${i !== heroIndex % a.length}"><img class="hero-bg" src="${safeURL(h.image)}" alt="${e(h.name)}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}><div class="hero-content"><span class="hero-eyebrow">EM DESTAQUE NO CINEMATCH</span><h2 class="hero-title">${e(h.name)}</h2><p>Uma nova história para descobrir. Explore o título e adicione à sua lista.</p><div class="metadata">${m?.release ? `<span>${e(m.release.slice(0, 4))}</span>` : ""}${m?.language ? `<span>${e(m.language)}</span>` : ""}${m?.duration ? `<span>${icon("clock")}${e(m.duration)}</span>` : ""}${m?.rating ? `<span>${icon("star")}${e(m.rating)}</span>` : ""}</div><div class="row">${m ? favButton(m.id) : ""}${m ? link("detail/" + m.id, icon("play") + " Explorar título", "button") : link("tv-shows", "Explorar séries", "button")}${m?.trailer ? btn("trailer", "Ver trailer", "film", "secondary", `data-id="${e(m.id)}"`) : ""}</div></div></div>`;
      })
      .join(
        "",
      )}</div><div class="hero-arrows">${btn("hero-prev", "", "left", "icon", 'aria-label="Destaque anterior"')}${btn("hero-next", "", "right", "icon", 'aria-label="Próximo destaque"')}</div><div class="hero-menu" aria-label="Selecionar destaque">${a.map((h, i) => btn("hero-dot", `<img src="${safeURL(h.image)}" alt=""><span><small>0${i + 1}</small>${e(h.name)}</span><i class="hero-progress"></i>`, "", `hero-menu-item ${i === heroIndex % a.length ? "active" : ""}`, `data-index="${i}" aria-label="Mostrar ${e(h.name)}" aria-pressed="${i === heroIndex % a.length}"`)).join("")}${btn("hero-pause", heroPaused ? "Retomar" : "Pausar", "", "hero-pause", `aria-label="${heroPaused ? "Retomar" : "Pausar"} transição automática"`)}</div></section>`;
  }
  function home() {
    const a = S.catalog(),
      movies = a.filter((c) => c.type === "movie");
    return (
      hero() +
      `<main id="content" class="home-sections"><h1 class="sr-only">CineMatch — encontre sua próxima história</h1>${recomendacoesHTML(false)}${shelf("Top 10", movies.slice(0, 10), "movies", true)}${shelf(
        "Pay Per View",
        a.filter((c) => c.access === "pay-per-view"),
        "pay-per-view",
      )}${collectionShelf("Popular Language", "languages")}${shelf("Popular Movies", movies.slice(5, 17), "movies")}${collectionShelf("Top Channels", "channels", true)}${shelf(
        "Popular TV Show",
        a.filter((c) => c.type === "tvshow"),
        "tv-shows",
      )}${collectionShelf("Popular Personalities", "actors", true)}${shelf(
        "Free Movies",
        movies.filter((c) => c.access === "free"),
        "movies",
      )}${collectionShelf("Genres", "genres")}${shelf(
        "Most Watched Videos",
        a.filter((c) => c.type === "video"),
        "videos",
      )}</main>`
    );
  }
  function filteredCatalog(route) {
    let a = S.catalog();
    if (route === "movies") a = a.filter((c) => c.type === "movie");
    if (route === "tv-shows") a = a.filter((c) => c.type === "tvshow");
    if (route === "videos") a = a.filter((c) => c.type === "video");
    if (route === "pay-per-view")
      a = a.filter((c) => c.access === "pay-per-view");
    if (route === "watchlist")
      a = a.filter((c) => S.favourites().includes(c.id));
    if (route === "comingsoon")
      a = a.filter(
        (c) => c.release && c.release > new Date().toISOString().slice(0, 10),
      );
    if (route.startsWith("browse/")) {
      const [, kind, name] = route.split("/");
      const n = decodeURIComponent(name || "").toLowerCase();
      a = a.filter((c) =>
        kind === "genres"
          ? c.genres.some((g) => g.toLowerCase() === n)
          : c.language.toLowerCase() === n,
      );
    }
    return a;
  }
  function catalogPage(route) {
    const withHero = ["movies", "tv-shows", "videos"].includes(route);
    const title =
      {
        movies: "Movies",
        "tv-shows": "TV Shows",
        videos: "Videos",
        "pay-per-view": "Pay Per View",
        watchlist: "My Watchlist",
        comingsoon: "Coming Soon",
        search: "Search",
      }[route] || decodeURIComponent(route.split("/").pop());
    return (
      (withHero ? hero(route) : "") +
      `<main id="content" class="page ${withHero ? "after-hero" : ""}"><h1>${e(title)}</h1><div class="filterbar"><input id="catalog-search" type="search" placeholder="Search titles..." aria-label="Search titles"><select id="genre-filter" aria-label="Genre"><option value="">All genres</option>${options([...new Set(S.catalog().flatMap((c) => c.genres))].sort())}</select><select id="language-filter" aria-label="Language"><option value="">All languages</option>${options(
        [
          ...new Set(
            S.catalog()
              .map((c) => c.language)
              .filter(Boolean),
          ),
        ].sort(),
      )}</select><select id="catalog-sort" aria-label="Sort titles">${options(["Featured", "Title A–Z", "Highest rated", "Newest"])}</select></div><p class="muted" id="catalog-count"></p><div id="catalog-grid" class="catalog-grid"></div></main>`
    );
  }
  function updateCatalog() {
    const container = document.querySelector("#catalog-grid");
    if (!container) return;
    let a = filteredCatalog(current),
      q = document.querySelector("#catalog-search").value.toLowerCase(),
      genre = document.querySelector("#genre-filter").value,
      language = document.querySelector("#language-filter").value,
      sort = document.querySelector("#catalog-sort").value;
    a = a.filter(
      (c) =>
        c.name.toLowerCase().includes(q) &&
        (!genre || c.genres.includes(genre)) &&
        (!language || c.language === language),
    );
    if (sort === "Title A–Z") a.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "Highest rated")
      a.sort((a, b) => Number(b.rating) - Number(a.rating));
    if (sort === "Newest")
      a.sort((a, b) => (b.release || "").localeCompare(a.release || ""));
    container.innerHTML =
      a.map((m) => card(m)).join("") ||
      '<div class="empty full">No titles found.</div>';
    document.querySelector("#catalog-count").textContent = `${a.length} titles`;
  }
  function detail(id) {
    const m = getTitle(id);
    if (!m)
      return `<main class="page" id="content"><h1>Title unavailable</h1>${link("home", "Back to home", "button")}</main>`;
    return `<section class="hero detail-hero">${img(m.image, m.name, "hero-bg")}<div class="hero-content"><span class="pill">${e(m.type === "tvshow" ? "TV SHOW" : m.type.toUpperCase())}</span><h1>${e(m.name)}</h1><div class="metadata"><span>${e(m.release?.slice(0, 4))}</span><span>${e(m.language)}</span><span>${e(m.duration)}</span>${m.rating ? `<span>☆ ${e(m.rating)} (IMDb)</span>` : ""}</div><div class="row wrap">${btn("watch", "Play Now", "play", "", `data-id="${e(m.id)}"`)}${m.trailer ? btn("trailer", "Watch Trailer", "film", "secondary", `data-id="${e(m.id)}"`) : ""}${favButton(m.id)}${btn("share", "", "share", "icon", `data-id="${e(m.id)}" aria-label="Share title"`)}</div></div></section><main id="content" class="detail-body"><div class="tabbar">${["Overview", ...(m.type === "tvshow" ? ["Episodes"] : []), "Reviews", "More Like This"].map((t, i) => btn("detail-tab", t, "", i ? "" : "active", `data-tab="${t}" data-id="${e(id)}"`)).join("")}</div><div id="detail-tab-content">${detailOverview(m)}</div>${shelf(
      "More Like This",
      S.catalog()
        .filter((c) => c.id !== id && c.type === m.type)
        .slice(0, 10),
      m.type === "tvshow" ? "tv-shows" : "movies",
    )}</main>`;
  }
  function detailOverview(m) {
    return `<div class="detail-columns"><div><h2>${e(m.name)}</h2><p>${e(m.description || `${m.name} is available in the reference catalogue. Explore the trailer and save this title to your watchlist.`)}</p><p><b>Genres:</b> ${e(m.genres.join(", ") || "Not provided")}</p></div><div><p><b>Language:</b> ${e(m.language || "Not provided")}<br><b>Release date:</b> ${e(m.release || "Not provided")}<br><b>Duration:</b> ${e(m.duration || "Not provided")}<br><b>Access:</b> ${e(m.access)}</p></div></div>`;
  }
  function videoFrame(url) {
    return `<div class="modal-video" data-inline-video="${safeURL(url)}"></div>`;
  }
  function play(id, trailer = true) {
    const m = getTitle(id);
    if (!m) return;
    const url = trailer ? m.trailer : m.video;
    if (!url) {
      openModal(
        m.name,
        `<p>${trailer ? "Não há trailer cadastrado para este título." : "O filme completo não faz parte deste catálogo de demonstração."}</p><a class="button secondary" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent(m.name + " official trailer")}">Buscar trailer no YouTube ↗</a>`,
      );
      return;
    }
    openModal(
      m.name,
      '<div class="modal-video"></div><p class="help-text">A reprodução depende da disponibilidade e das permissões do vídeo.</p>',
    );
    pararModalVideo = montarVideo(modal.querySelector(".modal-video"), url, {
      autoplay: true,
      muted: false,
    });
  }
  function collectionPage(type) {
    const a = D.collections[type] || [];
    return `<main id="content" class="page"><h1>${e({ genres: "All Genres", languages: "All Languages", actors: "Your Favourite Personality List", channels: "Top Channels" }[type])}</h1><div class="catalog-grid">${a.map((c) => `<a class="panel" href="#/${type === "channels" ? "channel/" + c.id : type === "actors" ? "person/" + c.id : "browse/" + type + "/" + encodeURIComponent(c.name)}">${img(c.image, c.name, "collection-img")}<h3>${e(c.name)}</h3></a>`).join("")}</div></main>`;
  }
  function liveTV() {
    return `<main id="content" class="page"><h1>Live TV</h1>${collectionShelf("Top Channels", "channels", true)}${[
      "News & Current Affairs",
      "Sports & Action",
      "Entertainment & Variety",
      "Music & Concerts",
    ]
      .map(
        (t, i) =>
          `<section class="shelf"><h2>${t}</h2><div class="carousel">${D.collections.channels
            .slice(i * 2, i * 2 + 4)
            .map(
              (c) =>
                `<a class="landscape-card" href="#/channel/${e(c.id)}">${img(c.image, c.name)}<span>${e(c.name)}</span></a>`,
            )
            .join("")}</div></section>`,
      )
      .join("")}</main>`;
  }
  function shorts() {
    const a = S.catalog().filter((m) => m.type === "video"),
      m = a[shortIndex % a.length];
    return `<main id="content" class="page"><div class="row between"><h1>Shorts</h1><div class="row">${btn("short-prev", "", "left", "icon", 'aria-label="Previous short"')}${btn("short-next", "", "right", "icon", 'aria-label="Next short"')}</div></div><div class="shorts-stage">${img(m.image, m.name)}<div class="shorts-actions">${btn("trailer", "", "play", "icon circle", `data-id="${e(m.id)}" aria-label="Play trailer"`)}${favButton(m.id)}${btn("share", "", "share", "icon circle", `data-id="${e(m.id)}" aria-label="Share"`)}</div><div class="shorts-caption"><h2>${e(m.name)}</h2>${link("detail/" + m.id, "View details →")}</div></div></main>`;
  }
  function auth(admin = false, register = false, forgot = false) {
    return `<main id="content" class="auth-page"><section class="auth-card">${logo()}<h1>${forgot ? "Forgot Password?" : register ? "Create Account" : admin ? "Admin Login" : "Login"}</h1><form id="auth-form" data-admin="${admin}" data-mode="${forgot ? "forgot" : register ? "register" : "login"}">${register ? '<label class="field">Full name<input name="name" required autocomplete="name"></label>' : ""}<label class="field">Email<input type="email" name="email" required autocomplete="email" placeholder="Email"></label>${!forgot ? '<label class="field">Password<input type="password" name="password" required minlength="8" autocomplete="off" placeholder="Enter password"></label>' : ""}<div class="auth-links"><label><input type="checkbox" name="remember"> Remember Me</label>${link("forgot-password", "Forgot Password?")}</div><button type="submit">${forgot ? "Request reset" : register ? "Create demo profile" : "Login"}</button></form><p class="help-text">Local demonstration only. Do not enter a real password. No credentials are sent to CineMatch.</p>${btn("demo-login", "Enter demonstration", "", "secondary", `data-admin="${admin}" style="width:100%"`)}<div class="auth-links" style="margin-top:22px">${link(register ? "login" : "register", register ? "Already have an account?" : "Create an account")}${link("home", "Back to Home")}</div>${admin ? "" : link("admin/login", "Administrator access", "muted")}</section></main>`;
  }
  function pricing() {
    return `<main id="content" class="page"><h1 style="text-align:center">Choose Your Plan</h1><p style="text-align:center">Enjoy movies, TV shows and more.</p><div class="pricing-grid">${S.list(
      "plans",
    )
      .filter((p) => p.Status !== false)
      .map(
        (p, i) =>
          `<section class="panel plan ${i === 1 ? "featured" : ""}"><h2>${e(p.Name)}</h2><div class="price">$${Number(p.Price).toFixed(2)} <small>/ ${e(p.Duration)}</small></div><ul><li>✓ Movies and TV shows</li><li>✓ ${["HD", "Full HD", "4K UHD"][i % 3]} quality</li><li>✓ ${i + 1} supported screens</li><li>✓ Watch on your favourite devices</li></ul>${btn("choose-plan", "Select Plan", "", "", `data-id="${e(p.id)}"`)}</section>`,
      )
      .join(
        "",
      )}</div><p class="note">Demonstration prices. Checkout does not process payments or create a real subscription.</p></main>`;
  }
  function prose(route) {
    const titles = {
      "privacy-policy": "Privacy Policy",
      "terms-conditions": "Terms & Conditions",
      "help-and-support": "Help and Support",
      "refund-and-cancellation-policy": "Refund and Cancellation Policy",
      "data-deletation-request": "Data Deletion Request",
      "about-us": "About Us",
      faq: "FAQ",
    };
    let body = "";
    if (route === "faq")
      body = S.list("faqs")
        .filter((x) => x.Status !== false)
        .map(
          (f) =>
            `<details><summary>${e(f.Question)}</summary><p>${e(f.Answer)}</p></details>`,
        )
        .join("");
    else if (route === "help-and-support")
      body = `<p>Send a message to the local support inbox.</p><form id="support-form" class="stack"><label class="field">Name<input name="name" required></label><label class="field">Email<input name="email" type="email" required></label><label class="field">Message<textarea name="message" required></textarea></label><button>Save message locally</button></form>`;
    else if (route === "data-deletation-request")
      body = `<p>You can remove your local profile and watchlist from this browser. This action does not affect accounts on the original website.</p>${btn("delete-profile", "Delete local profile", "", "secondary")}`;
    else if (route === "about-us")
      body =
        "<p>CineMatch brings movies, TV shows, videos and live channels together in one entertainment catalogue.</p><p>This HTML, CSS and JavaScript edition is an independent reconstruction of the reference interface.</p>";
    else
      body = `<p class="note">This is a local interface demonstration, not the original service. No payment, streaming subscription or legal agreement is created here.</p><h2>${route === "privacy-policy" ? "Local data" : "Demonstration terms"}</h2><p>Catalogue edits, preferences and watchlists are saved in your browser. Images and embedded videos are requested from external providers when available.</p><p>Before using this project as a public service, replace this page with terms specific to your service.</p>`;
    return `<main id="content" class="page"><article class="prose"><h1>${titles[route]}</h1>${body}</article></main>`;
  }
  const groups = [
    [
      "Main",
      [
        ["dashboard", "Dashboard", "grid"],
        ["media-library", "Media Library", "image"],
      ],
    ],
    [
      "Media Management",
      [
        ["genres", "Genres", "tag"],
        ["movies", "Movies", "film"],
        ["tvshows", "TV Shows", "tv"],
        ["seasons", "Seasons", "folder"],
        ["episodes", "Episodes", "film"],
        ["videos", "Videos", "play"],
        ["tv-category", "TV Category", "tv"],
        ["tv-channel", "TV Channel", "tv"],
        ["castcrew/actor", "Actors", "users"],
        ["castcrew/director", "Directors", "user"],
        ["vastads", "VAST Ads", "film"],
        ["customads", "Custom Ads", "image"],
      ],
    ],
    [
      "Subscription",
      [
        ["subscriptions", "Subscriptions", "star"],
        ["plans", "Plans", "menu"],
        ["planlimitation", "Plan Limits", "tag"],
        ["pay-per-view-history", "Rent History", "clock"],
        ["coupon", "Coupon", "tag"],
      ],
    ],
    [
      "Users",
      [
        ["users", "Users", "users"],
        ["soon-to-expire-users", "Soon-to-Expire", "clock"],
        ["reviews", "Reviews", "star"],
      ],
    ],
    [
      "System Setting",
      [
        ["banners", "App Banner", "image"],
        ["constants", "Constants", "grid"],
        ["mobile-setting", "Mobile Setting", "tv"],
        ["notifications", "Notifications", "bell"],
        ["notification-templates", "Templates", "mail"],
        ["setting/general-setting", "Settings", "settings"],
        ["pages", "Pages", "folder"],
        ["onboardings", "Onboarding", "grid"],
        ["taxes", "Tax", "money"],
        ["faqs", "FAQ", "mail"],
      ],
    ],
  ];
  function adminNavigation(key) {
    const nested = {
      tvshows: ["TV Shows", "tv", ["tvshows", "seasons", "episodes"]],
      "tv-category": ["Live TV", "tv", ["tv-category", "tv-channel"]],
      "castcrew/actor": [
        "Cast & Crew",
        "users",
        ["castcrew/actor", "castcrew/director"],
      ],
      vastads: ["Ads Manager", "film", ["vastads", "customads"]],
      "mobile-setting": ["Mobile Setting", "tv", ["mobile-setting"]],
      notifications: [
        "Notifications",
        "bell",
        ["notifications", "notification-templates"],
      ],
    };
    const children = new Set(
      Object.values(nested).flatMap((g) => g[2].slice(1)),
    );
    const all = groups.flatMap((g) => g[1]);
    return groups
      .map(
        ([title, items]) =>
          `<div class="nav-group-title">${title}</div>${items
            .map(([r, n, i]) => {
              if (children.has(r)) return "";
              const group = nested[r];
              if (group)
                return `<details ${group[2].includes(key) ? "open" : ""}><summary>${icon(group[1])}${group[0]}<span style="margin-left:auto">›</span></summary>${group[2]
                  .map((k) => {
                    const item = all.find((x) => x[0] === k);
                    return link(
                      "admin/" + k,
                      icon(item?.[2] || "grid") +
                        (k === "mobile-setting"
                          ? "Content Setting"
                          : item?.[1] || k),
                      "nav-item " + (key === k ? "active" : ""),
                    );
                  })
                  .join("")}</details>`;
              return link(
                "admin/" + r,
                icon(i) + n,
                "nav-item " + (key === r ? "active" : ""),
              );
            })
            .join("")}`,
      )
      .join("");
  }
  function adminShell(content, key) {
    return `<aside class="admin-sidebar">${logo()}${adminNavigation(key)}</aside><div class="admin-mobile-backdrop" data-action="admin-menu"></div><header class="admin-topbar">${btn("admin-menu", "", "menu", "icon", 'aria-label="Toggle admin sidebar"')}<div class="row"><span class="local-label">LOCAL DEMONSTRATION</span>${link("home", "View Site", "button secondary")}${link("admin/notifications", icon("bell"), "button icon")}${link("admin/my-profile", icon("user"), "button icon")}${btn("admin-logout", "", "logout", "icon", 'aria-label="Log out of demonstration"')}</div></header><main class="admin-main" id="content">${key !== "dashboard" ? `<div class="breadcrumb">${link("admin/dashboard", "Dashboard")}　/　${e(D.schemas[key]?.title || "Editor")}</div>` : ""}${content}<footer class="admin-footer">CineMatch: Your Ultimate Entertainment Hub · HTML / CSS / JavaScript · Data saved in this browser</footer></main>`;
  }
  function spark() {
    return '<svg class="sparkline" viewBox="0 0 180 65" role="img" aria-label="Decorative reference trend"><path d="M0 60C50 57 50 47 80 36S135 5 175 3V62H0Z" fill="currentColor" opacity=".22"/><path d="M0 60C50 57 50 47 80 36S135 5 175 3" fill="none" stroke="currentColor" stroke-width="4"/></svg>';
  }
  function dashboard() {
    const counts = [
      ["Total Users", S.list("users").length, "users", "user"],
      [
        "Total Subscribers",
        S.list("subscriptions").length,
        "subscriptions",
        "users",
      ],
      [
        "Total Soon to Expire",
        S.list("soon-to-expire-users").length,
        "soon-to-expire-users",
        "clock",
      ],
      ["Total Reviews", S.list("reviews").length, "reviews", "star"],
      ["Catalogue Titles", S.catalog().length, "movies", "film"],
      [
        "Rent Content",
        S.catalog().filter((m) => m.access === "pay-per-view").length,
        "movies",
        "tv",
      ],
      ["Subscription Revenue", "$0.00", "subscriptions", "money"],
      ["Rent Revenue", "$0.00", "pay-per-view-history", "money"],
      ["Total Revenue", "$0.00", "subscriptions", "money"],
    ];
    return `<div class="row between wrap" style="margin-bottom:20px"><span class="help-text">Local data · decorative reference charts</span><div class="row"><input type="date" id="dash-date" aria-label="Filter date">${btn("dashboard-date", "Submit")}${btn("dashboard-reset", "Reset", "", "secondary")}</div></div><div class="dashboard-grid">${counts.map(([n, v, r, i]) => `<a class="stat-card" href="#/admin/${r}"><span class="stat-icon">${icon(i)}</span>${spark()}<div class="stat-label">${n}</div><div class="row between"><div class="stat-value">${v}</div><span class="stat-gain">Local</span></div></a>`).join("")}<section class="panel genre-chart"><h3>Top 5 Genres</h3><div class="pie" role="img" aria-label="Illustrative genre distribution"></div><div class="legend">${["Horror", "Historical", "Inspirational", "Romantic", "Comedy"].map((x, i) => `<span style="--c:${["#e50914", "#be0010", "#97000a", "#760007", "#440004"][i]}">${x}</span>`).join("")}</div></section></div><div class="chart-grid"><section class="panel"><h3>Total Revenue</h3><p>No real payment data connected.</p><div class="revenue-bars">${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"].map((x) => `<div class="bar" style="height:2px"><span class="bar-label">${x}</span></div>`).join("")}</div></section><section class="panel"><h3>New Subscribers</h3><div class="empty">No local subscriptions yet.</div></section></div><div class="chart-grid"><section class="panel"><div class="section-title"><h3>Most Watched</h3>${link("admin/movies", "View All →")}</div><div class="carousel">${S.catalog()
      .slice(0, 5)
      .map(
        (m) =>
          `<a class="round-collection" href="#/detail/${e(m.id)}">${img(m.image, m.name)}<p>${e(m.name)}</p></a>`,
      )
      .join(
        "",
      )}</div></section><section class="panel"><h3>Transactions</h3><div class="empty">No payment gateway connected.</div></section></div>`;
  }
  function valueFor(row, col) {
    if (
      [
        "Movie",
        "TV Show",
        "Video",
        "Genres",
        "Actors",
        "Directors",
        "TV Channel",
        "User",
        "Name",
        "Title",
        "Season",
        "Episode",
      ].includes(col)
    )
      return row[col] ?? row.name ?? row.Name ?? "";
    if (col === "Access") return row.access || row.Access || "free";
    if (col === "Language") return row.language || row.Language || "";
    if (col === "Status") return row.Status ?? row.status ?? true;
    if (col === "Like" || col === "Watch") return row[col] || 0;
    return row[col] ?? "";
  }
  function tableData(key) {
    let a = S.list(key).filter((r) => !r.deleted);
    if (tableQuery)
      a = a.filter((r) =>
        JSON.stringify(r).toLowerCase().includes(tableQuery.toLowerCase()),
      );
    if (tableStatus)
      a = a.filter(
        (r) =>
          Boolean(r.Status ?? r.status ?? true) === (tableStatus === "active"),
      );
    if (sortKey)
      a.sort(
        (a, b) =>
          String(valueFor(a, sortKey)).localeCompare(
            String(valueFor(b, sortKey)),
            undefined,
            { numeric: true },
          ) * sortDir,
      );
    return a;
  }
  function tableView(key) {
    const schema = D.schemas[key] || {
      title: key,
      columns: ["Name", "Status"],
    };
    return `<section class="table-panel"><h1>${e(schema.title)}</h1><div class="toolbar"><select id="bulk-action" aria-label="Bulk action">${options(["Action", "Activate", "Deactivate", "Delete"])}</select>${btn("bulk-apply", "Apply", "", "secondary", `data-key="${e(key)}"`)}${btn("export-table", "Export", "download", "ghost", `data-key="${e(key)}"`)}${btn("import-table", "Import", "upload", "ghost", `data-key="${e(key)}"`)}<span class="spacer"></span><select id="table-status" aria-label="Filter status"><option value="">All</option><option value="active" ${tableStatus === "active" ? "selected" : ""}>Active</option><option value="inactive" ${tableStatus === "inactive" ? "selected" : ""}>Inactive</option></select><input type="search" id="table-search" value="${e(tableQuery)}" placeholder="Search..." aria-label="Search records">${link("admin/" + key + "/new", icon("plus") + " New", "button")}</div><div class="table-wrap" id="table-container">${tableBody(key)}</div></section>`;
  }
  function tableBody(key) {
    const schema = D.schemas[key] || { columns: ["Name", "Status"] },
      a = tableData(key),
      limit = 10,
      pages = Math.max(1, Math.ceil(a.length / limit));
    tablePage = Math.min(tablePage, pages);
    const rows = a.slice((tablePage - 1) * limit, tablePage * limit);
    return `<table><thead><tr><th><input type="checkbox" id="select-all" aria-label="Select visible records"></th>${schema.columns.map((c) => `<th>${btn("sort", e(c) + (sortKey === c ? (sortDir === 1 ? " ↑" : " ↓") : ""), "", "", `data-column="${e(c)}" data-key="${e(key)}"`)}</th>`).join("")}<th>Action</th></tr></thead><tbody>${rows
      .map(
        (r) =>
          `<tr><td><input class="select-record" type="checkbox" value="${e(r.id)}" aria-label="Select ${e(r.name || r.Name || r.id)}"></td>${schema.columns
            .map((c, i) => {
              const v = valueFor(r, c);
              if (c === "Status")
                return `<td>${btn("toggle-status", "", "", `switch ${v ? "on" : ""}`, `data-key="${e(key)}" data-id="${e(r.id)}" role="switch" aria-checked="${!!v}" aria-label="Status of ${e(r.name || r.id)}"`)}</td>`;
              if (c === "Restricted Content")
                return `<td>${btn("toggle-restricted", "", "", `switch ${r.restricted ? "on" : ""}`, `data-key="${e(key)}" data-id="${e(r.id)}" role="switch" aria-checked="${!!r.restricted}" aria-label="Restricted content"`)}</td>`;
              return `<td>${i === 0 ? `<div class="row">${r.image ? img(r.image, r.name || "", "table-poster") : ""}<div class="table-name">${e(v)}${r.genres ? `<small>${e(r.genres.join(", "))}</small><small>${e(r.release)}</small>` : ""}</div></div>` : c === "Access" ? `<span class="pill">${e(v)}</span>` : e(v)}</td>`;
            })
            .join(
              "",
            )}<td><div class="table-actions">${link("admin/" + key + "/edit/" + encodeURIComponent(r.id), icon("edit"), "button icon")}${btn("delete-record", "", "trash", "icon", `data-key="${e(key)}" data-id="${e(r.id)}" aria-label="Delete ${e(r.name || r.id)}"`)}</div></td></tr>`,
      )
      .join(
        "",
      )}</tbody></table>${!rows.length ? '<div class="empty">No records. Use New to create a local record.</div>' : ""}<div class="pagination"><span>Showing ${a.length ? (tablePage - 1) * limit + 1 : 0} to ${Math.min(tablePage * limit, a.length)} of ${a.length} entries</span><div class="row">${btn("table-prev", "Previous", "", "secondary", `data-key="${e(key)}" ${tablePage === 1 ? "disabled" : ""}`)}<span>${tablePage} / ${pages}</span>${btn("table-next", "Next", "", "secondary", `data-key="${e(key)}" ${tablePage === pages ? "disabled" : ""}`)}</div></div>`;
  }
  function field(label, name, value = "", type = "text", required = false) {
    return `<label class="field">${e(label)}${required ? " *" : ""}${type === "textarea" ? `<textarea name="${e(name)}" ${required ? "required" : ""}>${e(value)}</textarea>` : type === "checkbox" ? `<input name="${e(name)}" type="checkbox" ${value ? "checked" : ""}>` : `<input type="${type}" name="${e(name)}" value="${e(value)}" ${required ? "required" : ""} ${type === "number" ? 'step="any" min="0"' : ""}>`}</label>`;
  }
  function contentEditor(key, id) {
    const r = id ? S.list(key).find((x) => x.id === id) : null,
      m = r || {
        name: "",
        image: "",
        genres: [],
        status: true,
        access: "free",
        type: { movies: "movie", tvshows: "tvshow", videos: "video" }[key],
      };
    return `<h1>${r ? "Edit" : "New"} ${key === "tvshows" ? "TV Show" : key === "videos" ? "Video" : "Movie"}</h1><form id="record-form" data-key="${e(key)}" data-id="${e(id || "")}" class="stack"><section class="panel"><h2>About ${key === "tvshows" ? "TV Show" : "Movie"}</h2><div class="form-grid"><div class="upload-zone">${m.image ? img(m.image, m.name) : icon("image")}<label class="field">Thumbnail / Poster<input type="file" id="poster-upload" accept="image/png,image/jpeg,image/webp"></label></div><div class="stack">${field("Poster URL", "image", m.image, "url")}${field("Name", "name", m.name, "text", true)}</div><label class="field">Trailer URL Type<select name="trailerType">${options(["YouTube", "URL"], m.trailerType)}</select></label>${field("Trailer URL", "trailer", m.trailer, "url")}<div class="full">${field("Description", "description", m.description, "textarea")}</div></div></section><section class="panel"><h2>Basic Info</h2><div class="form-grid"><label class="field">Access<select name="access">${options(["free", "paid", "pay-per-view"], m.access)}</select></label>${field("Status", "status", m.status !== false, "checkbox")}${field("Language", "language", m.language || "English")}${field("Genres (comma separated)", "genres", (m.genres || []).join(", "))}${field("IMDb Rating", "rating", m.rating, "number")}${field("Duration", "duration", m.duration)}${field("Release Date", "release", m.release, "date")}${field("Content Rating", "contentRating", m.contentRating)}${field("Age Restricted", "restricted", m.restricted, "checkbox")}${field("Price", "Price", m.Price || 0, "number")}</div></section><section class="panel"><h2>Video Info</h2><p class="help-text">Use your own playable MP4/WebM URL or a public YouTube link. Full movies are not included.</p>${field("Video URL", "video", m.video, "url")}</section><div class="row">${link("admin/" + key, "Cancel", "button secondary")}<button type="submit">Save Changes</button></div></form>`;
  }
  function genericEditor(key, id) {
    const r = id ? S.list(key).find((x) => x.id === id) : null,
      schema = D.schemas[key] || {
        title: key,
        fields: [],
        columns: ["Name", "Status"],
      };
    let labels = [
      ...new Set(["Name", ...schema.columns, ...schema.fields, "Status"]),
    ].filter(
      (x) =>
        ![
          "Action",
          "Like",
          "Watch",
          "Restricted Content",
          "Created At",
          "Updated At",
        ].includes(x) && x.length < 60,
    );
    if (key === "faqs") labels = ["Question", "Answer", "Status"];
    if (key === "pages") labels = ["Name", "Content", "Status"];
    return `<h1>${r ? "Edit" : "New"} ${e(schema.title)}</h1><form id="record-form" data-key="${e(key)}" data-id="${e(id || "")}" class="stack"><section class="panel form-grid">${labels.map((l, i) => field(l, l, r?.[l] ?? (l === "Name" ? r?.name || "" : l === "Status" ? true : ""), l === "Status" ? "checkbox" : /description|answer|content|bio|review/i.test(l) ? "textarea" : /date/i.test(l) ? "date" : /price|amount|discount|level|value/i.test(l) ? "number" : /^email$/i.test(l) ? "email" : "text", i === 0)).join("")}</section><div class="row">${link("admin/" + key, "Cancel", "button secondary")}<button type="submit">Save Changes</button></div></form>`;
  }
  function settings(key) {
    const s = D.schemas[key],
      vals = S.read("settings:" + key, {});
    const integration = /mail|storage|module|notification|custom-code/.test(
      key,
    );
    return `<h1>Setting</h1><div class="settings-layout"><nav class="panel settings-nav">${Object.entries(
      D.schemas,
    )
      .filter(([k]) => k.startsWith("setting/"))
      .map(([k, v]) =>
        link("admin/" + k, e(v.title), k === key ? "active" : ""),
      )
      .join(
        "",
      )}</nav><section class="panel"><h2>${e(s.title)}</h2>${integration ? '<p class="note">Interface demonstration. Private server integrations are not connected. Do not enter API keys or real passwords here.</p>' : ""}<form id="settings-form" data-key="${e(key)}" class="stack"><div class="form-grid">${s.fields
      .filter((l) => l.length < 80)
      .map((l) => {
        const sensitive = /password|secret|api key|access key|username/i.test(
          l,
        );
        return `<div class="${sensitive ? "disabled-field" : ""}">${sensitive ? `<label class="field">${e(l)}<input disabled placeholder="Requires secure backend"></label>` : field(l, l, vals[l] || "", /description|code/i.test(l) ? "textarea" : "text")}</div>`;
      })
      .join(
        "",
      )}</div><button type="submit">Save locally</button></form></section></div>`;
  }
  function media() {
    const all = [
      ...S.read("media", []),
      ...S.catalog().map((m) => ({ id: m.id, name: m.name, image: m.image })),
    ];
    return `<div class="section-title"><h1>Media Library</h1><label class="button">${icon("upload")} Upload image<input hidden type="file" id="media-upload" accept="image/png,image/jpeg,image/webp"></label></div><p class="help-text">Uploads are saved in this browser. Maximum 2 MB per image.</p><div class="media-grid">${all.map((m) => `<div class="media-tile">${img(m.image, m.name)}<p>${e(m.name)}</p>${btn("media-view", "", "search", "icon", `data-url="${safeURL(m.image)}" data-name="${e(m.name)}" aria-label="View ${e(m.name)}"`)}</div>`).join("")}</div>`;
  }
  function profile() {
    const viewer = S.read("viewer", {
      name: "Demo Viewer",
      email: "viewer@example.test",
    });
    return `<main id="content" class="page"><h1>My Profile</h1><form id="profile-form" class="panel stack" style="max-width:600px">${field("Name", "name", viewer.name, "text", true)}${field("Email", "email", viewer.email, "email", true)}<button>Save profile</button></form><div class="row" style="margin-top:25px">${link("watchlist", "My Watchlist", "button secondary")}${btn("viewer-logout", "Logout", "", "secondary")}</div></main>`;
  }
  function adminPage(route) {
    if (route === "login") return auth(true);
    if (!S.read("adminSession", false)) return auth(true);
    let key = route,
      mode = "",
      id = "";
    if (route.includes("/edit/")) {
      [key, id] = route.split("/edit/");
      id = decodeURIComponent(id);
      mode = "edit";
    } else if (route.endsWith("/new")) {
      key = route.slice(0, -4);
      mode = "new";
    }
    let html;
    if (mode)
      html = ["movies", "tvshows", "videos"].includes(key)
        ? contentEditor(key, id)
        : genericEditor(key, id);
    else if (key === "dashboard") html = dashboard();
    else if (key === "media-library") html = media();
    else if (key.startsWith("setting/") && D.schemas[key]) html = settings(key);
    else if (key === "mobile-setting")
      html = `<section class="panel"><h1>Manage Content</h1><form id="settings-form" data-key="mobile-setting" class="stack">${["Banner", "Continue Watching", "Top 10", "Advertisement", "New Released Movies", "Popular Language", "Popular Movies", "Top Channels", "Popular Personalities", "Free Movies", "Genres", "Popular TV Show", "Most Watched Videos"].map((x) => field(x, x, S.read("settings:mobile-setting", {})[x] ?? true, "checkbox")).join("")}<button>Save locally</button></form></section>`;
    else if (key === "my-profile")
      html = `<section class="panel"><h1>Personal Information</h1><form id="settings-form" data-key="my-profile" class="form-grid">${["First Name", "Last Name", "Email", "Contact Number", "Gender"].map((x) => field(x, x, S.read("settings:my-profile", {})[x] || "")).join("")}<button>Save locally</button></form></section>`;
    else if (D.schemas[key]) html = tableView(key);
    else
      html =
        "<h1>Page not found</h1>" +
        link("admin/dashboard", "Back to Dashboard", "button");
    return adminShell(html, key);
  }
  function render() {
    inlineCleanups.forEach((stop) => stop());
    inlineCleanups = [];
    clearInterval(heroTimer);
    fecharPreview();
    if (modal.open) closeModal();
    current = decodeURI(
      location.hash.replace(/^#\/?/, "") ||
        document.body.dataset.entry ||
        "home",
    );
    document.body.classList.toggle("is-admin", current.startsWith("admin/"));
    let content;
    if (!current.startsWith("admin/") && !perfilAtual) {
      root.innerHTML = header() + formularioPerfil() + footer();
      traduzirInterface();
      return;
    }
    if (current.startsWith("admin/")) {
      root.innerHTML = adminPage(current.slice(6));
      traduzirInterface();
      document.title = "CineMatch · Administration";
      return;
    }
    if (["login", "register", "forgot-password"].includes(current)) {
      root.innerHTML = auth(
        false,
        current === "register",
        current === "forgot-password",
      );
      return;
    }
    if (current === "home") content = home();
    else if (current === "recomendacoes")
      content = `<main id="content" class="page"><h1>Seu próximo match</h1>${recomendacoesHTML(true)}</main>`;
    else if (
      [
        "movies",
        "tv-shows",
        "videos",
        "watchlist",
        "pay-per-view",
        "comingsoon",
        "search",
      ].includes(current) ||
      current.startsWith("browse/")
    )
      content = catalogPage(current);
    else if (current.startsWith("detail/")) content = detail(current.slice(7));
    else if (["genres", "languages", "actors", "channels"].includes(current))
      content = collectionPage(current);
    else if (current === "livetv") content = liveTV();
    else if (current === "short-drama") content = shorts();
    else if (current === "plans") content = pricing();
    else if (current === "profile") content = profile();
    else if (current.startsWith("channel/")) {
      const c = D.collections.channels.find((c) => c.id === current.slice(8));
      content = `<main id="content" class="page"><h1>${e(c?.name || "Channel")}</h1><section class="panel">${c ? img(c.image, c.name, "channel-logo") : ""}<p>The live streaming endpoint is not included in the public reference.</p>${link("admin/tv-channel", "Manage channel locally", "button secondary")}</section></main>`;
    } else if (current.startsWith("person/")) {
      const p = D.collections.actors.find((a) => a.id === current.slice(7));
      content = `<main id="content" class="page"><h1>${e(p?.name || "Personality")}</h1>${p ? img(p.image, p.name, "person-photo") : ""}<p>Personality listed in the reference catalogue.</p>${link("actors", "All personalities →")}</main>`;
    } else if (
      [
        "privacy-policy",
        "terms-conditions",
        "help-and-support",
        "refund-and-cancellation-policy",
        "data-deletation-request",
        "about-us",
        "faq",
      ].includes(current)
    )
      content = prose(current);
    else
      content = `<main class="page" id="content"><h1>Page not found</h1>${link("home", "Back to Home", "button")}</main>`;
    root.innerHTML = header() + content + footer();
    updateCatalog();
    preencherRecomendacoes();
    traduzirInterface();
    document.title =
      "CineMatch · " + (current === "home" ? "Home" : current.split("/")[0]);
    document.querySelectorAll("[data-inline-video]").forEach((el) =>
      inlineCleanups.push(
        montarVideo(el, el.dataset.inlineVideo, {
          autoplay: false,
          muted: false,
        }),
      ),
    );
    sincronizarHero();
    atualizarTopo();
  }
  function sincronizarHero() {
    clearInterval(heroTimer);
    if (
      !heroPaused &&
      document.querySelector(".cinematic-hero") &&
      !document.hidden &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      heroTimer = setInterval(() => changeHero(1), INTERVALO_BANNER);
  }
  function changeHero(step) {
    const heroEl = document.querySelector(".cinematic-hero");
    if (!heroEl) return;
    const slides = [...heroEl.querySelectorAll(".hero-slide")];
    heroIndex = (heroIndex + step + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      const active = i === heroIndex;
      slide.classList.toggle("active", active);
      slide.setAttribute("aria-hidden", String(!active));
      slide.inert = !active;
    });
    heroEl.querySelectorAll(".hero-menu-item").forEach((b, i) => {
      b.classList.toggle("active", i === heroIndex);
      b.setAttribute("aria-pressed", String(i === heroIndex));
    });
  }

  function redrawTable(key) {
    const el = document.querySelector("#table-container");
    if (el) el.innerHTML = tableBody(key);
  }
  function saveFile(name, contents, type = "application/json") {
    const url = URL.createObjectURL(new Blob([contents], { type }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  function selectedIds() {
    return [...document.querySelectorAll(".select-record:checked")].map(
      (x) => x.value,
    );
  }
  function confirmDelete(key, ids) {
    if (!ids.length) {
      toast("Select at least one record.");
      return;
    }
    openModal(
      "Delete records?",
      `<p>${ids.length} local record(s) will be moved to the local trash.</p>${btn("confirm-delete", "Delete", "", "", `data-key="${e(key)}" data-ids="${e(JSON.stringify(ids))}"`)}`,
    );
  }
  root.addEventListener(
    "error",
    (ev) => {
      const target = ev.target;
      if (target.tagName === "IMG") {
        target.classList.add("cover-fallback");
        if (target.closest(".logo")) {
          target.hidden = true;
          target.nextElementSibling.hidden = false;
        } else {
          target.style.objectFit = "contain";
          target.alt = target.alt || "Image unavailable";
        }
      }
    },
    true,
  );
  document.addEventListener("click", async (ev) => {
    const el = ev.target.closest("[data-action]");
    if (!el) return;
    const a = el.dataset.action,
      id = el.dataset.id,
      key = el.dataset.key;
    try {
      switch (a) {
        case "close-modal":
          closeModal();
          break;
        case "mobile-menu":
          document.querySelector(".main-nav").classList.toggle("open");
          break;
        case "admin-menu":
          document.querySelector(".admin-sidebar").classList.toggle("open");
          break;
        case "search":
          location.hash = "/search";
          setTimeout(
            () => document.querySelector("#catalog-search")?.focus(),
            0,
          );
          break;
        case "hero-prev":
          changeHero(-1);
          sincronizarHero();
          break;
        case "hero-next":
          changeHero(1);
          sincronizarHero();
          break;
        case "hero-dot":
          heroIndex = Number(el.dataset.index);
          changeHero(0);
          sincronizarHero();
          break;
        case "hero-pause":
          heroPaused = !heroPaused;
          el.textContent = heroPaused ? "Retomar" : "Pausar";
          el.dataset.paused = String(heroPaused);
          el.setAttribute(
            "aria-label",
            heroPaused
              ? "Retomar transição automática"
              : "Pausar transição automática",
          );
          sincronizarHero();
          break;
        case "preview": {
          const cardEl = el.closest("[data-card]");
          abrirPreview(cardEl);
          break;
        }
        case "close-preview":
          fecharPreview();
          break;
        case "trocar-perfil":
          perfilAtual = null;
          localStorage.removeItem("cinematchPerfil");
          render();
          document.querySelector("#perfil-nome")?.focus();
          break;
        case "voltar-topo":
          window.scrollTo({
            top: 0,
            behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
              ? "auto"
              : "smooth",
          });
          break;
        case "shelf-left":
        case "shelf-right": {
          fecharPreview();
          const carousel = el.closest(".shelf").querySelector(".carousel");
          carousel.scrollBy({
            left: (a === "shelf-left" ? -1 : 1) * carousel.clientWidth * 0.85,
            behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
              ? "auto"
              : "smooth",
          });
          break;
        }
        case "favourite": {
          const added = S.toggleFavourite(id);
          document
            .querySelectorAll('[data-action="favourite"]')
            .forEach((b) => {
              if (b.dataset.id === id) {
                b.innerHTML = icon(added ? "check" : "plus");
                b.setAttribute("aria-pressed", String(added));
                b.setAttribute(
                  "aria-label",
                  added ? "Remove from watchlist" : "Add to watchlist",
                );
              }
            });
          toast(
            added ? "Added to your watchlist" : "Removed from your watchlist",
          );
          if (current === "watchlist") updateCatalog();
          break;
        }
        case "trailer":
          play(id, true);
          break;
        case "watch":
          play(id, false);
          break;
        case "share": {
          const u =
            location.href.split("#")[0] + "#/detail/" + encodeURIComponent(id);
          if (navigator.clipboard?.writeText) {
            try {
              await navigator.clipboard.writeText(u);
              toast("Link copied");
            } catch {
              openModal(
                "Share",
                `<input value="${e(u)}" readonly style="width:100%">`,
              );
            }
          } else
            openModal(
              "Share",
              `<input value="${e(u)}" readonly style="width:100%">`,
            );
          break;
        }
        case "download-app":
          openModal(
            "Download Our App",
            '<p>Choose the official store.</p><a class="button" target="_blank" rel="noopener" href="https://play.google.com/store/apps/details?id=com.iqonic.streamitlaravel&pcampaignid=web_share">Google Play</a> <a class="button secondary" target="_blank" rel="noopener" href="https://apps.apple.com/us/app/streamit-laravel/id6736365806">App Store</a>',
          );
          break;
        case "demo-login": {
          const isAdmin = el.dataset.admin === "true";

          S.write(
            isAdmin ? "adminSession" : "viewer",
            isAdmin
              ? true
              : { name: "Demo Viewer", email: "viewer@example.test" },
          );

          mostrarCarregamento(isAdmin ? "/admin/dashboard" : "/home");

          break;
        }
        case "admin-logout":
          S.write("adminSession", false);
          location.hash = "/admin/login";
          break;
        case "viewer-logout":
          S.write("viewer", null);
          location.hash = "/home";
          break;
        case "short-next":
          shortIndex++;
          render();
          break;
        case "short-prev":
          shortIndex = Math.max(0, shortIndex - 1);
          render();
          break;
        case "choose-plan": {
          const p = S.list("plans").find((x) => x.id === id);
          openModal(
            "Plan preview",
            `<h2>${e(p.Name)}</h2><p>$${Number(p.Price).toFixed(2)} / ${e(p.Duration)}</p><p class="note">No real payment is processed. This package contains the checkout interface only.</p>${btn("demo-subscribe", "Save demo selection", "", "", `data-id="${e(id)}"`)}`,
          );
          break;
        }
        case "demo-subscribe":
          S.write("selectedPlan", id);
          closeModal();
          toast("Demo plan selection saved. No payment made.");
          break;
        case "table-prev":
          tablePage = Math.max(1, tablePage - 1);
          redrawTable(key);
          break;
        case "table-next":
          tablePage++;
          redrawTable(key);
          break;
        case "sort":
          sortDir = sortKey === el.dataset.column ? -sortDir : 1;
          sortKey = el.dataset.column;
          redrawTable(key);
          break;
        case "toggle-status":
        case "toggle-restricted": {
          const rows = S.list(key),
            r = rows.find((x) => x.id === id);
          if (a === "toggle-status") {
            r.Status = !(r.Status ?? r.status ?? true);
            r.status = r.Status;
          } else r.restricted = !r.restricted;
          S.save(key, rows);
          redrawTable(key);
          toast("Saved locally");
          break;
        }
        case "delete-record":
          confirmDelete(key, [id]);
          break;
        case "confirm-delete": {
          const ids = JSON.parse(el.dataset.ids);
          S.save(
            key,
            S.list(key).map((r) =>
              ids.includes(r.id) ? { ...r, deleted: true } : r,
            ),
          );
          closeModal();
          redrawTable(key);
          toast("Moved to local trash");
          break;
        }
        case "bulk-apply": {
          const ids = selectedIds(),
            action = document.querySelector("#bulk-action").value;
          if (!ids.length) {
            toast("Select records first");
            break;
          }
          if (action === "Delete") {
            confirmDelete(key, ids);
            break;
          }
          if (!["Activate", "Deactivate"].includes(action)) {
            toast("Choose an action");
            break;
          }
          S.save(
            key,
            S.list(key).map((r) =>
              ids.includes(r.id)
                ? {
                    ...r,
                    status: action === "Activate",
                    Status: action === "Activate",
                  }
                : r,
            ),
          );
          redrawTable(key);
          toast("Records updated");
          break;
        }
        case "export-table":
          saveFile(
            "streamit-" + key.replaceAll("/", "-") + ".json",
            JSON.stringify({ section: key, records: S.list(key) }, null, 2),
          );
          break;
        case "import-table":
          openModal(
            "Import JSON",
            `<p>Import a JSON export made by this project. Existing IDs are updated; new IDs are added.</p><input type="file" id="import-file" data-key="${e(key)}" accept=".json,application/json">`,
          );
          break;
        case "media-view":
          openModal(
            el.dataset.name,
            img(el.dataset.url, el.dataset.name, "media-preview"),
          );
          break;
        case "dashboard-date":
          toast(
            "Dashboard shows local totals; dated transaction data is not connected.",
          );
          break;
        case "dashboard-reset":
          document.querySelector("#dash-date").value = "";
          break;
        case "delete-profile":
          openModal(
            "Delete local profile?",
            `<p>Only the viewer profile and watchlist in this browser will be removed.</p>${btn("confirm-delete-profile", "Delete local profile")}`,
          );
          break;
        case "confirm-delete-profile":
          S.write("viewer", null);
          S.write("favourites", []);
          closeModal();
          toast("Local profile removed");
          break;
        case "detail-tab": {
          const m = getTitle(id),
            tab = el.dataset.tab;
          el.closest(".tabbar")
            .querySelectorAll("button")
            .forEach((b) => b.classList.toggle("active", b === el));
          const target = document.querySelector("#detail-tab-content");
          if (tab === "Overview") target.innerHTML = detailOverview(m);
          if (tab === "Episodes") {
            const eps = S.list("episodes").filter(
              (r) =>
                !r.deleted &&
                (r["TV Show"] === m.name || r["TV Show"] === m.id),
            );
            target.innerHTML = eps.length
              ? eps
                  .map(
                    (r) =>
                      `<div class="panel"><h3>${e(r.Name || r.name)}</h3><p>${e(r.Description || "")}</p></div>`,
                  )
                  .join("")
              : "<p>No episode files included. Add seasons and episodes in Administration.</p>";
          }
          if (tab === "Reviews") {
            const reviews = S.read("viewerReviews:" + id, []);
            target.innerHTML = `${reviews.map((r) => `<div class="panel"><strong>${e(r.name)} · ${r.rating}/5</strong><p>${e(r.text)}</p></div>`).join("")}<form id="review-form" data-id="${e(id)}" class="panel stack">${field("Your name", "name", "", "text", true)}<label class="field">Rating<select name="rating">${options([5, 4, 3, 2, 1])}</select></label>${field("Review", "text", "", "textarea", true)}<button>Save review locally</button></form>`;
          }
          if (tab === "More Like This")
            target.innerHTML = `<div class="catalog-grid">${S.catalog()
              .filter((c) => c.type === m.type && c.id !== m.id)
              .slice(0, 6)
              .map((c) => card(c))
              .join("")}</div>`;
          break;
        }
      }
    } catch (error) {
      toast(error.message || "Action failed.");
    }
  });
  document.addEventListener("input", (ev) => {
    if (ev.target.id === "catalog-search") updateCatalog();
    if (ev.target.id === "table-search") {
      tableQuery = ev.target.value;
      tablePage = 1;
      redrawTable(current.slice(6));
    }
  });
  document.addEventListener("change", async (ev) => {
    const el = ev.target;
    try {
      if (["genre-filter", "language-filter", "catalog-sort"].includes(el.id))
        updateCatalog();
      if (el.id === "table-status") {
        tableStatus = el.value;
        tablePage = 1;
        redrawTable(current.slice(6));
      }
      if (el.id === "select-all")
        document
          .querySelectorAll(".select-record")
          .forEach((x) => (x.checked = el.checked));
      if (["poster-upload", "media-upload"].includes(el.id)) {
        const f = el.files[0];
        if (!f) return;
        if (
          !/^image\/(png|jpeg|webp)$/.test(f.type) ||
          f.size > 2 * 1024 * 1024
        )
          throw Error("Choose a PNG, JPEG or WebP image smaller than 2 MB.");
        const data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(f);
        });
        if (el.id === "poster-upload") {
          document.querySelector('[name="image"]').value = data;
          toast("Image ready. Save changes to keep it.");
        } else {
          S.write("media", [
            { id: "media-" + Date.now(), name: f.name, image: data },
            ...S.read("media", []),
          ]);
          render();
          toast("Image saved locally");
        }
      }
      if (el.id === "import-file") {
        const f = el.files[0];
        if (!f) return;
        if (f.size > 4 * 1024 * 1024)
          throw Error("Import file too large (maximum 4 MB).");
        const parsed = JSON.parse(await f.text());
        if (
          !parsed ||
          parsed.section !== el.dataset.key ||
          !Array.isArray(parsed.records)
        )
          throw Error("This JSON does not match this section.");
        const records = parsed.records;
        if (
          records.length > 2000 ||
          records.some(
            (r) => !r || typeof r !== "object" || typeof r.id !== "string",
          )
        )
          throw Error("Invalid records.");
        const rows = S.list(el.dataset.key),
          map = new Map(rows.map((r) => [r.id, r]));
        records.forEach((r) => {
          const clean = JSON.parse(JSON.stringify(r));
          delete clean.__proto__;
          delete clean.constructor;
          map.set(clean.id, clean);
        });
        S.save(el.dataset.key, [...map.values()]);
        closeModal();
        redrawTable(el.dataset.key);
        toast("Import complete");
      }
    } catch (err) {
      toast(err.message || "Unable to import file.");
    }
  });
  document.addEventListener("submit", (ev) => {
    const form = ev.target;
    if (!(form instanceof HTMLFormElement)) return;
    ev.preventDefault();
    try {
      const fd = new FormData(form),
        obj = Object.fromEntries(fd.entries());
      form
        .querySelectorAll('input[type="checkbox"]')
        .forEach((c) => (obj[c.name] = c.checked));
      if (form.id === "auth-form") {
        if (form.dataset.mode === "forgot") {
          openModal(
            "Password reset",
            "<p>Password recovery requires an email service and backend. Use Enter demonstration to open this local project.</p>",
          );
          return;
        }
        const admin = form.dataset.admin === "true";
        if (admin) {
          toast(
            "Use Enter demonstration. This static edition has no server authentication.",
          );
          return;
        }
        S.write("viewer", {
          name: obj.name || obj.email.split("@")[0],
          email: obj.email,
        });
        form.reset();
        mostrarCarregamento(() => {
          location.hash = "/home";
        });
        return;
      }
      if (form.id === "record-form") {
        const key = form.dataset.key,
          rows = S.list(key),
          id =
            form.dataset.id ||
            slug(obj.name || obj.Name || obj.Question || "record") +
              "-" +
              Date.now().toString(36);
        let record = { ...rows.find((r) => r.id === id), ...obj, id };
        if (["movies", "tvshows", "videos"].includes(key)) {
          record.type = { movies: "movie", tvshows: "tvshow", videos: "video" }[
            key
          ];
          record.genres = String(obj.genres || "")
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean);
          record.rating = obj.rating
            ? Math.max(0, Math.min(10, Number(obj.rating)))
            : "";
          record.Status = record.status;
          record.deleted = false;
        } else {
          record.name =
            obj.Name || obj.Question || obj.Title || Object.values(obj)[0];
          record.Status = obj.Status !== false;
        }
        const index = rows.findIndex((r) => r.id === id);
        if (index >= 0) rows[index] = record;
        else rows.unshift(record);
        S.save(key, rows);
        location.hash = "/admin/" + key;
        toast("Record saved locally");
        return;
      }
      if (form.id === "settings-form") {
        S.write("settings:" + form.dataset.key, obj);
        toast("Settings saved locally");
        return;
      }
      if (form.id === "profile-form") {
        S.write("viewer", obj);
        toast("Profile saved");
        return;
      }
      if (form.id === "support-form") {
        S.write("support", [
          ...S.read("support", []),
          { ...obj, date: new Date().toISOString() },
        ]);
        form.reset();
        toast("Message saved locally. No email sent.");
        return;
      }
      if (form.id === "review-form") {
        S.write("viewerReviews:" + form.dataset.id, [
          ...S.read("viewerReviews:" + form.dataset.id, []),
          { ...obj, rating: Math.min(5, Math.max(1, Number(obj.rating))) },
        ]);
        form.reset();
        toast("Review saved locally");
        render();
        return;
      }
    } catch (err) {
      toast(err.message || "Could not save changes.");
    }
  });
  // Perfil, API e interações da versão CineMatch.
  let inlineCleanups = [];
  let heroPaused = false,
    perfilAtual = null,
    estadoAPI = "inicial",
    mensagemAPI = "",
    resultados = [],
    tituloMatch = "Séries que combinam com você",
    consultas = 0;
  const contarConsulta = criarContador();
  try {
    const salvo = JSON.parse(localStorage.getItem("cinematchPerfil"));
    if (validarPerfil(salvo)) perfilAtual = salvo;
  } catch {}
  const generosPerfil = [
    "Drama",
    "Comedy",
    "Action",
    "Adventure",
    "Romance",
    "Thriller",
    "Horror",
    "Mystery",
    "Crime",
    "Fantasy",
    "Science-Fiction",
    "Family",
    "Animation",
    "History",
    "War",
    "Music",
  ];
  function formularioPerfil() {
    return `<main id="content" class="profile-page"><section class="profile-intro"><span class="hero-eyebrow">HISTÓRIAS QUE COMBINAM COM VOCÊ</span><h1>Seu próximo favorito<br>começa com um <em>match.</em></h1><p>Conte um pouco sobre você. Nós encontramos séries com os gêneros que você mais gosta.</p><div class="profile-decoration">▶</div></section><form id="cinematch-perfil" class="profile-form"><h2>Crie seu perfil</h2><p>Seu perfil fica salvo neste navegador.</p><div class="form-grid"><label class="field" for="perfil-nome">Nome<input id="perfil-nome" name="nome" required minlength="2" maxlength="70" autocomplete="given-name"></label><label class="field" for="perfil-idade">Idade<input id="perfil-idade" name="idade" type="number" min="1" max="120" required></label></div><fieldset><legend>Quais gêneros você gosta?</legend><div class="genre-choices">${generosPerfil.map((g, i) => `<label for="genero-${i}"><input id="genero-${i}" name="generos" value="${g}" type="checkbox"><span>${nomeGenero(g)}</span></label>`).join("")}</div></fieldset><p id="perfil-erro" role="alert"></p><button type="submit">Encontrar meu match ${icon("right")}</button></form></main>`;
  }
  function recomendacoesHTML(todos) {
    return `<section class="shelf recommendations" data-all="${todos}"><div class="section-title"><h2>${e(tituloMatch)}</h2>${todos ? "" : link("recomendacoes", "Ver todos →")}</div><p>Compatibilidade calculada pelos gêneros em comum com seu perfil. <span id="consultas-api">Consultas nesta sessão: ${consultas}</span></p><div id="match-cards" class="${todos ? "catalog-grid" : "carousel"}"></div><p class="help-text">A porcentagem já é calculada. As faixas Alta, Média e Baixa aguardam os limites do projeto original em js/config.js.</p></section>`;
  }
  function preencherRecomendacoes() {
    const host = document.querySelector("#match-cards");
    if (!host) return;
    if (estadoAPI !== "pronto") {
      renderizarEstado(
        host,
        estadoAPI === "erro" ? "erro" : "carregando",
        estadoAPI === "erro" ? mensagemAPI : "Buscando séries na TVMaze…",
        atualizarCatalogo,
      );
      return;
    }
    if (!resultados.length) {
      renderizarEstado(
        host,
        "vazio",
        "Nenhuma série encontrada com dados suficientes.",
      );
      return;
    }
    host.replaceChildren();
    const todos = host.closest("[data-all]").dataset.all === "true";
    resultados.slice(0, todos ? 100 : 12).forEach((r) => {
      const el = criarCardRecomendacao(r, (id) => {
        const m = getTitle(id);
        if (!m) return null;
        const template = document.createElement("template");
        template.innerHTML = card(m, 0);
        return template.content.firstElementChild;
      });
      if (el) host.append(el);
    });
  }
  async function atualizarCatalogo() {
    if (!perfilAtual) return;
    estadoAPI = "carregando";
    preencherRecomendacoes();
    try {
      const dados = await buscarCatalogo();
      if (!perfilAtual) return;
      consultas = contarConsulta();
      const modelos = dados.map((d) => new Serie(d));
      resultados = modelos
        .map((m) => m.calcularAfinidade(perfilAtual.generosFavoritos))
        .sort(
          (a, b) => b.percentual - a.percentual || b.serie.nota - a.serie.nota,
        );
      S.setSeries(
        dados.map((d) => ({
          id: d.id,
          name: d.titulo,
          type: "tvshow",
          image: d.imagem,
          language: d.idioma,
          duration: d.duracaoMinutos ? `${d.duracaoMinutos} min` : "",
          rating: d.nota,
          release: d.estreia,
          genres: d.generos,
          access: "free",
          status: true,
          trailer: "",
          video: "",
          description: new DOMParser().parseFromString(d.resumo, "text/html")
            .body.textContent,
          source: d.fonte,
        })),
      );
      aoConcluirBusca(perfilAtual.nome, (texto) => {
        tituloMatch = texto;
      });
      estadoAPI = "pronto";
      if (!current.startsWith("admin/")) render();
    } catch (err) {
      estadoAPI = "erro";
      mensagemAPI = err.message;
      preencherRecomendacoes();
    }
  }
  document.addEventListener("submit", (event) => {
    if (event.target.id !== "cinematch-perfil") return;
    event.preventDefault();
    const fd = new FormData(event.target);
    const perfil = {
      nome: String(fd.get("nome") || "").trim(),
      idade: Number(fd.get("idade")),
      generosFavoritos: fd
        .getAll("generos")
        .filter((g) => generosPerfil.includes(g)),
    };
    if (!validarPerfil(perfil)) {
      document.querySelector("#perfil-erro").textContent =
        "Preencha seu nome, idade e selecione pelo menos um gênero.";
      return;
    }
    try {
      localStorage.setItem("cinematchPerfil", JSON.stringify(perfil));
    } catch {
      document.querySelector("#perfil-erro").textContent =
        "Não foi possível salvar. Permita o armazenamento local do navegador.";
      return;
    }
    perfilAtual = perfil;
    render();
    atualizarCatalogo();
  });
  let preview = null,
    previewId = "",
    previewTimer,
    fecharTimer,
    pararPreview = () => {};
  function fecharPreview() {
    clearTimeout(previewTimer);
    clearTimeout(fecharTimer);
    pararPreview();
    pararPreview = () => {};
    preview?.remove();
    preview = null;
    previewId = "";
  }
  function abrirPreview(cardEl) {
    if (!cardEl) return;
    const m = getTitle(cardEl.dataset.card);
    if (!m || previewId === m.id) return;
    fecharPreview();
    previewId = m.id;
    preview = document.createElement("section");
    preview.id = "hover-preview";
    preview.className = "hover-preview";
    preview.setAttribute("aria-label", `Prévia de ${m.name}`);
    preview.innerHTML = `<div class="preview-stage">${img(m.image, m.name)}<div class="preview-player"></div>${m.access !== "free" ? '<span class="preview-premium">♛</span>' : ""}</div>${btn("close-preview", "", "close", "icon preview-close", 'aria-label="Fechar prévia"')}<h3>${e(m.name)}</h3><p class="preview-runtime">${icon("clock")} ${e(m.duration || "Duração não informada")}</p><div class="preview-actions">${favButton(m.id)}${m.trailer ? btn("trailer", "Assistir trailer", "play", "preview-watch", `data-id="${e(m.id)}"`) : link("detail/" + m.id, "Ver detalhes", "button preview-watch")}</div>`;
    document.body.append(preview);
    const box = cardEl.getBoundingClientRect();
    const width = Math.min(560, innerWidth - 24);
    preview.style.width = width + "px";
    preview.style.left =
      Math.max(
        12,
        Math.min(innerWidth - width - 12, box.left + (box.width - width) / 2),
      ) + "px";
    preview.style.top =
      Math.max(
        84,
        Math.min(
          innerHeight - preview.offsetHeight - 12,
          box.top + (box.height - preview.offsetHeight) / 2,
        ),
      ) + "px";
    preview.addEventListener("pointerenter", () => clearTimeout(fecharTimer));
    preview.addEventListener("pointerleave", () => {
      fecharTimer = setTimeout(fecharPreview, 200);
    });
    preview.addEventListener("focusin", () => clearTimeout(fecharTimer));
    if (m.trailer)
      previewTimer = setTimeout(() => {
        if (preview && previewId === m.id)
          pararPreview = montarVideo(
            preview.querySelector(".preview-player"),
            m.trailer,
            { autoplay: true, muted: true },
          );
      }, 850);
  }
  document.addEventListener("pointerover", (event) => {
    if (event.pointerType === "touch") return;
    const el = event.target.closest("[data-card]");
    if (!el || el.contains(event.relatedTarget)) return;
    clearTimeout(fecharTimer);
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => abrirPreview(el), 350);
  });
  document.addEventListener("pointerout", (event) => {
    const el = event.target.closest("[data-card]");
    if (!el || el.contains(event.relatedTarget)) return;
    clearTimeout(previewTimer);
    if (preview?.contains(event.relatedTarget)) return;
    fecharTimer = setTimeout(fecharPreview, 220);
  });
  document.addEventListener("focusin", (event) => {
    const el = event.target.closest("[data-card]");
    if (el && event.target.matches('[data-action="preview"]')) abrirPreview(el);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") fecharPreview();
  });
  function atualizarTopo() {
    const b = document.querySelector("#back-to-top");
    if (b) b.hidden = window.scrollY < 400;
  }
  window.addEventListener(
    "scroll",
    () => {
      atualizarTopo();
      fecharPreview();
    },
    { passive: true },
  );
  window.addEventListener("resize", fecharPreview);
  document.addEventListener("visibilitychange", sincronizarHero);
  function traduzirInterface() {
    const traducoes = {
      "Popular Movies": "Filmes populares",
      "Popular TV Show": "Séries populares",
      "Popular Language": "Idiomas populares",
      "Top Channels": "Principais canais",
      "Pay Per View": "Aluguel",
      "Watch Now": "Assistir agora",
      "Watch Trailer": "Ver trailer",
      "Watch trailer": "Ver trailer",
      "View All →": "Ver todos →",
      Movies: "Filmes",
      "TV Shows": "Séries",
      Videos: "Vídeos",
      "My Watchlist": "Minha lista",
      Search: "Buscar",
      All: "Todos",
      "Latest Movies": "Últimos filmes",
      "Recommended For You": "Recomendados para você",
      "Close dialog": "Fechar janela",
      "Add to watchlist": "Adicionar à minha lista",
      "Remove from watchlist": "Remover da minha lista",
    };
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const trimmed = node.nodeValue.trim();
      if (traducoes[trimmed])
        node.nodeValue = node.nodeValue.replace(trimmed, traducoes[trimmed]);
    }
    root.querySelectorAll("[aria-label]").forEach((el) => {
      const v = el.getAttribute("aria-label");
      if (traducoes[v]) el.setAttribute("aria-label", traducoes[v]);
    });
    changeHero(0);
  }

  window.addEventListener("hashchange", () => {
    tablePage = 1;
    tableQuery = "";
    tableStatus = "";
    heroIndex = 0;
    render();
    window.scrollTo(0, 0);
  });
  window.addEventListener("storage", () => render());
  mostrarCarregamento(() => {
    render();

    if (perfilAtual) {
      atualizarCatalogo();
    }
  });
})();
