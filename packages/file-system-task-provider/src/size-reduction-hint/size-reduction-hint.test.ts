import { describe, expect, it } from 'vitest';
import { SizeReductionHint } from './index';

const hint = new SizeReductionHint();

describe('image', () => {
  const text = hint.for('assets/screen.png');

  it('suggests cropping, downscaling and reducing the palette, with the commands', () => {
    expect(text).toMatch(/crop/i);
    expect(text).toContain('scale=1280:-1');
    expect(text).toContain('palettegen');
    expect(text).toContain('paletteuse');
  });

  it('the commands point at the offending file', () => {
    expect(text).toContain('ffmpeg -i assets/screen.png');
  });

  it('says that a merely illustrative image can drop fidelity — and that this changes the link', () => {
    expect(text).toMatch(/illustrative/i);
    expect(text).toMatch(/fidelity/i);
    expect(text).toContain('assets/screen.jpg');
    expect(text).toMatch(/link/i);
  });

  it.each(['assets/a.jpg', 'assets/a.jpeg', 'assets/a.webp', 'assets/A.PNG'])('%s is an image', (file) => {
    expect(hint.for(file)).toContain('palettegen');
  });
});

describe('video and GIF', () => {
  it.each(['assets/flight.webm', 'assets/flight.mp4', 'assets/flight.mov', 'assets/flight.mkv', 'assets/flight.gif'])(
    '%s: fewer frames, less width, trimming — and first of all a strip of still frames',
    (file) => {
      const text = hint.for(file);
      expect(text).toContain('fps=');
      expect(text).toContain('scale=');
      expect(text).toContain('-ss');
      expect(text).toContain('tile=');
      expect(text).toMatch(/strip of still frames/i);
      expect(text).toContain(`ffmpeg -i ${file}`);
    },
  );

  it('a GIF is not treated as a still image', () => {
    expect(hint.for('assets/flight.gif')).not.toMatch(/illustrative/i);
  });
});

describe('everything else', () => {
  it.each(['assets/report.pdf', 'assets/dump.zip', 'assets/no-extension'])(
    '%s: compress it, or keep it outside the repository',
    (file) => {
      const text = hint.for(file);
      expect(text).toMatch(/compress/i);
      expect(text).toMatch(/outside the repository/i);
    },
  );
});

it.each(['assets/screen.png', 'assets/flight.webm', 'assets/flight.gif'])(
  'no command in the hint for %s writes over its own input',
  (file) => {
    const commands = hint
      .for(file)
      .split('\n')
      .flatMap((line) => line.match(/ffmpeg .*/g) ?? []);

    expect(commands.length).toBeGreaterThan(0);
    for (const command of commands) {
      const [input] = command.match(/-i (\S+)/)?.slice(1) ?? [];
      const output = command
        .split(' ')
        .filter((word) => !word.startsWith('-'))
        .at(-1);
      expect(output, command).not.toBe(input);
    }
  },
);

it('says how to put the reduced file in place of the original', () => {
  expect(hint.for('assets/screen.png')).toContain('mv assets/screen.reduced.png assets/screen.png');
});

it('is multi-line text, one action per line', () => {
  expect(hint.for('assets/screen.png').split('\n').length).toBeGreaterThan(3);
});
