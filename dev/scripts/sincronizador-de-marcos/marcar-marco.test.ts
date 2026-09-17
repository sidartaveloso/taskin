import { describe, expect, it, vi } from 'vitest';
import { marcarMarco } from './marcar-marco';
import type { ExecutarComando } from './marcar-marco.types';

const TAG = '@opentask/taskin-task-manager@3.2.0';
const SHA = 'bf5aac3';

/** Erro no formato que o `execFile` promisificado rejeita: a mensagem util esta no `stderr`. */
const falhaCom = (stderr: string) => Object.assign(new Error('Command failed'), { stderr });

/** Executor que falha nos comandos cujo argumento casa com um dos padroes dados, e passa no resto. */
const execQueFalhaEm = (falhas: Record<string, string>): ExecutarComando =>
  vi.fn(async (comando: string, argumentos: readonly string[]) => {
    const chave = `${comando} ${argumentos[0]}`;
    const stderr = falhas[chave];
    if (stderr) throw falhaCom(stderr);
    return { stdout: '' };
  });

const comandosDe = (exec: ExecutarComando) =>
  (exec as unknown as { mock: { calls: [string, string[]][] } }).mock.calls.map(
    ([comando, argumentos]) => `${comando} ${argumentos[0]}`,
  );

describe('marcarMarco', () => {
  it('cria a tag, empurra e abre o Release quando nada existe ainda', async () => {
    const exec = execQueFalhaEm({});

    const resultado = await marcarMarco(exec, { tag: TAG, sha: SHA });

    expect(resultado).toEqual({ tag: TAG, tagLocal: 'feito', tagNoRemoto: 'feito', release: 'feito' });
    expect(comandosDe(exec)).toEqual(['git tag', 'git push', 'gh release']);
  });

  it('empurra a tag mesmo quando ela ja existe localmente — o defeito do release de 17/09', async () => {
    // `changeset publish` criou a tag na copia do runner e nao empurrou. O passo
    // anterior tratava esse erro como "ja esta no remoto" e pulava o push junto,
    // e entao o `gh release create` recusava por a tag so existir localmente.
    const exec = execQueFalhaEm({ 'git tag': `fatal: tag '${TAG}' already exists` });

    const resultado = await marcarMarco(exec, { tag: TAG, sha: SHA });

    expect(comandosDe(exec)).toContain('git push');
    expect(resultado).toEqual({ tag: TAG, tagLocal: 'ja-existia', tagNoRemoto: 'feito', release: 'feito' });
  });

  it('tolera a tag ja estar no remoto e segue para o Release', async () => {
    const exec = execQueFalhaEm({ 'git push': `! [rejected] ${TAG} -> ${TAG} (already exists)` });

    const resultado = await marcarMarco(exec, { tag: TAG, sha: SHA });

    expect(resultado.tagNoRemoto).toBe('ja-existia');
    expect(comandosDe(exec)).toContain('gh release');
  });

  it('tolera o Release ja existir', async () => {
    const exec = execQueFalhaEm({ 'gh release': 'a release with the same tag name already exists' });

    const resultado = await marcarMarco(exec, { tag: TAG, sha: SHA });

    expect(resultado.release).toBe('ja-existia');
  });

  it('nao engole falha que nao seja "ja existe" — inclusive a tag so local vista pelo gh', async () => {
    const exec = execQueFalhaEm({
      'gh release': `tag ${TAG} exists locally but has not been pushed to sidartaveloso/taskin`,
    });

    // O erro precisa subir intacto: e o `stderr` que diz o que aconteceu.
    await expect(marcarMarco(exec, { tag: TAG, sha: SHA })).rejects.toMatchObject({
      stderr: expect.stringContaining('exists locally but has not been pushed'),
    });
  });

  it('nao confunde invocacao malformada do git com trabalho ja feito', async () => {
    // A tolerancia anterior tambem casava `tag shorthand`, que e erro de uso e
    // nunca significa que a tag existe.
    const exec = execQueFalhaEm({ 'git tag': 'fatal: tag shorthand without <tag>' });

    await expect(marcarMarco(exec, { tag: TAG, sha: SHA })).rejects.toMatchObject({
      stderr: expect.stringContaining('tag shorthand'),
    });
  });
});
