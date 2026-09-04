# Torneio Suíço

Aplicação web para organizar torneios de xadrez no sistema suíço, com geração de
emparceiramentos e cálculo de critérios de desempate em cascata.

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

Este projeto utiliza bibliotecas do projeto Echecs, uma coleção de bibliotecas TypeScript para desenvolvimento de aplicações de xadrez.

Em especial, o sistema utiliza:

@echecs/swiss — algoritmos de emparceiramento de torneios suíços seguindo as regras da FIDE.
Outras bibliotecas do ecossistema @echecs, conforme utilizadas pelo projeto.

As bibliotecas Echecs são distribuídas sob a licença MIT.

Projeto Echecs:
https://github.com/echecsjs

Licença:
MIT License