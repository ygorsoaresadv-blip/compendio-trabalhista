# Compêndio trabalhista

Consulta gratuita e rápida à jurisprudência trabalhista: súmulas, orientações jurisprudenciais, precedentes normativos,
recursos repetitivos e alguns temas do STF com impacto direto na matéria. Cada verbete mostra a **situação**, a **data da
última verificação** e o **link para a fonte oficial**.

> Conteúdo informativo, sem caráter de consultoria ou aconselhamento jurídico. A jurisprudência muda: confira sempre
> na fonte oficial antes de citar.

**Site:** https://ygorsoaresadv-blip.github.io/compendio-trabalhista/ · **Case:** [/case.html](https://ygorsoaresadv-blip.github.io/compendio-trabalhista/case.html)

## O que tem

- **1.692 verbetes** (TST 1.609 e STF 83): súmulas, súmulas vinculantes, OJs, OJs transitórias, PNs, IRRs, IACs, IRDRs, ADC 80 e Tema 1389.
- **Busca instantânea** no navegador. Entende número e espécie (`331`, `OJ 191`, `SDI-1 54`, `SV 22`, `tema 1389`) e frase exata entre aspas.
- **Campo de busca em estilo Spotlight**, com os atalhos `/` e `Ctrl K` / `⌘K`, setas para percorrer os resultados e o termo marcado no texto.
- **Filtros:** atalhos de espécie, chave "só o que está em vigor" e "Mais filtros" (tribunal, órgão, tema, status, espécie exata, ordem e favoritos).
- **Linhas que se abrem no lugar**, com tese, questão jurídica, referências, observação oficial e **linha do tempo** das redações.
- **Copiar citação** em formato forense ou ABNT, com link oficial. **Copiar link** do verbete.
- **Favoritos** (ficam só no seu navegador) e **modo claro/escuro** (abre sempre no claro).
- **Compartilhamento por URL**: busca, filtros e o verbete aberto vão no endereço.
- **Fluxogramas** de navegação para achar o verbete certo.
- Sem cadastro, sem cookies, sem rastreamento, sem servidor.

## Situação dos verbetes

`Em vigor`, `Cancelada`, `Convertida`, `Superada`, `Afetado` (IRR em andamento), `Julgado, acórdão pendente`,
`RG reconhecida, mérito pendente`. Cada status tem texto próprio; a cor nunca é o único sinal.

## Sobre os dados e a atualização

- Textos de **fontes oficiais** (TST e STF). Base geral verificada em **22/09/2026**; ADC 80 e Tema 1389 acrescentados em **10/11/2026**.
- A base geral **não foi reverificada por inteiro** depois disso. Veja [docs/ATUALIZACAO-2026-11.md](docs/ATUALIZACAO-2026-11.md)
  para o que entrou, o que ficou em tensão e o que falta levantar.
- A ADC 80 aparece como **resumo da notícia oficial**, porque o acórdão e a tese literal ainda não foram localizados.
- A maioria dos verbetes do TST tem link para a **listagem oficial** (é preciso localizar o número); só uma parte tem link direto.
- Os **temas** são etiquetas de navegação deste projeto, não classificação oficial.

## Rodar localmente

```bash
npm install
npm run dev      # servidor de desenvolvimento
npm run build    # gera dist/ (valida tipos e dados)
npm run preview  # serve o build
```

Os dados ficam em `data/` (`base.json`, `novos.json`, `patches.json`). `npm run dados` gera `src/data/compendio.json`.
Para acrescentar um verbete novo, inclua o registro em `data/novos.json` com tribunal, espécie, número, data, relator,
status e **link oficial**; o que não puder ser verificado na fonte não deve entrar.

## Stack

Vite, React e TypeScript. A busca roda no navegador, sem dependências, e o campo de busca em estilo Spotlight é
adaptado de um componente do [21st.dev](https://21st.dev). Fonte Inter, servida localmente. Sem Tailwind e sem biblioteca de componentes.
Publicado no GitHub Pages por GitHub Actions.

## Licenças

- **Código:** [MIT](LICENSE).
- **Conteúdo organizado e notas editoriais:** [CC0 1.0](LICENSE-CONTEUDO.md), uso irrestrito. Os textos oficiais são públicos.
- **Fonte:** Inter, SIL Open Font License 1.1 (`public/fonts/LICENSE-Inter.txt`).

Criado por [Ygor Soares](https://ygor.blog).
