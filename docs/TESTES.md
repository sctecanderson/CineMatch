# Verificação desta versão

Testes automatizados de lógica: herança, percentual, gêneros únicos, séries sem gêneros, faixas pendentes/configuradas, closure, validação de perfil, normalização da API, retorno vazio, HTTP inválido, formato incorreto, rede indisponível, domínio YouTube e parâmetro de origem.

Teste de integração DOM com jsdom e API simulada, executado durante a preparação: primeiro acesso; preenchimento e persistência; catálogo API; 50% de compatibilidade; renderização do banner; seleção e pausa; abertura e fechamento da prévia; favorito; visibilidade do botão de topo; entrada no painel demo.

Limitações: o ambiente de prévia visual bloqueou a URL local. Não foi possível certificar visualmente a renderização final em um navegador real nesta execução. jsdom não valida pixels, animações nem a reprodução real de vídeos. Não foi comprovada a disponibilidade individual de todos os pôsteres e trailers externos.

Validação manual recomendada: iniciar via HTTP, experimentar desktop/mobile, pairar sobre Top 10, usar setas, abrir prévia, reproduzir um trailer disponível, testar pausa/seleção do banner e voltar ao topo. Desconectar a rede para confirmar estado de falha e repetir a consulta.
