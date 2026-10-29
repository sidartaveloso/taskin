import { describe, expect, it } from 'vitest';
import { encontrarDependenciasLocais } from './dependencias-locais';

describe('encontrarDependenciasLocais', () => {
  it('acusa link: e file: em todos os campos de dependencias', () => {
    const manifesto = {
      dependencies: { '@rinhany/core': 'link:../../../rinhany/packages/core', zod: '^4.5.4' },
      devDependencies: { '@rinhany/testing': 'link:../../../rinhany/packages/testing' },
      peerDependencies: { algo: 'file:../algo' },
      optionalDependencies: { outro: 'file:./vendor/outro.tgz' },
    };

    expect(encontrarDependenciasLocais(manifesto)).toEqual([
      { campo: 'dependencies', nome: '@rinhany/core', versao: 'link:../../../rinhany/packages/core' },
      { campo: 'devDependencies', nome: '@rinhany/testing', versao: 'link:../../../rinhany/packages/testing' },
      { campo: 'peerDependencies', nome: 'algo', versao: 'file:../algo' },
      { campo: 'optionalDependencies', nome: 'outro', versao: 'file:./vendor/outro.tgz' },
    ]);
  });

  it('aceita versoes do registro e workspace:', () => {
    const manifesto = {
      dependencies: { '@rinhany/core': '^0.1.0', '@opentask/taskin-types': 'workspace:*' },
      devDependencies: { vitest: '^5.0.1' },
    };

    expect(encontrarDependenciasLocais(manifesto)).toEqual([]);
  });

  it('ignora o que nao e manifesto', () => {
    expect(encontrarDependenciasLocais(undefined)).toEqual([]);
    expect(encontrarDependenciasLocais({ dependencies: 'nada' })).toEqual([]);
  });
});
