/**
 * Sound player utility
 */

import { existsSync } from 'fs';
import path from 'path';
import player from 'play-sound';

const soundPlayer = player({});

/**
 * Play a sound file
 * @param soundName - Name of the sound file (without extension)
 */
export function playSound(soundName: string): void {
  // Suppress sounds during tests
  if (process.env.CI === 'true' || process.env.NODE_ENV === 'test') {
    return;
  }

  try {
    // Try to find the sound file in multiple locations
    const possiblePaths = [
      // In development (from src)
      path.join(process.cwd(), 'packages', 'cli', 'sounds', `${soundName}.mp3`),
      // In production (relative to dist)
      path.join(__dirname, '..', 'sounds', `${soundName}.mp3`),
      // Custom sound in project root
      path.join(process.cwd(), '.taskin', `${soundName}.mp3`),
    ];

    const soundPath = possiblePaths.find((p) => existsSync(p));

    if (!soundPath) {
      // Silently fail if sound file not found
      return;
    }

    // Play sound without blocking
    soundPlayer.play(soundPath, (err) => {
      if (err) {
        // Silently ignore playback errors
        return;
      }
    });
  } catch {
    // Silently ignore any errors
  }
}

/**
 * Check if sound playback is available
 */
export function isSoundAvailable(): boolean {
  try {
    const possiblePaths = [
      path.join(process.cwd(), 'sounds', 'stop.mp3'),
      path.join(__dirname, '..', '..', 'sounds', 'stop.mp3'),
      path.join(process.cwd(), '.taskin', 'stop.mp3'),
    ];

    return possiblePaths.some((p) => existsSync(p));
  } catch {
    return false;
  }
}
