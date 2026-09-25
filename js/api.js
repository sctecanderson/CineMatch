import { API_TVMAZE } from "./config.js";

/**
 * Busca séries reais no endpoint público da TVMaze
 * @returns {Promise<Array>} Lista de séries formatadas para o CineMatch
 */
export async function buscarCatalogo() {
  try {
    // 1. Faz a requisição HTTP para a API
    const resposta = await fetch(API_TVMAZE);

    // 2. Verifica se a resposta foi bem-sucedida (status 200 a 299)
    if (!resposta.ok) {
      throw new Error(`A TVMaze respondeu com erro HTTP: ${resposta.status}`);
    }

    // 3. Converte a resposta em JSON
    const dados = await resposta.json();

    if (!Array.isArray(dados)) {
      throw new Error("O formato recebido da API não é uma lista válida.");
    }

    // 4. Filtra apenas séries completas (com nome, nota e gêneros)
    const seriesValidas = dados.filter((item) => {
      return (
        item &&
        typeof item.name === "string" &&
        Array.isArray(item.genres) &&
        item.genres.length > 0 &&
        typeof item.rating?.average === "number"
      );
    });

    // 5. Mapeia e padroniza os campos para o modelo do CineMatch
    return seriesValidas.map((s) => ({
      id: `tvmaze-${s.id}`,
      tvmazeId: s.id,
      titulo: s.name,
      generos: s.genres,
      duracaoMinutos: s.runtime || s.averageRuntime || 45,
      nota: s.rating.average,
      imagem: s.image?.original || s.image?.medium || "",
      idioma: s.language || "Inglês",
      estreia: s.premiered || "",
      fonte: s.url || "",
      resumo: s.summary || ""
    }));

  } catch (erro) {
    console.error("Erro na busca da TVMaze:", erro);
    throw erro;
  }
}