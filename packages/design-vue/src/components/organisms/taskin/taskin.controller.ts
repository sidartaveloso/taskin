import type {
  TaskinArmSide,
  TaskinController,
  TaskinMood,
  TaskinTentacleId,
} from './taskin.types';

const TENTACLE_IDS: TaskinTentacleId[] = [
  'tentacle-front-left',
  'tentacle-front-right',
  'tentacle-side-left',
  'tentacle-side-right',
  'tentacle-back-left',
  'tentacle-back-right',
];

function getElement(svg: SVGElement, id: string): SVGElement | null {
  return svg.querySelector<SVGElement>(`#${id}`);
}

function animateTransform(
  el: SVGElement | null | undefined,
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  options: number | KeyframeAnimationOptions,
  enabled: () => boolean,
) {
  if (!el || !enabled()) return;
  el.animate(keyframes, options);
}

export function createTaskinController(
  svg: SVGElement,
  animationsEnabled: () => boolean,
): TaskinController {
  const controller: TaskinController = {
    raiseArm(side: TaskinArmSide, angleDeg = -35, durationMs = 250) {
      const armId = side === 'left' ? 'arm-left' : 'arm-right';
      const arm = getElement(svg, armId);
      animateTransform(
        arm,
        [
          { transform: 'rotate(0deg)', transformOrigin: '160px 110px' },
          {
            transform: `rotate(${angleDeg}deg)`,
            transformOrigin: '160px 110px',
          },
        ],
        { duration: durationMs, fill: 'forwards', easing: 'ease-out' },
        animationsEnabled,
      );
      return controller;
    },

    lowerArms(durationMs = 250) {
      ['arm-left', 'arm-right'].forEach((id) => {
        const arm = getElement(svg, id);
        animateTransform(
          arm,
          [
            { transformOrigin: '160px 110px' },
            { transform: 'rotate(0deg)', transformOrigin: '160px 110px' },
          ],
          { duration: durationMs, fill: 'forwards', easing: 'ease-out' },
          animationsEnabled,
        );
      });
      return controller;
    },

    smile(durationMs = 150) {
      const neutral = getElement(svg, 'mouth-neutral');
      const smile = getElement(svg, 'mouth-smile');

      animateTransform(
        smile,
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: durationMs, fill: 'forwards' },
        animationsEnabled,
      );
      animateTransform(
        neutral,
        [{ opacity: 1 }, { opacity: 0 }],
        { duration: durationMs, fill: 'forwards' },
        animationsEnabled,
      );

      return controller;
    },

    neutralMouth() {
      const neutral = getElement(svg, 'mouth-neutral');
      const smile = getElement(svg, 'mouth-smile');
      if (neutral) neutral.setAttribute('opacity', '1');
      if (smile) smile.setAttribute('opacity', '0');
      return controller;
    },

    blink(durationMs = 80) {
      const eyes = getElement(svg, 'eyes');
      animateTransform(
        eyes,
        [
          { transform: 'scaleY(1)', transformOrigin: '160px 100px' },
          { transform: 'scaleY(0.1)', transformOrigin: '160px 100px' },
          { transform: 'scaleY(1)', transformOrigin: '160px 100px' },
        ],
        { duration: durationMs * 3, easing: 'ease-in-out' },
        animationsEnabled,
      );
      return controller;
    },

    look(direction, amount = 4) {
      const pupilLeft = getElement(svg, 'pupil-left');
      const pupilRight = getElement(svg, 'pupil-right');
      if (!pupilLeft || !pupilRight) return controller;

      const offset =
        direction === 'left' ? -amount : direction === 'right' ? amount : 0;

      [pupilLeft, pupilRight].forEach((p) => {
        p.setAttribute('transform', `translate(${offset}, 0)`);
      });

      return controller;
    },

    setMood(mood: TaskinMood) {
      const browLeft = getElement(svg, 'brow-left');
      const browRight = getElement(svg, 'brow-right');
      const mouth = getElement(svg, 'mouth');

      if (!browLeft || !browRight) return controller;

      switch (mood) {
        case 'sarcastic':
        case 'annoyed':
          browLeft.setAttribute('d', 'M135 90 Q150 82 160 80');
          browRight.setAttribute('d', 'M160 88 Q170 90 185 94');
          break;
        case 'happy':
          controller.smile();
          browLeft.setAttribute('d', 'M135 88 Q150 80 160 84');
          browRight.setAttribute('d', 'M160 84 Q170 80 185 88');
          break;
        case 'smirk':
          controller.smile();
          browLeft.setAttribute('d', 'M135 90 Q150 84 160 86');
          browRight.setAttribute('d', 'M160 86 Q170 88 185 90');
          break;
        case 'crying':
          // Sobrancelhas anguladas para cima (expressão triste)
          browLeft.setAttribute('d', 'M135 95 Q150 88 160 86');
          browRight.setAttribute('d', 'M160 86 Q170 88 185 95');
          // Boca invertida (frown)
          if (mouth) {
            mouth.setAttribute('d', 'M145 125 Q160 118 175 125');
          }
          // Adicionar lágrimas com animação
          controller.addTears();
          break;
        case 'neutral':
        default:
          controller.neutralMouth();
          browLeft.setAttribute('d', 'M135 90 Q150 82 160 86');
          browRight.setAttribute('d', 'M160 86 Q170 82 185 90');
          // Remove tears if present
          controller.removeTears();
          break;
      }

      return controller;
    },

    addTears() {
      // Adiciona lágrimas animadas
      const leftEye = getElement(svg, 'eye-left');
      const rightEye = getElement(svg, 'eye-right');

      if (!leftEye || !rightEye) return controller;

      // Remove lágrimas existentes
      controller.removeTears();

      // Criar lágrimas como círculos azuis
      const createTear = (x: number, y: number, id: string) => {
        const tear = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'circle',
        );
        tear.setAttribute('id', id);
        tear.setAttribute('cx', x.toString());
        tear.setAttribute('cy', y.toString());
        tear.setAttribute('r', '2');
        tear.setAttribute('fill', '#4A90E2');
        tear.setAttribute('opacity', '0.8');
        svg.appendChild(tear);

        // Animar lágrima caindo
        animateTransform(
          tear,
          [
            { transform: 'translate(0, 0)', opacity: '0.8' },
            { transform: 'translate(0, 30)', opacity: '0' },
          ],
          { duration: 1500, iterations: Infinity, easing: 'ease-in' },
          animationsEnabled,
        );
      };

      // Criar lágrimas nos dois olhos
      createTear(148, 105, 'tear-left');
      createTear(172, 105, 'tear-right');

      return controller;
    },

    removeTears() {
      const tearLeft = getElement(svg, 'tear-left');
      const tearRight = getElement(svg, 'tear-right');
      if (tearLeft) tearLeft.remove();
      if (tearRight) tearRight.remove();
      return controller;
    },

    sarcasticShrug() {
      controller
        .raiseArm('left', -20, 200)
        .raiseArm('right', 15, 200)
        .smile()
        .blink(60);
      return controller;
    },

    speak(message: string) {
      console.log(`[Taskin] ${message}`);
      controller.smile();
      return controller;
    },

    wiggleTentacle(id: TaskinTentacleId, intensityDeg = 10, durationMs = 400) {
      const tentacle = getElement(svg, id);
      if (!tentacle) return controller;

      animateTransform(
        tentacle,
        [
          { transform: 'rotate(0deg)', transformOrigin: '160px 170px' },
          {
            transform: `rotate(${intensityDeg}deg)`,
            transformOrigin: '160px 170px',
          },
          {
            transform: `rotate(${-intensityDeg}deg)`,
            transformOrigin: '160px 170px',
          },
          { transform: 'rotate(0deg)', transformOrigin: '160px 170px' },
        ],
        {
          duration: durationMs,
          easing: 'ease-in-out',
        },
        animationsEnabled,
      );

      return controller;
    },

    wiggleAllTentacles(intensityDeg = 10, durationMs = 400) {
      TENTACLE_IDS.forEach((id, index) => {
        const tentacle = getElement(svg, id);
        if (!tentacle) return;
        const delay = index * 80;
        setTimeout(() => {
          controller.wiggleTentacle(id, intensityDeg, durationMs);
        }, delay);
      });

      return controller;
    },
  };

  return controller;
}
