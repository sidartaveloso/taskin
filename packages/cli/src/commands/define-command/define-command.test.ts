/**
 * Tests for defineCommand
 */

import { Command } from 'commander';
import { describe, expect, it, vi } from 'vitest';
import { defineCommand } from './define-command.js';

describe('defineCommand', () => {
  it('should create a command registration function', () => {
    const handler = vi.fn();
    const commandReg = defineCommand({
      name: 'test',
      description: 'Test command',
      handler,
    });

    expect(commandReg).toBeTypeOf('function');
  });

  it('should register a command with the program', () => {
    const program = new Command();
    const handler = vi.fn();

    const commandReg = defineCommand({
      name: 'test',
      description: 'Test command',
      handler,
    });

    commandReg(program);

    const commands = program.commands;
    expect(commands).toHaveLength(1);
    expect(commands[0]?.name()).toBe('test');
  });

  it('should register command with alias', () => {
    const program = new Command();
    const handler = vi.fn();

    const commandReg = defineCommand({
      name: 'test',
      description: 'Test command',
      alias: 't',
      handler,
    });

    commandReg(program);

    const command = program.commands[0];
    expect(command?.alias()).toBe('t');
  });

  it('should register command with options', () => {
    const program = new Command();
    const handler = vi.fn();

    const commandReg = defineCommand({
      name: 'test',
      description: 'Test command',
      options: [
        {
          flags: '-f, --force',
          description: 'Force flag',
        },
        {
          flags: '-n, --name <name>',
          description: 'Name option',
          defaultValue: 'default',
        },
      ],
      handler,
    });

    commandReg(program);

    const command = program.commands[0];
    const options = command?.options;

    expect(options).toHaveLength(2);
    expect(options?.[0]?.flags).toBe('-f, --force');
    expect(options?.[1]?.flags).toBe('-n, --name <name>');
  });

  it('should call handler when command is executed', async () => {
    const program = new Command();
    const handler = vi.fn().mockResolvedValue(undefined);

    const commandReg = defineCommand({
      name: 'test <arg>',
      description: 'Test command',
      handler,
    });

    commandReg(program);

    // Simulate command execution
    await program.parseAsync(['node', 'test', 'test', 'myarg']);

    expect(handler).toHaveBeenCalledWith(
      'myarg',
      expect.any(Object),
      expect.any(Object),
    );
  });

  it('should handle async handler errors', async () => {
    const program = new Command();
    const error = new Error('Test error');
    const handler = vi.fn().mockRejectedValue(error);
    const exitSpy = vi
      .spyOn(process, 'exit')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation((() => {}) as any);

    const commandReg = defineCommand({
      name: 'test',
      description: 'Test command',
      handler,
    });

    commandReg(program);

    await program.parseAsync(['node', 'test', 'test']);

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  it('should handle sync handler errors', async () => {
    const program = new Command();
    const error = new Error('Test error');
    const handler = vi.fn().mockImplementation(() => {
      throw error;
    });
    const exitSpy = vi
      .spyOn(process, 'exit')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation((() => {}) as any);

    const commandReg = defineCommand({
      name: 'test',
      description: 'Test command',
      handler,
    });

    commandReg(program);

    await program.parseAsync(['node', 'test', 'test']);

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});
