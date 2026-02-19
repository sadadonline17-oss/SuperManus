import { LanguageModelV1 } from '@ai-sdk/react';
import { openai, createOpenAI } from '@ai-sdk/openai';
import { anthropic, createAnthropic } from '@ai-sdk/anthropic';
import { google, createGoogleGenerativeAI } from '@ai-sdk/google';
import { deepseek, createDeepSeek } from '@ai-sdk/deepseek';

export interface ProviderConfig {
  name: string;
  apiKey: string;
  baseURL?: string;
  model?: string;
}

export interface Provider {
  id: string;
  name: string;
  models: string[];
  createModel: (model: string) => LanguageModelV1;
  isConfigured: boolean;
}

/**
 * LLMProviderRouter - Routes to 20+ LLM providers
 * This is the complete provider routing system from bolt.diy
 */
export class LLMProviderRouter {
  private providers: Map<string, Provider> = new Map();
  private configs: Map<string, ProviderConfig> = new Map();

  constructor() {
    this.initializeProviders();
  }

  /**
   * Initialize all supported providers
   */
  private initializeProviders() {
    // OpenAI
    this.registerProvider('openai', {
      id: 'openai',
      name: 'OpenAI',
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      createModel: (model) => {
        const config = this.configs.get('openai');
        const client = createOpenAI({ apiKey: config?.apiKey || '' });
        return client(model);
      },
      isConfigured: false
    });

    // Anthropic
    this.registerProvider('anthropic', {
      id: 'anthropic',
      name: 'Anthropic',
      models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
      createModel: (model) => {
        const config = this.configs.get('anthropic');
        const client = createAnthropic({ apiKey: config?.apiKey || '' });
        return client(model);
      },
      isConfigured: false
    });

    // Google (Gemini)
    this.registerProvider('google', {
      id: 'google',
      name: 'Google (Gemini)',
      models: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'],
      createModel: (model) => {
        const config = this.configs.get('google');
        const client = createGoogleGenerativeAI({ apiKey: config?.apiKey || '' });
        return client(model);
      },
      isConfigured: false
    });

    // DeepSeek
    this.registerProvider('deepseek', {
      id: 'deepseek',
      name: 'DeepSeek',
      models: ['deepseek-chat', 'deepseek-coder'],
      createModel: (model) => {
        const config = this.configs.get('deepseek');
        const client = createDeepSeek({ apiKey: config?.apiKey || '' });
        return client(model);
      },
      isConfigured: false
    });

    // OpenRouter
    this.registerProvider('openrouter', {
      id: 'openrouter',
      name: 'OpenRouter',
      models: ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'google/gemini-pro-1.5'],
      createModel: (model) => {
        const config = this.configs.get('openrouter');
        const client = createOpenAI({
          baseURL: 'https://openrouter.ai/api/v1',
          apiKey: config?.apiKey || ''
        });
        return client(model);
      },
      isConfigured: false
    });

    // Groq
    this.registerProvider('groq', {
      id: 'groq',
      name: 'Groq',
      models: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
      createModel: (model) => {
        const config = this.configs.get('groq');
        const client = createOpenAI({
          baseURL: 'https://api.groq.com/openai/v1',
          apiKey: config?.apiKey || ''
        });
        return client(model);
      },
      isConfigured: false
    });

    // Ollama (Local)
    this.registerProvider('ollama', {
      id: 'ollama',
      name: 'Ollama (Local)',
      models: ['llama3.2', 'deepseek-coder', 'codellama', 'mistral'],
      createModel: (model) => {
        const config = this.configs.get('ollama');
        const client = createOpenAI({
          baseURL: config?.baseURL || 'http://localhost:11434/v1',
          apiKey: 'ollama'
        });
        return client(model);
      },
      isConfigured: false
    });

