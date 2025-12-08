import type { TaskFile } from '@opentask/taskin-task-manager';
import type { TaskId } from '@opentask/taskin-types';
import { promises as fs } from 'fs';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FileSystemTaskProvider } from './fs-task-provider';
import type { UserRegistry } from './user-registry';

vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
    readdir: vi.fn(),
    access: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
  },
}));

const mockUserRegistryInstance = {
  load: vi.fn().mockResolvedValue(undefined),
  resolveUser: vi.fn().mockReturnValue(undefined),
  createTemporaryUser: vi.fn((name: string) => ({
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
  })),
};

vi.mock('./user-registry', () => ({
  UserRegistry: vi.fn().mockImplementation(() => mockUserRegistryInstance),
}));

describe('FileSystemTaskProvider', () => {
  let provider: FileSystemTaskProvider;
  const TASKS_DIR = '/fake/tasks';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    provider = new FileSystemTaskProvider(
      TASKS_DIR,
      mockUserRegistryInstance as unknown as UserRegistry,
    );
  });

  describe('findTask', () => {
    it('should find and parse a task file', async () => {
      (fs.readdir as Mock).mockResolvedValue(['task-001-do-stuff.md']);
      (fs.readFile as Mock).mockResolvedValue('# Task 001 - Do Stuff');

      const task = await provider.findTask('001');

      expect(task).toBeDefined();
      expect(task?.id).toBe('001');
      expect(task?.title).toBe('Do Stuff');
      expect(fs.readdir).toHaveBeenCalledWith(TASKS_DIR);
      expect(fs.readFile).toHaveBeenCalledWith(
        '/fake/tasks/task-001-do-stuff.md',
        'utf-8',
      );
    });

    it('should return undefined if task file is not found', async () => {
      (fs.readdir as Mock).mockResolvedValue(['task-002-other-stuff.md']);
      const task = await provider.findTask('001');
      expect(task).toBeUndefined();
    });
  });

  describe('updateTask', () => {
    it('should update the Status section in the file', async () => {
      const originalContent = `# Task 001 — Test Task

## Status
pending

## Type
feat

## Assignee
Test User

## Description
Test description`;

      const expectedContent = `# Task 001 — Test Task

## Status
in-progress

## Type
feat

## Assignee
Test User

## Description
Test description`;

      (fs.readFile as Mock).mockResolvedValue(originalContent);

      const mockTask: TaskFile = {
        content: 'not used in updateTask',
        createdAt: new Date().toISOString(),
        filePath: '/fake/tasks/task-001.md',
        id: '001' satisfies string as TaskId,
        status: 'in-progress',
        title: 'Test Task',
        type: 'feat',
      };

      await provider.updateTask(mockTask);

      expect(fs.readFile).toHaveBeenCalledWith(mockTask.filePath, 'utf-8');
      expect(fs.writeFile).toHaveBeenCalledWith(
        mockTask.filePath,
        expectedContent,
        'utf-8',
      );
    });
  });
  describe('createTask', () => {
    it('should create a task file using en-US i18n', async () => {
      const title = 'Test Title';
      const fileName = 'task-001-test-title.md';
      const filePath = `${TASKS_DIR}/${fileName}`;

      // First readdir (getAllTasks) -> no files, second readdir (findTask) -> newly created file
      (fs.readdir as Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([fileName]);
      (fs.access as Mock).mockRejectedValue(new Error('not found'));
      (fs.writeFile as Mock).mockResolvedValue(undefined);

      // After creation, findTask will read the file
      const createdContent = `# 🧩 Task 001 — ${title}\n\n## Status\n\npending`;
      (fs.readFile as Mock).mockResolvedValue(createdContent);

      (mockUserRegistryInstance.resolveUser as Mock).mockReturnValue(undefined);
      (mockUserRegistryInstance.createTemporaryUser as Mock).mockImplementation(
        (name: string) => ({ id: 'temp', name, email: `${name}@example.com` }),
      );

      const result = await provider.createTask({ title, type: 'feat' });

      expect(result.taskId).toBe('001');
      expect(result.filePath).toBe(filePath);
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining(fileName),
        expect.any(String),
        'utf-8',
      );
      // Ensure the generated content uses English section names
      const written = (fs.writeFile as Mock).mock.calls[0][1] as string;
      expect(written).toContain('## Status');
      expect(written).toContain('## Type');
      expect(written).toContain('## Assignee');
    });

    it('should create a task file using pt-BR i18n', async () => {
      const title = 'Título Teste';
      const titleSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const fileName = `task-001-${titleSlug}.md`;
      const filePath = `${TASKS_DIR}/${fileName}`;

      const providerPT = new FileSystemTaskProvider(
        TASKS_DIR,
        mockUserRegistryInstance as unknown as UserRegistry,
        'pt-BR',
      );

      (fs.readdir as Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([fileName]);
      (fs.access as Mock).mockRejectedValue(new Error('not found'));
      (fs.writeFile as Mock).mockResolvedValue(undefined);

      const createdContent = `# 🧩 Task 001 — ${title}\n\n## Status\n\npending`;
      (fs.readFile as Mock).mockResolvedValue(createdContent);

      (mockUserRegistryInstance.resolveUser as Mock).mockReturnValue(undefined);
      (mockUserRegistryInstance.createTemporaryUser as Mock).mockImplementation(
        (name: string) => ({ id: 'temp', name, email: `${name}@example.com` }),
      );

      const result = await providerPT.createTask({ title, type: 'feat' });

      expect(result.taskId).toBe('001');
      expect(result.filePath).toBe(filePath);
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining(fileName),
        expect.any(String),
        'utf-8',
      );
      const written = (fs.writeFile as Mock).mock.calls[0][1] as string;
      // Ensure the generated content uses Portuguese section names
      expect(written).toContain('## Status');
      expect(written).toContain('## Tipo');
      expect(written).toContain('## Responsável');
    });
  });

  describe('getAllTasks', () => {
    it('should return empty array when no task files exist', async () => {
      (fs.readdir as Mock).mockResolvedValue([]);

      const tasks = await provider.getAllTasks();

      expect(tasks).toEqual([]);
      expect(fs.readdir).toHaveBeenCalledWith(TASKS_DIR);
    });

    it('should parse all task files with correct metadata', async () => {
      const taskFiles = ['task-001-first-task.md', 'task-002-second-task.md'];

      const task1Content = `# Task 001 — First Task

## Status
in-progress

## Type
feat

## Assignee
John Doe

## Description
First task description`;

      const task2Content = `# Task 002 — Second Task

## Status
done

## Type
fix

## Assignee
Jane Smith

## Description
Second task description`;

      (fs.readdir as Mock).mockResolvedValue(taskFiles);
      (fs.readFile as Mock)
        .mockResolvedValueOnce(task1Content)
        .mockResolvedValueOnce(task2Content);

      (mockUserRegistryInstance.resolveUser as Mock).mockReturnValue(undefined);
      (mockUserRegistryInstance.createTemporaryUser as Mock).mockImplementation(
        (name: string) => ({
          id: name.toLowerCase().replace(/\s+/g, '-'),
          name,
          email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        }),
      );

      const tasks = await provider.getAllTasks();

      expect(tasks).toHaveLength(2);

      // Verify first task
      expect(tasks[0].id).toBe('001');
      expect(tasks[0].title).toBe('First Task');
      expect(tasks[0].status).toBe('in-progress');
      expect(tasks[0].type).toBe('feat');
      expect(tasks[0].assignee).toEqual({
        id: 'john-doe',
        name: 'John Doe',
        email: 'john.doe@example.com',
      });
      expect(tasks[0].filePath).toBe('/fake/tasks/task-001-first-task.md');
      expect(tasks[0].content).toBe(task1Content);

      // Verify second task
      expect(tasks[1].id).toBe('002');
      expect(tasks[1].title).toBe('Second Task');
      expect(tasks[1].status).toBe('done');
      expect(tasks[1].type).toBe('fix');
      expect(tasks[1].assignee).toEqual({
        id: 'jane-smith',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
      });
      expect(tasks[1].filePath).toBe('/fake/tasks/task-002-second-task.md');
      expect(tasks[1].content).toBe(task2Content);
    });

    it('should handle tasks without assignee', async () => {
      const taskContent = `# Task 001 — Task Without Assignee

## Status
pending

## Type
feat

## Description
Task without assignee`;

      (fs.readdir as Mock).mockResolvedValue(['task-001-no-assignee.md']);
      (fs.readFile as Mock).mockResolvedValue(taskContent);

      const tasks = await provider.getAllTasks();

      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe('001');
      expect(tasks[0].title).toBe('Task Without Assignee');
      expect(tasks[0].status).toBe('pending');
      expect(tasks[0].type).toBe('feat');
      expect(tasks[0].assignee).toBeUndefined();
    });

    it('should use default values for missing status and type', async () => {
      const taskContent = `# Task 001 — Minimal Task

## Description
Minimal task with no status or type`;

      (fs.readdir as Mock).mockResolvedValue(['task-001-minimal.md']);
      (fs.readFile as Mock).mockResolvedValue(taskContent);

      const tasks = await provider.getAllTasks();

      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe('001');
      expect(tasks[0].status).toBe('pending');
      expect(tasks[0].type).toBe('feat');
    });

    it('should parse pt-BR localized task files', async () => {
      const taskContentPT = `# Task 001 — Tarefa em Português

## Status
em-progresso

## Tipo
feat

## Responsável
João Silva

## Descrição
Descrição da tarefa`;

      (fs.readdir as Mock).mockResolvedValue(['task-001-tarefa.md']);
      (fs.readFile as Mock).mockResolvedValue(taskContentPT);

      (mockUserRegistryInstance.resolveUser as Mock).mockReturnValue(undefined);
      (mockUserRegistryInstance.createTemporaryUser as Mock).mockImplementation(
        (name: string) => ({
          id: name.toLowerCase().replace(/\s+/g, '-'),
          name,
          email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        }),
      );

      const tasks = await provider.getAllTasks();

      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe('001');
      expect(tasks[0].title).toBe('Tarefa em Português');
      expect(tasks[0].status).toBe('em-progresso');
      expect(tasks[0].type).toBe('feat');
      expect(tasks[0].assignee).toEqual({
        id: 'joão-silva',
        name: 'João Silva',
        email: 'joão.silva@example.com',
      });
    });

    it('should resolve assignee from user registry when available', async () => {
      const taskContent = `# Task 001 — Task With Registered User

## Status
in-progress

## Type
feat

## Assignee
registereduser

## Description
Task with registered user`;

      const registeredUser = {
        id: 'user-123',
        name: 'Registered User',
        email: 'registered@example.com',
      };

      (fs.readdir as Mock).mockResolvedValue(['task-001-registered.md']);
      (fs.readFile as Mock).mockResolvedValue(taskContent);
      (mockUserRegistryInstance.resolveUser as Mock).mockReturnValue(
        registeredUser,
      );

      const tasks = await provider.getAllTasks();

      expect(tasks).toHaveLength(1);
      expect(tasks[0].assignee).toEqual(registeredUser);
      expect(mockUserRegistryInstance.resolveUser).toHaveBeenCalledWith(
        'registereduser',
      );
    });

    it('should filter out non-task files', async () => {
      const files = [
        'task-001-valid.md',
        'README.md',
        'notes.txt',
        'task-002-another.md',
        '.gitignore',
      ];

      const task1Content = `# Task 001 — Valid Task\n\n## Status\npending`;
      const task2Content = `# Task 002 — Another Task\n\n## Status\npending`;

      (fs.readdir as Mock).mockResolvedValue(files);
      (fs.readFile as Mock)
        .mockResolvedValueOnce(task1Content)
        .mockResolvedValueOnce(task2Content);

      const tasks = await provider.getAllTasks();

      expect(tasks).toHaveLength(2);
      expect(tasks[0].id).toBe('001');
      expect(tasks[1].id).toBe('002');
      expect(fs.readFile).toHaveBeenCalledTimes(2);
    });
  });

  describe('complete task lifecycle', () => {
    it('should handle full workflow: create -> list -> start -> pause -> resume -> finish', async () => {
      const title = 'Lifecycle Test Task';

      // Step 1: Create task (ID will be auto-generated as '001')
      (fs.access as Mock).mockRejectedValue(new Error('not found'));
      (fs.mkdir as Mock).mockResolvedValue(undefined);

      // Mock readdir for creation flow (getAllTasks check, then findTask)
      (fs.readdir as Mock)
        .mockResolvedValueOnce([]) // getAllTasks returns empty initially
        .mockResolvedValue(['task-001-lifecycle-test-task.md']); // findTask finds the created file

      // Reset user registry mocks
      (mockUserRegistryInstance.resolveUser as Mock).mockReturnValue(undefined);
      (mockUserRegistryInstance.createTemporaryUser as Mock).mockImplementation(
        (name: string) => ({
          id: name.toLowerCase().replace(/\s+/g, '-'),
          name,
          email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        }),
      );

      // Use the ACTUAL content written by createTask (captured from writeFile mock)
      let currentFileContent = '';
      (fs.writeFile as Mock).mockImplementation(
        async (_path: string, content: string) => {
          currentFileContent = content;
        },
      );
      (fs.readFile as Mock).mockImplementation(async () => currentFileContent);

      const result = await provider.createTask({
        title,
        type: 'feat',
        assignee: 'Test User',
        description: 'Test lifecycle',
      });

      const taskId = result.taskId;
      expect(taskId).toBe('001');
      expect(result.task.title).toBe(title);
      expect(result.task.status).toBe('pending');
      expect(fs.writeFile).toHaveBeenCalledTimes(1);

      // Step 2: List tasks - verify data consistency
      let tasks = await provider.getAllTasks();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe('001');
      expect(tasks[0].title).toBe(title);
      expect(tasks[0].status).toBe('pending');
      expect(tasks[0].type).toBe('feat');
      expect(tasks[0].assignee?.name).toBe('Test User');

      // Step 3: Start task (pending -> in-progress)
      const taskToStart = await provider.findTask(taskId);
      await provider.updateTask({ ...taskToStart!, status: 'in-progress' });
      expect(fs.writeFile).toHaveBeenCalledTimes(2);

      // Step 4: List tasks - verify status changed but other data preserved
      tasks = await provider.getAllTasks();
      expect(tasks[0].id).toBe('001');
      expect(tasks[0].title).toBe(title);
      expect(tasks[0].status).toBe('in-progress');
      expect(tasks[0].type).toBe('feat');
      expect(tasks[0].assignee?.name).toBe('Test User');

      // Step 5: Pause task (in-progress -> blocked)
      const taskToPause = await provider.findTask(taskId);
      await provider.updateTask({ ...taskToPause!, status: 'blocked' });
      expect(fs.writeFile).toHaveBeenCalledTimes(3);

      // Step 6: List tasks - verify status changed but other data preserved
      tasks = await provider.getAllTasks();
      expect(tasks[0].id).toBe('001');
      expect(tasks[0].title).toBe(title);
      expect(tasks[0].status).toBe('blocked');
      expect(tasks[0].type).toBe('feat');
      expect(tasks[0].assignee?.name).toBe('Test User');

      // Step 7: Resume task (blocked -> in-progress)
      const taskToResume = await provider.findTask(taskId);
      await provider.updateTask({ ...taskToResume!, status: 'in-progress' });
      expect(fs.writeFile).toHaveBeenCalledTimes(4);

      // Step 8: List tasks - verify status changed but other data preserved
      tasks = await provider.getAllTasks();
      expect(tasks[0].id).toBe('001');
      expect(tasks[0].title).toBe(title);
      expect(tasks[0].status).toBe('in-progress');
      expect(tasks[0].type).toBe('feat');
      expect(tasks[0].assignee?.name).toBe('Test User');

      // Step 9: Finish task (in-progress -> done)
      const taskToFinish = await provider.findTask(taskId);
      await provider.updateTask({ ...taskToFinish!, status: 'done' });
      expect(fs.writeFile).toHaveBeenCalledTimes(5);

      // Step 10: Final verification - all original data preserved
      tasks = await provider.getAllTasks();
      expect(tasks[0].id).toBe('001');
      expect(tasks[0].title).toBe(title);
      expect(tasks[0].status).toBe('done');
      expect(tasks[0].type).toBe('feat');
      expect(tasks[0].assignee?.name).toBe('Test User');
    });

    it('should handle direct transitions: create -> start -> finish', async () => {
      const title = 'Quick Task';

      // Create task (ID will be auto-generated as '001')
      (fs.access as Mock).mockRejectedValue(new Error('not found'));
      (fs.mkdir as Mock).mockResolvedValue(undefined);
      (fs.readdir as Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValue(['task-001-quick-task.md']);

      // Capture the actual written content
      let currentFileContent = '';
      (fs.writeFile as Mock).mockImplementation(
        async (_path: string, content: string) => {
          currentFileContent = content;
        },
      );
      (fs.readFile as Mock).mockImplementation(async () => currentFileContent);

      const result = await provider.createTask({
        title,
        type: 'fix',
        assignee: 'Dev',
        description: 'Quick fix',
      });

      const taskId = result.taskId;
      expect(result.task.status).toBe('pending');
      expect(result.task.title).toBe(title);
      expect(result.task.type).toBe('fix');
      expect(result.task.assignee?.name).toBe('Dev');

      // Start immediately
      const taskToStart = await provider.findTask(taskId);
      await provider.updateTask({ ...taskToStart!, status: 'in-progress' });

      let tasks = await provider.getAllTasks();
      expect(tasks[0].id).toBe('001');
      expect(tasks[0].title).toBe(title);
      expect(tasks[0].status).toBe('in-progress');
      expect(tasks[0].type).toBe('fix');
      expect(tasks[0].assignee?.name).toBe('Dev');

      // Finish directly
      const taskToFinish = await provider.findTask(taskId);
      await provider.updateTask({ ...taskToFinish!, status: 'done' });

      tasks = await provider.getAllTasks();
      expect(tasks[0].id).toBe('001');
      expect(tasks[0].title).toBe(title);
      expect(tasks[0].status).toBe('done');
      expect(tasks[0].type).toBe('fix');
      expect(tasks[0].assignee?.name).toBe('Dev');

      // Verify only 3 writes: create, start, finish
      expect(fs.writeFile).toHaveBeenCalledTimes(3);
    });
  });
});
