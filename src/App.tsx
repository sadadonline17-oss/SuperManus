import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SuperAgent, SuperAgentConfig, Task, TaskResult } from './core/SuperAgent';

export default function App() {
  const [superAgent, setSuperAgent] = useState<SuperAgent | null>(null);
  const [status, setStatus] = useState<string>('Initializing...');
  const [taskInput, setTaskInput] = useState<string>('');
  const [taskResults, setTaskResults] = useState<TaskResult[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('openai');

  useEffect(() => {
    initializeSuperAgent();
  }, []);

  const initializeSuperAgent = async () => {
    try {
      const config: SuperAgentConfig = {
        providers: [
          { name: 'openai', apiKey: process.env.OPENAI_API_KEY || '', model: 'gpt-4o' },
          { name: 'anthropic', apiKey: process.env.ANTHROPIC_API_KEY || '', model: 'claude-3-5-sonnet-20241022' },
          { name: 'google', apiKey: process.env.GOOGLE_API_KEY || '', model: 'gemini-2.0-flash-exp' },
          { name: 'deepseek', apiKey: process.env.DEEPSEEK_API_KEY || '', model: 'deepseek-chat' }
        ],
        defaultProvider: 'openai',
        defaultModel: 'gpt-4o',
        workspacePath: '/workspace',
        agents: [
          'Coder Agent',
          'Browser Agent',
          'Shell Agent',
          'File Agent',
          'Search Agent'
        ]
      };

      const agent = new SuperAgent(config);
      await agent.initialize();
      setSuperAgent(agent);
      setStatus('Ready - All systems operational');
    } catch (error) {
      setStatus(`Error: ${error}`);
      console.error('Initialization error:', error);
    }
  };

  const executeTask = async () => {
    if (!superAgent || !taskInput.trim()) return;

    const task: Task = {
      id: `task-${Date.now()}`,
      description: taskInput
    };

    setStatus('Executing task...');
    const result = await superAgent.executeTask(task);
    
    setTaskResults(prev => [result, ...prev]);
    setTaskInput('');

    if (result.success) {
      setStatus('Task completed successfully');
    } else {
      setStatus(`Task failed: ${result.error}`);
      Alert.alert('Task Failed', result.error || 'Unknown error');
    }
  };

  const getStatusInfo = () => {
    if (!superAgent) return null;
    const info = superAgent.getStatus();
    return (
      <View style={styles.statusPanel}>
        <Text style={styles.statusTitle}>System Status</Text>
        <Text style={styles.statusText}>• Initialized: {info.initialized ? 'Yes' : 'No'}</Text>
        <Text style={styles.statusText}>• Providers Configured: {info.providersConfigured}</Text>
        <Text style={styles.statusText}>• Tools Available: {info.toolsAvailable}</Text>
        <Text style={styles.statusText}>• Workspace: {info.workspacePath}</Text>
      </View>
    );
  };

  const getProvidersList = () => {
    if (!superAgent) return null;
    const providers = superAgent.getConfiguredProviders();
    return (
      <View style={styles.providersPanel}>
        <Text style={styles.panelTitle}>Configured Providers</Text>
        {providers.map((provider, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.providerItem,
              selectedProvider === provider.id && styles.providerItemSelected
            ]}
            onPress={() => {
              setSelectedProvider(provider.id);
              superAgent.switchProvider(provider.id, provider.models[0]);
            }}
          >
            <Text style={styles.providerName}>{provider.name}</Text>
            <Text style={styles.providerModels}>{provider.models.length} models</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const getToolsList = () => {
    if (!superAgent) return null;
    const tools = superAgent.listTools();
    return (
      <View style={styles.toolsPanel}>
        <Text style={styles.panelTitle}>Available Tools</Text>
        {tools.slice(0, 10).map((tool, index) => (
          <View key={index} style={styles.toolItem}>
            <Text style={styles.toolName}>{tool.name}</Text>
            <Text style={styles.toolDesc} numberOfLines={2}>{tool.description}</Text>
          </View>
        ))}
        <Text style={styles.moreText}>+ {tools.length - 10} more tools</Text>
      </View>
    );
  };

  const renderTaskResult = (result: TaskResult, index: number) => (
    <View key={index} style={[
      styles.taskResult,
      result.success ? styles.taskResultSuccess : styles.taskResultFailure
    ]}>
      <Text style={styles.taskId}>Task: {result.taskId}</Text>
      <Text style={[
        styles.taskStatus,
        result.success ? styles.statusSuccess : styles.statusFailure
      ]}>
        {result.success ? '✓ Success' : '✗ Failed'}
      </Text>
      {result.error && (
        <Text style={styles.taskError}>Error: {result.error}</Text>
      )}
      {result.steps.length > 0 && (
        <View style={styles.stepsContainer}>
          <Text style={styles.stepsTitle}>Steps:</Text>
          {result.steps.map((step, i) => (
            <Text key={i} style={styles.stepText}>
              {step.step}. {step.description}
            </Text>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>SuperManus</Text>
        <Text style={styles.subtitle}>AI Manus + bolt.diy Merger</Text>
        <View style={[
          styles.statusBadge,
          superAgent ? styles.statusBadgeReady : styles.statusBadgeLoading
        ]}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Status Panel */}
        {getStatusInfo()}

        {/* Providers Panel */}
        {getProvidersList()}

        {/* Tools Panel */}
        {getToolsList()}

        {/* Task Input */}
        <View style={styles.taskInputContainer}>
          <Text style={styles.sectionTitle}>Execute Task</Text>
          <TextInput
            style={styles.taskInput}
            placeholder="Describe your task..."
            value={taskInput}
            onChangeText={setTaskInput}
            multiline
            numberOfLines={4}
          />
          <TouchableOpacity
            style={[
              styles.executeButton,
              !superAgent || !taskInput.trim() && styles.executeButtonDisabled
            ]}
            onPress={executeTask}
            disabled={!superAgent || !taskInput.trim()}
          >
            <Text style={styles.executeButtonText}>Execute Task</Text>
          </TouchableOpacity>
        </View>

        {/* Task Results */}
        {taskResults.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.sectionTitle}>Task Results</Text>
            {taskResults.map(renderTaskResult)}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  header: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  statusBadge: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusBadgeReady: {
    backgroundColor: '#22c55e',
  },
  statusBadgeLoading: {
    backgroundColor: '#f59e0b',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusPanel: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  statusText: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 6,
  },
  providersPanel: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  providerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    marginBottom: 8,
  },
  providerItemSelected: {
    backgroundColor: '#3b82f6',
  },
  providerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  providerModels: {
    color: '#888',
    fontSize: 12,
  },
  toolsPanel: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  toolItem: {
    padding: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    marginBottom: 8,
  },
  toolName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  toolDesc: {
    color: '#888',
    fontSize: 12,
  },
  moreText: {
    color: '#3b82f6',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  taskInputContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  taskInput: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  executeButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  executeButtonDisabled: {
    backgroundColor: '#333',
  },
  executeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
  },
  taskResult: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  taskResultSuccess: {
    backgroundColor: '#22c55e20',
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  taskResultFailure: {
    backgroundColor: '#ef444420',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  taskId: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusSuccess: {
    color: '#22c55e',
  },
  statusFailure: {
    color: '#ef4444',
  },
  taskError: {
    color: '#ef4444',
    fontSize: 12,
    marginBottom: 8,
  },
  stepsContainer: {
    marginTop: 8,
  },
  stepsTitle: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepText: {
    color: '#aaa',
    fontSize: 12,
    marginLeft: 8,
    marginBottom: 2,
  },
});