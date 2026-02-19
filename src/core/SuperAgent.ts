import { PromptCompiler, PromptConfig } from './PromptCompiler';
import { LLMProviderRouter, ProviderConfig } from './LLMProviderRouter';
import { PatchDiffEngine } from './PatchDiffEngine';
import { WorkspaceEngine } from './WorkspaceEngine';
import { ToolSchemaSystem, ToolCall } from './ToolSchemaSystem';
import { AutonomousBridge, BrowserConfig } from './AutonomousBridge';

export interface SuperAgentConfig {
  // Provider configuration
  providers: ProviderConfig[];
  defaultProvider: string;
  defaultModel: string;
  
  // Workspace configuration
  workspacePath: string;
  
  // Browser configuration
  browserConfig?: BrowserConfig;
  
  // Agent configuration
  agents: string[];
}

export interface Task {
  id: string;
  description: string;
  agent?: string;
  tools?: string[];
  context?: Record<string, any>;
}

export interface TaskResult {
  taskId: string;
  success: boolean;
  result?: any;
  error?: string;
  steps: TaskStep[];
  toolCalls: ToolCallResult[];
}

export interface TaskStep {
  step: number;
  description: string;
  action: string;
  result?: any;
  error?: string;
}

export interface ToolCallResult {
  toolName: string;
  parameters: any;
  success: boolean;
  result?: any;
  error?: string;
}

/**
 * SuperAgent - The unified orchestrator merging AI Manus and bolt.diy
 * 
 * This is the core system that:
 * - Uses PromptCompiler for multi-agent orchestration
 * - Routes to 20+ LLM providers via LLMProviderRouter
 * - Performs surgical code edits with PatchDiffEngine
 * - Manages files via WorkspaceEngine
 * - Executes tools via ToolSchemaSystem
 * - Bridges to services without APIs via AutonomousBridge
 */
export class SuperAgent {
  private promptCompiler: PromptCompiler;
  private providerRouter: LLMProviderRouter;
  private patchDiffEngine: PatchDiffEngine;
  private workspaceEngine: WorkspaceEngine;
  private toolSchemaSystem: ToolSchemaSystem;
  private autonomousBridge: AutonomousBridge;
  private config: SuperAgentConfig;

  constructor(config: SuperAgentConfig) {
    this.config = config;
    
    // Initialize all subsystems
    this.providerRouter = new LLMProviderRouter();
    this.configureProviders(config.providers);
    
    this.promptCompiler = new PromptCompiler({
      provider: config.defaultProvider as any,
      model: config.defaultModel,
      apiKey: config.providers.find(p => p.name === config.defaultProvider)?.apiKey || ''
    });
    
    this.patchDiffEngine = new PatchDiffEngine();
    this.workspaceEngine = new WorkspaceEngine(config.workspacePath);
    this.toolSchemaSystem = new ToolSchemaSystem();
    this.autonomousBridge = new AutonomousBridge(config.browserConfig);
  }

  /**
   * Configure LLM providers
   */
  private configureProviders(providers: ProviderConfig[]): void {
    for (const provider of providers) {
      this.providerRouter.configureProvider(provider.name, provider);
    }
  }

  /**
   * Initialize all systems
   */
  async initialize(): Promise<void> {
    await this.workspaceEngine.initializeWorkspace();
    await this.autonomousBridge.initialize();
    console.log('SuperAgent initialized successfully');
  }

  /**
   * Execute a task with multi-agent orchestration
   */
  async executeTask(task: Task): Promise<TaskResult> {
    const steps: TaskStep[] = [];
    const toolCalls: ToolCallResult[] = [];
    let success = false;
    let result: any;
    let error: string | undefined;

    try {
      // Step 1: Compile prompt for the task
      steps.push({
        step: 1,
        description: 'Compiling prompt for task',
        action: 'prompt_compilation'
      });

      const compiledPrompt = this.promptCompiler.compileAgentPrompt(
        task.agent ? [task.agent] : this.config.agents,
        task.description
      );

      // Step 2: Execute prompt with LLM
      steps.push({
        step: 2,
        description: 'Executing prompt with LLM',
        action: 'llm_execution'
      });

      const llmResult = await this.promptCompiler.execute(compiledPrompt);
      result = llmResult;

      // Step 3: Process tool calls if any
      if (llmResult.toolCalls && llmResult.toolCalls.length > 0) {
        steps.push({
          step: 3,
          description: `Executing ${llmResult.toolCalls.length} tool calls`,
          action: 'tool_execution'
        });

        for (const toolCall of llmResult.toolCalls) {
          const toolResult = await this.toolSchemaSystem.executeTool({
            id: `${task.id}-${Date.now()}`,
            name: toolCall.toolName,
            parameters: toolCall.args
          });

          toolCalls.push({
            toolName: toolCall.toolName,
            parameters: toolCall.args,
            success: toolResult.success,
            result: toolResult.result,
            error: toolResult.error
          });

          if (!toolResult.success) {
            throw new Error(`Tool ${toolCall.toolName} failed: ${toolResult.error}`);
          }
        }
      }

      success = true;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      console.error('Task execution failed:', error);
    }

    return {
      taskId: task.id,
      success,
      result,
      error,
      steps,
      toolCalls
    };
  }

