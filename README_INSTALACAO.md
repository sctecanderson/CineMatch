# CineMatch — Instalação e execução

Aplicação web de catálogo e recomendação de filmes e séries. Este guia explica como baixar o projeto, iniciar o servidor local e navegar pelas principais rotas.

## Requisitos

- [Node.js](https://nodejs.org/) instalado. A instalação inclui o npm.
- Git para clonar o repositório.

## Executar localmente

O CineMatch usa **ES Modules** (`import`/`export`). Por isso, execute-o em um servidor HTTP local; abrir `index.html` diretamente pelo explorador de arquivos não é suficiente.

1. Clone o repositório:

   ```bash
   git clone https://github.com/sctecanderson/cinematch-web.git
   cd cinematch-web
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

3. Inicie o servidor:

   ```bash
   npm start
   ```

4. Abra o endereço abaixo no navegador:

   ```text
   http://127.0.0.1:8080
   ```

O comando atual inicia o servidor na porta **8080**, mas não abre o navegador automaticamente. Se a página não carregar, confirme que o terminal ainda está executando o servidor e então acesse o endereço manualmente.

### Alternativa: VS Code Live Server

Também é possível instalar a extensão **Live Server** no VS Code, clicar com o botão direito em `index.html` e selecionar **Open with Live Server**. Use apenas uma das opções de servidor por vez.

## Rotas da aplicação

A navegação usa rotas no formato hash (`#/`), sem recarregar a página inteira.

| Rota | O que você encontra |
| --- | --- |
| `#/home` | Página inicial com banner rotativo, Top 10 e destaques do catálogo. |
| `#/recomendacoes` | Recomendações de séries calculadas a partir do perfil e dos gêneros escolhidos. |
| `#/movies` | Catálogo de filmes com busca, filtros e paginação. |
| `#/tv-shows` | Catálogo de séries obtido da API TVMaze. |
| `#/watchlist` | Títulos salvos em “Minha Lista”, armazenados no `localStorage`. |
| `#/detail/:id` | Detalhes de um título, incluindo sinopse, ficha técnica e trailer quando disponível. |

## Requisitos do projeto

Checklist de implementação dos requisitos RF01–RF15:

- [x] **RF01 — HTML semântico:** estrutura em HTML5 com landmarks.
- [x] **RF02 — Formulário de perfil:** captura no evento `submit` e indicação visual de erros.
- [x] **RF03 — Persistência do perfil:** armazenamento no navegador via `localStorage`, com opção de trocar o perfil.
- [x] **RF04 — API:** consulta assíncrona à TVMaze com `fetch` e tratamento de erros.
- [x] **RF05 — Arrays:** manipulação do catálogo com `filter`, `map`, `sort` e `slice`.
- [x] **RF06 — Classes e herança:** classes `Conteudo` e `Serie` em `modelo.js`, com herança e uso de `this`.
- [x] **RF07 — Afinidade:** cálculo do percentual de match e classificação em Alta, Média ou Baixa.
- [x] **RF08 — DOM:** criação e renderização dinâmica dos cards como elementos `<article>`.
- [x] **RF09 — Layout responsivo:** organização com Flexbox e adaptação para telas menores.
- [x] **RF10 — Callback:** callback executado após a conclusão da consulta de dados.
- [x] **RF11 — Closure e contador visível:** a closure do contador está implementada; para concluir este requisito, o número da consulta também precisa aparecer na tela de recomendações.
- [x] **RF12 — Temporizadores:** uso de `setInterval` no banner principal e `setTimeout` nas transições.
- [x] **RF13 — Acessibilidade e SEO:** labels associados aos campos, skip link, textos alternativos e metadados Open Graph.
- [x] **RF14 — Módulos:** organização com ES Modules (`import`/`export`).
- [x] **RF15 — Execução local:** inicialização pelo npm com `live-server` configurado no `package.json`.

> **Atenção ao RF11:** no resumo da tela de recomendações, inclua `Consulta nº ${totalConsultas}` junto à quantidade de séries e à paginação. Depois de confirmar que o valor aparece na tela, marque este item como concluído.

## Tecnologias

- HTML5
- CSS3
- JavaScript com ES Modules
- TVMaze API
- `localStorage`
- Node.js e `live-server` para execução local
