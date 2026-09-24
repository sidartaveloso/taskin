# 🧩 Task 113 — O Taskin no pulso: um app Wear OS instalavel no Galaxy Watch6, derivado do PWA do mascote

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Difficulty: 5

## Description
Levar o mascote da task-099 para o Samsung Galaxy Watch6 como aplicacao instalada no relogio, e nao como pagina aberta num navegador. O Watch6 roda Wear OS (One UI Watch), que nao instala PWA nem tem navegador de verdade, e nao tem camera: o que se aproveita do PWA e o comportamento do shhh (microfone, sustentacao, etapas de irritacao, nome a chamar, frase) e o formato do bloco mascot, nao o empacotamento. O produto entregue e um APK Wear OS que se instala no relogio por adb e sobrevive a tela redonda, ao modo ambiente e a bateria de um relogio.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Empacotar com **Quasar em modo Capacitor**, nas versoes estaveis mais recentes: `quasar` 2.33, `@quasar/app-vite` 3.10 e Capacitor 8.5 (`@capacitor/core`, `cli` e `android`), com `@capacitor/motion` 8 para o acelerometro. Projeto Android em `src-capacitor/`, gerando o APK Wear OS a partir do proprio app Vue
- [ ] Primeiro teste no aparelho: o `WebView` do Watch6 libera o microfone e entrega o acelerometro dentro do app Capacitor?
- [ ] Atualizar o Node antes da migracao: `.tool-versions` de 24.9.0 para a 24 mais recente (24.21.0 em 2026-09-24; o CI e o deploy do Pages leem a versao dali) e o `engines.node` da raiz de `>=20.19.0` para `>=24`, que o `@quasar/app-vite` 3 exige
- [ ] Migrar `packages/mascote` de Vite puro para Quasar (`@quasar/app-vite`), mantendo o modo PWA da task-099 funcionando e publicado em `/taskin/mascote/`
- [ ] Alvo de build Wear OS a partir do mesmo codigo Vue (`packages/mascote-wear` ou um modo do `packages/mascote`): projeto Android com `minSdk` do Wear OS 4, `uses-feature android.hardware.type.watch` e `com.google.android.wearable.standalone` para funcionar sem o celular pareado
- [ ] O shhh do relogio e o mesmo `TaskinWithShhh` do PWA, sem copia: limiar, `sustainMs`/`sustainRatio`, etapas de irritacao, calmaria, nome e frase continuam cobertos pela `TaskinWithShhh.spec.ts`
- [ ] Mascote desenhado para tela redonda de 432px (40mm) e 480px (44mm): nada cortado nos cantos, rosto centrado, sem os controles de laboratorio
- [ ] Sem camera, os olhos seguem a inclinacao do relogio pelo acelerometro: inclinar o pulso desloca as pupilas para o lado "de baixo", como se rolassem — com suavizacao e zona morta para nao tremer com o pulso parado
- [ ] Fonte de olhar como costura no organismo: o `Taskin` recebe um alvo de olhar (x, y normalizados) sem saber se veio da camera (PWA) ou do acelerometro (relogio), com teste para cada adaptador
- [ ] Leitura do sensor com cadencia baixa e pausada fora da tela ou no modo ambiente, para o acelerometro nao virar o maior custo de bateria
- [ ] Microfone com a permissao `RECORD_AUDIO` pedida no primeiro uso, com a recusa explicada na tela em vez de o mascote ficar mudo sem motivo
- [ ] Shhh no relogio: voz pelo alto-falante do Watch6 (TextToSpeech) e vibracao como alternativa quando o som estiver desligado
- [ ] Ajustes na propria tela (coroa/bisel e toque): nome, frase, som, sensibilidade, insistencia — guardados no formato do bloco `mascot.reactions.noise`, para o que se ajusta no pulso poder ir para um `.taskin.json`
- [ ] Modo ambiente e bateria: mascote simplificado no always-on, escuta em cadencia reduzida, e uma medicao de consumo por hora registrada nas notas
- [ ] Icone e nome do app na lista de aplicativos do relogio
- [ ] Script de build do APK assinado (debug e release) acessivel por `pnpm`, e o APK anexado como artefato do workflow
- [ ] Instalar no Galaxy Watch6 de verdade por depuracao sem fio (`adb connect` + `adb install`), abrir pelo menu do relogio e disparar o shhh falando alto — com foto ou video como evidencia
- [ ] Documentar: `README.md` do pacote com o passo a passo de instalacao (ativar opcoes de desenvolvedor, depuracao por Wi-Fi, parear, instalar), `docs/ARCHITECTURE.md` e o site em `packages/docs/content/` nos dois idiomas
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm format` e `pnpm test` verdes

## Notes
### Ponto de partida

A task-099 entregou `@opentask/taskin-mascote`: um PWA (Vite + Vue) que e o
`TaskinWithShhh` empacotado para um celular apoiado abaixo do monitor. O
comportamento vive no organismo do `design-vue`; o pacote so resolve aparelho
(portao de gesto, trava de tela, ajustes no `localStorage`, service worker).

### O que muda no relogio

**PWA nao instala.** O Wear OS nao tem Chrome nem suporte a PWA, e "instalar no
relogio" so e possivel como APK Wear OS. Por isso o reaproveitamento e de
comportamento e de formato de configuracao, nao do empacotamento.

**Nao ha camera, mas ha acelerometro.** O Galaxy Watch6 nao tem camera, entao o
rastreamento de rosto do PWA nao existe aqui. No lugar, os olhos seguem a
inclinacao do relogio: o vetor da gravidade, lido pelo acelerometro, vira o alvo
do olhar, e as pupilas "rolam" para o lado que esta mais baixo. Para isso nao
virar uma segunda implementacao do olhar, o organismo passa a receber um alvo
de olhar abstrato; camera e acelerometro sao so dois adaptadores que produzem
esse alvo. No navegador o sensor chega por `DeviceOrientationEvent`/
`DeviceMotionEvent` (ou pela Generic Sensor API); num build Capacitor, pelo
plugin de movimento — qual deles funciona no Watch6 e parte da medicao.

**Versoes.** Conferidas no npm em 2026-09-24: Capacitor 8.5.2 e o `latest`
(o 9 ainda esta em alpha, entao nao entra), `@quasar/app-vite` 3.10.0 e o
`latest` e aceita `@capacitor/cli >= 5`, e `quasar` 2.33.2. O app-vite 3 pede
Node `^22.22` ou `>= 24`; o repositorio roda em 24.9, mas o `engines` da raiz
ainda diz `>=20.19.0` e fica abaixo disso — por isso o Node sobe junto, no
checklist.

O app-vite 3 usa o Vite 8.3, o mesmo do repositorio. Ele traz duas consequencias
para a migracao do `packages/mascote`: `vue-router >= 5` e dependencia par
obrigatoria (a aplicacao tem uma tela so, mas o pacote precisa estar
instalado), e o modo PWA do Quasar gera o service worker pelo `workbox-build`,
entao o `vite-plugin-pwa` da task-099 sai e o comportamento offline precisa ser
conferido de novo.

**O caminho e Quasar em modo Capacitor.** O Quasar gera, do mesmo codigo Vue,
tanto o PWA da task-099 quanto um projeto Android em `src-capacitor/`; o mascote
passa a ter um codigo e dois alvos de build, e nao duas aplicacoes. O projeto
Android fica versionado e editavel no Android Studio, e e ali que entram os
ajustes de Wear OS (`uses-feature android.hardware.type.watch`, `standalone`,
`minSdk`, tela redonda), ja que o template padrao e de celular. Hoje o
`packages/mascote` e Vite + Vue sem Quasar, entao a migracao e o primeiro passo,
e o PWA nao pode regredir com ela.

**O `WebView` e o que se confere primeiro.** O app Capacitor roda dentro do
`WebView` do relogio; microfone, acelerometro e voz precisam funcionar ali. Isso
se confere no Watch6 logo no inicio, antes de investir no desenho da tela
redonda.

**Tela e bateria.** Tela redonda pequena, always-on e bateria de um dia mudam o
desenho e a cadencia. A task-099 deixou o modo economico adiado por falta de
medicao em aparelho; aqui a medicao e parte do criterio de pronto.

### Instalacao prevista

1. No relogio: Configuracoes > Sobre o relogio > Software > tocar 7 vezes em
   "Versao do software" para liberar as opcoes de desenvolvedor.
2. Opcoes de desenvolvedor > ativar depuracao ADB e depuracao por Wi-Fi.
3. No computador: `adb pair <ip>:<porta>` com o codigo exibido, depois
   `adb connect <ip>:<porta>` e `adb install taskin-mascote-wear.apk`.

Publicar na Play Store (faixa Wear OS) fica fora desta task.

### Fora de escopo

- Watch face / complicacao com o mascote (possivel task seguinte).
- Integracao com as tasks do taskin no relogio — aqui e so o mascote.
- Outros relogios alem do Galaxy Watch6, embora qualquer Wear OS 4+ deva servir.

