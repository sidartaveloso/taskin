# Audio Sounds for Taskin

This directory contains optional audio files that can be played during CLI operations.

## Included Sounds

### `start.mp3`

Played when you start a task with `taskin start` command.
Sound effect: CS:GO "Go Go Go!"

### `finish.mp3`

Played when you finish a task with `taskin finish` or `taskin done` command.
Sound effect: CS:GO "Bomb has been planted"

### `stop.mp3` (TODO)

Played when you pause a task with `taskin pause` or `taskin stop` command.
**Note:** This file needs to be added. Sound effect: (to be defined)

## How to Add Custom Sounds

1. **Built-in sounds**: Place MP3 files in this directory (`packages/cli/sounds/`)
2. **Project-specific sounds**: Create a `.taskin/` directory in your project root and add MP3 files there

## Adding Your Own Sounds

To add custom sounds:

1. Create a `.taskin/` directory in your project:

   ```bash
   mkdir .taskin
   ```

2. Add your MP3 files (you can customize any of these):

   ```bash
   cp /path/to/your/start-sound.mp3 .taskin/start.mp3
   cp /path/to/your/finish-sound.mp3 .taskin/finish.mp3
   cp /path/to/your/pause-sound.mp3 .taskin/stop.mp3
   ```

3. The sounds will play automatically on the respective commands!

## Disabling Sound

To disable sounds, use the `--no-sound` flag:

```bash
taskin start 001 --no-sound
taskin finish 001 --no-sound
taskin pause 001 --no-sound
```

## Requirements

The sound player uses system audio utilities. Make sure you have one of these installed:

- **Linux**: `mpg123`, `ffplay`, or `mplayer`
- **macOS**: `afplay` (built-in)
- **Windows**: Built-in Windows Media Player

### Installing audio players on Linux:

```bash
# Ubuntu/Debian
sudo apt-get install mpg123

# Fedora
sudo dnf install mpg123

# Arch
sudo pacman -S mpg123
```

## Notes

- Sounds are played asynchronously and won't block CLI operations
- If no sound file is found, the command executes silently
- Sound playback errors are silently ignored
