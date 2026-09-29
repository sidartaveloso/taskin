import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false,
  bundle: true,
  splitting: false,
  clean: true,
  minify: false,
  shims: true,
  platform: 'node',
  target: 'node20',
  esbuildOptions(options) {
    options.preserveSymlinks = true;
  },
  external: [
    'chalk',
    'commander',
    'inquirer',
    '@types/inquirer',
    'zod',
    'ws',
    'express',
    '@opentask/taskin-types',
    '@modelcontextprotocol/sdk',
    // As dependencias do layerall (@turf/*) nao se resolvem com preserveSymlinks;
    // ele esta no npm, entao vai como dependencia de runtime (task-141).
    '@layerall/core',
  ],
  noExternal: [
    '@opentask/taskin-core',
    '@opentask/taskin-difficulty-estimator',
    '@opentask/taskin-file-system-provider',
    '@opentask/taskin-git-utils',
    '@opentask/taskin-task-manager',
    '@opentask/taskin-task-provider-pinia',
    '@opentask/taskin-task-server-mcp',
    '@opentask/taskin-task-server-ws',
    '@opentask/taskin-utils',
  ],
});
