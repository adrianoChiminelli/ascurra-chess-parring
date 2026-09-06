# Torneio Suíço

Aplicação web para organizar torneios de xadrez no sistema suíço. Esse aplicativo é uma interface
gráfica para criação e gerenciamento de torneios e usa o motor de cálculo de emparceiramento e desempate
desenvolvidos pelo projeto echecsjs: https://github.com/echecsjs

Este projeto é software livre e de código aberto, desenvolvido sem fins lucrativos,
com foco em uso local e em estudo/prática de torneios suíços.

## Visão geral

- Pareamento suíço usando `@echecs/swiss`.
- Cálculo de desempate por: Buchholz Cut 1, Buchholz Total, Sonneborn-Berger,
  Confronto direto e Número de vitórias.
- Interface local em React + TypeScript.
- Sem backend: tudo roda no navegador e o torneio fica em memória durante a sessão.

## Requisitos para rodar localmente

- Node.js 20 LTS ou superior
- npm 10 ou superior
- Sistema operacional: Linux, macOS ou Windows com terminal compatível

## Comandos locais

Instale as dependências:

```bash
npm install
```

Inicie o ambiente de desenvolvimento:

```bash
npm run dev
```

Gere a build de produção:

```bash
npm run build
```

Verifique o código com lint:

```bash
npm run lint
```

A aplicação normalmente ficará disponível em:

```text
http://localhost:5173
```

## Como funciona

- Participantes podem ser cadastrados individualmente ou em lote.
- A primeira rodada é gerada automaticamente com o sistema suíço.
- Byes são atribuídos automaticamente quando o número de participantes é ímpar.
- A classificação considera pontos e desempates em cascata.
- O usuário pode configurar a ordem dos critérios de desempate na tela inicial.

## Créditos
Toda a lógica de xadrez (pareamento suíço e cálculo de critérios de desempate) é fornecida pelas bibliotecas de código aberto do projeto echecs.js, licenciadas sob MIT:

@echecs/swiss — pareamento suíço (sistema Dutch, FIDE C.04.3)
@echecs/buchholz — Buchholz e Buchholz Cut 1 (FIDE 8.1)
@echecs/sonneborn-berger — Sonneborn-Berger (FIDE 9.1)
@echecs/direct-encounter — Confronto direto (FIDE 6)
@echecs/number-of-wins — Número de vitórias

Este projeto não é afiliado ao autor dessas bibliotecas — apenas as consome como dependências via npm. Veja THIRD-PARTY-NOTICES.md para os textos completos de licença de cada uma.

## Licença:
MIT License