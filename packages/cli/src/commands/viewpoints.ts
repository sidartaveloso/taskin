/**
 * `taskin viewpoints` e `taskin channels` — o que e da pessoa, na camada dela:
 * o consentimento para pedidos de ponto de vista (as competencias, a carga
 * semanal e o horario) e os canais preferidos moram em
 * `~/.config/taskin/resources.json`, ao lado das contas; os pedidos, o tempo de
 * resposta e os avisos que esperam, no diretorio de estado. Nada disto vai ao
 * repositorio.
 */

import { homedir, userInfo } from 'node:os';
import { join } from 'node:path';
import {
  type ChannelName,
  createLocalChannels,
  createLocalPeople,
  expertise,
  type ILocalChannels,
  type ILocalPeople,
  instant,
  type PersonId,
  personId,
  taskinStateDir,
  type ViewpointConsent,
  type Weekday,
  type WorkingHours,
} from '@opentask/taskin-situation';
import type { Command } from 'commander';

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

/** Os arquivos da pessoa desta sessao: a camada dela e o diretorio de estado desta maquina. */
export function personalFiles(env: NodeJS.ProcessEnv = process.env, home = homedir()) {
  const state = taskinStateDir(env, home);
  return {
    personalResources: join(home, '.config', 'taskin', 'resources.json'),
    viewpoints: join(state, 'viewpoints.json'),
    notices: join(state, 'notices.json'),
  };
}

const clock = { now: () => instant(Date.now()) };
const me = (): PersonId => personId(userInfo().username);

function openPeople(): ILocalPeople {
  const files = personalFiles();
  return createLocalPeople(
    // Consentir, retirar e ver os proprios pedidos nao consulta o registro nem a presenca.
    { clock, people: { members: async () => [] }, presence: { present: async () => undefined } },
    { personalResources: files.personalResources, state: files.viewpoints },
  );
}

