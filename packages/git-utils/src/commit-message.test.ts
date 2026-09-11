import { describe, expect, it } from 'vitest';
import {
  appendCiSkipTag,
  buildTaskStatusCommitMessage,
  CI_SKIP_TAGS,
  DEFAULT_CI_SKIP_TAG,
  isRecognizedCiSkipTag,
} from './commit-message';

describe('CI_SKIP_TAGS', () => {
  it('lists exactly the five strings GitHub Actions documents', () => {
    expect([...CI_SKIP_TAGS]).toEqual(['[skip ci]', '[ci skip]', '[no ci]', '[skip actions]', '[actions skip]']);
  });

  it('defaults to the only form GitHub, GitLab and Bitbucket all accept', () => {
    expect(DEFAULT_CI_SKIP_TAG).toBe('[skip ci]');
  });
});

describe('isRecognizedCiSkipTag', () => {
  it.each(CI_SKIP_TAGS)('recognizes %s', (tag) => {
    expect(isRecognizedCiSkipTag(tag)).toBe(true);
  });

  it('rejects the hyphenated form that started this bug', () => {
    expect(isRecognizedCiSkipTag('[skip-ci]')).toBe(false);
  });

  it('rejects a tag that is merely similar', () => {
    expect(isRecognizedCiSkipTag('[skipci]')).toBe(false);
    expect(isRecognizedCiSkipTag('skip ci')).toBe(false);
  });

  it('ignores capitalization, because GitLab documents it as irrelevant', () => {
    expect(isRecognizedCiSkipTag('[SKIP CI]')).toBe(true);
    expect(isRecognizedCiSkipTag('[Ci Skip]')).toBe(true);
  });

  it('does not treat the empty string as a recognized tag', () => {
    expect(isRecognizedCiSkipTag('')).toBe(false);
  });
});

describe('appendCiSkipTag', () => {
  it('appends the tag after a single space', () => {
    expect(appendCiSkipTag('docs(TASKS): task-052 - done', '[skip ci]')).toBe('docs(TASKS): task-052 - done [skip ci]');
  });

  it('falls back to the default tag when none is given', () => {
    expect(appendCiSkipTag('subject')).toBe('subject [skip ci]');
  });

  it('appends nothing when the tag is an empty string, so CI runs on purpose', () => {
    expect(appendCiSkipTag('subject', '')).toBe('subject');
  });

  it('appends nothing when the tag is only whitespace', () => {
    expect(appendCiSkipTag('subject', '   ')).toBe('subject');
  });

  it('trims the surrounding whitespace of a configured tag', () => {
    expect(appendCiSkipTag('subject', '  [ci skip]  ')).toBe('subject [ci skip]');
  });

  it('accepts a tag the platforms do not document, for custom CI', () => {
    expect(appendCiSkipTag('subject', '***NO_CI***')).toBe('subject ***NO_CI***');
  });

  it('does not append the tag twice when the subject already ends with it', () => {
    expect(appendCiSkipTag('subject [skip ci]', '[skip ci]')).toBe('subject [skip ci]');
  });
});

describe('buildTaskStatusCommitMessage', () => {
  it('builds the status subject with the configured tag', () => {
    expect(buildTaskStatusCommitMessage({ taskId: '052', status: 'in-progress', ciSkipTag: '[skip ci]' })).toBe(
      'docs(TASKS): task-052 - atualiza status para in-progress [skip ci]',
    );
  });

  it('uses the default tag when the caller passes none', () => {
    expect(buildTaskStatusCommitMessage({ taskId: '014', status: 'done' })).toBe(
      'docs(TASKS): task-014 - atualiza status para done [skip ci]',
    );
  });

  it('never emits the hyphenated form', () => {
    const message = buildTaskStatusCommitMessage({ taskId: '001', status: 'done' });
    expect(message).not.toContain('[skip-ci]');
  });

  it('omits the tag entirely when it is configured empty', () => {
    expect(buildTaskStatusCommitMessage({ taskId: '001', status: 'done', ciSkipTag: '' })).toBe(
      'docs(TASKS): task-001 - atualiza status para done',
    );
  });
});
