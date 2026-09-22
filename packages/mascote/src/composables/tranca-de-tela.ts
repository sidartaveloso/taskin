import { onUnmounted, type Ref, readonly, ref } from 'vue';

/**
 * O que a Screen Wake Lock API devolve, reduzido ao que aqui se usa. O tipo do
 * DOM so existe em ambientes que ja tem a API, e o objetivo aqui e justamente
 * lidar com os que nao tem.
 */
export interface Sentinela {
  released: boolean;
  release: () => Promise<void>;
}

export type SolicitarTranca = () => Promise<Sentinela>;

export interface TrancaDeTela {
  /** Se a tela esta, neste momento, impedida de apagar. */
  ativa: Readonly<Ref<boolean>>;
  /** Por que nao deu, quando nao deu. Vazio enquanto nada falhou. */
  motivo: Readonly<Ref<string>>;
  manter: () => Promise<void>;
  soltar: () => Promise<void>;
}

/**
 * Impede a tela de apagar enquanto o mascote esta trabalhando.
 *
 * Um celular apagado nao olha para ninguem, entao isto nao e conforto: e o que
 * faz o aparelho apoiado abaixo do monitor continuar existindo depois de um
 * minuto parado.
 *
 * Duas regras do navegador moldam o desenho. A trava **so e concedida apos
 * interacao do usuario e em contexto seguro** — dai a tela de entrada com um
 * botao. E ela **e liberada sozinha quando a aba deixa de estar visivel**, o
 * que acontece a cada troca de aplicativo; por isso quem usa precisa
 * reconquista-la no `visibilitychange`, e nao apenas uma vez no inicio.
 *
 * O `solicitar` entra por parametro para o teste nao precisar de um navegador
 * que tenha a API — e `null` diz, sem ambiguidade, que este aparelho nao tem.
 */
export function criarTrancaDeTela(solicitar: SolicitarTranca | null): TrancaDeTela {
  const ativa = ref(false);
  const motivo = ref('');
  let sentinela: Sentinela | null = null;

  const manter = async () => {
    if (!solicitar) {
      motivo.value = 'Este navegador nao sabe manter a tela acesa.';
      return;
    }
    if (sentinela && !sentinela.released) return;

    try {
      sentinela = await solicitar();
      ativa.value = true;
      motivo.value = '';
    } catch (erro) {
      // Negada e um estado normal: bateria baixa, economia de energia, ou a
      // pagina ainda sem interacao. Quem chama segue funcionando sem a trava.
      sentinela = null;
      ativa.value = false;
      motivo.value = erro instanceof Error ? erro.message : String(erro);
    }
  };

  const soltar = async () => {
    ativa.value = false;
    if (!sentinela) return;
    const atual = sentinela;
    sentinela = null;
    try {
      await atual.release();
    } catch {
      // Soltar e melhor-esforco: se ja foi liberada, nao ha o que fazer.
    }
  };

  return { ativa: readonly(ativa), motivo: readonly(motivo), manter, soltar };
}

/** A porta do navegador de verdade, ou `null` quando a API nao existe aqui. */
export function solicitarTrancaDoNavegador(): SolicitarTranca | null {
  if (typeof navigator === 'undefined') return null;
  const gerenciador = (navigator as Navigator & { wakeLock?: { request: (tipo: 'screen') => Promise<Sentinela> } })
    .wakeLock;
  if (!gerenciador) return null;
  return () => gerenciador.request('screen');
}

/**
 * A tranca ligada ao ciclo de vida do componente, reconquistada sempre que a
 * aba volta a ficar visivel — que e a parte que o navegador nao faz sozinho.
 */
export function useTrancaDeTela(solicitar: SolicitarTranca | null = solicitarTrancaDoNavegador()): TrancaDeTela {
  const tranca = criarTrancaDeTela(solicitar);

  const aoVoltar = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') void tranca.manter();
  };

  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', aoVoltar);

  onUnmounted(() => {
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', aoVoltar);
    void tranca.soltar();
  });

  return tranca;
}
