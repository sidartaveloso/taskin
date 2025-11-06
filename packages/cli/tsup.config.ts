import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false,
  bundle: true,
  splitting: false,
  clean: true,
  minify: false,
  external: ['chalk', 'commander', 'inquirer', '@types/inquirer', 'zod'],
  noExternal: [
    '@taskin/core',
    '@taskin/fs-task-provider',
    '@taskin/git-utils',
    '@taskin/task-manager',
    '@taskin/types-ts',
    '@taskin/utils',
  ],
});
