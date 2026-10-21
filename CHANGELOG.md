# Changelog

## [Unreleased]

### Added

- Botões "Exportar" e "Manutenção" no rodapé da barra lateral; no mobile ficam fixos à direita da barra horizontal.
- Aba de manutenção com a lista de participantes: número inicial, rating, pontuação atual e status.
- Botão "Importar torneio" na tela inicial: continua um torneio a partir de um arquivo JSON exportado, com validação e mensagens de erro específicas.
- Sorteio da ordem inicial dos participantes ao iniciar o torneio; o sorteio desempata jogadores com o mesmo rating e sem rating (critério FIDE).
- Suporte no domínio a participantes retirados e a partidas decididas por W.O.

### Changed

- Tela do torneio ocupa a altura da janela: cabeçalho e barra lateral fixos, só o conteúdo rola; cada aba abre no topo e a rodada ativa fica sempre visível na barra.
- Formato salvo passa para a versão 2, com migração automática de torneios da versão 1 (pareamentos em andamento preservados).
- Validação de integridade do torneio salvo (referências, sequência de rodadas e unicidade).

### Fixed

- Torneio salvo por uma versão mais nova do app não é mais apagado ao abrir.

## [1.2.0] - 2026-10-21

### Fixed

- Rodada sem pareamento possível com número par de jogadores era criada vazia e tratada como concluída.
- Rodada sem pareamento possível aparecia como concluída e entrava no cálculo de desempates como rodada disputada.
- Nomes acima de 20 caracteres na entrada em lote eram truncados sem aviso; agora a linha é rejeitada e mantida no campo.

### Changed

- Resultados de rodadas anteriores ficam somente leitura depois que a rodada seguinte é gerada.
- Estado do torneio gerenciado por reducer de domínio (`tournamentReducer`), separado da UI.
- Ids gerados com `crypto.randomUUID()`.
- Build passa a rodar typecheck (`tsc -b`); CI com lint, typecheck, testes e build em push e PR.

### Added

- Testes unitários (Vitest) para classificação, desempates, pareamento, reducer e entrada em lote.
- Testes E2E (Playwright) cobrindo cadastro, fluxo de rodadas, rodadas somente leitura, rodada inválida, placar, tooltip e persistência; executados no CI.

## [1.1.1] - 2026-10-18

### Fix
 
- Corigindo tooltip que interferia no posicionamento da interface, criando novo component HintLabel

## [1.1.0] - 2026-10-17

### Changed

- Testando novo visual da interface.

## [1.0.0] - 2026-10-16

### Added

- Cadastro de participantes individual e em lote, com numeração na lista.
- Pareamento suíço (sistema Dutch, FIDE C.04.3) via `@echecs/swiss`, com bye automático.
- Classificação com pontuação e desempates configuráveis: Buchholz Cut 1, Buchholz Total,
  Sonneborn-Berger, Confronto direto e Número de vitórias.
- Seleção e ordenação de critérios de desempate com tooltip de descrição.
- Persistência do torneio atual no `localStorage`.
- Créditos e avisos de licença das bibliotecas de terceiros.

[Unreleased]: https://github.com/adrianoChiminelli/ascurra-chess-parring/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/adrianoChiminelli/ascurra-chess-parring/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/adrianoChiminelli/ascurra-chess-parring/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/adrianoChiminelli/ascurra-chess-parring/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/adrianoChiminelli/ascurra-chess-parring/releases/tag/v1.0.0