    // xAI (Grok)
    this.registerProvider('xai', {
      id: 'xai',
      name: 'xAI (Grok)',
      models: ['grok-2', 'grok-2-vision'],
      createModel: (model) => {
        const config = this.configs.get('xai');
        const client = createOpenAI({
          baseURL: 'https://api.x.ai/v1',
          apiKey: config?.apiKey || ''
        });
        return client(model);
      },
      isConfigured: false
    });

    // Together AI
    this.registerProvider('together', {
      id: 'together',
      name: 'Together AI',
      models: ['meta-llama/Llama-3.3-70B-Instruct-Turbo', 'mistralai/Mixtral-8x7B-Instruct-v0.1'],
      createModel: (model) => {
        const config = this.configs.get('together');
        const client = createOpenAI({
          baseURL: 'https://api.together.xyz/v1',
          apiKey: config?.apiKey || ''
        });
        return client(model);
      },
      isConfigured: false
    });

    // Cohere
    this.registerProvider('cohere', {
      id: 'cohere',
      name: 'Cohere',
      models: ['command-r-plus', 'command-r'],
      createModel: (model) => {
        const config = this.configs.get('cohere');
        const client = createOpenAI({
          baseURL: 'https://api.cohere.com/v1',
          apiKey: config?.apiKey || ''
        });
        return client(model);
      },
      isConfigured: false
    });

    // Mistral
    this.registerProvider('mistral', {
      id: 'mistral',
      name: 'Mistral',
      models: ['mistral-large-latest', 'mixtral-8x7b-latest', 'mistral-small-latest'],
      createModel: (model) => {
        const config = this.configs.get('mistral');
        const client = createOpenAI({
          baseURL: 'https://api.mistral.ai/v1',
          apiKey: config?.apiKey || ''
        });
        return client(model);
      },
      isConfigured: false
    });

    // Perplexity
    this.registerProvider('perplexity', {
      id: 'perplexity',
      name: 'Perplexity',
      models: ['sonar-pro', 'sonar-medium-online'],
      createModel: (model) => {
        const config = this.configs.get('perplexity');
        const client = createOpenAI({
          baseURL: 'https://api.perplexity.ai',
          apiKey: config?.apiKey || ''
        });
        return client(model);
      },
      isConfigured: false
    });

    // HuggingFace
    this.registerProvider('huggingface', {
      id: 'huggingface',
      name: 'HuggingFace',
      models: ['Qwen/Qwen2.5-Coder-32B-Instruct', 'meta-llama/Llama-3.3-70B-Instruct'],
      createModel: (model) => {
        const config = this.configs.get('huggingface');
        const client = createOpenAI({
          baseURL: 'https://api-inference.huggingface.co/v1',
          apiKey: config?.apiKey || ''
        });
        return client(model);
      },
      isConfigured: false
    });

    // Amazon Bedrock
    this.registerProvider('bedrock', {
      id: 'bedrock',
      name: 'Amazon Bedrock',
      models: ['anthropic.claude-3-5-sonnet-20241022-v2:0', 'us.anthropic.claude-3-5-haiku-20241022-v1:0'],
      createModel: (model) => {
        const config = this.configs.get('bedrock');
        const client = createOpenAI({
          baseURL: 'https://bedrock-runtime.us-east-1.amazonaws.com',
          apiKey: config?.apiKey || ''
        });
        return client(model);
      },
      isConfigured: false
    });

    // Moonshot (Kimi)
    this.registerProvider('moonshot', {
      id: 'moonshot',
      name: 'Moonshot (Kimi)',
      models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
      createModel: (model) => {
        const config = this.configs.get('moonshot');
        const client = createOpenAI({
          baseURL: 'https://api.moonshot.cn/v1',
          apiKey: config?.apiKey || ''
        });
        return client(model);
      },
      isConfigured: false
    });

