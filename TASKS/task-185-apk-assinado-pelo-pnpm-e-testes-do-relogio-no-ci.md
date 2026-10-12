# 🧩 Task 185 — APK assinado pelo pnpm e testes do relogio no CI

- Status: pending
- Type: chore
- Assignee: sidartaveloso
- Group: taskin-no-pulso
- Priority: 7000
- Difficulty: 3

## Description
Gerar o APK debug e release assinado por um script pnpm, rodar os testes Kotlin no CI do GitHub e anexar o APK como artefato do workflow.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Script `pnpm --filter @opentask/taskin-mascote-wear wear:build:release` gerando APK release assinado; keystore fora do repositorio, lida de variaveis de ambiente (`TASKIN_WEAR_KEYSTORE`, senha e alias), com o debug assinado pela chave de debug como hoje
- [ ] Job novo no `.github/workflows/ci.yml` (ou workflow proprio), com `actions/setup-java` (Temurin 21) e o Android SDK do runner: roda `test` e `lint` do pacote quando algo em `packages/mascote-wear/` ou nas fixtures compartilhadas mudar
- [ ] Mudanca nas fixtures compartilhadas (`__fixtures__/*.cases.json`) dispara os testes TypeScript e os Kotlin no mesmo CI — e o que faz a divergencia virar build vermelho
- [ ] APK debug anexado como artefato do workflow; release so quando houver os secrets
- [ ] Documentar os secrets no README do pacote; criar a keystore e registrar os secrets fica para o usuario (anotar o comando `keytool` pronto)

## Notes
Depende da task-175. A decisao da task-175 sobre o `turbo` da raiz define se este job e o unico lugar onde o Kotlin roda no CI.

### Contexto da rodada
- Ler: `.github/workflows/ci.yml`; `packages/mascote-wear/app/build.gradle.kts`; `.tool-versions` (o CI le as versoes dali).
- Nao ler: o codigo Kotlin.

### Verificacao
```bash
pnpm --filter @opentask/taskin-mascote-wear wear:build
pnpm --filter @opentask/taskin-mascote-wear wear:test
```
E o job do CI verde num push para o `develop`.

### Onde executar
`sidarta-desktop` (Tailscale): e a maquina com JDK 21 (asdf, Temurin), Android SDK em `~/Android/Sdk` (plataforma 36, build-tools 36, emulador e a imagem Wear OS 36 no AVD `taskin_wear`, redondo 454x454) e Docker nativo. O Mac nao tem Android SDK. Abrir um shell interativo (o `.bashrc` so exporta `ANDROID_HOME` e o PATH do SDK em shell interativo).

Fechar a task so com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
