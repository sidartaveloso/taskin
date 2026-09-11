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

/**
 * Uma camera, compartilhada por quem estiver olhando o mesmo `<video>`.
 *
 * Existe porque telas com mais de um landmarker — o `TaskinWithFullTracking`
 * roda face e pose ao mesmo tempo — travavam. Cada composable abria o proprio
 * `getUserMedia` e escrevia no mesmo elemento, e o segundo `srcObject`
 * desligava o primeiro stream sem para-lo: camera acesa, ninguem lendo.
 *
 * O travamento vinha de uma linha menor e mais cruel. Os dois esperavam o video
 * assim:
 *
 * ```ts
 * videoElement.onloadedmetadata = () => resolve();
 * ```
 *
 * `onloadedmetadata` e **propriedade**, nao lista: a segunda atribuicao apaga a
 * primeira. Quem chegou antes nunca recebia o callback, ficava preso no `await`
 * para sempre e jamais comecava a detectar — sem erro, sem log, so um mascote
 * parado. Qual dos dois travava dependia da ordem em que terminavam de carregar
 * o modelo, o que explica funcionar num dia e nao no outro.
 */
interface Attachment {
  stream: MediaStream;
  refs: number;
}

const attachments = new WeakMap<HTMLVideoElement, Attachment>();

/**
 * Liga a camera a um elemento de video, reaproveitando o stream se ele ja
 * estiver ligado.
 *
 * @param videoElement - O elemento que vai exibir e alimentar a deteccao
 * @param constraints - Usadas apenas quando a camera ainda nao foi aberta
 * @returns Uma funcao que solta esta referencia; a camera so e desligada quando
 *   a ultima soltar
 * @public
 */
export async function attachCamera(
  videoElement: HTMLVideoElement,
  constraints: MediaStreamConstraints = DEFAULT_VIDEO_CONSTRAINTS,
): Promise<() => void> {
  const existing = attachments.get(videoElement);

  if (existing) {
    existing.refs += 1;
  } else {
    const stream = await requestMediaStream(constraints);
    videoElement.srcObject = stream;
    attachments.set(videoElement, { stream, refs: 1 });
  }

  await waitForMetadata(videoElement);

  /*
   * `play()` rejeita com AbortError quando outra chamada o interrompe — o que
   * acontece justamente quando dois consumidores ligam quase juntos. Nao e
   * falha: o video esta tocando, so nao foi esta chamada que o iniciou.
   */
  try {
    await videoElement.play();
  } catch (error) {
    if (!(error instanceof DOMException) || error.name !== 'AbortError') {
      throw error;
    }
  }

  let released = false;

  return () => {
    if (released) return;
    released = true;

    const attachment = attachments.get(videoElement);
    if (!attachment) return;

    attachment.refs -= 1;
    if (attachment.refs > 0) return;

    for (const track of attachment.stream.getTracks()) {
      track.stop();
    }
    attachments.delete(videoElement);
    videoElement.srcObject = null;
  };
}

/**
 * Espera os metadados do video, ou volta na hora se eles ja chegaram.
 *
 * `addEventListener` e nao `onloadedmetadata`: o segundo se sobrescreve, e era
 * assim que o segundo consumidor prendia o primeiro para sempre.
 */
function waitForMetadata(videoElement: HTMLVideoElement): Promise<void> {
  if (videoElement.readyState >= HTMLMediaElement.HAVE_METADATA) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    videoElement.addEventListener('loadedmetadata', () => resolve(), { once: true });
  });
}
