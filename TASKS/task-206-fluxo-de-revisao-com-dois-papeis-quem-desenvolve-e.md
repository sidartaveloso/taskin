# 🧩 Task 206 — Fluxo de revisão com dois papéis: quem desenvolve e quem revisa

- Status: pending
- Type: feat
- Assignee: To be defined

## Description
Hoje o review leva a task de in-progress para in-review e roda as verificações, mas não há revisor: o finish fecha a task a partir de qualquer estado e por qualquer pessoa, e não há como devolver uma task para ajustes. Num projeto com duas pessoas, uma desenvolvendo e outra revisando, o desenvolvedor acaba mesclando sozinho na branch padrão. Proposta: papel de revisor no registro de usuários (taskin user); estado changes-requested (devolvida para ajustes), com o motivo registrado na task, e o caminho in-review → changes-requested → in-progress; finish só a partir de in-review e só por revisor (com --force para projetos de uma pessoa só); o review não mescla: abre ou aponta o PR para a branch padrão; com autoSync, os commits de mudança de estado vão no PR em vez de direto na branch padrão (que pode estar protegida); renomear o --skip-merge do review, que hoje só pula os hooks pre; métrica de quantas vezes uma task volta da revisão e do tempo em in-review. Avaliado e descartado: um estado separado para 'aguardando o início da revisão' — com um revisor só, in-review já é a fila, e o tempo de espera sai das datas das mudanças de estado.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Papel de revisor no registro de usuários (`taskin user`).
- [ ] Estado `changes-requested`, com o motivo registrado na task, e o
      comando que devolve uma task em `in-review` para ajustes.
- [ ] `finish` só a partir de `in-review` e só por revisor; `--force` para
      projeto de uma pessoa só.
- [ ] `review` não mescla: abre ou aponta o PR para a branch padrão.
- [ ] Com `autoSync`, os commits de mudança de estado vão no PR, e não
      direto na branch padrão.
- [ ] Renomear o `--skip-merge` do `review` (hoje só pula os hooks `pre`).
- [ ] Métricas: quantas vezes a task volta da revisão e o tempo em
      `in-review`.

## Notes
Add any relevant notes or links here.
