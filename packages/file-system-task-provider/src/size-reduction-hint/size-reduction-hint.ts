import path from 'path';
import type { ISizeReductionHint } from './size-reduction-hint.types.js';

const STILL_IMAGE = new Set(['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tif', '.tiff']);
/** Two-pass palette in one filter graph: builds the palette, then maps the image onto it. */
const PALETTE = 'split[a][b];[a]palettegen=max_colors=256[p];[b][p]paletteuse';
const MOVING_IMAGE = new Set(['.gif', '.webm', '.mp4', '.mov', '.mkv', '.avi', '.m4v']);

/** `assets/screen.png` → `assets/screen.jpg`, for the lossy-conversion line. */
function withExtension(file: string, extension: string): string {
  const parsed = path.parse(file);
  return path.join(parsed.dir, `${parsed.name}${extension}`);
}

/**
 * The hint the lint prints under an attachment over the limit.
 *
 * Every command uses `ffmpeg`: it covers still images and video alike, runs on
 * macOS and Linux, and spares the reader one tool per format. The order is the
 * order to try things in — what keeps the file faithful first, what trades
 * fidelity for size last.
 *
 * @public
 */
export class SizeReductionHint implements ISizeReductionHint {
  for(file: string): string {
    const extension = path.extname(file).toLowerCase();
    if (STILL_IMAGE.has(extension)) return this.forStillImage(file);
    if (MOVING_IMAGE.has(extension)) return this.forMovingImage(file);
    return this.forAnythingElse();
  }

  private forStillImage(file: string): string {
    // ffmpeg cannot write over the file it is reading, hence the `.reduced` copy
    const reduced = withExtension(file, `.reduced${path.extname(file)}`);
    return [
      'Crop it to the part that matters — a full screen rarely is the evidence.',
      `Reduce the palette to 256 colours, keeping name and format: ffmpeg -i ${file} -vf "${PALETTE}" ${reduced}`,
      `If it is still too big, downscale as well: ffmpeg -i ${file} -vf "scale=1280:-1,${PALETTE}" ${reduced}`,
      `Then put the reduced file in place: mv ${reduced} ${file}`,
      `If the image is merely illustrative and fidelity need not be kept, convert it — the extension changes, so update the link in the task: ffmpeg -i ${file} -q:v 5 ${withExtension(file, '.jpg')}`,
    ].join('\n');
  }

  private forMovingImage(file: string): string {
    const smaller = withExtension(file, `.small${path.extname(file)}`);
    return [
      'First consider a strip of still frames instead of motion — a few moments side by side usually prove the change for a fraction of the size, and the link changes to the .jpg:',
      `  ffmpeg -i ${file} -vf "select='not(mod(n\\,100))',scale=360:-1,tile=4x1" -frames:v 1 ${withExtension(file, '.jpg')}`,
      `Or fewer frames per second and less width: ffmpeg -i ${file} -vf fps=6,scale=560:-1 ${smaller}`,
      `Or trim the start and the end: ffmpeg -ss 3 -t 10 -i ${file} -c copy ${smaller}`,
      `Then put the smaller file in place: mv ${smaller} ${file}`,
    ].join('\n');
  }

  private forAnythingElse(): string {
    return [
      'Compress it, or reduce what it contains.',
      'If it is only a reference, keep it outside the repository and link to it from the task.',
    ].join('\n');
  }
}
