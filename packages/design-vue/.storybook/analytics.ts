/**
 * Envio de eventos ao PostHog na galeria de componentes.
 *
 * Copia deliberada do arquivo equivalente em `packages/docs`: sao dois pacotes
 * sem dependencia entre si, e o `posthog-js` aqui e **devDependency** — a
 * galeria e publicada a partir do `.storybook/`, que nao entra no build do
 * pacote. Extrair isto para um pacote compartilhado faria o design-vue publicar
 * o posthog para todo consumidor do design system, o que ninguem pediu.
 *
 * Sem `VITE_POSTHOG_KEY`, `initAnalytics` nao faz nada: em desenvolvimento nao
 * ha o que medir, e o build nao deve falhar por falta de uma credencial que so
 * existe depois do site publicado. `track` sem inicializacao previa tambem nao
 * faz nada, em vez de lancar erro.
 *
 * O projeto PostHog e EU Cloud — `VITE_POSTHOG_HOST` precisa ser
 * `https://eu.i.posthog.com`. O padrao abaixo (US) so serve para quem nunca
 * configurar a variavel; sem ela definida certo, os eventos vao para a regiao
 * errada e o projeto EU nunca os recebe.
 *
 * `person_profiles` fica configuravel por `VITE_POSTHOG_PERSON_PROFILES` porque
 * o valor certo depende de decisao de produto, nao de algo fixo no codigo. O
 * padrao do codigo e `identified_only` — o proprio padrao do PostHog; a
 * implantacao define `always`, porque o site nunca chama `posthog.identify()`.
 *
 * Identificadores em ingles, ao contrario do original em portugues: e a
 * convencao deste repo para codigo (`parseTaskId`, `normalizeTaskId`), com os
 * comentarios em portugues.
 */
type PersonProfiles = 'always' | 'never' | 'identified_only';

/**
 * Distingue os dois sites publicados no mesmo Pages, que compartilham o projeto
 * PostHog: a landing em `/` e a galeria de componentes em `/components/`. Sem
 * isso os eventos dos dois chegam misturados e nao da para separar nos
 * dashboards.
 */
export type Surface = 'docs' | 'components';

type PostHog = typeof import('posthog-js').default;

let client: PostHog | null = null;

/**
 * O `import()` e dinamico de proposito.
 *
 * Medido: com import estatico o chunk do tema do site saiu de 139 KB para
 * 493 KB — o SDK entrava em toda visita, inclusive nos builds sem chave (dev,
 * PR, fork), onde ele nem inicializa. Sendo dinamico, so baixa quando ha
 * `VITE_POSTHOG_KEY`.
 *
 * Sem a chave no build o efeito e mais forte que carregamento tardio: o Vite
 * substitui `import.meta.env.VITE_POSTHOG_KEY` por `undefined`, o retorno
 * antecipado abaixo vira codigo morto e o `import()` some no tree-shaking. O
 * bundle publicado sem chave nao contem PostHog nenhum — nem esta funcao.
 *
 * Nao torna o SDK mais bloqueavel: o chunk sai com nome opaco
 * (`module.<hash>.js`, ~92 KB gzip) e e servido do proprio dominio, igual a um
 * import estatico. O que bloqueadores pegam sao as requisicoes para
 * `*.i.posthog.com`, e isso independe de como o script foi carregado.
 */
export async function initAnalytics(surface: Surface): Promise<void> {
  if (client || typeof window === 'undefined') return;

  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  if (!key) return;

  const personProfiles =
    (import.meta.env.VITE_POSTHOG_PERSON_PROFILES as PersonProfiles | undefined) ?? 'identified_only';

  const { default: posthog } = await import('posthog-js');

  posthog.init(key, {
    api_host: (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://us.i.posthog.com',
    // Trava o conjunto de comportamentos padrao (autocapture, pageview,
    // heatmap) nesta versao datada. Vale conferido no fonte do SDK: com esta
    // data ele resolve `capture_pageview` para `'history_change'`, que e o que
    // um site SPA precisa — pageview a cada troca de rota, sem hook manual.
    defaults: '2026-05-30',
    person_profiles: personProfiles,
  });

  posthog.register({ taskin_surface: surface });
  client = posthog;
}

export function track(event: string, data?: Record<string, unknown>): void {
  client?.capture(event, data);
}
