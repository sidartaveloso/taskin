import type { TaskinController, TaskinProps } from './taskin.types';

export const defaultTaskinProps: TaskinProps = {
  size: 340,
  mood: 'sarcastic',
  idleAnimation: true,
  animationsEnabled: true,
};

export const fakeTaskinController: TaskinController = {
  raiseArm() {
    console.log('[TaskinMock] raiseArm');
    return this;
  },
  lowerArms() {
    console.log('[TaskinMock] lowerArms');
    return this;
  },
  smile() {
    console.log('[TaskinMock] smile');
    return this;
  },
  neutralMouth() {
    console.log('[TaskinMock] neutralMouth');
    return this;
  },
  blink() {
    console.log('[TaskinMock] blink');
    return this;
  },
  look() {
    console.log('[TaskinMock] look');
    return this;
  },
  setMood(mood) {
    console.log('[TaskinMock] setMood', mood);
    return this;
  },
  sarcasticShrug() {
    console.log('[TaskinMock] sarcasticShrug');
    return this;
  },
  speak(message) {
    console.log('[TaskinMock] speak:', message);
    return this;
  },
  wiggleTentacle(id) {
    console.log('[TaskinMock] wiggleTentacle:', id);
    return this;
  },
  wiggleAllTentacles() {
    console.log('[TaskinMock] wiggleAllTentacles');
    return this;
  },
  addTears() {
    console.log('[TaskinMock] addTears');
    return this;
  },
  removeTears() {
    console.log('[TaskinMock] removeTears');
    return this;
  },
  changeColor(bodyColor, bodyHighlight, tentacleColor) {
    console.log(
      '[TaskinMock] changeColor:',
      bodyColor,
      bodyHighlight,
      tentacleColor,
    );
    return this;
  },
  shiver() {
    console.log('[TaskinMock] shiver');
    return this;
  },
  pant() {
    console.log('[TaskinMock] pant');
    return this;
  },
  dance() {
    console.log('[TaskinMock] dance');
    return this;
  },
  addHearts() {
    console.log('[TaskinMock] addHearts');
    return this;
  },
  removeHearts() {
    console.log('[TaskinMock] removeHearts');
    return this;
  },
  addZzz() {
    console.log('[TaskinMock] addZzz');
    return this;
  },
  removeZzz() {
    console.log('[TaskinMock] removeZzz');
    return this;
  },
  angryShake() {
    console.log('[TaskinMock] angryShake');
    return this;
  },
  addThoughtBubble() {
    console.log('[TaskinMock] addThoughtBubble');
    return this;
  },
  removeThoughtBubble() {
    console.log('[TaskinMock] removeThoughtBubble');
    return this;
  },
  vomit() {
    console.log('[TaskinMock] vomit');
    return this;
  },
  addPhone() {
    console.log('[TaskinMock] addPhone');
    return this;
  },
  removePhone() {
    console.log('[TaskinMock] removePhone');
    return this;
  },
  addFartCloud() {
    console.log('[TaskinMock] addFartCloud');
    return this;
  },
  removeFartCloud() {
    console.log('[TaskinMock] removeFartCloud');
    return this;
  },
};
