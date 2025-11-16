#!/usr/bin/env node

/**
 * Test script for MCP server
 * Tests basic MCP protocol communication
 */

import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CLI_PATH = join(__dirname, '../cli/dist/index.js');

function sendMessage(proc, message) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timeout waiting for response'));
    }, 5000);

    let buffer = '';

    const onData = (data) => {
      buffer += data.toString();
      try {
        // MCP messages are JSON-RPC format
        const lines = buffer.split('\n');
        for (const line of lines) {
          if (line.trim()) {
            const response = JSON.parse(line);
            clearTimeout(timeout);
            proc.stdout.off('data', onData);
            resolve(response);
            return;
          }
        }
      } catch (e) {
        // Not valid JSON yet, continue buffering
      }
    };

    proc.stdout.on('data', onData);
    proc.stdin.write(JSON.stringify(message) + '\n');
  });
}

async function testMCPServer() {
  console.log('🧪 Testing MCP Server...\n');

  // Start MCP server process
  const proc = spawn('node', [CLI_PATH, 'mcp-server'], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  proc.stderr.on('data', (data) => {
    const msg = data.toString();
    if (msg.includes('ERROR') || msg.includes('Error')) {
      console.error('❌ Error:', msg);
    }
  });

  try {
    // Test 1: Initialize
    console.log('1️⃣ Testing initialize...');
    const initResponse = await sendMessage(proc, {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0',
        },
      },
    });
    console.log(
      '✅ Initialize successful:',
      initResponse.result?.serverInfo?.name,
    );

    // Test 2: List tools
    console.log('\n2️⃣ Testing tools/list...');
    const toolsResponse = await sendMessage(proc, {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {},
    });
    console.log(
      '✅ Tools available:',
      toolsResponse.result?.tools?.length || 0,
    );
    toolsResponse.result?.tools?.forEach((tool) => {
      console.log(`   • ${tool.name}: ${tool.description}`);
    });

    // Test 3: List prompts
    console.log('\n3️⃣ Testing prompts/list...');
    const promptsResponse = await sendMessage(proc, {
      jsonrpc: '2.0',
      id: 3,
      method: 'prompts/list',
      params: {},
    });
    console.log(
      '✅ Prompts available:',
      promptsResponse.result?.prompts?.length || 0,
    );

    // Test 4: List resources
    console.log('\n4️⃣ Testing resources/list...');
    const resourcesResponse = await sendMessage(proc, {
      jsonrpc: '2.0',
      id: 4,
      method: 'resources/list',
      params: {},
    });
    console.log(
      '✅ Resources available:',
      resourcesResponse.result?.resources?.length || 0,
    );

    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    proc.kill();
  }
}

testMCPServer();
