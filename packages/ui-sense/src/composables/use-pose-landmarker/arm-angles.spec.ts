import { describe, expect, it } from 'vitest';
import { armAnglesFromLandmarks } from './arm-angles';
import type { PoseLandmark } from './use-pose-landmarker.types';

/** Landmarks vem normalizados em 0..1, com y crescendo para baixo. */
const at = (x: number, y: number): PoseLandmark => ({ x, y, z: 0, visibility: 1 });

/*
 * Os indices do MediaPipe sao nomeados pelo corpo do **sujeito**, e uma pessoa
 * de frente para a camera tem o ombro esquerdo dela no lado direito da imagem.
 * Por isso os fixtures aqui sao construidos como o modelo entrega — `11` a
 * direita da tela — e as asercoes falam do lado da **tela**, que e o lado em que
 * o mascote desenha.
 *
 * A versao anterior destes testes montava `11` a esquerda da tela, fixando a
 * convencao errada: eles passavam verdes enquanto o mascote abracava a si
 * mesmo. Cada braco era medido de um lado e pintado no ombro oposto.
 */
function poseWith(points: Partial<Record<number, PoseLandmark>>): PoseLandmark[] {
  const landmarks = Array.from({ length: 33 }, () => at(0.5, 0.5));
  for (const [index, point] of Object.entries(points)) {
    if (point) landmarks[Number(index)] = point;
  }
  return landmarks;
}

/**
 * Bracos para baixo e para fora, o caso do relato da task-044 — montado como o
 * MediaPipe entrega: `11`/`13`/`15` (esquerdo do sujeito) na direita da tela.
 */
const armsDownAndOut = poseWith({
  11: at(0.6, 0.4), // ombro esquerdo do sujeito -> direita da tela
  13: at(0.66, 0.5),
  15: at(0.72, 0.6),
  12: at(0.4, 0.4), // ombro direito do sujeito -> esquerda da tela
  14: at(0.34, 0.5),
  16: at(0.28, 0.6),
});

describe('armAnglesFromLandmarks', () => {
  it('measures each shoulder in screen space, so the two sides are mirror values', () => {
    const angles = armAnglesFromLandmarks(armsDownAndOut);

    expect(angles).not.toBeNull();
    expect(angles?.right.shoulder).toBeCloseTo(59, 0);
    expect(angles?.left.shoulder).toBeCloseTo(121, 0);
  });

  it('reads the screen side, not the body side the model names', () => {
    /*
     * A assercao que faltava. `left` tem de sair do ponto que esta a esquerda
     * da imagem — que e `12`, o ombro *direito* do sujeito. Trocar os dois
     * indices faz este teste falhar, e era o defeito em producao.
     */
    const onlyScreenLeftIsRaised = poseWith({
      11: at(0.6, 0.4), // direita da tela, braco para baixo
      13: at(0.66, 0.5),
      15: at(0.72, 0.6),
      12: at(0.4, 0.4), // esquerda da tela, braco para cima
      14: at(0.34, 0.3),
      16: at(0.28, 0.2),
    });

    const angles = armAnglesFromLandmarks(onlyScreenLeftIsRaised);

    // Para cima e para fora, na esquerda da tela: dx < 0 e dy < 0
    expect(angles?.left.shoulder).toBeLessThan(-90);
    // Para baixo e para fora, na direita da tela: dx > 0 e dy > 0
    expect(angles?.right.shoulder).toBeGreaterThan(0);
    expect(angles?.right.shoulder).toBeLessThan(90);
  });

  it('reports a straight arm as a straight elbow', () => {
    const straight = poseWith({
      11: at(0.6, 0.3),
      13: at(0.6, 0.5),
      15: at(0.6, 0.7),
    });

    expect(armAnglesFromLandmarks(straight)?.right.elbow).toBeCloseTo(180, 0);
  });

  it('reports a folded arm as a small elbow angle', () => {
    const folded = poseWith({
      11: at(0.6, 0.3),
      13: at(0.6, 0.5),
      15: at(0.6, 0.32),
    });

    expect(armAnglesFromLandmarks(folded)?.right.elbow).toBeLessThan(20);
  });

  it('returns null when any of the six points is missing', () => {
    const incomplete = poseWith({ 11: at(0.4, 0.4) }).slice(0, 12);

    expect(armAnglesFromLandmarks(incomplete)).toBeNull();
  });
});
