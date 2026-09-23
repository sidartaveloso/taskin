/**
 * Como a CLI conta o resultado de um commit de trabalho automatico (task-107).
 *
 * O `pause` e o `finish` em autopilot comitam tudo o que esta no working tree.
 * O `GitService.commitWork` recusa quando algo parece sensivel; aqui a recusa
 * vira uma mensagem que diz o arquivo, o motivo e como seguir — em vez do
 * silencio que o `try { git add -A } catch {}` de antes produzia.
 */

import type { WorkCommitResult } from '@opentask/taskin-git-utils';
import { colors, info, success, warning } from '../colors.js';

/**
 * Imprime o resultado e devolve `true` quando o commit aconteceu.
 */
export function reportWorkCommit(result: WorkCommitResult, committedMessage: string, commitMessage: string): boolean {
  switch (result.status) {
    case 'committed':
      success(committedMessage);
      return true;
    case 'nothing-to-commit':
      return false;
    case 'failed':
      warning('Auto-commit failed; nothing was committed.');
      return false;
    case 'blocked':
      warning('Auto-commit skipped: these changes look sensitive, so nothing was staged or committed.');
      for (const finding of result.findings) {
        const where = finding.line === undefined ? finding.path : `${finding.path}:${finding.line}`;
        console.log(colors.secondary(`  • ${where} — ${finding.reason}`));
      }
      info('Remove them or add them to .gitignore, then commit yourself:');
      console.log(colors.secondary(`  git add -A && git commit -m "${commitMessage}"`));
      return false;
  }
}
