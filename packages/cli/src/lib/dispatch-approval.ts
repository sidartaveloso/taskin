import { createInterface } from 'node:readline/promises';

export type ApprovalAnswer = 'approved' | 'declined' | 'no-terminal';

/** Pergunta so num terminal: sem pessoa do outro lado, nunca aprova. */
export async function askApproval(
  interactive: boolean,
  ask: (question: string) => Promise<string>,
): Promise<ApprovalAnswer> {
  if (!interactive) return 'no-terminal';
  const answer = await ask('Allow this command to run with the secret of your accounts in its environment? [y/N] ');
  return /^(y|yes)$/i.test(answer.trim()) ? 'approved' : 'declined';
}

export async function askInTerminal(question: string): Promise<string> {
  const terminal = createInterface({ input: process.stdin, output: process.stderr });
  try {
    return await terminal.question(question);
  } finally {
    terminal.close();
  }
}
