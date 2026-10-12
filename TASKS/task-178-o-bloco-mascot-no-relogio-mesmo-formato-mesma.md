# 🧩 Task 178 — O bloco mascot no relogio: mesmo formato, mesma validacao, guardado no aparelho

- Status: done
- Type: feat
- Assignee: sidartaveloso
- Group: taskin-no-pulso
- Priority: 6300
- Difficulty: 2

## Description
Portar resolveMascotNoiseSettings e o formato do bloco mascot.reactions.noise para Kotlin, guiado pelas fixtures compartilhadas, e guardar os ajustes no DataStore no formato do .taskin.json, para o que se ajusta no pulso poder ir para um projeto.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] Teste primeiro: `core/src/test/.../MascotNoiseSettingsTabelaTest.kt`, um teste por caso de `packages/types-ts/src/__fixtures__/mascot-noise-settings.cases.json` (os validos comparam os ajustes; os invalidos exigem `ConfiguracaoInvalida`). Falhou antes da implementacao (`Unresolved reference 'resolveMascotNoiseSettings'`)
- [x] Leitura do bloco `mascot` com o `JsonElement` do `kotlinx.serialization`, aceitando o mesmo JSON do `.taskin.json`: chaves desconhecidas ignoradas, ausente vale o padrao. **Diferente do que a task previa**, invalido nao cai nos padroes dentro de `resolveMascotNoiseSettings`: lanca, como o zod lanca no TypeScript. Quem cai nos padroes e o `lerAjustes`, como no PWA
- [x] `resolveMascotNoiseSettings` em Kotlin (`core/src/main/.../MascotNoiseSettings.kt`), com as mesmas faixas e padroes, validacao escrita campo a campo: `null` nao e ausente, inteiro exige parte fracionaria zero, texto passa por `trim` e a frase nao pode ficar vazia. Os 19 casos verdes
- [x] Armazenamento no relogio: `ArmazenamentoDoRelogio` grava e le o **bloco** (texto JSON no formato do arquivo), nao o objeto resolvido. **Em `SharedPreferences`, e nao no DataStore** que a task citava — razao nas notas. `lerAjustes`/`gravarAjustes` no `core` (`Ajustes.kt`) repetem o `ajustes.ts` do PWA: nada gravado, JSON quebrado, fora da faixa ou armazenamento negado caem nos padroes; bloco invalido e recusado antes de gravar; falha ao gravar nao recusa a mudanca. `AjustesTest.kt` (9 testes) e `ArmazenamentoDoRelogioTest.kt` (2 testes, Robolectric: comeca vazio; o gravado sobrevive a uma instancia nova)
- [x] Exportar como texto: `blocoDe(ajustes)` monta o bloco e `blocoComoTexto(bloco)` o devolve indentado, pronto para a chave `mascot` de um `.taskin.json`; testado de ida-e-volta. A tela fica para a task-183

## Notes
Depende das tasks 175 e 176.

### Contexto da rodada
- Ler: `packages/types-ts/src/taskin.schemas.ts` — so `MascotConfigSchema`, os schemas de `reactions.noise` e `resolveMascotNoiseSettings`; a tabela `mascot-noise-settings.cases.json`; `packages/mascote/src/composables/ajustes.ts` (como o PWA guarda o bloco).
- Nao ler: o resto do `taskin.schemas.ts` (e longo), `design-vue`.

### Verificacao
```bash
pnpm --filter @opentask/taskin-mascote-wear wear:test
pnpm --filter @opentask/taskin-mascote-wear wear:lint
pnpm --filter @opentask/taskin-mascote-wear wear:build
```

### Onde executar
`sidarta-desktop` (Tailscale): e a maquina com JDK 21 (asdf, Temurin), Android SDK em `~/Android/Sdk` (plataforma 36, build-tools 36, emulador e a imagem Wear OS 36 no AVD `taskin_wear`, redondo 454x454) e Docker nativo. O Mac nao tem Android SDK. Abrir um shell interativo (o `.bashrc` so exporta `ANDROID_HOME` e o PATH do SDK em shell interativo). A parte de `core` roda em qualquer maquina com JDK 21.

Fechar a task so com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).

### Resultado

```
./gradlew test → core: AjustesTest 9 · MascotNoiseSettingsTabelaTest 19 · NoiseDispatcherTabelaTest 22 · NoiseDispatcherTest 2 · TaskinWearTest 2
                 app:  ArmazenamentoDoRelogioTest 2 · TelaInicialTest 1 — 57 testes, 0 falhas
./gradlew :app:lintDebug → 0 erros, 5 avisos (os do icone provisorio)
```

**Por que `SharedPreferences` e nao DataStore.** O que se guarda e um texto pequeno, numa chave so, lido ao abrir e gravado ao fechar a tela de ajustes — o papel do `localStorage` no PWA. A porta do `core` e sincrona como a do PWA, e o DataStore e assincrono: usa-lo aqui exigiria `runBlocking` na thread de UI ou uma porta assincrona so para isto. Se o estado crescer ou varias telas passarem a observa-lo, a troca fica contida em `ArmazenamentoDoRelogio`. A chave e a mesma do PWA, `taskin-mascote:mascot`.

`kotlinx-serialization-json` passou de dependencia de teste a `api` do `core`: o bloco e um `JsonObject` na interface publica.
