# 🧩 Task 178 — O bloco mascot no relogio: mesmo formato, mesma validacao, guardado no aparelho

- Status: in-progress
- Type: feat
- Assignee: sidartaveloso
- Group: taskin-no-pulso
- Priority: 6300
- Difficulty: 2

## Description
Portar resolveMascotNoiseSettings e o formato do bloco mascot.reactions.noise para Kotlin, guiado pelas fixtures compartilhadas, e guardar os ajustes no DataStore no formato do .taskin.json, para o que se ajusta no pulso poder ir para um projeto.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Teste primeiro, em `core`: le `packages/types-ts/src/__fixtures__/mascot-noise-settings.cases.json` e confere `resolveMascotNoiseSettings` em Kotlin caso a caso — vermelho antes
- [ ] Modelo do bloco `mascot` com `kotlinx.serialization`, aceitando o mesmo JSON do `.taskin.json` (chaves desconhecidas ignoradas, invalido cai nos defaults como no TypeScript)
- [ ] `resolveMascotNoiseSettings` em Kotlin, com as mesmas faixas e defaults
- [ ] Em `app`: repositorio de ajustes sobre o Jetpack DataStore que grava e le o **bloco** (JSON no formato do arquivo), e nao o objeto resolvido — a mesma decisao da task-099 para o `localStorage`. Teste de ida-e-volta e de bloco invalido recusado antes de gravar
- [ ] Exportar o bloco como texto (para colar num `.taskin.json`) — so a funcao, a tela fica na task-183

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
