import { describe, expect, it } from 'vitest';
import { SizeReductionHint } from './index';

/*
 * The hint that comes with an attachment-over-the-limit error (task-108): what
 * to try, in order, with the command ready to run on the offending file.
 */
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

it('is multi-line text, one action per line', () => {
  expect(hint.for('assets/screen.png').split('\n').length).toBeGreaterThan(3);
});
