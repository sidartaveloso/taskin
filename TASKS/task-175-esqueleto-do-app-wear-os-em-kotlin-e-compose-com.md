# 🧩 Task 175 — Esqueleto do app Wear OS em Kotlin e Compose, com teste rodando pelo pnpm

- Status: pending
- Type: chore
- Assignee: sidartaveloso
- Group: taskin-no-pulso
- Priority: 6000
- Difficulty: 3

## Description
Criar packages/mascote-wear: projeto Gradle em Kotlin com Compose for Wear OS, standalone, que abre uma tela redonda vazia no emulador e tem um teste de unidade e um de UI rodando por pnpm --filter. E a base de todas as outras tasks do grupo.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Teste primeiro: um teste de unidade em `core` (JUnit 5) e um teste de UI em `app` (Compose UI test com Robolectric) que confere que a tela inicial mostra o texto "Taskin" — os dois vermelhos antes do codigo
- [ ] `packages/mascote-wear/` com Gradle 9.8 (wrapper versionado), AGP 9.4, Kotlin 2.4, JDK 21 (toolchain), `compileSdk`/`targetSdk` 36 e `minSdk` 33 (Wear OS 4, a versao com que o Galaxy Watch6 saiu de fabrica)
- [ ] Dois modulos: `core` (Kotlin/JVM puro, sem dependencia Android: e onde vivem detector, ajustes, contas do olhar e plano do shhh) e `app` (Android, Compose for Wear OS: `androidx.wear.compose:compose-material3` 1.7, BOM do Compose 2026.09)
- [ ] `AndroidManifest.xml` de relogio: `uses-feature android.hardware.type.watch`, `meta-data com.google.android.wearable.standalone=true`, uma `Activity` com `AppScaffold`/`ScreenScaffold` mostrando "Taskin" centralizado
- [ ] `package.json` com nome `@opentask/taskin-mascote-wear`, `private: true`, e scripts que chamam o wrapper: `test:core` (`./gradlew :core:test`), `test` (`./gradlew test`), `lint` (`./gradlew lint ktlintCheck` ou o equivalente escolhido), `build` (`./gradlew :app:assembleDebug`)
- [ ] Decidir se o pacote entra no `turbo` da raiz: se entrar, `pnpm test` da raiz passa a exigir JDK e Android SDK; a alternativa e ficar fora do pipeline padrao e ganhar um job proprio no CI (task-185). Registrar a escolha nas notas
- [ ] `.gitignore` do pacote (`build/`, `.gradle/`, `local.properties`)
- [ ] Abrir no emulador `taskin_wear` e salvar a captura em `TASKS/assets/task-175/tela-inicial.png`, referenciada aqui

## Notes
Primeira task do grupo `taskin-no-pulso`. Contexto da decisao: a task-113 previa Capacitor, mas o Wear OS nao tem `WebView` (o emulador Wear OS 36 nao tem nem o servico `webviewupdate`, e o Android nao o liga em relogio), entao o app do relogio e nativo, em Kotlin com Compose for Wear OS.

A separacao `core`/`app` e a decisao que mais pesa: tudo que e regra fica em Kotlin/JVM puro e se testa em milissegundos, sem emulador e sem Android SDK; o `app` so liga sensores, audio e desenho a essas regras.

### Contexto da rodada
- Ler: este arquivo; `packages/mascote/package.json` (para o formato de pacote-aplicacao do repositorio); `pnpm-workspace.yaml`; `turbo.json`.
- Nao ler: `packages/design-vue`, `packages/ui-sense` — nao entram nesta task.

### Verificacao
```bash
pnpm --filter @opentask/taskin-mascote-wear test
pnpm --filter @opentask/taskin-mascote-wear lint
pnpm --filter @opentask/taskin-mascote-wear build
```

### Onde executar
`sidarta-desktop` (Tailscale): e a maquina com JDK 21 (asdf, Temurin), Android SDK em `~/Android/Sdk` (plataforma 36, build-tools 36, emulador e a imagem Wear OS 36 no AVD `taskin_wear`, redondo 454x454) e Docker nativo. O Mac nao tem Android SDK. Abrir um shell interativo (o `.bashrc` so exporta `ANDROID_HOME` e o PATH do SDK em shell interativo).

Fechar a task so com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
