import { describe, expect, it } from 'vitest';
import { addedLinesFromDiff, findSecretsInLine, sensitivePathReason } from './sensitive-changes';

describe('sensitivePathReason', () => {
  it.each(['.env', 'apps/api/.env', '.env.local', '.env.production'])('recusa o arquivo de ambiente %s', (path) => {
    expect(sensitivePathReason(path)).toBe('environment file');
  });

  it.each(['.env.example', '.env.sample', '.env.template', 'config/.env.dist'])(
    'aceita o modelo %s, que existe para ser versionado',
    (path) => {
      expect(sensitivePathReason(path)).toBeUndefined();
    },
  );

  it.each(['certs/server.pem', 'server.key', 'store.p12', 'android/release.keystore', 'AuthKey.p8'])(
    'recusa a chave ou certificado %s',
    (path) => {
      expect(sensitivePathReason(path)).toBe('private key or certificate store');
    },
  );

  it.each(['.ssh/id_rsa', 'id_ed25519'])('recusa a chave SSH %s', (path) => {
    expect(sensitivePathReason(path)).toBe('SSH private key');
  });

  it('aceita a chave SSH publica', () => {
    expect(sensitivePathReason('id_ed25519.pub')).toBeUndefined();
  });

  it.each(['.netrc', '.git-credentials', 'credentials.json', 'gcp/service-account-prod.json'])(
    'recusa o arquivo de credenciais %s',
    (path) => {
      expect(sensitivePathReason(path)).toBe('credentials file');
    },
  );

  it.each(['src/app.ts', 'README.md', 'TASKS/task-001-x.md', 'src/env.ts', 'docs/keys.md'])(
    'aceita o arquivo comum %s',
    (path) => {
      expect(sensitivePathReason(path)).toBeUndefined();
    },
  );
});

describe('findSecretsInLine', () => {
  it.each([
    ['DIRECTUS_TOKEN=Xk9fQ2mZ7pL4vB8nR1sT6wY3hJ5cD0aE', 'credential assignment'],
    ['  apiKey: "a1b2c3d4e5f6g7h8i9j0k1l2"', 'credential assignment'],
    ['const password = "S3nh4-Muito-L0nga-Mesmo";', 'credential assignment'],
    ['-----BEGIN OPENSSH PRIVATE KEY-----', 'private key'],
    ['aws_id = AKIAIOSFODNN7EXAMPLE', 'AWS access key'],
    ['token ghp_abcdefghijklmnopqrstuvwxyz0123456789', 'GitHub token'],
    ['glpat-abcdefghij0123456789', 'GitLab token'],
    ['xoxb-1234567890-abcdefghij', 'Slack token'],
    ['key = sk-ant-api03-abcdefghijklmnopqrstu', 'API secret key'],
    ['AIzaSyA1234567890abcdefghijklmnopqrstuv', 'Google API key'],
    [
      'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
      'JWT',
    ],
  ])('acusa %s', (line, reason) => {
    expect(findSecretsInLine(line)).toBe(reason);
  });

  it.each([
    'const token = options.token;',
    'const apiKey = process.env.API_KEY;',
    // biome-ignore lint/suspicious/noTemplateCurlyInString: a linha testada tem `${...}` literal.
    'webhookUrl: "${DISCORD_TASKIN_WEBHOOK_URL}"',
    'DIRECTUS_TOKEN=',
    'DIRECTUS_TOKEN=<seu-token-aqui>',
    'API_KEY=your-api-key-goes-here',
    'password: "changeme"',
    'const secretReason = sensitivePathReason(path);',
    'tokenizer.encodeSequence(inputBuffer)',
  ])('nao acusa %s', (line) => {
    expect(findSecretsInLine(line)).toBeUndefined();
  });
});

describe('addedLinesFromDiff', () => {
  it('devolve so as linhas adicionadas, com o numero no arquivo novo', () => {
    const diff = [
      'diff --git a/app.ts b/app.ts',
      'index 1111111..2222222 100644',
      '--- a/app.ts',
      '+++ b/app.ts',
      '@@ -3,0 +4,2 @@ export const x = 1;',
      '+const a = 1;',
      '+const b = 2;',
      '@@ -10 +12 @@',
      '-old',
      '+new',
    ].join('\n');

    expect(addedLinesFromDiff(diff)).toEqual([
      { line: 4, text: 'const a = 1;' },
      { line: 5, text: 'const b = 2;' },
      { line: 12, text: 'new' },
    ]);
  });
});
