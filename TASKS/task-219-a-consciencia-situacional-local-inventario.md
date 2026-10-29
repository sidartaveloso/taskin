# 🧩 Task 219 — A consciência situacional local: inventário, sondagem desta máquina, registro de execução e o taskin status

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: g-ebwuvrd1

## Description
As implementações locais dos plugins de inventário, sondagem e registro de execução, passando pela mesma suíte, e o taskin status com --format lendo do sistema

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Inventário local: a camada do repositório na chave `resources` do `.taskin.json` e a da pessoa em `~/.config/taskin/resources.json`, com liberações e restrições, e os segredos só por referência
- [ ] Sondagem desta máquina (SO, CPU, memória, Docker, SDKs, imagem do sandcastle) e dos agentes pelo `probe()` que já existe, com cada fato datado
- [ ] Registro de execução versionado no repositório, com a dificuldade estimada e a encontrada, citando recursos só pelo nome lógico
- [ ] As mesmas suítes de contrato verdes contra as implementações locais
- [ ] `taskin status` com a task em andamento no topo e o quadro somado, e `--format text|json|html|md` com o atalho `--json`; o JSON com schema e `version`
- [ ] Nada privado no que é versionado: o teste confere que o registro e a camada do repositório não levam endereço, hostname nem credencial

## Notes
Depende da task-218. A parte remota (o mesmo contrato servido pelo `taskin daemon` às outras máquinas e ao taskinboard) vem depois da task-200.

O `### Contexto da rodada` desta task é escrito quando a task-218 fechar.

### Onde executar
Sandcastle para o código e os testes; a sondagem de verdade é conferida à mão numa máquina macOS e numa Linux.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