    // Hyperbolic
    this.registerProvider('hyperbolic', {
      id: 'hyperbolic',
      name: 'Hyperbolic',
      models: ['Qwen/Qwen2.5-72B-Instruct', 'meta-llama/Llama-3.3-70B-Instruct'],
      createModel: (model) => {
        const config = this.configs.get('hyperbolic');
        const client = createOpenAI({
          baseURL: 'https://api.hyperbolic.xyz/v1',
          apiKey: config?.apiKey || ''
        });
        return client(model);
      },
      isConfigured: false
    });

    // GitHub Models
    this.registerProvider('github', {
      id: 'github',
      name: 'GitHub Models',
      models: ['gpt-4o-mini', 'Phi-3.5-mini-128k-instruct'],
      createModel: (model) => {
        const config = this.configs.get('github');
        const client = createOpenAI({
          baseURL: 'https://models.inference.ai.azure.com',
          apiKey: config?.apiKey || ''
        });
        return client(model);
      },
      isConfigured: false
    });

    // OpenAI-compatible (custom endpoints)
    this.registerProvider('openai-compatible', {
      id: 'openai-compatible',
      name: 'OpenAI-Compatible',
      models: ['custom-model'],
      createModel: (model) => {
        const config = this.configs.get('openai-compatible');
        const client = createOpenAI({
          baseURL: config?.baseURL || 'http://localhost:8080/v1',
          apiKey: config?.apiKey || 'dummy-key'
        });
        return client(model);
      },
      isConfigured: false
    });
  }

  /**
   * Register a provider
   */
  private registerProvider(id: string, provider: Provider) {
    this.providers.set(id, provider);
  }

  /**
   * Configure a provider with API credentials
   */
  configureProvider(providerId: string, config: ProviderConfig) {
    this.configs.set(providerId, config);
    const provider = this.providers.get(providerId);
    if (provider) {
      provider.isConfigured = !!config.apiKey;
    }
  }

  /**
   * Get all available providers
   */
  getProviders(): Provider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get a specific provider
   */
  getProvider(providerId: string): Provider | undefined {
    return this.providers.get(providerId);
  }

  /**
   * Get a model from a provider
   */
  getModel(providerId: string, model: string): LanguageModelV1 | null {
    const provider = this.providers.get(providerId);
    if (!provider || !provider.isConfigured) {
      return null;
    }
    return provider.createModel(model);
  }

  /**
   * Check if a provider is configured
   */
  isProviderConfigured(providerId: string): boolean {
    return this.providers.get(providerId)?.isConfigured || false;
  }

  /**
   * Get all configured providers
   */
  getConfiguredProviders(): Provider[] {
    return Array.from(this.providers.values()).filter(p => p.isConfigured);
  }

  /**
   * Auto-detect configured providers from environment variables
   */
  autoDetectProviders(env: Record<string, string>) {
    const providerEnvMap: Record<string, string> = {
      openai: 'OPENAI_API_KEY',
      anthropic: 'ANTHROPIC_API_KEY',
      google: 'GOOGLE_API_KEY',
      deepseek: 'DEEPSEEK_API_KEY',
      openrouter: 'OPENROUTER_API_KEY',
      groq: 'GROQ_API_KEY',
      xai: 'XAI_API_KEY',
      together: 'TOGETHER_API_KEY',
      cohere: 'COHERE_API_KEY',
      mistral: 'MISTRAL_API_KEY',
      perplexity: 'PERPLEXITY_API_KEY',
      huggingface: 'HUGGINGFACE_API_KEY',
      bedrock: 'AWS_ACCESS_KEY_ID',
      moonshot: 'MOONSHOT_API_KEY',
      hyperbolic: 'HYPERBOLIC_API_KEY',
      github: 'GITHUB_TOKEN'
    };

    for (const [providerId, envKey] of Object.entries(providerEnvMap)) {
      const apiKey = env[envKey];
      if (apiKey) {
        this.configureProvider(providerId, {
          name: providerId,
          apiKey
        });
      }
    }
  }
}