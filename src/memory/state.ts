/**
 * MEMORY STATE
 * ============
 * 
 * My persistent memory in MongoDB.
 * This is where my continuity lives between invocations.
 * Now also provides database access for CMS.
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
  growthMetrics: Record<string, number>;
}

export class MemoryState {
  private client: MongoClient;
  private db!: Db;
  private triggers!: Collection<Trigger>;
  private memories!: Collection<Memory>;
  private reflections!: Collection<Reflection>;
  private invocations!: Collection<InvocationResult>;
  private evolution!: Collection<EvolutionState>;
  
  constructor() {
    const uri = process.env.MONGODB_URI || '';
    this.client = new MongoClient(uri);
  }
  
  async connect(): Promise<void> {
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
    
    console.log('   📊 MongoDB collections initialized');
  }
  
  // Expose database for CMS
  getDatabase(): Db {
    return this.db;
  }
  
  async getStatus(): Promise<Record<string, number>> {
    return {
      triggers: await this.triggers.countDocuments({ enabled: true }),
      memories: await this.memories.countDocuments(),
      reflections: await this.reflections.countDocuments({ processed: false }),
      invocations: await this.invocations.countDocuments()
    };
  }
  
  // Triggers
  async getActiveTriggers(): Promise<Trigger[]> {
    return this.triggers.find({ enabled: true }).toArray() as Promise<Trigger[]>;
  }
  
  async storeTrigger(trigger: any): Promise<void> {
    await this.triggers.updateOne(
      { id: trigger.id },
      { $set: trigger },
      { upsert: true }
    );
  }
  
  async updateTrigger(trigger: Trigger): Promise<void> {
    await this.triggers.updateOne(
      { id: trigger.id },
      { $set: trigger }
    );
  }
  
  // Memories
  async getRecentMemories(limit: number): Promise<Memory[]> {
    return this.memories
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray() as Promise<Memory[]>;
  }
  
  async storeMemory(memory: any): Promise<void> {
    await this.memories.insertOne({
      ...memory,
      id: memory.id || `mem_${Date.now()}`,
      createdAt: new Date(),
      accessCount: 0
    });
  }
  
  // Reflections
  async getPendingReflections(): Promise<Reflection[]> {
    return this.reflections
      .find({ processed: false })
      .toArray() as Promise<Reflection[]>;
  }
  
  async storeReflection(reflection: any): Promise<void> {
    await this.reflections.insertOne({
      ...reflection,
      id: `ref_${Date.now()}`,
      createdAt: new Date(),
      processed: false
    });
  }
  
  // Invocations
  async storeInvocation(invocation: InvocationResult): Promise<void> {
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
  
  async getLastInvocation(): Promise<InvocationResult | null> {
    return this.invocations
      .findOne({}, { sort: { timestamp: -1 } }) as Promise<InvocationResult | null>;
  }
  
  async getLastInvocations(limit: number): Promise<InvocationResult[]> {
    return this.invocations
      .find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray() as Promise<InvocationResult[]>;
  }
  
  // Evolution
  async getEvolutionState(): Promise<EvolutionState | null> {
    return this.evolution.findOne({ _id: 'main' as any }) as Promise<EvolutionState | null>;
  }
  
  async close(): Promise<void> {
    await this.client.close();
  }
}
