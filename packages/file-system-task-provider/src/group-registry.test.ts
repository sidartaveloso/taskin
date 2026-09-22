import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runGroupRegistryContractTests } from '@opentask/taskin-task-manager/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { FileSystemGroupRegistry } from './group-registry.js';

const temporarios: string[] = [];

afterEach(() => {
  for (const d of temporarios.splice(0)) rmSync(d, { recursive: true, force: true });
});

/**
 * O registro de grupos do provider de arquivos prova o contrato agnostico.
 *
 * A reatribuicao e simulada por um contador: o contrato so precisa saber
 * **quantas** tarefas foram afetadas, e quem sabe mexer em tarefa e o provider.
 */
runGroupRegistryContractTests(async () => {
  const dir = mkdtempSync(join(tmpdir(), 'taskin-grupos-'));
  temporarios.push(dir);

  const membros = new Map<string, number>();
  const registry = new FileSystemGroupRegistry(dir, async (de) => {
    const quantas = membros.get(String(de)) ?? 0;
    membros.delete(String(de));
    return quantas;
  });

  return {
    registry,
    atribuir: async (groupId: string, quantas: number) => {
      membros.set(groupId, quantas);
    },
  };
});

describe('FileSystemGroupRegistry, alem do contrato', () => {
  it('um projeto sem o arquivo simplesmente nao tem grupo', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'taskin-grupos-'));
    temporarios.push(dir);

    const registry = new FileSystemGroupRegistry(dir, async () => 0);

    expect(await registry.listGroups()).toEqual([]);
  });

  it('recusa apagar quando o destino nao existe, e nao apaga nada', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'taskin-grupos-'));
    temporarios.push(dir);
    const registry = new FileSystemGroupRegistry(dir, async () => 0);
    await registry.createGroup({ id: 'g-1' as never, name: 'Sprint' });

    await expect(registry.deleteGroup('g-1' as never, { reassignTo: 'g-404' as never })).rejects.toThrow();

    expect(await registry.findGroup('g-1' as never)).toBeDefined();
  });
});
