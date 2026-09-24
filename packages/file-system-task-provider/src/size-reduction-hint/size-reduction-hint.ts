import path from 'path';
import type { ISizeReductionHint } from './size-reduction-hint.types.js';

const STILL_IMAGE = new Set(['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tif', '.tiff']);
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
    return [
      'Crop it to the part that matters — a full screen rarely is the evidence.',
      `Downscale: ffmpeg -i ${file} -vf scale=1280:-1 ${file}`,
      `Reduce the palette to 256 colours (keeps name and format): ffmpeg -i ${file} -vf "split[a][b];[a]palettegen=max_colors=256[p];[b][p]paletteuse" ${file}`,
      `If the image is merely illustrative and fidelity need not be kept, convert it: ffmpeg -i ${file} -q:v 5 ${withExtension(file, '.jpg')} — this changes the extension, so update the link in the task.`,
    ].join('\n');
  }

  private forMovingImage(file: string): string {
    return [
      'First consider a strip of still frames instead of motion — a few moments side by side usually prove the change for a fraction of the size:',
      `  ffmpeg -i ${file} -vf "select='not(mod(n\\,100))',scale=360:-1,tile=4x1" -frames:v 1 ${withExtension(file, '.jpg')}`,
      `Fewer frames per second and less width: ffmpeg -i ${file} -vf fps=6,scale=560:-1 ${withExtension(file, `.small${path.extname(file)}`)}`,
      `Trim the start and the end: ffmpeg -ss 3 -t 10 -i ${file} -c copy ${withExtension(file, `.trimmed${path.extname(file)}`)}`,
    ].join('\n');
  }

  private forAnythingElse(): string {
    return [
      'Compress it, or reduce what it contains.',
      'If it is only a reference, keep it outside the repository and link to it from the task.',
    ].join('\n');
  }
}
