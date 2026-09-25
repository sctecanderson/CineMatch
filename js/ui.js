const nomes = {Drama:'Drama',Comedy:'Comédia',Action:'Ação',Adventure:'Aventura',Romance:'Romance',Thriller:'Suspense',Horror:'Terror',Mystery:'Mistério',Crime:'Crime',Fantasy:'Fantasia','Science-Fiction':'Ficção científica',Family:'Família',Animation:'Animação',History:'História',War:'Guerra',Music:'Música'};
export const nomeGenero = g => nomes[g] || g;
export function criarCardRecomendacao(resultado, criarCard) {
  const {serie, percentual, classificacao, comuns, naoExplorados} = resultado;
  const card = criarCard(serie.id); // Callback usa a mesma aparência do catálogo.
  if (!card) return null;
  const dados = document.createElement('div'); dados.className = 'afinidade-info';
  const nota = document.createElement('strong'); nota.textContent = `${percentual.toFixed(1).replace('.', ',')}% de compatibilidade`;
  const nivel = document.createElement('span'); nivel.className = 'afinidade-nivel'; nivel.textContent = classificacao;
  const comum = document.createElement('p'); comum.textContent = `Em comum: ${comuns.map(nomeGenero).join(', ') || 'nenhum'}`;
  const novos = document.createElement('p'); novos.textContent = `Para explorar: ${naoExplorados.map(nomeGenero).join(', ') || 'nenhum'}`;
  dados.append(nota, nivel, comum, novos); card.append(dados); return card;
}
export function renderizarEstado(container, estado, mensagem, tentarNovamente) {
  container.replaceChildren();
  const aviso = document.createElement('p'); aviso.className = `api-state ${estado}`;
  aviso.setAttribute('role', estado === 'erro' ? 'alert' : 'status');
  aviso.textContent = mensagem; container.append(aviso);
  if (estado === 'erro') { const botao = document.createElement('button'); botao.textContent = 'Tentar novamente'; botao.addEventListener('click', tentarNovamente); container.append(botao); }
}
export function validarPerfil(perfil) {
  return Boolean(perfil && typeof perfil.nome === 'string' && perfil.nome.trim().length >= 2 && Number.isInteger(perfil.idade) && perfil.idade > 0 && perfil.idade <= 120 && Array.isArray(perfil.generosFavoritos) && perfil.generosFavoritos.length && perfil.generosFavoritos.every(g => typeof g === 'string' && g.length > 0));
}
