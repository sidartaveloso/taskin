import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { fixTaskFile } from './task-validator.js';

/**
 * Um `--fix` que so remove nunca deveria conseguir gravar.
 *
 * A task-078 relata que `taskin lint --fix`, invocado no geohub para normalizar
 * **um** arquivo, mexeu em 201 e apagou 93 linhas de conteudo em dois deles —
 * titulo, `## Description` inteira, `## Tasks` e subitens. O diff nao tinha
 * nenhuma adicao que nao fosse `Priority`.
 *
 * O gatilho nao reproduz: contra as 361 tarefas reais do geohub, com o mesmo
 * binario 4.3.0, o comando nao altera nada. O arquivo que estava sendo
 * normalizado foi recuperado com `git checkout --`, e com ele o estado que
 * disparou o defeito.
 *
 * Entao, em vez de cacar um gatilho que sumiu, estes testes fecham a **classe**
 * de falha: a migracao de metadados pode reescrever o cabecalho, e nada mais. Se
 * o resultado perder uma secao ou encolher o corpo, o arquivo nao e gravado.
 */
describe('fixTaskFile nunca perde conteudo', () => {
  const corpo = `## Description
Uma descricao que precisa sobreviver.
Com duas linhas.

## Tasks
- [ ] Item que precisa sobreviver
- [ ] Outro item

## Notes
Observacao final.
`;

  it('migra o cabecalho de secao para linha, preservando o corpo inteiro', async () => {
    const arquivo = await escrever(`# 🧩 Task 003 — Formato antigo

## Status
pending

## Type
feat

## Assignee
Ana

${corpo}`);

    await fixTaskFile(arquivo, { metadataStyle: 'list' });

    const depois = await readFile(arquivo, 'utf-8');
    expect(depois).toContain('- Status: pending');
    expect(depois).toContain('Uma descricao que precisa sobreviver.');
    expect(depois).toContain('- [ ] Item que precisa sobreviver');
    expect(depois).toContain('Observacao final.');
    // As tres secoes do corpo continuam la.
    expect(depois.match(/^## /gm)).toHaveLength(3);
  });

  it('e idempotente: a segunda passada nao altera nada', async () => {
    const arquivo = await escrever(`# 🧩 Task 004 — Ja normalizada

- Status: pending
- Type: feat
- Assignee: Ana

${corpo}`);

    await fixTaskFile(arquivo, { metadataStyle: 'list' });
    const primeira = await readFile(arquivo, 'utf-8');
    await fixTaskFile(arquivo, { metadataStyle: 'list' });

    expect(await readFile(arquivo, 'utf-8')).toBe(primeira);
  });

  /*
   * O teste que fecha a classe: mesmo com o arquivo num estado estranho, o que
   * sai nao pode ter menos secoes do que entrou.
   */
  it('recusa gravar um resultado que perdeu secao do corpo', async () => {
    const arquivo = await escrever(`# 🧩 Task 005 — Estado estranho

## Status
pending
## Type
feat
## Assignee
Ana
${corpo}`);
    const antes = await readFile(arquivo, 'utf-8');
    const secoesAntes = (antes.match(/^## (?!Status|Type|Assignee)/gm) ?? []).length;

    await fixTaskFile(arquivo, { metadataStyle: 'list' });

    const depois = await readFile(arquivo, 'utf-8');
    expect((depois.match(/^## /gm) ?? []).length).toBeGreaterThanOrEqual(secoesAntes);
  });
});

/** Escreve um arquivo de tarefa temporario e devolve o caminho. */
async function escrever(conteudo: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'taskin-fix-'));
  const alvo = join(dir, 'task-000-fixture.md');
  await writeFile(alvo, conteudo, 'utf-8');
  return alvo;
}

/**
 * A rede de seguranca, provada de verdade.
 *
 * Os testes acima passam porque a implementacao atual preserva o conteudo —
 * eles guardam contra regressao. Este prova que a **recusa** existe: com a
 * conversao sabotada para devolver so o cabecalho, o arquivo tem que ficar como
 * estava, em vez de ser gravado mutilado.
 */
describe('a recusa de gravar', () => {
  it('deixa o arquivo intacto quando o resultado perderia o corpo', async () => {
    const original = `# 🧩 Task 006 — Nao pode sumir

## Status
pending

## Description
Conteudo que nao pode desaparecer.

## Tasks
- [ ] Item
`;
    const arquivo = await escrever(original);

    const modulo = await import('./metadata-style/index.js');
    const espiao = vi
      .spyOn(modulo, 'convertMetadataStyle')
      .mockReturnValue('# 🧩 Task 006 — Nao pode sumir\n\n- Status: pending\n');

    try {
      const mexeu = await fixTaskFile(arquivo, { metadataStyle: 'list' });

      // A sabotagem precisa ter sido de fato exercida: sem isto, o teste
      // passaria por nao ter havido mudanca alguma, e nao pela recusa.
      expect(espiao).toHaveBeenCalled();
      expect(mexeu).toBe(false);
      expect(await readFile(arquivo, 'utf-8')).toBe(original);
    } finally {
      espiao.mockRestore();
    }
  });
});
