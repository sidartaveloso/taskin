export type { McpCommand, McpConfig, MergeOutcome, PackageManager, ProbeResult } from './mcp-install.types.js';
export { mergeMcpConfig, NOME_DO_SERVIDOR } from './merge-mcp-config.js';
export { detectPackageManager, mcpCommandFor } from './package-manager.js';
export { probeMcpServer } from './probe-server.js';
export { resolveInvocation } from './resolve-invocation.js';
