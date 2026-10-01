---
'@opentask/taskin-utils': patch
'@opentask/taskin-git-utils': patch
'@opentask/taskin-file-system-provider': patch
---

Os pacotes voltam a carregar no Node ESM. O `@opentask/taskin-utils@1.1.1` saiu com `export * from './security'`, sem a extensão `.js`, e o `@opentask/taskin-git-utils@3.1.0` saiu sem os próprios arquivos: o `.gitignore` da raiz (`**/src/**/*.js`) descartava `dist/src/*.js` do tarball, e só o `main` entrava. Como o provider fs fixa os dois, `import('@opentask/taskin-file-system-provider')` falhava com `ERR_MODULE_NOT_FOUND` em qualquer consumidor ESM. O git-utils passa pelo `fix-esm-extensions` e declara `files`. O utils já gerava saída válida e só precisava ser republicado.
