#!/usr/bin/env node
// Pós-build: torna a saída consumível pelo loader ESM do Node, adicionando a
// extensão `.js` apenas a imports/exports RELATIVOS (`./`, `../`) que a omitem.
// Specifiers de pacote (`@opentask/...`, `fs`, `zod`, …) são preservados — eles
// são resolvidos por `dependencies` em runtime, não por caminho.
//
// Uso: node scripts/fix-esm-extensions.mjs <dir-dist>
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const alvo = process.argv[2];
if (!alvo) {
  console.error('uso: fix-esm-extensions.mjs <dir-dist>');
  process.exit(1);
}

// Captura o specifier de: import ... from '...', export ... from '...',
// import '...' e import('...') — com aspas simples ou duplas.
const RE_SPECIFIER = /(\bfrom\s*|\bimport\s*|\bimport\s*\(\s*)(['"])(\.[^'"]*)\2/g;

function jaTemExtensao(spec) {
  return /\.(js|mjs|cjs|json|node)$/.test(spec);
}

/** Resolve o specifier relativo a partir do arquivo e devolve o sufixo correto. */
function sufixoPara(arquivo, spec) {
  const base = resolve(dirname(arquivo), spec);
  if (existsSync(`${base}.js`)) return '.js';
  if (existsSync(base) && statSync(base).isDirectory() && existsSync(join(base, 'index.js'))) {
    return '/index.js';
  }
  return '.js'; // padrão seguro: arquivo irmão .js
}

function corrigir(arquivo) {
  const original = readFileSync(arquivo, 'utf8');
  const novo = original.replace(RE_SPECIFIER, (todo, verbo, aspas, spec) => {
    if (jaTemExtensao(spec)) return todo;
    return `${verbo}${aspas}${spec}${sufixoPara(arquivo, spec)}${aspas}`;
  });
  if (novo !== original) writeFileSync(arquivo, novo);
}

function percorrer(dir) {
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    const caminho = join(dir, entrada.name);
    if (entrada.isDirectory()) percorrer(caminho);
    else if (/\.(js|d\.ts)$/.test(entrada.name)) corrigir(caminho);
  }
}

percorrer(resolve(alvo));
