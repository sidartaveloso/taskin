/**
 * Tells how to shrink a file that is over the attachment size limit.
 *
 * @public
 */
export interface ISizeReductionHint {
  /**
   * What to try, one action per line, with the command ready to run.
   *
   * @param file - the offending file, as the commands should name it
   */
  for(file: string): string;
}
