import { createHash } from 'node:crypto';
import { readPersonalSection, writePersonalSection } from './personal-layer';

/** O que a camada da pessoa guarda de um repositorio: o hash do comando que ela aprovou, nunca o texto. */
interface ApprovedCommand {
  readonly commandSha256: string;
}

export type CommandApproval = 'approved' | 'changed' | 'new';

export function commandHash(command: string): string {
  return createHash('sha256').update(command).digest('hex');
}

/**
 * Se a pessoa aprovou este comando neste repositorio. O comando vem do
 * `.taskin.json`, que e versionado, e roda com o segredo da conta no ambiente:
 * quem o altera decide o que recebe o token. Por isso a aprovacao e da pessoa,
 * e vale so para o texto que ela viu.
 */
export function commandApproval(personalResources: string, repository: string, command: string): CommandApproval {
  const approved = readPersonalSection<Partial<ApprovedCommand>>(personalResources, 'dispatch')[repository];
  if (typeof approved?.commandSha256 !== 'string') return 'new';
  return approved.commandSha256 === commandHash(command) ? 'approved' : 'changed';
}

/** Grava a aprovacao na camada da pessoa, preservando as contas e as outras secoes. */
export function approveCommand(personalResources: string, repository: string, command: string): void {
  const approvals = readPersonalSection<ApprovedCommand>(personalResources, 'dispatch');
  writePersonalSection(personalResources, 'dispatch', {
    ...approvals,
    [repository]: { commandSha256: commandHash(command) },
  });
}
