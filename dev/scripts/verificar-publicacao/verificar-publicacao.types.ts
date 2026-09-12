/**
 * Um pacote publicavel do monorepo, ja filtrado pelos mesmos criterios do
 * changesets (nao privado e fora do `ignore`), com os campos que os dois
 * guarda-corpos do release precisam conferir.
 */
export type PacotePublicavel = {
  nome: string;
  versao: string;
  /** `repository.url` do package.json, normalizado para string; '' quando ausente. */
  repositoryUrl: string;
};
