import { readFileSync, writeFileSync } from 'node:fs';

/**
 * Patches @vue/compiler-core.cjs.js to suppress the harmless
 * "decodeEntities option is passed but will be ignored in non-browser builds"
 * warning that fires every time @vue/compiler-dom compiles a template
 * inside Node.js (the CJS build path used by @vitejs/plugin-vue).
 *
 * The warning is functionally irrelevant — decodeEntities is only meaningful
 * for browser-side runtime compilation, not for SFC build-time compilation.
 */
export function patchVueCompilerCjs() {
  const cjsPath = require.resolve('@vue/compiler-core/dist/compiler-core.cjs.js');
  const original = readFileSync(cjsPath, 'utf8');
  const patched = original.replace(
    "decodeEntities option is passed but will be ignored in non-browser builds",
    "decodeEntities option is passed but will be ignored",
  );
  if (original !== patched) {
    writeFileSync(cjsPath, patched);
  }
}
