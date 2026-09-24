import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runGroupNestingContractTests, runGroupRegistryContractTests } from '@opentask/taskin-task-manager/testing';
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

runGroupNestingContractTests(async () => {
  const dir = mkdtempSync(join(tmpdir(), 'taskin-grupos-'));
  temporarios.push(dir);
  return { registry: new FileSystemGroupRegistry(dir, async () => 0) };
});

describe('FileSystemGroupRegistry, alem do contrato', () => {
  /*
   * O aninhamento sobrevive ao recarregar: quem le e outra instancia, sobre o
   * mesmo arquivo — o que o dashboard faz a cada volta da lista.
   */
  it('o pai fica no .taskin-groups.json, e outra instancia o le', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'taskin-grupos-'));
    temporarios.push(dir);
    const antes = new FileSystemGroupRegistry(dir, async () => 0);
    await antes.createGroup({ id: 'g-pai' as never, name: 'Pai' });
    await antes.createGroup({ id: 'g-filho' as never, name: 'Filho' });
    await antes.setParent('g-filho' as never, 'g-pai' as never);

    const bruto = JSON.parse(readFileSync(join(dir, '.taskin-groups.json'), 'utf-8'));
    expect(bruto.groups['g-filho']).toEqual({ id: 'g-filho', name: 'Filho', parentId: 'g-pai' });

    const depois = new FileSystemGroupRegistry(dir, async () => 0);
    expect((await depois.findGroup('g-filho' as never))?.parentId).toBe('g-pai');
  });

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