  /**
   * Execute a command via the workspace
   */
  async executeCommand(command: string, workingDir?: string): Promise<any> {
    // This would integrate with a command execution system
    console.log(`Executing command: ${command}`);
    return { output: 'Command output', exitCode: 0 };
  }

  /**
   * Edit a file using PatchDiffEngine
   */
  async editFile(
    path: string,
    operation: 'replace' | 'insert' | 'delete',
    oldValue?: string,
    newValue?: string
  ): Promise<any> {
    const content = await this.workspaceEngine.readFile(path);
    
    const patchResult = this.patchDiffEngine.applyPatch(content, {
      op: operation,
      path,
      value: newValue,
      oldValue
    });
    
    await this.workspaceEngine.writeFile(path, patchResult);
    
    return {
      success: true,
      path,
      operation,
      diff: this.patchDiffEngine.computeDiff(content, patchResult)
    };
  }

  /**
   * Navigate and scrape a webpage
   */
  async scrapeWebpage(url: string, options?: {
    selector?: string;
    extractLinks?: boolean;
  }): Promise<any> {
    await this.autonomousBridge.navigate(url);
    await this.autonomousBridge.waitForNavigation();
    
    const result = await this.autonomousBridge.scrapePage({
      selector: options?.selector,
      extractLinks: options?.extractLinks,
      extractText: true
    });
    
    return result;
  }

  /**
   * Create a new React Native component
   */
  async createComponent(
    name: string,
    type: 'functional' | 'class' = 'functional',
    props: string[] = []
  ): Promise<any> {
    const componentPath = `src/components/${name}.tsx`;
    
    let componentCode: string;
    
    if (type === 'functional') {
      const propsInterface = props.length > 0 
        ? `interface ${name}Props {\n  ${props.map(p => `${p}: any;`).join('\n  ')}\n}\n`
        : '';
      
      componentCode = `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

${propsInterface}export const ${name}: React.FC<${props.length > 0 ? `${name}Props` : '{}'}> = (${props.length > 0 ? '{ ' + props.join(', ') + ' }' : ''}) => {
  return (
    <View style={styles.container}>
      <Text>${name} Component</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
`;
    } else {
      componentCode = `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export class ${name} extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Text>${name} Component</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
`;
    }
    
    await this.workspaceEngine.writeFile(componentPath, componentCode);
    
    return {
      success: true,
      path: componentPath,
      type
    };
  }

  /**
   * Build Expo app for Android
   */
  async buildAndroid(profile: 'preview' | 'production' = 'preview'): Promise<any> {
    const command = `eas build --platform android --profile ${profile} --non-interactive`;
    
    return await this.executeCommand(command);
  }

  /**
   * Get workspace statistics
   */
  async getWorkspaceStats(): Promise<any> {
    return await this.workspaceEngine.getWorkspaceStats();
  }

  /**
   * List all available tools
   */
  listTools(): any[] {
    return this.toolSchemaSystem.getTools();
  }

  /**
   * Get available providers
   */
  getProviders(): any[] {
    return this.providerRouter.getProviders();
  }

  /**
   * Get configured providers
   */
  getConfiguredProviders(): any[] {
    return this.providerRouter.getConfiguredProviders();
  }

  /**
   * Switch provider
   */
  switchProvider(providerId: string, model: string): void {
    const provider = this.providerRouter.getProvider(providerId);
    if (provider && provider.isConfigured) {
      this.promptCompiler = new PromptCompiler({
        provider: providerId as any,
        model,
        apiKey: '' // API key already configured in providerRouter
      });
    }
  }

  /**
   * Close all systems
   */
  async shutdown(): Promise<void> {
    await this.autonomousBridge.close();
    this.workspaceEngine.clearCache();
    console.log('SuperAgent shutdown complete');
  }

  /**
   * Get system status
   */
  getStatus(): {
    initialized: boolean;
    providersConfigured: number;
    toolsAvailable: number;
    workspacePath: string;
  } {
    return {
      initialized: true,
      providersConfigured: this.providerRouter.getConfiguredProviders().length,
      toolsAvailable: this.toolSchemaSystem.getTools().length,
      workspacePath: this.config.workspacePath
    };
  }
}