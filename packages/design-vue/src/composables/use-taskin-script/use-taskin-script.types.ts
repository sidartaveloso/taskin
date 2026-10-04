import type { Ref } from 'vue';
import type { TaskinAction } from '../../components/organisms/taskin/Taskin.actions';
import type { TaskinMood } from '../../components/organisms/taskin/Taskin.types';

/**
 * Um passo do roteiro. Tudo e opcional: um passo pode so trocar o humor, so
 * dizer algo, so fazer um gesto, ou os tres de uma vez.
 */
export interface TaskinScriptStep {
  /** O humor que o passo deixa. Fica ate outro passo trocar. */
  mood?: TaskinMood;
  /** A acao de uma vez, tocada pelo `play()` do `Taskin`. O passo espera o fim dela. */
  action?: TaskinAction;
  /** O que o mascote diz: vai para `speechText`, com `speaking` ligado, enquanto o passo durar. */
  say?: string;
  /**
   * Quanto o passo segura depois da acao, em ms. Sem isto, a pausa vem da
   * frase (`stepHold`): quem le precisa de tempo, e a frase diz quanto.
   */
  holdMs?: number;
}

/** O que o roteiro precisa do `Taskin`: so o `play` que ele expoe. */
export interface TaskinPlayer {
  play(action: TaskinAction): Promise<boolean>;
}

export interface UseTaskinScriptOptions {
  /** O humor de partida, e o humor a que `reset()` volta. Padrao: `neutral`. */
  initialMood?: TaskinMood;
}

export interface TaskinScript {
  /** As props reativas para ligar no `<Taskin>`: `:mood`, `:speech-text`, `:speaking`. */
  mood: Ref<TaskinMood>;
  speechText: Ref<string | undefined>;
  speaking: Ref<boolean>;
  /** `true` enquanto um roteiro toca. */
  running: Ref<boolean>;
  /**
   * Toca os passos em ordem. Resolve `true` no fim; `false` se `stop()` ou
   * outro `run()` o interrompeu. O que interrompe limpa a fala.
   */
  run(steps: TaskinScriptStep[]): Promise<boolean>;
  /** Interrompe o roteiro em curso e limpa a fala. O humor fica onde estava. */
  stop(): void;
}
