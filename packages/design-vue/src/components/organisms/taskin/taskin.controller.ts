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

      // Clean up mood-specific elements
      controller
        .removeTears()
        .removeHearts()
        .removeZzz()
        .removeThoughtBubble()
        .removePhone()
        .removeFartCloud()
        .lowerArms();

      switch (mood) {
        case 'sarcastic':
        case 'annoyed':
          controller.blink().changeColor('#1f7acb', '#2090e0', '#1f7acb');
          browLeft.setAttribute('d', 'M135 90 Q150 82 160 80');
          browRight.setAttribute('d', 'M160 88 Q170 90 185 94');
          break;
        case 'happy':
          controller
            .blink()
            .smile()
            .changeColor('#FFD700', '#FFF44F', '#FFD700');
          browLeft.setAttribute('d', 'M135 88 Q150 80 160 84');
          browRight.setAttribute('d', 'M160 84 Q170 80 185 88');
          break;
        case 'smirk':
          controller
            .blink()
            .smile()
            .changeColor('#1f7acb', '#2090e0', '#1f7acb');
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
          // Blue sad color
          controller.changeColor('#4A90E2', '#6BB6FF', '#4A90E2');
          // Adicionar lágrimas com animação
          controller.addTears();
          break;
        case 'cold':
          // Shivering expression, blue-ish color
          controller
            .neutralMouth()
            .changeColor('#A0C4FF', '#C4D7FF', '#A0C4FF')
            .shiver();
          browLeft.setAttribute('d', 'M135 92 Q150 84 160 86');
          browRight.setAttribute('d', 'M160 86 Q170 84 185 92');
          break;
        case 'hot':
          // Panting expression, red-orange gradient
          controller
            .neutralMouth()
            .changeColor('#FF6B6B', '#FFA07A', '#FF6B6B')
            .pant();
          browLeft.setAttribute('d', 'M135 94 Q150 88 160 88');
          browRight.setAttribute('d', 'M160 88 Q170 88 185 94');
          break;
        case 'dancing':
          // Colorful, dancing
          controller
            .smile()
            .changeColor('#9B59B6', '#BB8FCE', '#9B59B6')
            .dance();
          browLeft.setAttribute('d', 'M135 88 Q150 80 160 84');
          browRight.setAttribute('d', 'M160 84 Q170 80 185 88');
          break;
        case 'furious':
          // Angry red color, angry expression
          controller
            .neutralMouth()
            .changeColor('#DC143C', '#FF6347', '#DC143C')
            .angryShake();
          browLeft.setAttribute('d', 'M135 90 Q150 78 160 76');
          browRight.setAttribute('d', 'M160 76 Q170 78 185 90');
          // Angry mouth
          if (mouth) {
            mouth.setAttribute('d', 'M145 125 Q160 118 175 125');
          }
          break;
        case 'sleeping':
          // Closed eyes, sleeping
          controller
            .neutralMouth()
            .changeColor('#6C5CE7', '#A29BFE', '#6C5CE7')
            .addZzz();
          browLeft.setAttribute('d', 'M135 90 Q150 84 160 86');
          browRight.setAttribute('d', 'M160 86 Q170 84 185 90');
          // Close eyes
          const eyes = getElement(svg, 'eyes');
          if (eyes) {
            eyes.setAttribute('transform', 'scaleY(0.1)');
            eyes.setAttribute('transform-origin', '160px 100px');
          }
          break;
        case 'in-love':
          // Pink with hearts
          controller
            .smile()
            .changeColor('#FF69B4', '#FFB6C1', '#FF69B4')
            .addHearts();
          browLeft.setAttribute('d', 'M135 88 Q150 80 160 84');
          browRight.setAttribute('d', 'M160 84 Q170 80 185 88');
          break;
        case 'tired':
          // Grayish, exhausted
          controller
            .neutralMouth()
            .changeColor('#95A5A6', '#BDC3C7', '#95A5A6');
          browLeft.setAttribute('d', 'M135 94 Q150 90 160 90');
          browRight.setAttribute('d', 'M160 90 Q170 90 185 94');
          // Half-closed eyes
          const eyesTired = getElement(svg, 'eyes');
          if (eyesTired) {
            eyesTired.setAttribute('transform', 'scaleY(0.5)');
            eyesTired.setAttribute('transform-origin', '160px 100px');
          }
          break;
        case 'thoughtful':
          // Purple-blue, thinking pose
          controller
            .neutralMouth()
            .changeColor('#5F4B8B', '#8B7BA8', '#5F4B8B')
            .addThoughtBubble();
          browLeft.setAttribute('d', 'M135 92 Q150 85 160 86');
          browRight.setAttribute('d', 'M160 86 Q170 82 185 88');
          // Look up slightly
          controller.look('center');
          const pupilsThought = svg.querySelectorAll('[id^="pupil-"]');
          pupilsThought.forEach((p) => {
            (p as SVGElement).setAttribute('transform', 'translate(0, -3)');
          });
          break;
        case 'vomiting':
          // Greenish sick color
          controller
            .neutralMouth()
            .changeColor('#7CB342', '#9CCC65', '#7CB342')
            .vomit();
          browLeft.setAttribute('d', 'M135 95 Q150 90 160 90');
          browRight.setAttribute('d', 'M160 90 Q170 90 185 95');
          // Sad eyes
          const eyesVomit = getElement(svg, 'eyes');
          if (eyesVomit) {
            eyesVomit.setAttribute('transform', 'scaleY(0.6)');
            eyesVomit.setAttribute('transform-origin', '160px 100px');
          }
          if (mouth) {
            mouth.setAttribute('d', 'M145 125 Q160 135 175 125');
          }
          break;
        case 'taking-selfie':
          // Bright, happy color with phone
          controller
            .smile()
            .changeColor('#FF8A65', '#FFAB91', '#FF8A65')
            .addPhone()
            .raiseArm('right', -45);
          browLeft.setAttribute('d', 'M135 88 Q150 80 160 84');
          browRight.setAttribute('d', 'M160 84 Q170 80 185 88');
          break;
        case 'farting':
          // Embarrassed brownish-green color
          controller
            .neutralMouth()
            .changeColor('#8D6E63', '#A1887F', '#8D6E63')
            .addFartCloud();
          browLeft.setAttribute('d', 'M135 92 Q150 88 160 88');
          browRight.setAttribute('d', 'M160 88 Q170 88 185 92');
          // Embarrassed look to the side
          controller.look('left', 6);
          if (mouth) {
            mouth.setAttribute('d', 'M145 125 Q160 128 175 125');
          }
          break;
        case 'neutral':
        default:
          controller
            .neutralMouth()
            .changeColor('#1f7acb', '#2090e0', '#1f7acb');
          browLeft.setAttribute('d', 'M135 90 Q150 82 160 86');
          browRight.setAttribute('d', 'M160 86 Q170 82 185 90');
          // Reset eyes
          const eyesNeutral = getElement(svg, 'eyes');
          if (eyesNeutral) {
            eyesNeutral.setAttribute('transform', 'scaleY(1)');
          }
          break;
      }

      return controller;
    },

    changeColor(
      bodyColor: string,
      bodyHighlight: string,
      tentacleColor: string,
    ) {
      const body = svg.querySelectorAll('#body circle');
      const tentacles = svg.querySelectorAll('[id^="tentacle-"]');
      const arms = svg.querySelectorAll('#arm-left path, #arm-right path');

      // Animate color change for body
      body.forEach((circle, index) => {
        const targetColor = index === 0 ? bodyColor : bodyHighlight;
        animateTransform(
          circle as SVGElement,
          [
            { fill: circle.getAttribute('fill') || '#1f7acb' },
            { fill: targetColor },
          ],
          { duration: 500, fill: 'forwards', easing: 'ease-in-out' },
          animationsEnabled,
        );
      });

      // Animate color change for tentacles
      tentacles.forEach((tentacle) => {
        animateTransform(
          tentacle as SVGElement,
          [
            { stroke: tentacle.getAttribute('stroke') || '#1f7acb' },
            { stroke: tentacleColor },
          ],
          { duration: 500, fill: 'forwards', easing: 'ease-in-out' },
          animationsEnabled,
        );
      });

      // Animate color change for arms
      arms.forEach((arm) => {
        animateTransform(
          arm as SVGElement,
          [
            { stroke: arm.getAttribute('stroke') || '#1f7acb' },
            { stroke: tentacleColor },
          ],
          { duration: 500, fill: 'forwards', easing: 'ease-in-out' },
          animationsEnabled,
        );
      });

      return controller;
    },

    shiver() {
      const body = getElement(svg, 'body');
      if (!body) return controller;

      animateTransform(
        body,
        [
          { transform: 'translate(0, 0)' },
          { transform: 'translate(-2, 0)' },
          { transform: 'translate(2, 0)' },
          { transform: 'translate(-2, 0)' },
          { transform: 'translate(0, 0)' },
        ],
        { duration: 200, iterations: Infinity, easing: 'ease-in-out' },
        animationsEnabled,
      );

      return controller;
    },

    pant() {
      const mouth = getElement(svg, 'mouth');
      if (!mouth) return controller;

      animateTransform(
        mouth,
        [
          { d: mouth.getAttribute('d') || 'M145 125 Q160 130 175 125' },
          { d: 'M145 125 Q160 135 175 125' },
          { d: mouth.getAttribute('d') || 'M145 125 Q160 130 175 125' },
        ],
        { duration: 600, iterations: Infinity, easing: 'ease-in-out' },
        animationsEnabled,
      );

      return controller;
    },

    dance() {
      controller.wiggleAllTentacles(15, 300);

      const body = getElement(svg, 'body');
      if (!body) return controller;

      animateTransform(
        body,
        [
          {
            transform: 'translate(0, 0) rotate(0deg)',
            transformOrigin: '160px 110px',
          },
          {
            transform: 'translate(-5, -3) rotate(-5deg)',
            transformOrigin: '160px 110px',
          },
          {
            transform: 'translate(5, -3) rotate(5deg)',
            transformOrigin: '160px 110px',
          },
          {
            transform: 'translate(0, 0) rotate(0deg)',
            transformOrigin: '160px 110px',
          },
        ],
        { duration: 800, iterations: Infinity, easing: 'ease-in-out' },
        animationsEnabled,
      );

      return controller;
    },

    angryShake() {
      const rootSvg = svg;
      animateTransform(
        rootSvg,
        [
          { transform: 'translate(0, 0)' },
          { transform: 'translate(-3, 0)' },
          { transform: 'translate(3, 0)' },
          { transform: 'translate(-3, 0)' },
          { transform: 'translate(0, 0)' },
        ],
        { duration: 100, iterations: 5, easing: 'ease-in-out' },
        animationsEnabled,
      );

      return controller;
    },

    addHearts() {
      controller.removeHearts();

      const createHeart = (x: number, y: number, id: string, delay: number) => {
        const heart = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'text',
        );
        heart.setAttribute('id', id);
        heart.setAttribute('x', x.toString());
        heart.setAttribute('y', y.toString());
        heart.setAttribute('fill', '#FF1493');
        heart.setAttribute('font-size', '20');
        heart.textContent = '❤';
        svg.appendChild(heart);

        setTimeout(() => {
          animateTransform(
            heart,
            [
              { transform: 'translate(0, 0)', opacity: '1' },
              { transform: 'translate(0, -30)', opacity: '0' },
            ],
            { duration: 2000, iterations: Infinity, easing: 'ease-out' },
            animationsEnabled,
          );
        }, delay);
      };

      createHeart(120, 90, 'heart-left', 0);
      createHeart(195, 90, 'heart-right', 300);
      createHeart(150, 70, 'heart-center', 600);

      return controller;
    },

    removeHearts() {
      ['heart-left', 'heart-right', 'heart-center'].forEach((id) => {
        const heart = getElement(svg, id);
        if (heart) heart.remove();
      });
      return controller;
    },

    addZzz() {
      controller.removeZzz();

      const createZ = (x: number, y: number, id: string, delay: number) => {
        const z = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'text',
        );
        z.setAttribute('id', id);
        z.setAttribute('x', x.toString());
        z.setAttribute('y', y.toString());
        z.setAttribute('fill', '#2C3E50');
        z.setAttribute('font-size', '24');
        z.setAttribute('font-weight', 'bold');
        z.textContent = 'Z';
        svg.appendChild(z);

        setTimeout(() => {
          animateTransform(
            z,
            [
              { transform: 'translate(0, 0)', opacity: '0.8' },
              { transform: 'translate(10, -40)', opacity: '0' },
            ],
            { duration: 2500, iterations: Infinity, easing: 'ease-out' },
            animationsEnabled,
          );
        }, delay);
      };

      createZ(190, 90, 'zzz-1', 0);
      createZ(200, 80, 'zzz-2', 600);
      createZ(210, 70, 'zzz-3', 1200);

      return controller;
    },

    removeZzz() {
      ['zzz-1', 'zzz-2', 'zzz-3'].forEach((id) => {
        const z = getElement(svg, id);
        if (z) z.remove();
      });
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

    addThoughtBubble() {
      controller.removeThoughtBubble();

      // Create thought bubble
      const bubble = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'g',
      );
      bubble.setAttribute('id', 'thought-bubble');

      // Main bubble
      const mainBubble = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'ellipse',
      );
      mainBubble.setAttribute('cx', '210');
      mainBubble.setAttribute('cy', '50');
      mainBubble.setAttribute('rx', '35');
      mainBubble.setAttribute('ry', '30');
      mainBubble.setAttribute('fill', '#ffffff');
      mainBubble.setAttribute('stroke', '#2C3E50');
      mainBubble.setAttribute('stroke-width', '2');

      // Small bubbles
      const smallBubble1 = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle',
      );
      smallBubble1.setAttribute('cx', '190');
      smallBubble1.setAttribute('cy', '75');
      smallBubble1.setAttribute('r', '8');
      smallBubble1.setAttribute('fill', '#ffffff');
      smallBubble1.setAttribute('stroke', '#2C3E50');
      smallBubble1.setAttribute('stroke-width', '2');

      const smallBubble2 = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle',
      );
      smallBubble2.setAttribute('cx', '180');
      smallBubble2.setAttribute('cy', '85');
      smallBubble2.setAttribute('r', '5');
      smallBubble2.setAttribute('fill', '#ffffff');
      smallBubble2.setAttribute('stroke', '#2C3E50');
      smallBubble2.setAttribute('stroke-width', '2');

      // Question marks or dots
      const text = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'text',
      );
      text.setAttribute('x', '210');
      text.setAttribute('y', '55');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', '#2C3E50');
      text.setAttribute('font-size', '24');
      text.textContent = '?';

      bubble.appendChild(mainBubble);
      bubble.appendChild(smallBubble1);
      bubble.appendChild(smallBubble2);
      bubble.appendChild(text);
      svg.appendChild(bubble);

      // Subtle floating animation
      animateTransform(
        bubble,
        [
          { transform: 'translate(0, 0)', opacity: '0.9' },
          { transform: 'translate(0, -3)', opacity: '1' },
          { transform: 'translate(0, 0)', opacity: '0.9' },
        ],
        { duration: 2000, iterations: Infinity, easing: 'ease-in-out' },
        animationsEnabled,
      );

      return controller;
    },

    removeThoughtBubble() {
      const bubble = getElement(svg, 'thought-bubble');
      if (bubble) bubble.remove();
      return controller;
    },

    vomit() {
      const vomitGroup = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'g',
      );
      vomitGroup.setAttribute('id', 'vomit-effect');

      // Multiple vomit drops
      for (let i = 0; i < 5; i++) {
        const drop = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'ellipse',
        );
        const x = 160 + (i - 2) * 8;
        drop.setAttribute('cx', x.toString());
        drop.setAttribute('cy', '135');
        drop.setAttribute('rx', '4');
        drop.setAttribute('ry', '6');
        drop.setAttribute('fill', '#8BC34A');
        drop.setAttribute('opacity', '0.8');
        vomitGroup.appendChild(drop);

        animateTransform(
          drop,
          [
            { transform: 'translate(0, 0)', opacity: '0.8' },
            { transform: `translate(${(i - 2) * 5}, 40)`, opacity: '0' },
          ],
          {
            duration: 800,
            iterations: Infinity,
            easing: 'ease-in',
            delay: i * 100,
          },
          animationsEnabled,
        );
      }

      svg.appendChild(vomitGroup);
      return controller;
    },

    addPhone() {
      controller.removePhone();

      // Create phone group that will be positioned relative to the raised arm
      const phone = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      phone.setAttribute('id', 'phone');

      // When arm is raised at -45deg from origin (160, 110),
      // the hand at original position (238, 74) moves to approximately (253, 45)
      // We need to calculate the rotated position
      // Original hand center: (238, 74), rotation origin: (160, 110)
      // After -45° rotation: approximately (253, 45)
      phone.setAttribute('transform', 'translate(253, 45) rotate(-45)');

      // Phone body
      const body = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'rect',
      );
      body.setAttribute('x', '-10');
      body.setAttribute('y', '-17.5');
      body.setAttribute('width', '20');
      body.setAttribute('height', '35');
      body.setAttribute('rx', '3');
      body.setAttribute('fill', '#2C3E50');
      body.setAttribute('stroke', '#34495E');
      body.setAttribute('stroke-width', '1');

      // Screen
      const screen = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'rect',
      );
      screen.setAttribute('x', '-8');
      screen.setAttribute('y', '-14.5');
      screen.setAttribute('width', '16');
      screen.setAttribute('height', '25');
      screen.setAttribute('rx', '1');
      screen.setAttribute('fill', '#3498DB');

      // Camera flash effect
      const flash = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle',
      );
      flash.setAttribute('cx', '0');
      flash.setAttribute('cy', '-15.5');
      flash.setAttribute('r', '1.5');
      flash.setAttribute('fill', '#FFD700');

      phone.appendChild(body);
      phone.appendChild(screen);
      phone.appendChild(flash);
      svg.appendChild(phone);

      // Flash animation
      animateTransform(
        flash,
        [{ opacity: '0' }, { opacity: '1' }, { opacity: '0' }],
        { duration: 1500, iterations: Infinity, easing: 'ease-in-out' },
        animationsEnabled,
      );

      return controller;
    },

    removePhone() {
      const phone = getElement(svg, 'phone');
      const vomit = getElement(svg, 'vomit-effect');
      if (phone) phone.remove();
      if (vomit) vomit.remove();
      return controller;
    },

    addFartCloud() {
      controller.removeFartCloud();

      // Create fart cloud
      const cloud = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      cloud.setAttribute('id', 'fart-cloud');

      // Multiple cloud puffs
      const puffs = [
        { cx: 140, cy: 190, r: 12 },
        { cx: 130, cy: 200, r: 10 },
        { cx: 125, cy: 210, r: 8 },
        { cx: 150, cy: 195, r: 9 },
      ];

      puffs.forEach((puff, i) => {
        const circle = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'circle',
        );
        circle.setAttribute('cx', puff.cx.toString());
        circle.setAttribute('cy', puff.cy.toString());
        circle.setAttribute('r', puff.r.toString());
        circle.setAttribute('fill', '#A1887F');
        circle.setAttribute('opacity', '0.4');
        cloud.appendChild(circle);

        animateTransform(
          circle,
          [
            { transform: 'translate(0, 0) scale(0.5)', opacity: '0.4' },
            { transform: 'translate(-5, 10) scale(1.2)', opacity: '0' },
          ],
          {
            duration: 1500,
            iterations: Infinity,
            easing: 'ease-out',
            delay: i * 200,
          },
          animationsEnabled,
        );
      });

      svg.appendChild(cloud);
      return controller;
    },

    removeFartCloud() {
      const cloud = getElement(svg, 'fart-cloud');
      if (cloud) cloud.remove();
      return controller;
    },
  };

  return controller;
}
