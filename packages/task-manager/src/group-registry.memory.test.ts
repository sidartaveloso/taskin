import { runGroupNestingContractTests, runGroupRegistryContractTests } from './group-registry.contract';
import { registroDeGruposEmMemoria } from './group-registry.memory';

/** O registro em memoria que os testes das superficies usam cumpre os dois contratos. */
runGroupRegistryContractTests(async () => {
  const membros = new Map<string, number>();
  const registry = registroDeGruposEmMemoria([], async (de) => {
    const quantas = membros.get(String(de)) ?? 0;
    membros.delete(String(de));
    return quantas;
  });
  return { registry, atribuir: async (groupId, quantas) => void membros.set(groupId, quantas) };
});

runGroupNestingContractTests(async () => ({ registry: registroDeGruposEmMemoria() }));
