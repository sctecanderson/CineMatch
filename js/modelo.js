import { FAIXAS_COMPATIBILIDADE } from "./config.js";

/**
 * Classifica a porcentagem em faixas: Alta, Média ou Baixa
 */
export function classificar(percentual, faixas = FAIXAS_COMPATIBILIDADE) {
  if (!faixas || typeof faixas.media !== "number" || typeof faixas.alta !== "number") {
    return "Indefinida";
  }

  if (percentual >= faixas.alta) {
    return "Alta";
  } else if (percentual >= faixas.media) {
    return "Média";
  } else {
    return "Baixa";
  }
}

/**
 * Classe Base representando qualquer conteúdo com título e gêneros
 */
export class Conteudo {
  constructor({ id, titulo, generos = [] }) {
    this.id = id;
    this.titulo = titulo;
    // Remove duplicados de gêneros usando Set
    this.generos = [...new Set(generos)];
  }

  // Retorna quais gêneros deste conteúdo estão na lista de favoritos do usuário
  generosEmComum(favoritos = []) {
    return this.generos.filter((g) => favoritos.includes(g));
  }
}

/**
 * Classe Série que herda de Conteúdo e adiciona propriedades de streaming
 */
export class Serie extends Conteudo {
  constructor(dados) {
    super(dados); // Chama o construtor da classe Conteudo
    this.duracaoMinutos = dados.duracaoMinutos || null;
    this.nota = dados.nota || 0;
    this.imagem = dados.imagem || "";
    this.dados = dados;
  }

  /**
   * Calcula a afinidade (match) entre esta série e os gêneros do usuário
   */
  calcularAfinidade(favoritos = [], faixas = FAIXAS_COMPATIBILIDADE) {
    const comuns = this.generosEmComum(favoritos);
    const naoExplorados = this.generos.filter((g) => !favoritos.includes(g));

    // Porcentagem baseada nos gêneros da série que combinam com o perfil
    let percentual = 0;
    if (this.generos.length > 0) {
      percentual = (comuns.length / this.generos.length) * 100;
    }

    return {
      serie: this,
      titulo: this.titulo,
      comuns: comuns,
      naoExplorados: naoExplorados,
      percentual: percentual,
      classificacao: classificar(percentual, faixas),
    };
  }
}

/**
 * Função closure para contar quantas consultas foram feitas à API
 */
export function criarContador() {
  let total = 0;
  return function () {
    total++;
    return total;
  };
}

/**
 * Função de callback para montar o título final da seção de recomendações
 */
export function aoConcluirBusca(nomeUsuario, callback) {
  if (typeof callback === "function") {
   callback(`${nomeUsuario}, as melhores recomendações para você.`);
  }
}