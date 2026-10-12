# 🧩 Task 199 — O serviço repassa: a skill na nuvem acha a máquina da pessoa e responde mesmo com ela desligada

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: alexa-etapa-2
- Priority: 8500
- Difficulty: 4

## Description
Os tratadores da skill passam a rodar na nuvem, com a porta do executor apontando para o repasse, sem guardar o conteúdo das tasks e com fala clara quando a máquina está fora.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Os tratadores da task-193 rodando no serviço, com a `PonteParaOExecutor` implementada pelo repasse da task-198
- [ ] Máquina desligada → "seu <nome da máquina> está desligado" ou "nenhuma máquina sua está conectada"; máquina sem o projeto → diz quais projetos estão conectados
- [ ] A regra do repositório em duas máquinas, como decidido na task-195
- [ ] Nada do conteúdo das tasks gravado, nem em banco nem em log: um teste roda uma conversa e procura o título nos logs capturados
- [ ] O replay da task-194 roda contra o serviço no estágio de desenvolvimento e passa

## Notes
Depende das tasks 193 e 198.

O `### Contexto da rodada` desta task é escrito quando a task-195 fechar, a partir das decisões dela. Antes disso, a task não está pronta para o sandcastle.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
