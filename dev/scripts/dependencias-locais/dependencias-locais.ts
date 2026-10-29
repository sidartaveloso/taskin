import type { CampoDeDependencias, DependenciaLocal } from './dependencias-locais.types';

const CAMPOS: readonly CampoDeDependencias[] = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
];

/** `link:` e `file:` apontam para uma pasta; entre pacotes do monorepo o protocolo e `workspace:`. */
const PROTOCOLOS_LOCAIS = ['link:', 'file:'];

/**
 * As dependencias de um manifesto que apontam para uma pasta da maquina.
 *
 * Foi um `link:../../../rinhany/...` no difficulty-estimator (task-210) que
 * deixou o CI e o Release vermelhos por semanas: a pasta existia ao lado do
 * taskin na maquina de quem escreveu e em nenhum outro lugar, e um pacote
 * publicado com `link:` nao instala. Vale para `devDependencies` tambem, porque
 * o CI precisa delas para o typecheck.
 */
export function encontrarDependenciasLocais(manifesto: unknown): DependenciaLocal[] {
  if (typeof manifesto !== 'object' || manifesto === null) return [];

  return CAMPOS.flatMap((campo) => {
    const dependencias = (manifesto as Record<string, unknown>)[campo];
    if (typeof dependencias !== 'object' || dependencias === null) return [];

    return Object.entries(dependencias).flatMap(([nome, versao]) =>
      typeof versao === 'string' && PROTOCOLOS_LOCAIS.some((protocolo) => versao.startsWith(protocolo))
        ? [{ campo, nome, versao }]
        : [],
    );
  });
}
