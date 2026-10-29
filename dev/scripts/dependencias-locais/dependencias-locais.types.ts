export type CampoDeDependencias = 'dependencies' | 'devDependencies' | 'peerDependencies' | 'optionalDependencies';

export type DependenciaLocal = {
  campo: CampoDeDependencias;
  nome: string;
  versao: string;
};
