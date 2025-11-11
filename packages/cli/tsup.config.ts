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
  external: ['chalk', 'commander', 'inquirer', '@types/inquirer', 'zod'],
  noExternal: [
    '@opentask/taskin-core',
    '@opentask/taskin-fs-provider',
    '@opentask/taskin-git-utils',
    '@opentask/taskin-task-manager',
    '@opentask/taskin-types',
    '@opentask/taskin-utils',
  ],
});
