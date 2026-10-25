# Task 204 — O autopilot descobre a defaultBranch e o taskin config interativo a pergunta

Status: in-progress
Type: feat
Assignee: sidartaveloso

## Description

Em autopilot a defaultBranch deve estar configurada. Ao escolher autopilot (taskin config --level autopilot ou o menu interativo) detectar a branch: develop se existir, senao main, senao master; checar refs locais e origin/*, sem rede. Gravar em automation.defaultBranch e imprimir o que escolheu. No interativo, ao selecionar autopilot perguntar a defaultBranch com a detectada como sugestao. Adicionar a flag --default-branch <branch> ao taskin config e mostrar o valor no --show. Um .taskin.json autopilot sem o campo usa a mesma deteccao em memoria em vez do aviso de que nada sera sincronizado. Sem develop, main nem master nao adivinhar: avisar e apontar a flag. Fora do autopilot o campo segue opcional. Relacionada a task-135.

## Tasks

- [x] Teste vermelho: deteccao escolhe `develop`, senao `main`, senao `master`, olhando refs locais e `origin/*`
- [x] Teste vermelho: sem nenhuma das tres nao adivinha; avisa e aponta `--default-branch`
- [x] Teste vermelho: `taskin config --level autopilot` grava `automation.defaultBranch` e imprime a escolha
- [x] Teste vermelho: no interativo, escolher autopilot pergunta a `defaultBranch` com a detectada como sugestao
- [x] Flag `--default-branch <branch>` no `taskin config`, valor visivel no `--show`
- [x] `.taskin.json` autopilot sem o campo usa a deteccao em memoria em vez do aviso de nada sincronizado
- [x] Fora do autopilot o campo continua opcional e nada e preenchido sozinho

## Notes

Parte do desenho da task-135: a `defaultBranch` e o quadro de status compartilhado.
