import { generateText } from '@ai-sdk/react';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { deepseek } from '@ai-sdk/deepseek';

export interface PromptConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'deepseek';
  model: string;
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
}

export interface CompiledPrompt {
  systemPrompt: string;
  userPrompt: string;
  tools?: any[];
  context?: Record<string, any>;
}

export class PromptCompiler {
  private config: PromptConfig;
  
  constructor(config: PromptConfig) {
    this.config = config;
  }

  /**
   * Compiles a multi-agent orchestration prompt
   */
  compileAgentPrompt(agents: string[], task: string): CompiledPrompt {
    const systemPrompt = this.buildSystemPrompt(agents);
    const userPrompt = this.buildUserPrompt(task);
    
    return {
      systemPrompt,
      userPrompt,
      tools: this.getAvailableTools()
    };
  }

  /**
   * Executes the compiled prompt using the configured LLM
   */
  async execute(compiled: CompiledPrompt) {
    const provider = this.getProvider();
    
    const result = await generateText({
      model: provider(this.config.model),
      prompt: compiled.userPrompt,
      system: compiled.systemPrompt,
      temperature: this.config.temperature || 0.7,
      maxTokens: this.config.maxTokens || 2000,
      tools: compiled.tools,
    });

    return result;
  }

  /**
   * Builds the system prompt for multi-agent orchestration
   */
  private buildSystemPrompt(agents: string[]): string {
    return `You are a multi-agent orchestrator coordinating the following specialized agents:
${agents.map(agent => `- ${agent}`).join('\n')}

Your role is to:
1. Analyze the task and determine which agents should handle it
2. Coordinate communication between agents
3. Ensure tools are used appropriately
4. Generate comprehensive solutions

Available tools include:
- Terminal operations (execute commands)
- Browser automation (navigate, click, scrape)
- File operations (read, write, edit)
- Web search capabilities
- Code generation and editing

Always think step by step and explain your reasoning before taking actions.`;
  }

  /**
   * Builds the user prompt for the specific task
   */
  private buildUserPrompt(task: string): string {
    return `Task: ${task}

Please:
1. Break down this task into manageable steps
2. Identify which agents and tools are needed
3. Execute the plan systematically
4. Provide detailed results and any issues encountered`;
  }

  /**
   * Returns available tools for the agents
   */
  private getAvailableTools(): any[] {
    return [
      {
        type: 'function',
        function: {
          name: 'execute_command',
          description: 'Execute a terminal command',
          parameters: {
            type: 'object',
            properties: {
              command: {
                type: 'string',
                description: 'The command to execute'
              }
            },
            required: ['command']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'write_file',
          description: 'Write content to a file',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              content: { type: 'string' }
            },
            required: ['path', 'content']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'read_file',
          description: 'Read content from a file',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string' }
            },
            required: ['path']
          }
        }
      }
    ];
  }

  /**
   * Gets the configured AI provider
   */
  private getProvider() {
    switch (this.config.provider) {
      case 'openai':
        return openai;
      case 'anthropic':
        return anthropic;
      case 'google':
        return google;
      case 'deepseek':
        return deepseek;
      default:
        return openai;
    }
  }
}