/**
 * O que o taskin se recusa a comitar sozinho (task-107).
 *
 * Nao e um scanner de segredos completo e nao tenta ser: e a rede minima para
 * que um commit automatico nao publique, sem ninguem olhar, o tipo de arquivo
 * ou de linha que quase sempre e acidente. Os padroes privilegiam precisao:
 * um falso positivo aqui so faz o taskin devolver o commit para a pessoa, que
 * decide; um padrao barulhento ensinaria a desligar a automacao.
 *
 * Funcoes puras, sem git e sem disco, para serem testadas sozinhas.
 */

/**
 * Um arquivo que o commit automatico recusou, e por que.
 *
 * @public
 */
export interface SensitiveFinding {
  path: string;
  reason: string;
  /** Linha no arquivo novo, quando o motivo e o conteudo e nao o nome. */
  line?: number;
}

const TEMPLATE_SUFFIXES = ['.example', '.sample', '.template', '.dist', '.defaults'];

const PATH_RULES: { reason: string; test: (name: string) => boolean }[] = [
  {
    reason: 'environment file',
    test: (name) =>
      (name === '.env' || name.startsWith('.env.')) && !TEMPLATE_SUFFIXES.some((suffix) => name.endsWith(suffix)),
  },
  {
    reason: 'private key or certificate store',
    test: (name) => /\.(pem|key|p12|pfx|p8|jks|keystore)$/i.test(name),
  },
  {
    reason: 'SSH private key',
    test: (name) => /^id_(rsa|dsa|ecdsa|ed25519)$/.test(name),
  },
  {
    reason: 'credentials file',
    test: (name) =>
      name === '.netrc' ||
      name === '.git-credentials' ||
      name === '.pypirc' ||
      /^credentials.*\.json$/i.test(name) ||
      /^service-account.*\.json$/i.test(name),
  },
];

/**
 * Motivo para recusar um caminho pelo nome, ou `undefined` se o nome nao diz
 * nada.
 *
 * @public
 */
export function sensitivePathReason(path: string): string | undefined {
  const name = path.split('/').pop() ?? path;
  return PATH_RULES.find((rule) => rule.test(name))?.reason;
}

const TOKEN_RULES: { reason: string; pattern: RegExp }[] = [
  { reason: 'private key', pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { reason: 'AWS access key', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { reason: 'GitHub token', pattern: /\b(gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{22,})/ },
  { reason: 'GitLab token', pattern: /\bglpat-[A-Za-z0-9_-]{20,}/ },
  { reason: 'Slack token', pattern: /\bxox[abprs]-[A-Za-z0-9-]{10,}/ },
  { reason: 'API secret key', pattern: /\bsk-(ant-)?[A-Za-z0-9_-]{20,}/ },
  { reason: 'Google API key', pattern: /\bAIza[0-9A-Za-z_-]{35}/ },
  { reason: 'JWT', pattern: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
];

/*
 * `NOME_COM_TOKEN = valor`, em .env, YAML, JSON ou codigo. O nome tem de
 * terminar na palavra sensivel (`DIRECTUS_TOKEN`, `apiKey`, `client_secret`),
 * para nao pegar `tokenizer` ou `secretReason`.
 */
const CREDENTIAL_ASSIGNMENT =
  /(?:^|[^A-Za-z0-9])[A-Za-z0-9_.-]*(?:token|secret|passw(?:or)?d|api[_-]?key|access[_-]?key|private[_-]?key)["']?\s*[:=]\s*["'`]?([^\s"'`,;]+)/i;

const PLACEHOLDER = /example|changeme|your|xxx|placeholder|dummy|<|>|\$\{|\{\{/i;
const PROPERTY_ACCESS = /^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)+(\(.*)?$/;

function looksLikeSecretValue(value: string): boolean {
  if (value.length < 16) return false;
  if (PLACEHOLDER.test(value)) return false;
  if (PROPERTY_ACCESS.test(value)) return false;
  // Um segredo gerado mistura letras e digitos; um identificador raramente.
  return /[A-Za-z]/.test(value) && /[0-9]/.test(value);
}

/**
 * Motivo para recusar uma linha adicionada, ou `undefined` se ela parece
 * inofensiva.
 *
 * @public
 */
export function findSecretsInLine(line: string): string | undefined {
  const token = TOKEN_RULES.find((rule) => rule.pattern.test(line));
  if (token) return token.reason;

  const assignment = CREDENTIAL_ASSIGNMENT.exec(line);
  if (assignment?.[1] && looksLikeSecretValue(assignment[1])) {
    return 'credential assignment';
  }
  return undefined;
}

/**
 * As linhas adicionadas de um `git diff -U0`, com o numero que tem no arquivo
 * novo. So o que entra importa: um segredo que ja esta no historico nao fica
 * mais ou menos publico por causa deste commit.
 *
 * @public
 */
export function addedLinesFromDiff(diff: string): { line: number; text: string }[] {
  const added: { line: number; text: string }[] = [];
  let next = 0;
  for (const raw of diff.split('\n')) {
    const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(raw);
    if (hunk) {
      next = Number(hunk[1]);
      continue;
    }
    if (next === 0) continue;
    if (raw.startsWith('+') && !raw.startsWith('+++')) {
      added.push({ line: next, text: raw.slice(1) });
      next++;
    } else if (raw.startsWith(' ')) {
      next++;
    }
  }
  return added;
}
