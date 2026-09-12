/**
 * Custom help display for the CLI.
 *
 * A lista de comandos sai do proprio `program` do commander, e nao de um array
 * escrito a mao. O array anterior tinha divergido: mostrava 10 dos 14 comandos
 * registrados, escondendo `review`, `stats`, `export` e `notify` de quem le a
 * ajuda — funcionalidade pronta que ninguem descobria.
 *
 * O que continua a mao sao os **exemplos**, porque ninguem os deriva: eles
 * dizem o que vale a pena fazer, nao o que e possivel. Ficam presos ao nome do
 * comando em {@link EXEMPLOS}, entao um comando sem exemplo aparece do mesmo
 * jeito, so sem a secao — nunca some da lista.
 */

import type { Command } from 'commander';
import { colors, icons, printHeader } from './colors.js';

/**
 * Exemplos por comando, indexados pelo nome registrado.
 *
 * Ausencia aqui nao esconde o comando: ele aparece sem a secao de exemplos. Era
 * esse acoplamento — lista e exemplos no mesmo array — que fazia esquecer um
 * comando inteiro.
 */
const EXEMPLOS: Readonly<Record<string, readonly string[]>> = {
  init: ['taskin init', 'taskin setup'],
  list: ['taskin list', 'taskin list pending', 'taskin list --status in-progress', 'taskin list --type feat'],
  new: [
    'taskin new -t feat -T "Add login" -d "Implement user authentication"',
    'taskin new --type fix --title "Fix bug" --user "John"',
    'taskin create -t docs -T "Update README"',
  ],
  start: ['taskin start 001', 'taskin start task-001', 'taskin start 001 --force'],
  pause: ['taskin pause 001', 'taskin pause 001 -m "saving progress"'],
  review: ['taskin review 001', 'taskin review 001 --dry-run'],
  finish: ['taskin finish 001', 'taskin done task-001'],
  stats: ['taskin stats', 'taskin stats --team', 'taskin stats --period month'],
  config: ['taskin config', 'taskin config --level assisted', 'taskin config --show'],
  export: ['taskin export', 'taskin export --format json'],
  lint: ['taskin lint', 'taskin lint --fix', 'taskin lint --fix --metadata-style=list'],
  dashboard: ['taskin dashboard', 'taskin dashboard --port 3000', 'taskin dashboard --filter-open'],
  'mcp-server': ['taskin mcp-server', 'taskin mcp'],
  notify: ['taskin notify --event task:done --task 001'],
};

const ICONE_PADRAO = '•';

/**
 * O icone sai da propria descricao do comando, que ja comeca com um
 * (`🔍 Validate task markdown files`). Mante-lo tambem num mapa a parte
 * imprimia os dois — `🎯 taskin init` seguido de `🎯 Initialize Taskin` — e
 * era mais uma copia a mao para divergir.
 */
function separarIcone(descricao: string): { icone: string; texto: string } {
  const match = descricao.match(/^(\p{Extended_Pictographic}\uFE0F?)\s+(.*)$/su);
  return match?.[1] && match[2] !== undefined
    ? { icone: match[1], texto: match[2] }
    : { icone: ICONE_PADRAO, texto: descricao };
}

/**
 * `help` fica de fora da lista: ele existe para imprimir esta propria tela, e
 * anuncia-lo aqui seria so ruido. Todo o resto entra, venha de onde vier.
 */
const OCULTOS: readonly string[] = ['help'];

/** `taskin list [filter]`, montado a partir do que o comando declarou. */
function assinatura(cmd: Command): string {
  const argumentos = cmd.usage().replace('[options]', '').trim();
  const nome = colors.highlight(`taskin ${cmd.name()}`);
  return argumentos ? nome + colors.normal(` ${argumentos}`) : nome;
}

/** A segunda linha: aliases e um resumo das opcoes, quando houver. */
function detalhes(cmd: Command): string | undefined {
  const partes: string[] = [];

  const aliases = cmd.aliases();
  if (aliases.length > 0) {
    partes.push(`Alias: ${aliases.join(', ')}`);
  }

  const flags = cmd.options.map((opcao) => opcao.flags.split(',')[0]?.trim()).filter(Boolean);
  if (flags.length > 0) {
    partes.push(`Options: ${flags.join(', ')}`);
  }

  return partes.length > 0 ? partes.join(' · ') : undefined;
}

export function showCustomHelp(program: Command): string {
  printHeader('Taskin - Task Management System', icons.rocket);

  console.log(colors.info('📋 AVAILABLE COMMANDS'));
  console.log(colors.highlight('═'.repeat(60)));
  console.log();

  const comandos = program.commands.filter((cmd) => !OCULTOS.includes(cmd.name()));

  comandos.forEach((cmd, index) => {
    const exemplos = EXEMPLOS[cmd.name()] ?? [];
    const { icone, texto } = separarIcone(cmd.description());

    console.log(colors.warning(`${icone} ${assinatura(cmd)}`));

    const linhaDeDetalhes = detalhes(cmd);
    if (linhaDeDetalhes) {
      console.log(colors.normal(`   ${colors.secondary(linhaDeDetalhes)}`));
    }

    console.log(colors.info(`   ${texto}`));

    if (exemplos.length > 0) {
      console.log();
      console.log(colors.normal(`   ${colors.info('📝 Examples:')}`));
      for (const exemplo of exemplos) {
        console.log(colors.secondary(`      ${exemplo}`));
      }
    }

    if (index < comandos.length - 1) {
      console.log();
      console.log(colors.normal(`   ${colors.secondary('─'.repeat(50))}`));
      console.log();
    }
  });

  console.log();
  console.log(colors.highlight('═'.repeat(60)));
  console.log();

  console.log(colors.info('💡 QUICK TIPS'));
  console.log(
    colors.normal(`${colors.warning('•')} Use short IDs: ${colors.highlight('001')}, ${colors.highlight('task-001')}`),
  );
  console.log(
    colors.normal(
      `${colors.warning('•')} Configure automation with ${colors.highlight('taskin config --level <manual|assisted|autopilot>')}`,
    ),
  );
  console.log(
    colors.normal(`${colors.warning('•')} All commands support ${colors.highlight('--help')} for more options`),
  );
  console.log(
    colors.normal(
      `${colors.warning('•')} Use aliases for faster commands: ${colors.highlight('ls')}, ${colors.highlight('begin')}, ${colors.highlight('stop')}, ${colors.highlight('done')}`,
    ),
  );
  console.log();

  console.log(colors.info('🔧 FOR MORE HELP'));
  console.log(colors.secondary('taskin ') + colors.highlight('<command>') + colors.secondary(' --help'));
  console.log();

  return '';
}
