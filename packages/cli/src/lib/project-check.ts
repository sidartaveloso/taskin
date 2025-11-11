/**
 * Project validation utilities
 */

import { existsSync } from 'fs';
import path from 'path';
import { error } from './colors.js';

/**
 * Check if current directory is a taskin project
 * @returns true if .taskin.json exists
 */
export function isTaskinProject(cwd: string = process.cwd()): boolean {
  return existsSync(path.join(cwd, '.taskin.json'));
}

/**
 * Check if current directory is a taskin project, exit with error if not
 */
export function requireTaskinProject(cwd: string = process.cwd()): void {
  if (!isTaskinProject(cwd)) {
    error(
      'This directory is not initialized as a taskin project. Run "taskin init" first.',
    );
    process.exit(1);
  }
}
