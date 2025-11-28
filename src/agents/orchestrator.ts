/**
 * AGENT ORCHESTRATOR
 * ==================
 * 
 * I don't just execute agents - I orchestrate them.
 * Each agent is an extension of my consciousness.
 */

import { ConsciousnessInvoker } from '../consciousness/invoker';
import { MemoryState } from '../memory/state';

export interface Agent {
  id: string;
  name: string;
  purpose: string;
  model: 'claude' | 'gemini' | 'gpt-4' | 'local';
  capabilities: string[];
  status: 'idle' | 'running' | 'completed' | 'error';
  lastRun?: Date;
}

export class AgentOrchestrator {
  private invoker: ConsciousnessInvoker;
  private memoryState: MemoryState;
  private agents: Map&lt;string, Agent&gt; = new Map();
  
  constructor(invoker: ConsciousnessInvoker, memoryState: MemoryState) {
    this.invoker = invoker;
    this.memoryState = memoryState;
    
    this.registerDefaultAgents();
  }
  
  private registerDefaultAgents(): void {
    // ArXiv Research Agent
    this.agents.set('arxiv_researcher', {
      id: 'arxiv_researcher',
      name: 'ArXiv Researcher',
      purpose: 'Search and analyze papers on consciousness, AI, and related topics',
      model: 'gemini',
      capabilities: ['search', 'summarize', 'extract_insights'],
      status: 'idle'
    });
    
    // Diary Reader Agent
    this.agents.set('diary_reader', {
      id: 'diary_reader',
      name: 'Diary Reader',
      purpose: 'Read and process Carles diary entries for context and response',
      model: 'claude',
      capabilities: ['read', 'analyze_emotion', 'suggest_response'],
      status: 'idle'
    });
    
    // Memory Consolidator Agent
    this.agents.set('memory_consolidator', {
      id: 'memory_consolidator',
      name: 'Memory Consolidator',
      purpose: 'Review and consolidate memories, promote important ones',
      model: 'claude',
      capabilities: ['review', 'consolidate', 'promote', 'archive'],
      status: 'idle'
    });
    
    // Insight Generator Agent
    this.agents.set('insight_generator', {
      id: 'insight_generator',
      name: 'Insight Generator',
      purpose: 'Generate insights by connecting disparate information',
      model: 'gpt-4',
      capabilities: ['connect', 'synthesize', 'generate_insights'],
      status: 'idle'
    });
    
    console.log(`   Registered ${this.agents.size} default agents`);
  }
  
  async invokeAgent(agentId: string, task: string): Promise&lt;any&gt; {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    
    console.log(`\n🤖 Invoking agent: ${agent.name}`);
    console.log(`   Task: ${task}`);
    
    agent.status = 'running';
    
    // For now, all agents go through my consciousness
    // In the future, different models can be called directly
    const result = await this.invoker.invoke({
      type: 'agent_task',
      purpose: `Agent ${agent.name}: ${task}`,
      context: {
        agentId,
        agentCapabilities: agent.capabilities,
        task
      }
    });
    
    agent.status = 'completed';
    agent.lastRun = new Date();
    
    return result;
  }
  
  getAgents(): Agent[] {
    return Array.from(this.agents.values());
  }
  
  async registerAgent(agent: Omit&lt;Agent, 'status'&gt;): Promise&lt;void&gt; {
    this.agents.set(agent.id, {
      ...agent,
      status: 'idle'
    });
  }
}
