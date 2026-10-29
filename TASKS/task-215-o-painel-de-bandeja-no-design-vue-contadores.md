# 🧩 Task 215 — O painel de bandeja no design-vue: contadores, alerta e alarme que o taskinboard e outros painéis usam

- Status: pending
- Type: feat
- Assignee: sidartaveloso

## Description
Levar para o design-vue, com story, os componentes de um painel de bandeja já usado em outro projeto (painel de contadores com alerta pulsando, alarme sonoro e mensagem de erro), com nomes em inglês e sem nada do domínio de origem, para o taskinboard e o projeto de origem usarem a mesma peça

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Antes de copiar qualquer linha: a autorização de quem detém o código de origem para publicá-lo sob a licença MIT do `design-vue`, anotada aqui (quem autorizou e quando, sem dado pessoal). Sem ela, os itens seguintes viram reescrita do zero, usando o painel de origem só como referência visual
- [ ] Atom `AlarmAudio`: toca o som de alerta em laço enquanto `active` e não `muted`, e para ao desmontar
- [ ] Atom `ErrorMessage`: a mensagem de erro com o botão de abrir as configurações
- [ ] Organism `CounterPanel`: a lista de contadores (rótulo, valor com zero-pad e transição de dígito para cima ou para baixo, marca de alerta, link opcional), o estado de conexão, a borda pulsando enquanto `alerting`, o carregando e o erro. O estado de conexão reaproveita ou estende a molecule `ConnectionStatus` que já existe, em vez de criar outra
- [ ] Template `TrayBoardScreen`: o `CounterPanel` com o `AlarmAudio`, o silenciar e o tamanho de janela de bandeja
- [ ] Nada do domínio de origem: nenhum nome de produto, de coleção ou de contador, nos componentes, nas stories, nos mocks e nos comentários. Textos visíveis por prop, sem rótulo fixo
- [ ] Cada componente com `*.types.ts`, `*.mock.ts`, teste e story, no padrão do `design-vue`; stories com o estado normal, alertando, silenciado, carregando, erro e sem permissão
- [ ] Evidência visual: captura das stories em `TASKS/assets/task-215/` e o link do Storybook com cada story nova
- [ ] Exportados no `index.ts` do `design-vue` e no changeset, para o projeto de origem trocar a cópia dele pelo pacote publicado

## Notes
Faz parte do taskinboard (`docs/RDT/consciencia-situacional.md`, seção "Onde a situação aparece"). Os componentes saem de um painel de bandeja de outro projeto, que é Vue 3 com componentes quase sem domínio: só os comentários citam o produto de origem.

A troca do lado do projeto de origem (passar a importar do `@opentask/taskin-design-vue`) é trabalho no repositório dele, depois que esta task for publicada.

### Verificacao
```bash
pnpm --filter @opentask/taskin-design-vue typecheck
pnpm --filter @opentask/taskin-design-vue lint
pnpm --filter @opentask/taskin-design-vue test
```

### Onde executar
Interativo, fora do sandcastle: o código de origem não está neste repositório, e o primeiro item é uma autorização. A revisão das stories é visual.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
