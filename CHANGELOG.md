# Changelog

Todas as mudanças relevantes deste projeto são documentadas aqui.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o projeto adota [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

## [1.0.0] - 2026-10-16

### Added

- Cadastro de participantes individual e em lote, com numeração na lista.
- Pareamento suíço (sistema Dutch, FIDE C.04.3) via `@echecs/swiss`, com bye automático.
- Classificação com pontuação e desempates configuráveis: Buchholz Cut 1, Buchholz Total,
  Sonneborn-Berger, Confronto direto e Número de vitórias.
- Seleção e ordenação de critérios de desempate com tooltip de descrição.
- Persistência do torneio atual no `localStorage`.
- Créditos e avisos de licença das bibliotecas de terceiros.

[Unreleased]: https://github.com/adrianoChiminelli/ascurra-chess-parring/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/adrianoChiminelli/ascurra-chess-parring/releases/tag/v1.0.0
