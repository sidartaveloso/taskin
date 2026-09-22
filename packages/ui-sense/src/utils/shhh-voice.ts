/**
 * A voz do "shhh": o mascote pede silencio no lugar da pessoa.
 *
 * O caso de uso e concreto — o Taskin fica no celular, tela ligada, na frente
 * de quem programa; quando alguem fala alto na sala, e ele quem pede silencio.
 * Para isso o som precisa sair alto o bastante para atravessar a sala, e nao
 * apenas aparecer num balao na tela.
 *
 * Sao duas camadas, **em sequencia**, e a segunda nunca falta:
 *
 * - **a fala**, pelo `speechSynthesis` do proprio navegador, que diz apenas o
 *   NOME de quem esta sendo chamado — e por isso que da para dirigir o pedido a
 *   uma pessoa;
 * - **o chiado**, sintetizado com Web Audio: ruido branco passado por um filtro
 *   de banda alta, que e literalmente o que uma sibilante e. Nao ha arquivo de
 *   audio para baixar, licenciar ou versionar, funciona sem rede, e a duracao e
 *   o volume ficam sob controle.
 *
 * A ordem e o lapso entre as duas sao o que faz aquilo soar como fala. Antes as
 * duas camadas comecavam juntas e o `speechSynthesis` ainda tentava pronunciar
 * "Shhhhhhhhhhhh...", o que saia embolado e sem sentido — o chiado sintetizado
 * ja e quem sabe fazer esse som. Agora e "Bruno," — pausa — "shhhhh".
 */

/** Quanto tempo cada `h` da frase acrescenta ao chiado. */
const MS_POR_H = 90;
/** Piso e teto do chiado: audivel sem ser um alarme. */
const DURACAO_MINIMA_MS = 400;
const DURACAO_MAXIMA_MS = 3000;

/**
 * Lapso entre o fim do nome e o comeco do chiado. Curto o bastante para
 * continuar sendo a mesma frase, longo o bastante para nao soar como uma
 * interrupcao: e a virgula de "Bruno, shhhhh".
 */
const PAUSA_APOS_O_NOME_MS = 260;

/** Quanto se espera por uma fala travada antes de chiar assim mesmo. */
const ESPERA_MAXIMA_DA_FALA_MS = 4000;

export interface ShhhFala {
  texto: string;
  volume: number;
}

export interface ShhhPlan {
  /**
   * O nome a chamar, ou `null` quando nao ha nome ou o navegador nao tem
   * sintese de voz.
   */
  fala: ShhhFala | null;
  /** Lapso entre o fim da fala e o inicio do chiado. Zero quando nao ha fala. */
  pausaMs: number;
  /** O chiado, sempre presente: e ele que atravessa a sala. */
  chiado: { duracaoMs: number; volume: number };
}

export interface ShhhPedido {
  /**
   * Quem esta sendo chamado. E a unica coisa que a sintese de voz pronuncia —
   * "Bruno" vira "Bruno,", e o chiado vem depois.
   */
  name?: string;
  /** O que aparece no balao e de onde sai a duracao do chiado. */
  phrase: string;
  volume: number;
}

/**
 * Decide o que emitir. Puro de proposito: a regra de duracao e testavel sem
 * microfone, sem alto-falante e sem navegador.
 *
 * A duracao acompanha os `h` da frase — quem escreve `Shhhhhhhhhhhh...` esta
 * pedindo mais silencio que quem escreve `Shh`, e o chiado obedece.
 */
export function planejarShhh({
  name,
  phrase,
  volume,
  vozDisponivel,
}: ShhhPedido & { vozDisponivel: boolean }): ShhhPlan {
  const hh = (phrase.match(/h/gi) ?? []).length;
  const duracaoMs = Math.min(DURACAO_MAXIMA_MS, Math.max(DURACAO_MINIMA_MS, hh * MS_POR_H));

  // A virgula nao e enfeite: ela e o que faz a sintese de voz descer a entoacao
  // e deixar o espaco onde o chiado entra.
  const nome = name?.trim();
  const fala = vozDisponivel && nome ? { texto: `${nome},`, volume } : null;

  return {
    fala,
    pausaMs: fala ? PAUSA_APOS_O_NOME_MS : 0,
    chiado: { duracaoMs, volume },
  };
}

export interface ShhhVoiceDeps {
  /** Como abrir o contexto de audio. Injetado para o teste nao precisar de Web Audio. */
  criarContexto: () => AudioContext;
  /**
   * Como falar o nome. A promessa resolve quando a fala termina — e disso que
   * depende o chiado entrar na hora certa. `null` quando o navegador nao
   * oferece sintese.
   */
  falar: ((fala: ShhhFala) => Promise<void>) | null;
  /** Como esperar. Injetado para o teste nao gastar tempo de verdade. */
  aguardar?: (ms: number) => Promise<void>;
  /** Teto da espera pela fala. Ver a rede de seguranca em `shush`. */
  esperaMaximaDaFalaMs?: number;
}

