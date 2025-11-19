import type { TaskinProps, TaskinController } from './taskin.types';

export const defaultTaskinProps: TaskinProps = {
  size: 220,
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
};
