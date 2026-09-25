# CineMatch — HTML, CSS e JavaScript

## Executar

Extraia o ZIP, abra o terminal nesta pasta e execute:

```sh
npm install
npm start
```

Acesse http://localhost:8080. Também funciona com a extensão Live Server. Não abra index.html com duplo clique: módulos JavaScript e players precisam de HTTP(S). Não há compilação nem bundler. Node/npm são usados apenas para servir arquivos e executar testes.

## O que mudou

- Identidade CineMatch, fundo escuro, vermelho e navegação em português nas áreas principais.
- Setas nas bordas dos carrosséis com sombra em gradiente; aparecem no hover ou foco. Em telas de toque ficam visíveis.
- Botão circular vermelho no canto inferior direito; aparece após rolagem e volta suavemente ao topo.
- Prévia flutuante sobre os cards, sem ser cortada pelo carrossel: imagem, título, duração, favorito e trailer/detalhes. Mouse abre com pequeno atraso; o botão de prévia também atende teclado e toque.
- Banners com transição por opacidade, menu de miniaturas, progresso, anterior/próximo e pausa. Rotação de 6,5 segundos, respeitando redução de movimento.
- Player YouTube com origem HTTP real, prévia sem som, tratamento de falhas e link externo. Vídeos privados, removidos, restritos ou com incorporação desativada continuam dependendo do provedor.
- Primeiro acesso com nome, idade e gêneros; perfil em localStorage e opção Trocar perfil.
- Séries reais da TVMaze, com carregamento, erro, nova tentativa e estado vazio. Recomendações ordenadas por compatibilidade e nota.
- Painel administrativo local mantido: login de demonstração, tabelas, formulários, edição, favoritos, importação/exportação e mídia local.

## Compatibilidade

Porcentagem = gêneros em comum / total de gêneros únicos da série × 100. As listas mostram os gêneros em comum e os que podem ser explorados.

**Pendência explícita:** o guia recebido não fornece os limiares de Alta/Média/Baixa. Em `js/config.js`, `media` e `alta` estão como `null`. Insira os limites do CineMatch original. Enquanto isso a porcentagem aparece normalmente e a classificação mostra “Faixas pendentes”. Nenhum limiar foi inventado.

A idade é registrada, mas não é usada como classificação etária de títulos: a fonte consultada não fornece essa classificação de forma padronizada.

## Site e painel

- Início: `index.html`
- Recomendações: `index.html#/recomendacoes`
- Séries: `tv-shows.html`
- Filmes de referência: `movies.html`
- Minha lista: `watchlist.html`
- Painel: `admin.html` — botão de entrada demo; dados permanecem neste navegador.

O painel não é um backend Laravel e o login local não fornece autenticação de produção. Pagamentos, envio de e-mail, transmissão de filmes completos e endpoints privados do site de referência não estão conectados. Os dados administrativos de referência são independentes do catálogo de séries TVMaze carregado em tempo real.

## Imagens e fontes

Pôsteres, banners e trailers de referência usam URLs externas já presentes no projeto anterior. Não são cópias offline. Sua disponibilidade depende dos servidores de origem. Dados de séries: https://www.tvmaze.com/api — atribuição TVMaze, licença CC BY-SA. Obras, imagens e vídeos têm seus respectivos titulares.

A versão implementa as interações dos prints; não é uma cópia pixel a pixel certificada de todas as páginas do produto original.

## Estrutura e verificação

`css/style.css`: estilos externos com Flexbox. `js/app.js`: rotas, componentes e eventos. `js/data.js`: referência visual. `js/store.js`: persistência local. `js/api.js`: fetch TVMaze. `js/modelo.js`: classes e compatibilidade. `js/ui.js`: DOM e validação. `js/video.js`: players. `js/config.js`: faixas e temporização.

`npm test` executa os testes de lógica e tratamento de API. Veja `docs/TESTES.md` e `docs/REQUISITOS.md` para escopo validado e pendências acadêmicas.
