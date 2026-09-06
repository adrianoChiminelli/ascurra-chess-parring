# Avisos de licença de terceiros

Este projeto utiliza as seguintes bibliotecas de código aberto, do projeto
**echecs.js** (autor: Adrian de la Rosa — [@mormubis](https://github.com/mormubis)),
para toda a lógica de pareamento suíço e cálculo de critérios de desempate.
Cada uma é distribuída sob a Licença MIT, reproduzida abaixo.

- [`@echecs/swiss`](https://github.com/echecsjs/swiss) — pareamento suíço (sistema Dutch, FIDE C.04.3)
- [`@echecs/buchholz`](https://github.com/mormubis/buchholz) — Buchholz e Buchholz Cut 1 (FIDE 8.1)
- [`@echecs/sonneborn-berger`](https://github.com/mormubis/sonneborn-berger) — Sonneborn-Berger (FIDE 9.1)
- [`@echecs/direct-encounter`](https://github.com/echecsjs/direct-encounter) — Confronto direto (FIDE 6)
- [`@echecs/number-of-wins`](https://github.com/mormubis/number-of-wins) — Número de vitórias

Este projeto não é afiliado ao autor dessas bibliotecas — apenas as consome
como dependências via npm.

---

## Licença MIT — @echecs/swiss, @echecs/buchholz, @echecs/sonneborn-berger, @echecs/direct-encounter, @echecs/number-of-wins

```
MIT License

Copyright (c) Adrian de la Rosa

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

*Nota: o ano exato de copyright varia por pacote/versão publicada; consulte o
arquivo `LICENSE` dentro de cada pacote em `node_modules/@echecs/<nome>/` para
o texto exato daquela versão, caso precise citar o ano específico.*
