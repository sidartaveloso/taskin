# 🧩 Task 077 — autoSync configuravel: escolher o remoto e a estrategia de sincronizacao

- Priority: 986
- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Difficulty: 3

## Description
Hoje syncBeforeCreate() tem duas decisoes cravadas no codigo: o remoto e sempre 'origin' e a estrategia e sempre rebase. As duas precisam ser configuraveis, e a segunda precisa de uma opcao que nao altere a arvore de trabalho.

## O codigo hoje

```js
async function syncBeforeCreate(git, config) {
  if (!config.autoSync || !config.defaultBranch) { /* avisa e sai */ }
  const fetchOk = await safeCall(() => git.fetch());
  const rebaseOk = await safeCall(() => git.rebase(`origin/${config.defaultBranch}`));
  ...
}
```

Duas decisoes estao cravadas: o remoto (`origin`) e a estrategia (rebase).

## 1. Remoto configuravel

`origin` esta escrito no template string. Repositorio com mais de um remoto nao
tem como escolher — e nao e caso raro: o geohub tem `origin` (GitLab) e `github`
(GitHub), e qual deles e a fonte da verdade e decisao do projeto, nao do taskin.

Sugestao: `automation.remote`, com `origin` de padrao para nao quebrar quem ja
usa.

## 2. Estrategia configuravel — e um padrao que nao mexe na arvore

Aqui a proposta vai alem de "tornar configuravel", porque **rebase e a
ferramenta errada para o objetivo declarado**.

O que o `syncBeforeCreate` quer saber e **quais numeros de task ja existem**,
para o `new` nao colidir. Isso nao exige alterar a arvore de trabalho:
`git fetch` seguido de ler `origin/<branch>:TASKS/` ja responde. Rebasear a
branch inteira para descobrir nomes de arquivo e marreta — e marreta com efeito
colateral, porque reescreve historia de trabalho em andamento.

No geohub isso e proibitivo por tres motivos somados, e vale como caso de uso
real:

- a convencao do projeto e **merge, nunca rebase**, para integracao;
- a branch de trabalho tinha **189 commits** sobre o `develop` quando isto foi
  levantado;
- varias sessoes trabalham na mesma arvore, entao um rebase disparado por um
  comando de *criar task* puxa o chao de quem esta no meio de outra coisa.

Sugestao: `automation.syncStrategy` com tres valores —

| valor | o que faz | quando serve |
| --- | --- | --- |
| `fetch-only` | so `git fetch`; le os numeros de task da ref remota | **padrao sugerido** — resolve a colisao sem tocar na arvore |
| `merge` | `git merge <remote>/<branch>` | projeto que integra por merge |
| `rebase` | comportamento atual | quem ja depende dele |

O `fetch-only` como padrao inverte o risco na direcao certa: o comportamento
menos destrutivo passa a ser o que se recebe sem escolher.

## Tasks

- [ ] `automation.remote`, padrao `origin`.
- [ ] `automation.syncStrategy` com `fetch-only` | `merge` | `rebase`.
- [ ] Ler os numeros de task da ref remota sem checkout, no modo `fetch-only`
      (`git show <remote>/<branch>:<tasksDir>` ou `git ls-tree`).
- [ ] Decidir o padrao para quem ja tem config: manter `rebase` para nao mudar
      comportamento em atualizacao, ou migrar com aviso. **Decisao de
      compatibilidade — nao tomar sozinho.**
- [ ] Teste que prove que `fetch-only` nao altera o `HEAD` nem a arvore.

## Notes

Levantado em 2026-09-14 ao configurar o taskin no geohub. O aviso
`autoSync is enabled but no defaultBranch is configured` leva a pessoa a
configurar `defaultBranch` sem saber que isso **liga um rebase automatico a cada
`taskin new`**. O aviso nao menciona rebase, e a configuracao que ele sugere e a
que arma o gatilho.

Enquanto esta task nao existir, o geohub fica com `autoSync: false` explicito —
decisao consciente em vez de aviso recorrente.
