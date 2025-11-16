import type { ITaskManager } from '@opentask/taskin-task-manager';

/**
 * MCP Server configuration
 */
export interface MCPServerConfig {
  /**
   * TaskManager instance to expose via MCP
   */
  taskManager: ITaskManager;

  /**
   * Server name
   * @default 'taskin-mcp-server'
   */
  name?: string;

  /**
   * Server version
   * @default '1.0.0'
   */
  version?: string;

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;
}

/**
 * MCP Tool definition
 */
export interface MCPTool {
  /**
   * Unique tool identifier
   */
  name: string;

  /**
   * Human-readable description
   */
  description: string;

  /**
   * Input schema (JSON Schema)
   */
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * MCP Prompt definition
 */
export interface MCPPrompt {
  /**
   * Unique prompt identifier
   */
  name: string;

  /**
   * Human-readable description
   */
  description: string;

  /**
   * Optional arguments
   */
  arguments?: Array<{
    name: string;
    description: string;
    required?: boolean;
  }>;
}

/**
 * MCP Resource definition
 */
export interface MCPResource {
  /**
   * Resource URI (e.g., "task://123")
   */
  uri: string;

  /**
   * Human-readable name
   */
  name: string;

  /**
   * Resource description
   */
  description?: string;

  /**
   * MIME type
   */
  mimeType?: string;
}

/**
 * MCP Tool call parameters
 */
export interface MCPToolCallParams {
  /**
   * Tool name
   */
  name: string;

  /**
   * Tool arguments
   */
  arguments?: Record<string, unknown>;
}

/**
 * MCP Tool call result
 */
export interface MCPToolCallResult {
  /**
   * Result content
   */
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;

  /**
   * Whether the call was successful
   */
  isError?: boolean;
}

/**
 * MCP Prompt get parameters
 */
export interface MCPPromptGetParams {
  /**
   * Prompt name
   */
  name: string;

  /**
   * Prompt arguments
   */
  arguments?: Record<string, string>;
}

/**
 * MCP Prompt messages
 */
export interface MCPPromptMessage {
  /**
   * Message role
   */
  role: 'user' | 'assistant';

  /**
   * Message content
   */
  content: {
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  };
}

/**
 * MCP Prompt get result
 */
export interface MCPPromptGetResult {
  /**
   * Prompt description
   */
  description?: string;

  /**
   * Prompt messages
   */
  messages: MCPPromptMessage[];
}

/**
 * MCP Resource read parameters
 */
export interface MCPResourceReadParams {
  /**
   * Resource URI
   */
  uri: string;
}

/**
 * MCP Resource read result
 */
export interface MCPResourceReadResult {
  /**
   * Resource contents
   */
  contents: Array<{
    uri: string;
    mimeType?: string;
    text?: string;
    blob?: string;
  }>;
}

/**
 * MCP Resource list result
 */
export interface MCPResourceListResult {
  /**
   * Available resources
   */
  resources: MCPResource[];
}

/**
 * Task server MCP interface
 */
export interface ITaskMCPServer {
  /**
   * Get server information
   */
  getServerInfo(): {
    name: string;
    version: string;
    protocolVersion: string;
    capabilities: {
      tools?: Record<string, unknown>;
      prompts?: Record<string, unknown>;
      resources?: Record<string, unknown>;
    };
  };

  /**
   * List available tools
   */
  listTools(): { tools: MCPTool[] };

  /**
   * Call a tool
   */
  callTool(params: MCPToolCallParams): Promise<MCPToolCallResult>;

  /**
   * List available prompts
   */
  listPrompts(): { prompts: MCPPrompt[] };

  /**
   * Get a prompt
   */
  getPrompt(params: MCPPromptGetParams): Promise<MCPPromptGetResult>;

  /**
   * List available resources
   */
  listResources(): Promise<MCPResourceListResult>;

  /**
   * Read a resource
   */
  readResource(params: MCPResourceReadParams): Promise<MCPResourceReadResult>;
}

/**
 * MCP Transport type
 */
export type MCPTransportType = 'stdio' | 'sse';

/**
 * MCP Connection options
 */
export interface MCPConnectionOptions {
  /**
   * Transport type
   */
  transport: MCPTransportType;

  /**
   * Additional transport options
   */
  options?: Record<string, unknown>;
}
