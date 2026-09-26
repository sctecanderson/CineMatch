// Dicionário de tradução dos gêneros da TVMaze para português
const dicionarioGeneros = {
  Drama: "Drama",
  Comedy: "Comédia",
  Action: "Ação",
  Adventure: "Aventura",
  Romance: "Romance",
  Thriller: "Suspense",
  Horror: "Terror",
  Mystery: "Mistério",
  Crime: "Crime",
  Fantasy: "Fantasia",
  "Science-Fiction": "Ficção científica",
  Family: "Família",
  Animation: "Animação",
  History: "História",
  War: "Guerra",
  Music: "Música",
};

/**
 * Traduz o gênero vindo em inglês para o português
 */
export function nomeGenero(generoIngles) {
  return dicionarioGeneros[generoIngles] || generoIngles;
}

/**
 * Monta o card de recomendação com as informações de match usando manipulação do DOM
 */
export function criarCardRecomendacao(resultado, criarCardBase) {
  const { serie, percentual, classificacao, comuns, naoExplorados } = resultado;

  // Cria a base do card através do callback
  const card = criarCardBase(serie.id);
  if (!card) return null;

  // 1. Cria o contêiner das informações de afinidade
  const caixaInfo = document.createElement("div");
  caixaInfo.className = "afinidade-info";

  // 2. Cria o texto com a porcentagem de compatibilidade
  const nota = document.createElement("strong");
  nota.textContent = `${percentual.toFixed(1).replace(".", ",")}% de compatibilidade`;

  // 3. Cria a etiqueta de nível (Alta, Média ou Baixa)
  const nivel = document.createElement("span");
  nivel.className = "afinidade-nivel";
  nivel.textContent = classificacao;

  // 4. Cria o parágrafo de gêneros em comum
  const textoComuns = document.createElement("p");
  const listaComuns = comuns.map(nomeGenero).join(", ") || "nenhum";
  textoComuns.textContent = `Em comum: ${listaComuns}`;

  // 5. Cria o parágrafo de novos gêneros para explorar
  const textoNovos = document.createElement("p");
  const listaNovos = naoExplorados.map(nomeGenero).join(", ") || "nenhum";
  textoNovos.textContent = `Para explorar: ${listaNovos}`;

  // 6. Junta todos os elementos com appendChild e insere no card
  caixaInfo.appendChild(nota);
  caixaInfo.appendChild(nivel);
  caixaInfo.appendChild(textoComuns);
  caixaInfo.appendChild(textoNovos);

  card.appendChild(caixaInfo);
  return card;
}

/**
 * Renderiza mensagens de status (carregando, erro ou vazio)
 */
export function renderizarEstado(container, estado, mensagem, tentarNovamente) {
  container.replaceChildren();

  const aviso = document.createElement("p");
  aviso.className = `api-state ${estado}`;
  aviso.setAttribute("role", estado === "erro" ? "alert" : "status");
  aviso.textContent = mensagem;
  container.appendChild(aviso);

  // Se for erro, cria o botão para tentar de novo
  if (estado === "erro" && typeof tentarNovamente === "function") {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.textContent = "Tentar novamente";
    botao.addEventListener("click", tentarNovamente);
    container.appendChild(botao);
  }
}

/**
 * Validação passo a passo dos dados do perfil
 */
export function validarPerfil(perfil) {
  if (!perfil || typeof perfil !== "object") {
    return false;
  }

  // Nome precisa ter pelo menos 2 caracteres
  if (typeof perfil.nome !== "string" || perfil.nome.trim().length < 2) {
    return false;
  }

  // Idade deve ser número inteiro entre 1 e 120
  if (!Number.isInteger(perfil.idade) || perfil.idade < 1 || perfil.idade > 120) {
    return false;
  }

  // Precisa selecionar ao menos um gênero
  if (!Array.isArray(perfil.generosFavoritos) || perfil.generosFavoritos.length === 0) {
    return false;
  }

  return true;
}