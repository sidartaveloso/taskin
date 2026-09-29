# 🧩 Task 144 — lint --fix resolve Priority por extenso e item de checklist ja anotado como adiado

- Status: in-progress
- Type: feat
- Assignee: sidartaveloso

## Description
No layerall, 'taskin lint' mandava rodar --fix e o --fix devolvia os 7 erros intactos: 'Priority: medium/high/low' (valor descartado pelo parser) e tarefa done com item aberto cujo proprio texto ja diz que ficou de fora ('(galeria — pendente)', '(fora do escopo desta task...)'). Nos dois casos a decisao humana ja esta escrita, so no formato errado: o --fix passa a traduzi-la para a forma canonica, sem inventar nenhuma. O que ele nao sabe ler continua erro, agora marcado fixable: false e com sugestao do que fazer — e o lint para de mandar rodar --fix para isso.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] `Priority` por extenso (`critical/high/medium/low`, `alta/média/baixa`) vira
      numero no `--fix`: por nivel, ordem de chegada dentro do nivel, depois do
      maior numero existente. Numero existente nunca e tocado (task-078)
- [ ] Tarefa `done` com item aberto que se anota como fora (parentese ou
      `— ...` com `pendente`, `fora do escopo`, `próximo passo`, `out of scope`,
      `follow-up`, `next step`) vira `— adiado: <a propria anotacao>` no `--fix`.
      Nunca marca `[x]`; item sem anotacao continua erro
- [ ] O que o `--fix` nao resolve sai com `fixable: false` e sugestao — o
      `taskin lint` deixa de mandar rodar `--fix` a toa
- [ ] O `--fix` diz o que converteu (info por arquivo), para nada mudar calado
- [ ] Rodar no layerall: os 7 erros somem, e `lint` seguido de `lint` nao muda nada

## Notes

Achado rodando `pnpm taskin lint --fix` no layerall em 2026-09-29.

A regra que une os dois casos: o `--fix` converte uma decisao **ja escrita** para
a forma canonica; nunca toma uma decisao. `Priority: medium` e `(galeria —
pendente)` sao decisoes escritas no formato errado. `Priority: amanha` e um
`- [ ]` sem anotacao nao sao — e continuam erro.