export interface ShhhVoice {
  shush: (pedido: ShhhPedido) => Promise<void>;
}

/** Preenche um buffer com ruido branco — a materia-prima da sibilante. */
function encherComRuido(buffer: AudioBuffer): void {
  const amostras = buffer.getChannelData(0);
  for (let i = 0; i < amostras.length; i++) amostras[i] = Math.random() * 2 - 1;
}

/**
 * Monta a voz sobre as dependencias dadas. Em producao use
 * {@link criarVozDoShhhDoNavegador}; nos testes, passe dublês.
 */
export function createShhhVoice({
  criarContexto,
  falar,
  aguardar = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)),
  esperaMaximaDaFalaMs = ESPERA_MAXIMA_DA_FALA_MS,
}: ShhhVoiceDeps): ShhhVoice {
  return {
    async shush({ name, phrase, volume }) {
      const plano = planejarShhh({ name, phrase, volume, vozDisponivel: falar !== null });

      /*
       * O nome primeiro, e o chiado so depois da pausa. A ordem e o ponto: as
       * duas camadas juntas viram ruido, e o pedido perde o endereco.
       *
       * A corrida com `esperaMaximaDaFalaMs` e rede de seguranca: o `onend` do
       * `speechSynthesis` nao dispara em alguns navegadores quando a aba perde
       * o foco, e o chiado — que e a camada que atravessa a sala — nao pode
       * ficar refem disso.
       */
      if (plano.fala && falar) {
        await Promise.race([falar(plano.fala), aguardar(esperaMaximaDaFalaMs)]);
        await aguardar(plano.pausaMs);
      }

      // O audio do navegador recusa antes do primeiro gesto do usuario, e a
      // aba pode estar sem saida de som. Nada disso justifica derrubar a
      // reacao: o balao ja apareceu, e o chiado e um extra.
      try {
        const contexto = criarContexto();
        if (contexto.state === 'suspended') await contexto.resume();

        const segundos = plano.chiado.duracaoMs / 1000;
        const buffer = contexto.createBuffer(1, Math.floor(contexto.sampleRate * segundos), contexto.sampleRate);
        encherComRuido(buffer);

        const fonte = contexto.createBufferSource();
        fonte.buffer = buffer;

        // Banda alta: e o que separa um "shhh" de um chuvisco de televisao.
        const filtro = contexto.createBiquadFilter();
        filtro.type = 'bandpass';
        filtro.frequency.value = 6000;
        filtro.Q.value = 0.7;

        // Envelope curto nas pontas, para o chiado nao estalar ao comecar nem
        // ao terminar.
        const ganho = contexto.createGain();
        const agora = contexto.currentTime;
        ganho.gain.setValueAtTime(0, agora);
        ganho.gain.linearRampToValueAtTime(plano.chiado.volume, agora + 0.05);
        ganho.gain.linearRampToValueAtTime(plano.chiado.volume, agora + segundos - 0.08);
        ganho.gain.linearRampToValueAtTime(0, agora + segundos);

        fonte.connect(filtro);
        filtro.connect(ganho);
        ganho.connect(contexto.destination);
        fonte.start();
        fonte.stop(agora + segundos);
      } catch {
        // Sem audio: o nome ja foi chamado, e o balao continua na tela.
      }
    },
  };
}

/**
 * A voz ligada ao navegador de verdade. Devolve `null` quando nao ha Web Audio
 * — assim quem chama descobre pela ausencia, em vez de por uma chamada que nao
 * faz nada.
 */
export function criarVozDoShhhDoNavegador(): ShhhVoice | null {
  if (typeof window === 'undefined') return null;

  const Contexto =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Contexto) return null;

  let contexto: AudioContext | null = null;
  const sintese = typeof window.speechSynthesis !== 'undefined' ? window.speechSynthesis : null;

  return createShhhVoice({
    // Um contexto so, reaproveitado: abrir um por reacao esgota o limite do
    // navegador depois de algumas dezenas de pedidos de silencio.
    criarContexto: () => {
      contexto ??= new Contexto();
      return contexto;
    },
    falar: sintese
      ? ({ texto, volume }) =>
          new Promise<void>((resolve) => {
            // Cancela a fala anterior: dois pedidos de silencio sobrepostos
            // viram ruido, que e o oposto do que se quer.
            sintese.cancel();
            const fala = new SpeechSynthesisUtterance(texto);
            fala.volume = volume;
            fala.rate = 0.9;
            fala.onend = () => resolve();
            fala.onerror = () => resolve();
            sintese.speak(fala);
          })
      : null,
  });
}
