/**
 * Provider registry
 * Central registry of available task providers
 */

import type { ProviderInfo } from './provider-registry.types.js';

export const AVAILABLE_PROVIDERS: ProviderInfo[] = [
  {
    id: 'fs',
    name: '📁 File System',
    description: 'Store tasks as Markdown files in a local TASKS/ directory',
    packageName: '@opentask/taskin-fs-provider',
    configSchema: {
      required: ['tasksDir'],
      properties: {
        tasksDir: {
          type: 'string',
          description: 'Directory to store task files',
        },
      },
    },
    status: 'stable',
  },
  {
    id: 'redmine',
    name: '🔴 Redmine',
    description: 'Sync tasks with Redmine issues via REST API',
    packageName: '@opentask/taskin-redmine-provider',
    configSchema: {
      required: ['apiUrl', 'apiKey', 'projectId'],
      properties: {
        apiUrl: {
          type: 'string',
          description: 'Redmine server URL (e.g., https://redmine.example.com)',
        },
        apiKey: {
          type: 'string',
          description: 'Your Redmine API key',
          secret: true,
        },
        projectId: {
          type: 'string',
          description: 'Project identifier or ID',
        },
      },
    },
    status: 'coming-soon',
  },
  {
    id: 'jira',
    name: '🔵 Jira',
    description: 'Sync tasks with Jira issues via REST API',
    packageName: '@opentask/taskin-jira-provider',
    configSchema: {
      required: ['apiUrl', 'email', 'apiToken', 'projectKey'],
      properties: {
        apiUrl: {
          type: 'string',
          description: 'Jira server URL (e.g., https://company.atlassian.net)',
        },
        email: {
          type: 'string',
          description: 'Your Atlassian account email',
        },
        apiToken: {
          type: 'string',
          description: 'Your Jira API token',
          secret: true,
        },
        projectKey: {
          type: 'string',
          description: 'Project key (e.g., PROJ)',
        },
      },
    },
    status: 'coming-soon',
  },
  {
    id: 'github',
    name: '🐙 GitHub Issues',
    description: 'Sync tasks with GitHub Issues',
    packageName: '@opentask/taskin-github-provider',
    configSchema: {
      required: ['owner', 'repo', 'token'],
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner (username or organization)',
        },
        repo: {
          type: 'string',
          description: 'Repository name',
        },
        token: {
          type: 'string',
          description: 'GitHub Personal Access Token',
          secret: true,
        },
      },
    },
    status: 'coming-soon',
  },
];

export function getProviderById(id: string): ProviderInfo | undefined {
  return AVAILABLE_PROVIDERS.find((p) => p.id === id);
}

export function getAvailableProviders(): ProviderInfo[] {
  return AVAILABLE_PROVIDERS.filter((p) => p.status !== 'coming-soon');
}

export function getAllProviders(): ProviderInfo[] {
  return AVAILABLE_PROVIDERS;
}
