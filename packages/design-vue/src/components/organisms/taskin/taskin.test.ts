import { describe, expect, it } from 'vitest';
import { fakeTaskinController } from './taskin.mock';

describe('TaskinMascot', () => {
  it('should export TaskinMascot component', async () => {
    const module = await import('./taskin');
    expect(module.default).toBeDefined();
  });

  it('should have all required controller methods', () => {
    expect(fakeTaskinController.raiseArm).toBeDefined();
    expect(fakeTaskinController.lowerArms).toBeDefined();
    expect(fakeTaskinController.smile).toBeDefined();
    expect(fakeTaskinController.neutralMouth).toBeDefined();
    expect(fakeTaskinController.blink).toBeDefined();
    expect(fakeTaskinController.look).toBeDefined();
    expect(fakeTaskinController.setMood).toBeDefined();
    expect(fakeTaskinController.sarcasticShrug).toBeDefined();
    expect(fakeTaskinController.speak).toBeDefined();
    expect(fakeTaskinController.wiggleTentacle).toBeDefined();
    expect(fakeTaskinController.wiggleAllTentacles).toBeDefined();
    expect(fakeTaskinController.addTears).toBeDefined();
    expect(fakeTaskinController.removeTears).toBeDefined();
  });

  it('should return controller for chaining', () => {
    const result = fakeTaskinController.raiseArm('left');
    expect(result).toBe(fakeTaskinController);
  });

  it('should support all moods', () => {
    const moods = [
      'neutral',
      'smirk',
      'happy',
      'annoyed',
      'sarcastic',
      'crying',
    ];
    moods.forEach((mood) => {
      const result = fakeTaskinController.setMood(mood as any);
      expect(result).toBe(fakeTaskinController);
    });
  });
});
