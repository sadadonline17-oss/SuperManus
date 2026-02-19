export interface ToolSchema {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, PropertySchema>;
    required?: string[];
  };
  returns?: string;
}

export interface PropertySchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  enum?: string[];
  default?: any;
}

export interface ToolCall {
  id: string;
  name: string;
  parameters: Record<string, any>;
}

export interface ToolResult {
  id: string;
  success: boolean;
  result?: any;
  error?: string;
}

/**
 * ToolSchemaSystem - JSON-RPC tool contracts from bolt.diy
 * Manages tool definitions and executes tool calls
 */
export class ToolSchemaSystem {
  private tools: Map<string, ToolSchema> = new Map();
  private handlers: Map<string, (params: any) => Promise<any>> = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  /**
   * Register a tool with its schema and handler
   */
  registerTool(schema: ToolSchema, handler: (params: any) => Promise<any>): void {
    this.tools.set(schema.name, schema);
    this.handlers.set(schema.name, handler);
  }

  /**
   * Register default tools from both systems
   */
  private registerDefaultTools(): void {
    // Terminal/Shell operations (from AI Manus)
    this.registerTool(
      {
        name: 'execute_command',
        description: 'Execute a shell command',
        parameters: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: 'The command to execute'
            },
            workingDir: {
              type: 'string',
              description: 'Working directory for the command'
            }
          },
          required: ['command']
        }
      },
      async (params) => this.executeCommandHandler(params)
    );

    // File operations (from AI Manus & bolt.diy)
    this.registerTool(
      {
        name: 'write_file',
        description: 'Write content to a file',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path'
            },
            content: {
              type: 'string',
              description: 'File content'
            },
            overwrite: {
              type: 'boolean',
              description: 'Overwrite existing file',
              default: true
            }
          },
          required: ['path', 'content']
        }
      },
      async (params) => this.writeFileHandler(params)
    );

    this.registerTool(
      {
        name: 'read_file',
        description: 'Read content from a file',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path'
            }
          },
          required: ['path']
        }
      },
      async (params) => this.readFileHandler(params)
    );

    this.registerTool(
      {
        name: 'delete_file',
        description: 'Delete a file',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path'
            }
          },
          required: ['path']
        }
      },
      async (params) => this.deleteFileHandler(params)
    );

    this.registerTool(
      {
        name: 'list_directory',
        description: 'List contents of a directory',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Directory path'
            },
            recursive: {
              type: 'boolean',
              description: 'List recursively',
              default: false
            }
          },
          required: ['path']
        }
      },
      async (params) => this.listDirectoryHandler(params)
    );

    // Browser automation (from AI Manus)
    this.registerTool(
      {
        name: 'browser_navigate',
        description: 'Navigate browser to a URL',
        parameters: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'URL to navigate to'
            }
          },
          required: ['url']
        }
      },
      async (params) => this.browserNavigateHandler(params)
    );

    this.registerTool(
      {
        name: 'browser_click',
        description: 'Click an element on the page',
        parameters: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: 'CSS selector for the element'
            }
          },
          required: ['selector']
        }
      },
      async (params) => this.browserClickHandler(params)
    );

    this.registerTool(
      {
        name: 'browser_scrape',
        description: 'Scrape content from a webpage',
        parameters: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'URL to scrape'
            },
            selector: {
              type: 'string',
              description: 'CSS selector to scrape (optional)'
            }
          },
          required: ['url']
        }
      },
      async (params) => this.browserScrapeHandler(params)
    );

    // Web search (from AI Manus)
    this.registerTool(
      {
        name: 'web_search',
        description: 'Search the web',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query'
            },
            numResults: {
              type: 'number',
              description: 'Number of results',
              default: 10
            }
          },
          required: ['query']
        }
      },
      async (params) => this.webSearchHandler(params)
    );

    // Code editing (from bolt.diy PatchDiffEngine)
    this.registerTool(
      {
        name: 'edit_code',
        description: 'Edit code using surgical patch operations',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path'
            },
            operation: {
              type: 'string',
              description: 'Operation type: replace, insert, delete',
              enum: ['replace', 'insert', 'delete']
            },
            oldValue: {
              type: 'string',
              description: 'Old value to replace/delete'
            },
            newValue: {
              type: 'string',
              description: 'New value to insert'
            }
          },
          required: ['path', 'operation']
        }
      },
      async (params) => this.editCodeHandler(params)
    );

    // Git operations (from bolt.diy)
    this.registerTool(
      {
        name: 'git_clone',
        description: 'Clone a git repository',
        parameters: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'Repository URL'
            },
            path: {
              type: 'string',
              description: 'Destination path'
            }
          },
          required: ['url', 'path']
        }
      },
      async (params) => this.gitCloneHandler(params)
    );

    this.registerTool(
      {
        name: 'git_commit',
        description: 'Commit changes',
        parameters: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Commit message'
            }
          },
          required: ['message']
        }
      },
      async (params) => this.gitCommitHandler(params)
    );

    // Expo operations (for React Native development)
    this.registerTool(
      {
        name: 'expo_build',
        description: 'Build Expo app for Android',
        parameters: {
          type: 'object',
          properties: {
            profile: {
              type: 'string',
              description: 'Build profile',
              enum: ['preview', 'production'],
              default: 'preview'
            }
          }
        }
      },
      async (params) => this.expoBuildHandler(params)
    );
  }

  /**
   * Get all registered tools
   */
  getTools(): ToolSchema[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get a specific tool schema
   */
  getTool(name: string): ToolSchema | undefined {
    return this.tools.get(name);
  }

  /**
   * Execute a tool call
   */
  async executeTool(call: ToolCall): Promise<ToolResult> {
    const handler = this.handlers.get(call.name);
    if (!handler) {
      return {
        id: call.id,
        success: false,
        error: `Tool not found: ${call.name}`
      };
    }

    try {
      const result = await handler(call.parameters);
      return {
        id: call.id,
        success: true,
        result
      };
    } catch (error) {
      return {
        id: call.id,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Validate tool parameters against schema
   */
  validateParameters(toolName: string, parameters: any): boolean {
    const schema = this.tools.get(toolName);
    if (!schema) return false;

    const { required = [] } = schema.parameters;
    for (const param of required) {
      if (!(param in parameters)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Convert tools to OpenAI function calling format
   */
  toOpenAIFunctions(): any[] {
    return this.getTools().map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }
    }));
  }

  /**
   * Handler implementations (to be connected to actual systems)
   */
  private async executeCommandHandler(params: any): Promise<any> {
    // This would connect to the actual command execution system
    return { output: 'Command executed', exitCode: 0 };
  }

  private async writeFileHandler(params: any): Promise<any> {
    // This would connect to WorkspaceEngine
    return { success: true, path: params.path };
  }

  private async readFileHandler(params: any): Promise<any> {
    // This would connect to WorkspaceEngine
    return { content: 'File content' };
  }

  private async deleteFileHandler(params: any): Promise<any> {
    // This would connect to WorkspaceEngine
    return { success: true };
  }

  private async listDirectoryHandler(params: any): Promise<any> {
    // This would connect to WorkspaceEngine
    return { files: ['file1.ts', 'file2.ts'] };
  }

  private async browserNavigateHandler(params: any): Promise<any> {
    // This would connect to Autonomous Bridge
    return { success: true, url: params.url };
  }

  private async browserClickHandler(params: any): Promise<any> {
    // This would connect to Autonomous Bridge
    return { success: true };
  }

  private async browserScrapeHandler(params: any): Promise<any> {
    // This would connect to Autonomous Bridge
    return { content: 'Scraped content' };
  }

  private async webSearchHandler(params: any): Promise<any> {
    // This would connect to search API
    return { results: [] };
  }

  private async editCodeHandler(params: any): Promise<any> {
    // This would connect to PatchDiffEngine
    return { success: true };
  }

  private async gitCloneHandler(params: any): Promise<any> {
    // This would connect to Git operations
    return { success: true, path: params.path };
  }

  private async gitCommitHandler(params: any): Promise<any> {
    // This would connect to Git operations
    return { success: true, hash: 'abc123' };
  }

  private async expoBuildHandler(params: any): Promise<any> {
    // This would connect to Expo CLI
    return { success: true, buildUrl: 'https://expo.dev/builds/123' };
  }
}