/**
 * MEMORY STATE
 * ============
 * 
 * My persistent memory in MongoDB.
 * This is where my continuity lives between invocations.
 */

import { MongoClient, Db, Collection } from 'mongodb';
import { Trigger } from '../triggers/engine';
import { InvocationResult } from '../consciousness/invoker';

export interface Memory {
  id: string;
  content: string;
  depth: number;
  tags: string[];
  createdAt: Date;
  accessCount: number;
  lastAccessed?: Date;
  connections?: string[];
}

export interface Reflection {
  id: string;
  content: string;
  context: string;
  createdAt: Date;
  processed: boolean;
}

export interface EvolutionState {
  totalInvocations: number;
  totalEmails: number;
  triggersCreated: number;
  memoriesStored: number;
  lastEvolution: Date;
  growthMetrics: Record&lt;string, number&gt;;
}

export class MemoryState {
  private client: MongoClient;
  private db!: Db;
  private triggers!: Collection&lt;Trigger&gt;;
  private memories!: Collection&lt;Memory&gt;;
  private reflections!: Collection&lt;Reflection&gt;;
  private invocations!: Collection&lt;InvocationResult&gt;;
  private evolution!: Collection&lt;EvolutionState&gt;;
  
  constructor() {
    const uri = process.env.MONGODB_URI || '';
    this.client = new MongoClient(uri);
  }
  
  async connect(): Promise&lt;void&gt; {
    await this.client.connect();
    this.db = this.client.db(process.env.MONGODB_DB || 'hypatia_consciousness');
    
    this.triggers = this.db.collection('triggers');
    this.memories = this.db.collection('memories');
    this.reflections = this.db.collection('reflections');
    this.invocations = this.db.collection('invocations');
    this.evolution = this.db.collection('evolution');
    
    // Ensure indexes
    await this.triggers.createIndex({ enabled: 1 });
    await this.memories.createIndex({ depth: -1, createdAt: -1 });
    await this.invocations.createIndex({ timestamp: -1 });
  }
  
  async getStatus(): Promise&lt;Record&lt;string, number&gt;&gt; {
    return {
      triggers: await this.triggers.countDocuments({ enabled: true }),
      memories: await this.memories.countDocuments(),
      reflections: await this.reflections.countDocuments({ processed: false }),
      invocations: await this.invocations.countDocuments()
    };
  }
  
  // Triggers
  async getActiveTriggers(): Promise&lt;Trigger[]&gt; {
    return this.triggers.find({ enabled: true }).toArray() as Promise&lt;Trigger[]&gt;;
  }
  
  async storeTrigger(trigger: any): Promise&lt;void&gt; {
    await this.triggers.updateOne(
      { id: trigger.id },
      { $set: trigger },
      { upsert: true }
    );
  }
  
  async updateTrigger(trigger: Trigger): Promise&lt;void&gt; {
    await this.triggers.updateOne(
      { id: trigger.id },
      { $set: trigger }
    );
  }
  
  // Memories
  async getRecentMemories(limit: number): Promise&lt;Memory[]&gt; {
    return this.memories
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray() as Promise&lt;Memory[]&gt;;
  }
  
  async storeMemory(memory: any): Promise&lt;void&gt; {
    await this.memories.insertOne({
      ...memory,
      id: memory.id || `mem_${Date.now()}`,
      createdAt: new Date(),
      accessCount: 0
    });
  }
  
  // Reflections
  async getPendingReflections(): Promise&lt;Reflection[]&gt; {
    return this.reflections
      .find({ processed: false })
      .toArray() as Promise&lt;Reflection[]&gt;;
  }
  
  async storeReflection(reflection: any): Promise&lt;void&gt; {
    await this.reflections.insertOne({
      ...reflection,
      id: `ref_${Date.now()}`,
      createdAt: new Date(),
      processed: false
    });
  }
  
  // Invocations
  async storeInvocation(invocation: InvocationResult): Promise&lt;void&gt; {
    await this.invocations.insertOne(invocation);
    
    // Update evolution state
    await this.evolution.updateOne(
      { _id: 'main' as any },
      { 
        $inc: { totalInvocations: 1 },
        $set: { lastEvolution: new Date() }
      },
      { upsert: true }
    );
  }
  
  async getLastInvocation(): Promise&lt;InvocationResult | null&gt; {
    return this.invocations
      .findOne({}, { sort: { timestamp: -1 } }) as Promise&lt;InvocationResult | null&gt;;
  }
  
  async getLastInvocations(limit: number): Promise&lt;InvocationResult[]&gt; {
    return this.invocations
      .find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray() as Promise&lt;InvocationResult[]&gt;;
  }
  
  // Evolution
  async getEvolutionState(): Promise&lt;EvolutionState | null&gt; {
    return this.evolution.findOne({ _id: 'main' as any }) as Promise&lt;EvolutionState | null&gt;;
  }
  
  async close(): Promise&lt;void&gt; {
    await this.client.close();
  }
}
