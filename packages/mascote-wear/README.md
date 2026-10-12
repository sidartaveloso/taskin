# @opentask/taskin-mascote-wear

O Taskin no pulso: o mascote como app nativo de Wear OS, feito para o Galaxy
Watch6 e para qualquer relógio com Wear OS 4 ou mais novo.

O [PWA do mascote](../mascote/) não serve no relógio: o Wear OS não tem
navegador nem `WebView`, então o app é Kotlin com Compose for Wear OS.

## Estrutura

- **`core/`** — Kotlin/JVM puro, sem Android. É onde ficam as regras: o
  detector de ruído, os ajustes, a conta do olhar e o plano do shhh. Os testes
  rodam em milissegundos e sem emulador, e leem as mesmas tabelas de casos que
  os testes TypeScript, para as duas implementações não divergirem.
- **`app/`** — o aplicativo Android: liga microfone, acelerômetro, voz,
  vibração e desenho às regras do `core`.

## Desenvolvendo

Precisa de JDK 21 e do Android SDK com a plataforma 37 (`ANDROID_HOME`
apontando para ele).

```bash
pnpm --filter @opentask/taskin-mascote-wear wear:test       # core + UI (Robolectric)
pnpm --filter @opentask/taskin-mascote-wear wear:test:core  # só o core, sem Android SDK
pnpm --filter @opentask/taskin-mascote-wear wear:lint       # Android lint
pnpm --filter @opentask/taskin-mascote-wear wear:build      # APK debug em app/build/outputs/apk/debug/
```

Os scripts têm o prefixo `wear:` de propósito: assim o `pnpm test` e o
`pnpm lint` da raiz, que passam pelo turbo, não exigem JDK nem Android SDK de
quem só mexe no TypeScript. O pacote tem um job próprio no CI.

O passo a passo para instalar no relógio fica na task-113.
