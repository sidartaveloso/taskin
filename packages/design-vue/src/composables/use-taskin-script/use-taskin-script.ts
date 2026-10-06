/**
 * O roteiro do mascote: humor, acao e fala encadeados, para ele conversar.
 *
 * O `Taskin` e um componente controlado: `mood`, `speechText` e `speaking` sao
 * props, e ele nao pode trocar o proprio humor. Quem conversa com a pessoa pelo
 * mascote (o chat, o app do mascote) precisava encadear os passos por fora,
 * com `setTimeout` solto e sem saber quando cada acao acaba. Este composable
 * faz isso uma vez so, do lado do Vue: devolve as props reativas para ligar no
 * `<Taskin>` e um `run(steps)` que toca os passos em ordem, esperando o fim de
 * cada acao pelo `play()` e dimensionando a pausa pela frase.
 */

import { type Ref, ref } from 'vue';
import type { TaskinCharacter } from '../../components/organisms/taskin/character/character.types';
import { actionDuration } from '../../components/organisms/taskin/Taskin';
import type { TaskinMood } from '../../components/organisms/taskin/Taskin.types';
import type { TaskinPlayer, TaskinScript, TaskinScriptStep, UseTaskinScriptOptions } from './use-taskin-script.types';

/** Quanto tempo de leitura cada caractere da frase compra. */
export const SCRIPT_MS_PER_CHAR = 55;
/** A frase mais curta fica pelo menos isto; a mais longa, no maximo isto. */
export const SCRIPT_MIN_HOLD_MS = 1200;
export const SCRIPT_MAX_HOLD_MS = 6000;
/** Um passo que so troca o humor, sem frase nem acao, segura isto. */
export const SCRIPT_EMPTY_HOLD_MS = 800;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/**
 * Quanto o passo segura depois da acao. `holdMs` manda; sem ele, a frase
 * dimensiona a pausa; sem frase, uma acao sozinha nao segura nada alem do
 * proprio tempo, e um passo vazio segura o minimo para a troca de humor se ver.
 */
export const stepHold = (step: TaskinScriptStep): number => {
  if (step.holdMs !== undefined) return Math.max(0, step.holdMs);
  if (step.say) return clamp(step.say.length * SCRIPT_MS_PER_CHAR, SCRIPT_MIN_HOLD_MS, SCRIPT_MAX_HOLD_MS);
  return step.action ? 0 : SCRIPT_EMPTY_HOLD_MS;
};

/**
 * Quanto o roteiro inteiro dura sem toca-lo: a acao de cada passo (pela
 * personagem, como `actionDuration`) mais a pausa dele. Para quem sincroniza
 * algo por fora, como o balao HTML de um chat.
 */
export const scriptDuration = (character: TaskinCharacter, steps: TaskinScriptStep[]): number =>
  steps.reduce((total, step) => total + (step.action ? actionDuration(character, step.action) : 0) + stepHold(step), 0);

export function useTaskinScript(
  taskin: Ref<TaskinPlayer | null | undefined>,
  options: UseTaskinScriptOptions = {},
): TaskinScript {
  const mood = ref<TaskinMood>(options.initialMood ?? 'neutral');
  const speechText = ref<string | undefined>(undefined);
  const speaking = ref(false);
  const running = ref(false);

  // Cada `run` recebe um numero; um `stop` (ou o `run` seguinte) avanca o
  // numero, e o laco antigo percebe ao acordar que nao e mais o dono.
  let token = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let wake: (() => void) | undefined;

  const sleep = (ms: number) =>
    new Promise<void>((resolve) => {
      wake = resolve;
      timer = setTimeout(() => {
        wake = undefined;
        resolve();
      }, ms);
    });

  const clearSpeech = () => {
    speechText.value = undefined;
    speaking.value = false;
  };

  const stop = () => {
    token += 1;
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    wake?.();
    wake = undefined;
    clearSpeech();
    running.value = false;
  };

  const run = async (steps: TaskinScriptStep[]): Promise<boolean> => {
    stop();
    const mine = token;
    running.value = true;

    for (const step of steps) {
      if (step.mood) mood.value = step.mood;
      if (step.say) {
        speechText.value = step.say;
        speaking.value = true;
      }

      if (step.action) {
        // Sem `Taskin` montado nao ha gesto, mas o roteiro segue: a pausa e a fala valem.
        await taskin.value?.play(step.action);
        if (token !== mine) return false;
      }

      const hold = stepHold(step);
      if (hold > 0) {
        await sleep(hold);
        if (token !== mine) return false;
      }

      // A fala acaba com o passo; o humor fica.
      clearSpeech();
    }

    running.value = false;
    return true;
  };

  return { mood, speechText, speaking, running, run, stop };
}
