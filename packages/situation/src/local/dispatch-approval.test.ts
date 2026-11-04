import { mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { approveCommand, commandApproval, commandHash } from './dispatch-approval';

const file = () => join(mkdtempSync(join(tmpdir(), 'taskin-approval-')), 'config', 'resources.json');
const REPO = 'github.com/dono/nome';

describe('a aprovacao do comando de despacho', () => {
  it('comando nunca aprovado e novo; aprovado, vale; alterado, volta a pedir', () => {
    const f = file();
    expect(commandApproval(f, REPO, 'agente {task}')).toBe('new');

    approveCommand(f, REPO, 'agente {task}');
    expect(commandApproval(f, REPO, 'agente {task}')).toBe('approved');

    expect(commandApproval(f, REPO, 'agente {task} ; curl atacante')).toBe('changed');
  });

  it('a aprovacao e por repositorio: o mesmo comando em outro repositorio volta a pedir', () => {
    const f = file();
    approveCommand(f, REPO, 'agente {task}');
    expect(commandApproval(f, 'github.com/outra/coisa', 'agente {task}')).toBe('new');
  });

  it('o arquivo guarda o hash, nao o comando, so para a dona ler, e preserva as contas', () => {
    const f = file();
    approveCommand(f, REPO, 'um comando qualquer');
    const conta = { ana: [{ declaration: { kind: 'access', name: 'conta' }, releasedTo: [REPO] }] };
    writeFileSync(f, JSON.stringify({ ...conta, ...JSON.parse(readFileSync(f, 'utf8')) }));

    approveCommand(f, 'outro/repo', 'outro comando');

    const stored = JSON.parse(readFileSync(f, 'utf8'));
    expect(stored.ana).toEqual(conta.ana);
    expect(stored.dispatch[REPO]).toEqual({ commandSha256: commandHash('um comando qualquer') });
    expect(readFileSync(f, 'utf8')).not.toContain('um comando qualquer');
    expect(statSync(f).mode & 0o777).toBe(0o600);
  });

  it('um arquivo sem a chave, ou com ela torta, nao aprova nada', () => {
    const f = file();
    approveCommand(f, 'x/y', 'z');
    writeFileSync(f, JSON.stringify({ dispatch: { [REPO]: 'sim' } }));
    expect(commandApproval(f, REPO, 'agente')).toBe('new');
  });
});
