import { describe, expect, it } from 'vitest';
import { normalizeRemoteUrl, resolveRepositoryIdentity } from './repository-id';

const ID = 'github.com/dono/nome';

describe('normalizeRemoteUrl', () => {
  it.each([
    'git@github.com:dono/nome.git',
    'git@github.com:dono/nome',
    'ssh://git@github.com/dono/nome.git',
    'ssh://git@github.com:22/dono/nome.git',
    'https://github.com/dono/nome.git',
    'https://github.com/dono/nome',
    'https://github.com/dono/nome/',
    'http://github.com/dono/nome.git',
    'git://github.com/dono/nome.git',
    'https://GitHub.com/Dono/Nome.git',
  ])('%s vira o mesmo id', (url) => {
    expect(normalizeRemoteUrl(url)).toBe(ID);
  });

  it.each([
    'https://usuario:senha-secreta@github.com/dono/nome.git',
    'https://ghp_tokensecreto@github.com/dono/nome.git',
    'https://x-access-token:ghs_tokensecreto@github.com/dono/nome.git',
    'ssh://usuario:senha-secreta@github.com/dono/nome.git',
    'https://github.com/dono/nome.git?token=tokensecreto',
    'https://github.com/dono/nome.git#tokensecreto',
  ])('%s perde o usuario e o token', (url) => {
    expect(normalizeRemoteUrl(url)).toBe(ID);
  });

  it.each([
    ['caminho local', '/srv/git/nome.git'],
    ['caminho relativo', '../nome.git'],
    ['file', 'file:///srv/git/nome.git'],
    ['Windows', 'C:\\repos\\nome.git'],
    ['host sem dominio', 'maquina-de-casa:repos/nome.git'],
    ['host sem dominio em https', 'https://servidor/dono/nome.git'],
    ['IP', 'git@192.168.0.2:dono/nome.git'],
    ['IP em https', 'https://10.0.0.1/dono/nome.git'],
    ['IPv6', 'https://[fd00::1]/dono/nome.git'],
    ['rede local', 'git@servidor.local:dono/nome.git'],
    ['rede interna', 'https://git.empresa.internal/dono/nome.git'],
    ['rede privada', 'git@maquina.tailnet.ts.net:dono/nome.git'],
    ['sem caminho', 'https://github.com'],
    ['vazio', ''],
  ])('%s nao serve de id: levaria um dado da maquina ao arquivo versionado', (_, url) => {
    expect(normalizeRemoteUrl(url)).toBeUndefined();
  });
});

describe('resolveRepositoryIdentity', () => {
  it('resources.repository tem prioridade sobre o remote', () => {
    const identity = resolveRepositoryIdentity({
      folder: 'pasta',
      declared: 'time/app',
      remote: 'git@github.com:time/app.git',
    });
    expect(identity.id).toBe('time/app');
  });

  it('o id declarado diferente do origin avisa: quem declara herda as liberacoes daquele id', () => {
    const identity = resolveRepositoryIdentity({ folder: 'pasta', declared: 'time/app', remote: `https://${ID}.git` });
    expect(identity.warnings.join()).toContain('time/app');
    expect(identity.warnings.join()).toContain(ID);
  });

  it('sem declarar, vale o remote, e a pasta nao importa', () => {
    const a = resolveRepositoryIdentity({ folder: 'pasta-a', remote: `git@github.com:dono/nome.git` });
    const b = resolveRepositoryIdentity({ folder: 'pasta-b', remote: `https://token@github.com/dono/nome` });
    expect([a.id, b.id]).toEqual([ID, ID]);
    expect(a.warnings).toEqual([]);
  });

  it('sem os dois, cai na pasta e avisa que a liberacao e o historico ficam presos a ela', () => {
    const identity = resolveRepositoryIdentity({ folder: 'pasta' });
    expect(identity.id).toBe('pasta');
    expect(identity.warnings.join()).toContain('resources.repository');
    expect(identity.warnings.join()).toContain('folder');
  });

  it('um remote que nao serve de id cai na pasta, e o aviso nao repete a URL', () => {
    const identity = resolveRepositoryIdentity({ folder: 'pasta', remote: 'https://token-secreto@servidor/dono/nome' });
    expect(identity.id).toBe('pasta');
    expect(identity.warnings.join()).not.toContain('token-secreto');
  });

  it('um id declarado que nao se entende e ignorado, com aviso, e nao entra com credencial', () => {
    const identity = resolveRepositoryIdentity({
      folder: 'pasta',
      declared: 'https://token-secreto@github.com/dono/nome',
      remote: `git@github.com:dono/nome.git`,
    });
    expect(identity.id).toBe(ID);
    expect(identity.warnings.join()).toContain('resources.repository');
    expect(identity.warnings.join()).not.toContain('token-secreto');
  });

  it('liberacao gravada com o nome da pasta deixa de valer, e o aviso diz como refazer', () => {
    const identity = resolveRepositoryIdentity({
      folder: 'pasta',
      remote: `git@github.com:dono/nome.git`,
      releasedTo: ['pasta', 'outra'],
    });
    expect(identity.id).toBe(ID);
    expect(identity.warnings.join()).toContain('"pasta"');
    expect(identity.warnings.join()).toContain('releasedTo');
    expect(identity.warnings.join()).toContain(ID);
  });

  it('liberacao que ja usa o id nao avisa', () => {
    const identity = resolveRepositoryIdentity({
      folder: 'pasta',
      remote: `git@github.com:dono/nome.git`,
      releasedTo: [ID],
    });
    expect(identity.warnings).toEqual([]);
  });
});
