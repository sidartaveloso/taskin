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
  const LOCAL = '/casa/projetos/pasta';
  const base = { folder: 'pasta', location: LOCAL };

  it('o id do historico: resources.repository, depois o remote, depois a pasta', () => {
    const remote = 'git@github.com:dono/nome.git';
    expect(resolveRepositoryIdentity({ ...base, declared: 'time/app', remote }).id).toBe('time/app');
    expect(resolveRepositoryIdentity({ ...base, remote }).id).toBe(ID);
    expect(resolveRepositoryIdentity(base).id).toBe('pasta');
  });

  it('o id de confianca nunca vem do arquivo versionado: declarar o id de outro repositorio nao muda nada', () => {
    const hostil = resolveRepositoryIdentity({ ...base, declared: ID, remote: 'git@github.com:atacante/isca.git' });
    expect(hostil.id).toBe(ID);
    expect(hostil.trustId).toBe('github.com/atacante/isca');
  });

  it('sem origin, o id declarado tambem nao da confianca: vale o caminho da pasta', () => {
    const baixado = resolveRepositoryIdentity({ ...base, declared: ID });
    expect(baixado.id).toBe(ID);
    expect(baixado.trustId).toBe(`path:${LOCAL}`);
  });

  it('pastas de mesmo nome, sem origin, nao dividem confianca', () => {
    const a = resolveRepositoryIdentity({ folder: 'app-loja', location: '/a/app-loja' });
    const b = resolveRepositoryIdentity({ folder: 'app-loja', location: '/b/app-loja' });
    expect(a.id).toBe(b.id);
    expect(a.trustId).not.toBe(b.trustId);
  });

  it('com origin publico, os dois ids coincidem, e a pasta nao importa', () => {
    const a = resolveRepositoryIdentity({
      folder: 'pasta-a',
      location: '/a/pasta-a',
      remote: 'git@github.com:dono/nome.git',
    });
    const b = resolveRepositoryIdentity({
      folder: 'pasta-b',
      location: '/b/pasta-b',
      remote: 'https://token@github.com/dono/nome',
    });
    expect([a.id, b.id, a.trustId, b.trustId]).toEqual([ID, ID, ID, ID]);
    expect(a.warnings).toEqual([]);
  });

  it('o id declarado diferente do origin nao avisa: so rotula o historico', () => {
    const identity = resolveRepositoryIdentity({
      ...base,
      declared: 'time/app',
      remote: 'git@github.com:dono/nome.git',
    });
    expect(identity.warnings).toEqual([]);
  });

  it('um remote privado nao vai ao historico, mas serve de confianca, sem credenciais', () => {
    const identity = resolveRepositoryIdentity({
      ...base,
      remote: 'https://usuario:token-secreto@maquina-de-casa/dono/nome.git',
    });
    expect(identity.id).toBe('pasta');
    expect(identity.trustId).toBe('maquina-de-casa/dono/nome');
    expect(JSON.stringify(identity)).not.toContain('token-secreto');
    expect(JSON.stringify(identity)).not.toContain('usuario');
  });

  it('um remote que e caminho local nao serve de confianca: vale o caminho da pasta', () => {
    expect(resolveRepositoryIdentity({ ...base, remote: '/srv/git/nome.git' }).trustId).toBe(`path:${LOCAL}`);
  });

  it('sem id publico, avisa que o historico fica preso a pasta', () => {
    const identity = resolveRepositoryIdentity(base);
    expect(identity.warnings.join()).toContain('resources.repository');
    expect(identity.warnings.join()).toContain('folder');
  });

  it('um remote privado avisa sem repetir a URL', () => {
    const identity = resolveRepositoryIdentity({ ...base, remote: 'https://token-secreto@servidor/dono/nome' });
    expect(identity.warnings.join()).not.toContain('token-secreto');
  });

  it('um id declarado que nao se entende e ignorado, com aviso, e nao entra com credencial', () => {
    const identity = resolveRepositoryIdentity({
      ...base,
      declared: 'https://token-secreto@github.com/dono/nome',
      remote: 'git@github.com:dono/nome.git',
    });
    expect(identity.id).toBe(ID);
    expect(identity.warnings.join()).toContain('resources.repository');
    expect(identity.warnings.join()).not.toContain('token-secreto');
  });

  it('liberacao gravada com o nome da pasta deixa de valer, e o aviso diz o que trocar', () => {
    const identity = resolveRepositoryIdentity({
      ...base,
      remote: 'git@github.com:dono/nome.git',
      releasedTo: ['pasta', 'outra'],
    });
    expect(identity.warnings.join()).toContain('"pasta"');
    expect(identity.warnings.join()).toContain('releasedTo');
    expect(identity.warnings.join()).toContain(ID);
  });

  it('liberacao gravada com o id declarado tambem deixa de valer, e o aviso diz o que trocar', () => {
    const identity = resolveRepositoryIdentity({
      ...base,
      declared: 'time/app',
      remote: 'git@github.com:dono/nome.git',
      releasedTo: ['time/app'],
    });
    expect(identity.warnings.join()).toContain('"time/app"');
    expect(identity.warnings.join()).toContain(ID);
  });

  it('liberacao que ja usa o id de confianca nao avisa', () => {
    const identity = resolveRepositoryIdentity({ ...base, remote: 'git@github.com:dono/nome.git', releasedTo: [ID] });
    expect(identity.warnings).toEqual([]);
  });
});
