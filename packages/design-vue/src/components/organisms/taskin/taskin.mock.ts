import type { TaskinController, TaskinProps } from './taskin.types';

export const defaultTaskinProps: TaskinProps = {
  size: 340,
  mood: 'sarcastic',
  idleAnimation: true,
  animationsEnabled: true,
};

export const fakeTaskinController: TaskinController = {
  raiseArm() {
    return this;
  },
  lowerArms() {
    return this;
  },
  smile() {
    return this;
  },
  neutralMouth() {
    return this;
  },
  blink() {
    return this;
  },
  look() {
    return this;
  },
  setMood(_mood) {
    return this;
  },
  sarcasticShrug() {
    return this;
  },
  speak(_message) {
    return this;
  },
  wiggleTentacle(_id) {
    return this;
  },
  wiggleAllTentacles() {
    return this;
  },
  addTears() {
    return this;
  },
  removeTears() {
    return this;
  },
  changeColor(_bodyColor, _bodyHighlight, _tentacleColor) {
    return this;
  },
  shiver() {
    return this;
  },
  pant() {
    return this;
  },
  dance() {
    return this;
  },
  addHearts() {
    return this;
  },
  removeHearts() {
    return this;
  },
  addZzz() {
    return this;
  },
  removeZzz() {
    return this;
  },
  angryShake() {
    return this;
  },
  addThoughtBubble() {
    return this;
  },
  removeThoughtBubble() {
    return this;
  },
  vomit() {
    return this;
  },
  addPhone() {
    return this;
  },
  removePhone() {
    return this;
  },
  addFartCloud() {
    return this;
  },
  removeFartCloud() {
    return this;
  },
};
