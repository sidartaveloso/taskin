# 🧩 Task 113 — O Taskin no pulso: um app Wear OS instalavel no Galaxy Watch6, derivado do PWA do mascote

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Difficulty: 2
- Priority: 7100
- Group: taskin-no-pulso

## Description
O fecho do grupo `taskin-no-pulso`: instalar no Samsung Galaxy Watch6 de verdade o app Wear OS nativo construido nas tasks 175 a 185, abrir pelo menu do relogio e ver o Taskin pedir silencio quando a sala fala alto, com o olhar seguindo a inclinacao do pulso. Esta task comecou prevendo Capacitor; o plano mudou para Kotlin com Compose for Wear OS porque o Wear OS nao tem `WebView` (detalhes nas notas).

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Antes de tudo, confirmar no Watch6 o que o emulador mostrou: `adb shell dumpsys webviewupdate` e `adb shell pm list packages | grep -i webview`. Registrar a saida aqui; se o Watch6 tiver `WebView`, isso nao muda o plano (o app nativo continua), mas fica registrado
- [ ] Registrar a versao do relogio: `adb shell getprop ro.build.version.sdk` e `ro.build.version.release`, e conferir que e >= o `minSdk` 33 da task-175
- [ ] Instalar o APK da task-185 pelo `sidarta-desktop` (`adb install -r`), abrir pelo menu de aplicativos do relogio, conferir icone e nome
- [ ] No pulso: o mascote aparece inteiro na tela redonda, os olhos seguem a inclinacao, falar alto dispara o shhh com o nome e a frase, sem som ele vibra, os ajustes pela coroa gravam e sobrevivem a reabrir, o modo ambiente entra ao baixar o pulso
- [ ] Evidencia: foto ou video do relogio no pulso disparando o shhh, em `TASKS/assets/task-113/`, referenciado aqui
- [ ] Documentar: `packages/mascote-wear/README.md` com o passo a passo de instalacao (opcoes de desenvolvedor, depuracao por Wi-Fi, pareamento, tunel quando o relogio esta em outra rede, `adb install`); `docs/ARCHITECTURE.md` com o pacote, a divisao `core`/`app` e as tabelas compartilhadas; o site em `packages/docs/content/` nos dois idiomas
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm format` e `pnpm test` verdes, e o job do relogio no CI verde

## Notes
### Por que nao Capacitor

O plano original era migrar o `packages/mascote` para Quasar e gerar o APK pelo modo Capacitor. Ao preparar o `sidarta-desktop`, a imagem Wear OS 36 do emulador mostrou que o relogio nao tem `WebView`: nenhum pacote de WebView e nem o servico `webviewupdate`. O Android nao liga esse servico quando o aparelho e um relogio, e o Capacitor depende do `WebView` para desenhar toda a interface; sem ele, o app fecha ao abrir. As proprias empresas de plugins de relogio para Capacitor (Capawesome, Capgo) mandam fazer o app do relogio em Kotlin nativo. NativeScript-Vue e Vue Lynx foram considerados e descartados: sem uso conhecido em Wear OS, e o desenho do mascote teria de ser refeito do mesmo jeito.

Fontes: [Capawesome](https://capawesome.io/blog/how-to-build-a-wear-os-app-for-your-capacitor-app/), [Capgo](https://capgo.app/blog/capacitor-wear-os-app/), [AOSP: o servico de WebView nao sobe em relogio](https://gerrit.omnirom.org/plugins/gitiles/android_frameworks_base/+/41262a5b743960e55dbf1d2b066ea9256f0eff9c).

### O plano que ficou

Grupo `taskin-no-pulso`, em ordem de prioridade:

| Task | O que | Dificuldade |
|---|---|---|
| 175 | Esqueleto Kotlin + Compose for Wear OS, modulos `core` e `app`, testes pelo pnpm | 3 |
| 176 | Casos do detector, dos ajustes e do plano do shhh viram tabelas JSON compartilhadas | 2 |
| 177 | Detector de ruido em Kotlin, guiado pelas tabelas | 3 |
| 178 | Bloco `mascot` no relogio: mesmo formato e validacao, guardado no DataStore | 2 |
| 179 | Mascote em Compose Canvas com os paths gerados do SVG, tela redonda | 4 |
| 180 | Olhos pela inclinacao do pulso (acelerometro) | 3 |
| 181 | Microfone alimentando o detector, com permissao explicada | 3 |
| 182 | O shhh: nome, frase, voz e vibracao | 2 |
| 183 | Ajustes pela coroa e pelo toque | 3 |
| 184 | Modo ambiente e medicao de bateria no aparelho | 3 |
| 185 | APK assinado pelo pnpm e testes do relogio no CI | 3 |
| 113 | Instalar no Watch6, evidencia e documentacao | 2 |

A regra que atravessa o grupo: o comportamento do shhh passa a existir em TypeScript e em Kotlin, e a unica definicao dele sao as tabelas da task-176. Caso novo entra na tabela e passa nas duas implementacoes; o CI da task-185 roda as duas quando a tabela muda.

### Ambiente preparado (2026-10-12)

No `sidarta-desktop`: `develop` atualizado; `cmdline-tools` instaladas; plataforma Android 36 (o `@capacitor/android` 8.5 a exigia, e o app nativo usa a mesma); `platform-tools` 37.0.1; emulador e imagem Wear OS 36 x86_64; AVD `taskin_wear` (redondo, 454x454); `ANDROID_HOME` e PATH do SDK no `~/.bashrc` (shell interativo).

### Ligar o relogio ao desktop

O relogio esta na rede do notebook, nao na do desktop. Tunel SSH reverso a partir do notebook, com os dados da tela de depuracao sem fio do relogio:

```bash
ssh -N -R 37000:<ip-relogio>:<porta-pareamento> -R 37001:<ip-relogio>:<porta-conexao> sidarta-desktop
```

E no desktop: `adb pair localhost:37000 <codigo>` e `adb connect localhost:37001`.

### Fora de escopo

- Etapas de irritacao e calmaria (task-097, ainda pendente no TypeScript): entram depois, pela tabela compartilhada.
- Watch face ou complicacao com o mascote.
- Publicar na Play Store.
- Tasks do taskin no relogio — aqui e so o mascote.

### Onde executar

Manual, com o relogio na mao e o `sidarta-desktop` fazendo o `adb`. Nao e task para o sandcastle.
