/**
 * Acesso a webcam/microfone com a causa do erro dita por extenso.
 *
 * `navigator.mediaDevices` so existe em contexto seguro: `https://`, ou
 * `http://` em `localhost`/`127.0.0.1`. Fora disso o navegador nao define a
 * propriedade — e ler `.getUserMedia` dela estoura
 * `TypeError: Cannot read properties of undefined`, que nao diz nada sobre
 * permissao, camera ou origem. Abrir o Storybook pelo IP da rede
 * (`http://192.168.x.x:6107`) cai exatamente nesse caso.
 *
 * Por isso a checagem mora aqui, uma vez, em vez de repetida em cada
 * composable: o ponto e a mensagem, e mensagem duplicada envelhece torta.
 */

export const DEFAULT_VIDEO_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: 'user',
  },
  audio: false,
};

export const DEFAULT_AUDIO_CONSTRAINTS: MediaStreamConstraints = {
  audio: true,
};

/**
 * `lib.dom` declara `navigator.mediaDevices` como sempre presente, e e por isso
 * que o `TypeError` so aparece em tempo de execucao: para o compilador a
 * checagem e morta. O cast restaura a verdade em um lugar so.
 */
function getMediaDevices(): MediaDevices | undefined {
  return navigator.mediaDevices as MediaDevices | undefined;
}

/**
 * Explica por que `getUserMedia` esta fora de alcance, ou `null` se estiver
 * disponivel. Separada de `requestMediaStream` para que a UI possa avisar
 * antes de o usuario clicar em "ligar a camera".
 */
export function describeMediaUnavailability(): string | null {
  if (typeof navigator === 'undefined') {
    return 'Media capture is unavailable: there is no `navigator` in this environment (server-side render or Node).';
  }

  if (typeof getMediaDevices()?.getUserMedia === 'function') {
    return null;
  }

  const origin = typeof location === 'undefined' ? 'unknown origin' : location.origin;

  if (typeof isSecureContext !== 'undefined' && !isSecureContext) {
    return `Media capture is unavailable: ${origin} is not a secure context, so the browser does not expose \`navigator.mediaDevices\`. Open the page over https://, or over http:// on localhost or 127.0.0.1.`;
  }

  return `Media capture is unavailable: this browser does not expose \`navigator.mediaDevices.getUserMedia\` at ${origin}.`;
}

/**
 * `getUserMedia` com a checagem de contexto seguro na frente. Rejeita com uma
 * mensagem que nomeia a causa, em vez do `TypeError` opaco.
 */
export async function requestMediaStream(
  constraints: MediaStreamConstraints = DEFAULT_VIDEO_CONSTRAINTS,
): Promise<MediaStream> {
  const unavailable = describeMediaUnavailability();
  if (unavailable) {
    throw new Error(unavailable);
  }

  // `describeMediaUnavailability` acabou de garantir que existe.
  return (getMediaDevices() as MediaDevices).getUserMedia(constraints);
}
