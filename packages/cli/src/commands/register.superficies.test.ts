import { nomesNaSuperficie } from '@opentask/taskin-task-manager';
import { Command } from 'commander';
import { describe, expect, it } from 'vitest';
import { registerCommands } from './register.js';

/**
 * A CLI atende cada operacao que `SUPERFICIES_DAS_OPERACOES` diz que ela
 * atende. O tipo garante que a tabela decide as tres superficies; este teste
 * garante que o nome declarado para a CLI e um comando que existe.
 */
describe('comandos da CLI x SUPERFICIES_DAS_OPERACOES', () => {
  const program = new Command();
  registerCommands(program);

  const acharComando = (caminho: string): Command | undefined =>
    caminho
      .split(' ')
      .reduce<Command | undefined>((atual, parte) => atual?.commands.find((c) => c.name() === parte), program);

  it.each(nomesNaSuperficie('cli'))('`taskin %s` existe', (nome) => {
    expect(acharComando(nome)).toBeDefined();
  });
});
