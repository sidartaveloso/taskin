# 🧩 Task 200 — O taskin em segundo plano: começa com o sistema e diz se está conectado

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: alexa-etapa-2
- Priority: 8600
- Difficulty: 3

## Description
taskin alexa conectar mantém a conexão enquanto a máquina está ligada, sobe sozinho com o login do sistema no macOS e no Linux, e taskin alexa status diz o que está ativado e se a conexão está de pé.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] `taskin alexa conectar`: mantém a conexão da task-198 enquanto roda, com log curto ("conectado", "start pedido no rinha")
- [ ] `taskin alexa conectar --instalar` e `--desinstalar`: agente do launchd no macOS e unidade de usuário do systemd no Linux, subindo com o login do sistema
- [ ] `taskin alexa status`: se está logado, os repositórios ativados com o nome falado, se a conexão está de pé e o último pedido
- [ ] Repositório ativado com o `conectar` já de pé entra sem reiniciar
- [ ] Documentado no `packages/cli/README.md`

## Notes
Depende das tasks 191 e 198. A instalação no launchd e no systemd é conferida à mão, no Mac e no `sidarta-desktop`.

O `### Contexto da rodada` desta task é escrito quando a task-195 fechar, a partir das decisões dela. Antes disso, a task não está pronta para o sandcastle.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
