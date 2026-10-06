import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { actionDuration } from '../../components/organisms/taskin/Taskin';
import type { TaskinAction } from '../../components/organisms/taskin/Taskin.actions';
import {
  SCRIPT_EMPTY_HOLD_MS,
  SCRIPT_MAX_HOLD_MS,
  SCRIPT_MIN_HOLD_MS,
  SCRIPT_MS_PER_CHAR,
  scriptDuration,
  stepHold,
  useTaskinScript,
} from './use-taskin-script';
import type { TaskinPlayer } from './use-taskin-script.types';

/** Um `Taskin` de mentira: `play` so resolve quando o teste mandar. */
const fakePlayer = () => {
  const calls: TaskinAction[] = [];
  let resolve: ((done: boolean) => void) | undefined;
  const player: TaskinPlayer = {
    play: (action) => {
      calls.push(action);
      return new Promise<boolean>((r) => {
        resolve = r;
      });
    },
  };
  return { player, calls, end: (done = true) => resolve?.(done) };
};

describe('stepHold', () => {
  it('holdMs manda, mesmo com frase', () => {
    expect(stepHold({ say: 'Oi, Sidarta!', holdMs: 300 })).toBe(300);
    expect(stepHold({ holdMs: -5 })).toBe(0);
  });

  it('a frase dimensiona a pausa, entre o piso e o teto', () => {
    expect(stepHold({ say: 'Oi' })).toBe(SCRIPT_MIN_HOLD_MS);
    expect(stepHold({ say: 'x'.repeat(40) })).toBe(40 * SCRIPT_MS_PER_CHAR);
    expect(stepHold({ say: 'x'.repeat(500) })).toBe(SCRIPT_MAX_HOLD_MS);
  });

  it('uma acao sozinha nao segura; um passo vazio segura o minimo', () => {
    expect(stepHold({ action: 'nod' })).toBe(0);
    expect(stepHold({ mood: 'happy' })).toBe(SCRIPT_EMPTY_HOLD_MS);
  });
});

describe('scriptDuration', () => {
  it('soma a acao de cada passo, pela variante, e a pausa dele', () => {
    const steps = [{ action: 'wave' as const, say: 'Oi' }, { mood: 'happy' as const }];
    expect(scriptDuration('taskin', steps)).toBe(
      actionDuration('taskin', 'wave') + SCRIPT_MIN_HOLD_MS + SCRIPT_EMPTY_HOLD_MS,
    );
  });
});

describe('useTaskinScript', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('parte do humor inicial, sem fala', () => {
    const script = useTaskinScript(ref(null), { initialMood: 'sarcastic' });
    expect(script.mood.value).toBe('sarcastic');
    expect(script.speechText.value).toBeUndefined();
    expect(script.speaking.value).toBe(false);
    expect(script.running.value).toBe(false);
  });

  it('aplica o humor e a fala do passo, e limpa a fala no fim dele', async () => {
    const script = useTaskinScript(ref(null));
    const done = script.run([{ mood: 'happy', say: 'Oi' }]);

    expect(script.running.value).toBe(true);
    expect(script.mood.value).toBe('happy');
    expect(script.speechText.value).toBe('Oi');
    expect(script.speaking.value).toBe(true);

    await vi.advanceTimersByTimeAsync(SCRIPT_MIN_HOLD_MS);

    await expect(done).resolves.toBe(true);
    expect(script.speechText.value).toBeUndefined();
    expect(script.speaking.value).toBe(false);
    expect(script.running.value).toBe(false);
    expect(script.mood.value).toBe('happy');
  });

  it('espera a acao acabar pelo play antes de segurar a pausa', async () => {
    const { player, calls, end } = fakePlayer();
    const script = useTaskinScript(ref(player));
    let finished = false;
    const done = script.run([{ action: 'wave', say: 'Oi' }]).then((r) => {
      finished = true;
      return r;
    });

    expect(calls).toEqual(['wave']);
    // A pausa inteira passa, mas a acao ainda nao acabou: o passo nao termina.
    await vi.advanceTimersByTimeAsync(SCRIPT_MIN_HOLD_MS * 2);
    expect(finished).toBe(false);
    expect(script.speechText.value).toBe('Oi');

    end();
    await vi.advanceTimersByTimeAsync(SCRIPT_MIN_HOLD_MS - 1);
    expect(finished).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await expect(done).resolves.toBe(true);
  });

  it('toca os passos em ordem', async () => {
    const { player, calls, end } = fakePlayer();
    const script = useTaskinScript(ref(player));
    const done = script.run([
      { action: 'wave', say: 'Oi' },
      { mood: 'thoughtful', say: 'Hmm' },
      { action: 'celebrate', holdMs: 0 },
    ]);

    expect(calls).toEqual(['wave']);
    end();
    await vi.advanceTimersByTimeAsync(SCRIPT_MIN_HOLD_MS);
    expect(script.mood.value).toBe('thoughtful');
    expect(script.speechText.value).toBe('Hmm');
    expect(calls).toEqual(['wave']);

    await vi.advanceTimersByTimeAsync(SCRIPT_MIN_HOLD_MS);
    expect(calls).toEqual(['wave', 'celebrate']);
    end();
    await vi.advanceTimersByTimeAsync(0);
    await expect(done).resolves.toBe(true);
  });

  it('stop interrompe, limpa a fala e deixa o humor onde estava', async () => {
    const script = useTaskinScript(ref(null));
    const done = script.run([{ mood: 'happy', say: 'Oi' }, { mood: 'furious' }]);

    script.stop();

    await expect(done).resolves.toBe(false);
    expect(script.speechText.value).toBeUndefined();
    expect(script.speaking.value).toBe(false);
    expect(script.running.value).toBe(false);
    expect(script.mood.value).toBe('happy');
  });

  it('um run novo interrompe o anterior', async () => {
    const script = useTaskinScript(ref(null));
    const primeiro = script.run([{ say: 'Oi' }, { mood: 'furious' }]);
    const segundo = script.run([{ mood: 'in-love', say: 'Ai' }]);

    await expect(primeiro).resolves.toBe(false);
    expect(script.mood.value).toBe('in-love');
    expect(script.speechText.value).toBe('Ai');

    await vi.advanceTimersByTimeAsync(SCRIPT_MIN_HOLD_MS);
    await expect(segundo).resolves.toBe(true);
    expect(script.mood.value).toBe('in-love');
  });

  it('interrompido no meio de uma acao, nao segue para o passo seguinte', async () => {
    const { player, calls, end } = fakePlayer();
    const script = useTaskinScript(ref(player));
    const done = script.run([{ action: 'wave' }, { action: 'celebrate' }]);

    script.stop();
    end();
    await vi.advanceTimersByTimeAsync(0);

    await expect(done).resolves.toBe(false);
    expect(calls).toEqual(['wave']);
  });

  it('sem Taskin montado, pula o gesto e segue', async () => {
    const script = useTaskinScript(ref(null));
    const done = script.run([{ action: 'wave', say: 'Oi' }]);

    await vi.advanceTimersByTimeAsync(SCRIPT_MIN_HOLD_MS);
    await expect(done).resolves.toBe(true);
  });
});
