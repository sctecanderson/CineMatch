import { CINEMATCH_DATA } from "./data.js";

export const Store = (() => {
  const prefixo = "cinematch-local-v2:";
  let seriesTVMaze = [];

  // Clona um objeto/array com segurança
  function clonar(objeto) {
    return JSON.parse(JSON.stringify(objeto));
  }

  /**
   * Lê um item do localStorage
   */
  function read(chave, valorPadrao) {
    try {
      const textoSalvo = localStorage.getItem(prefixo + chave);
      return textoSalvo ? JSON.parse(textoSalvo) : clonar(valorPadrao);
    } catch (erro) {
      return clonar(valorPadrao);
    }
  }

  /**
   * Grava um item no localStorage
   */
  function write(chave, valor) {
    try {
      localStorage.setItem(prefixo + chave, JSON.stringify(valor));
    } catch (erro) {
      console.error("Erro ao salvar no localStorage:", erro);
    }
    return valor;
  }

  /**
   * Inicializa dados padrão caso a tabela ainda não exista no localStorage
   */
  function dadosIniciais(tabela) {
    const dados = CINEMATCH_DATA;

    if (tabela === "movies") {
      return cloneFiltrado("movie");
    }
    if (tabela === "tvshows") {
      return cloneFiltrado("tvshow");
    }
    if (tabela === "videos") {
      return cloneFiltrado("video");
    }
    if (tabela === "genres") {
      return clonar(dados.collections.genres || []);
    }
    return [];
  }

  function cloneFiltrado(tipo) {
    return clonar(CINEMATCH_DATA.catalog.filter((item) => item.type === tipo));
  }

  /**
   * Retorna os registros de uma tabela local
   */
  function list(tabela) {
    return read("table:" + tabela, dadosIniciais(tabela));
  }

  /**
   * Salva os registros atualizados de uma tabela
   */
  function save(tabela, linhas) {
    write("table:" + tabela, linhas);
    window.dispatchEvent(new CustomEvent("storechange", { detail: tabela }));
  }

  /**
   * Retorna o catálogo unificado: Filmes/Vídeos estáticos + Séries da TVMaze
   */
  function catalog() {
    const filmes = list("movies");
    const videos = list("videos");
    const catalogoCompleto = [...filmes, ...videos, ...seriesTVMaze];

    // Remove títulos inativos ou deletados
    return catalogoCompleto.filter((item) => item.status !== false && !item.deleted);
  }

  /**
   * Atualiza as séries vindas da TVMaze na memória
   */
  function setSeries(dados) {
    seriesTVMaze = dados;
  }

  /**
   * Retorna a lista de IDs favoritos do usuário
   */
  function favourites() {
    return read("favourites", []);
  }

  /**
   * Adiciona ou remove um ID da lista de favoritos (Minha Lista)
   */
  function toggleFavourite(id) {
    const lista = favourites();
    const index = lista.indexOf(id);
    let foiAdicionado = false;

    if (index >= 0) {
      lista.splice(index, 1); // Se já estava na lista, remove
      foiAdicionado = false;
    } else {
      lista.push(id);         // Se não estava, adiciona
      foiAdicionado = true;
    }

    write("favourites", lista);
    return foiAdicionado;
  }

  return {
    read,
    write,
    list,
    save,
    catalog,
    setSeries,
    favourites,
    toggleFavourite,
    clone: clonar,
  };
})();