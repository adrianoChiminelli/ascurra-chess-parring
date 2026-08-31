# Torneio Suíço

Aplicação React + TypeScript para organizar torneios de xadrez no sistema suíço,
usando a lib [`@echecs/swiss`](https://github.com/echecsjs/swiss) (regras FIDE)
para gerar os emparceiramentos. Roda inteiramente no navegador — sem backend.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra o endereço que o terminal mostrar (geralmente `http://localhost:5173`).

## Build de produção

```bash
npm run build
```

Gera a pasta `dist/` com os arquivos estáticos prontos para publicar.

## Publicando no GitHub Pages

1. Crie um repositório no GitHub e suba este projeto.
2. Rode `npm run build` para gerar a pasta `dist/`.
3. Publique a pasta `dist/` na branch `gh-pages`, de uma destas formas:

   **Opção A — pacote `gh-pages` (mais simples):**
   ```bash
   npm install -D gh-pages
   npx gh-pages -d dist
   ```
   Depois ative o GitHub Pages nas configurações do repositório, apontando
   para a branch `gh-pages`.

   **Opção B — GitHub Actions:** use a action oficial
   [`actions/deploy-pages`](https://github.com/actions/deploy-pages) para
   publicar `dist/` automaticamente a cada push na branch principal.

O `vite.config.ts` já usa `base: './'` (caminho relativo), então o build
funciona tanto publicado na raiz do domínio quanto em uma subpasta como
`usuario.github.io/nome-do-repo/`.

## Como funciona

- Tudo roda no estado do React — não há persistência entre sessões. Se
  recarregar a página, o torneio em andamento é perdido.
- Participantes sem rating podem ser adicionados normalmente; eles entram na
  primeira rodada como jogadores não classificados.
- Byes (folgas, quando o número de participantes é ímpar) são atribuídos
  automaticamente pela lib e já entram com ponto cheio no placar.
- O sistema de pareamento usado é o **Dutch** (padrão da lib, regra FIDE
  C.04.3). Para trocar de sistema, ajuste o import em `src/lib/tournament.ts`
  (ex.: `@echecs/swiss/dubov`, `@echecs/swiss/burstein`).