function openChannels(): ILocalChannels {
  const files = personalFiles();
  return createLocalChannels(
    { clock, presence: { present: async () => undefined }, sender: { send: async () => false } },
    { personalResources: files.personalResources, state: files.notices },
  );
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

/** `09:00-18:00` em minutos desde a meia-noite. */
export function parseHours(text: string): { fromMinute: number; toMinute: number } {
  const match = /^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/.exec(text);
  if (!match) throw new RangeError(`Hours must look like 09:00-18:00, got "${text}"`);
  const [, fh, fm, th, tm] = match.map(Number) as [number, number, number, number, number];
  const fromMinute = fh * 60 + fm;
  const toMinute = th * 60 + tm;
  if (fm > 59 || tm > 59 || fromMinute >= toMinute || toMinute > 24 * 60) {
    throw new RangeError(`Hours must be a range within the day, start before end, got "${text}"`);
  }
  return { fromMinute, toMinute };
}

/** `mon,tue,wed` nos dias da semana, domingo = 0. */
export function parseDays(text: string): Weekday[] {
  return text.split(',').map((day) => {
    const index = DAYS.indexOf(day.trim().toLowerCase() as (typeof DAYS)[number]);
    if (index < 0) throw new RangeError(`Unknown day "${day}". Use: ${DAYS.join(', ')}`);
    return index as Weekday;
  });
}

const clockText = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;

function hoursText(hours: WorkingHours): string {
  const sign = hours.utcOffsetMinutes < 0 ? '-' : '+';
  const offset = Math.abs(hours.utcOffsetMinutes);
  return `${hours.weekdays.map((d) => DAYS[d]).join(',')} ${clockText(hours.fromMinute)}-${clockText(hours.toMinute)} (UTC${sign}${clockText(offset)})`;
}

interface ConsentOptions {
  weeklyLoad: string;
  hours: string;
  days: string;
  utcOffset?: string;
}

async function giveConsent(list: string[], options: ConsentOptions): Promise<void> {
  if (list.length === 0) fail('Name at least one expertise. Usage: taskin viewpoints consent <expertise...>');
  const weeklyLoad = Number(options.weeklyLoad);
  if (!Number.isInteger(weeklyLoad) || weeklyLoad < 0)
    fail(`--weekly-load must be a whole number, got "${options.weeklyLoad}"`);
  const utcOffsetMinutes =
    options.utcOffset === undefined ? -new Date().getTimezoneOffset() : Number(options.utcOffset);
  if (!Number.isInteger(utcOffsetMinutes)) fail(`--utc-offset must be minutes, got "${options.utcOffset}"`);
  let consent: ViewpointConsent;
  try {
    consent = {
      expertise: list.map((e) => expertise(e)),
      weeklyLoad,
      hours: { weekdays: parseDays(options.days), ...parseHours(options.hours), utcOffsetMinutes },
    };
  } catch (failure) {
    fail((failure as Error).message);
  }
  await openPeople().consent(me(), consent);
  console.log(
    `You accept viewpoint requests on ${list.join(', ')}: up to ${weeklyLoad} a week, ${hoursText(consent.hours)}.`,
  );
}

async function withdraw(): Promise<void> {
  await openPeople().withdrawConsent(me());
  console.log('You no longer receive new viewpoint requests. Open ones stay open.');
}

async function viewpointStatus(options: { json?: boolean }): Promise<void> {
  const people = openPeople();
  const person = me();
  const consent = await people.consentOf(person);
  const requests = await people.requests(person);
  if (options.json) {
    process.stdout.write(`${JSON.stringify({ person, consent: consent ?? null, requests }, null, 2)}\n`);
    return;
  }
  console.log(
    consent === undefined
      ? 'No consent: nobody asks you for a viewpoint.'
      : `Consent: ${consent.expertise.join(', ')}; up to ${consent.weeklyLoad} a week; ${hoursText(consent.hours)}.`,
  );
  if (requests.length === 0) {
    console.log('No open requests.');
    return;
  }
  for (const r of requests) {
    console.log(
      `${r.id}  ${r.state}  ${r.repository} ${r.task}  ${r.expertise}  due ${new Date(r.dueAt).toISOString()}  ${r.question}`,
    );
  }
}

async function prefer(channels: string[]): Promise<void> {
  if (channels.length === 0) fail('Name at least one channel. Usage: taskin channels prefer <channel...>');
  await openChannels().prefer(me(), channels as ChannelName[]);
  console.log(`Notices reach you through ${channels.join(', then ')}.`);
}

async function channelStatus(options: { json?: boolean }): Promise<void> {
  const channels = openChannels();
  const person = me();
  const preferred = await channels.preferredBy(person);
  const pending = await channels.pending(person);
  if (options.json) {
    process.stdout.write(`${JSON.stringify({ person, preferred, pending }, null, 2)}\n`);
    return;
  }
  console.log(
    preferred.length === 0 ? 'No channel: notices cannot reach you.' : `Channels, in order: ${preferred.join(', ')}.`,
  );
  console.log(pending.length === 0 ? 'No notices waiting.' : `${pending.length} notice(s) waiting for you.`);
}

export function registerViewpointsCommand(program: Command): void {
  const viewpoints = program
    .command('viewpoints')
    .description('🙋 Consent to viewpoint requests, on your terms; kept in your own layer, never in the repository');

  viewpoints
    .command('consent <expertise...>')
    .description(
      'Accept viewpoint requests on these expertises, up to a weekly load and within your hours. Declaring again replaces',
    )
    .option('--weekly-load <n>', 'How many requests a week (the last seven days) you accept', '3')
    .option('--hours <from-to>', 'Your hours, local time', '09:00-18:00')
    .option('--days <days>', `Your days, comma separated: ${DAYS.join(',')}`, 'mon,tue,wed,thu,fri')
    .option('--utc-offset <minutes>', 'Your local time minus UTC, in minutes (default: this machine)')
    .action(async (list: string[], options: ConsentOptions) => {
      await giveConsent(list, options);
    });

  viewpoints
    .command('withdraw')
    .description('Stop receiving new viewpoint requests')
    .action(async () => {
      await withdraw();
    });

  viewpoints
    .command('status')
    .description('Your consent and the requests that reached you and are still open')
    .option('--json', 'Output as JSON')
    .action(async (options: { json?: boolean }) => {
      await viewpointStatus(options);
    });

  const channels = program
    .command('channels')
    .description('📣 The channels notices reach you through, in your order; kept in your own layer');

  channels
    .command('prefer <channel...>')
    .description('The channels, in the order you prefer (e.g. watch taskinboard). Declaring again replaces')
    .action(async (list: string[]) => {
      await prefer(list);
    });

  channels
    .command('status')
    .description('Your channels and how many notices wait for you')
    .option('--json', 'Output as JSON')
    .action(async (options: { json?: boolean }) => {
      await channelStatus(options);
    });
}
