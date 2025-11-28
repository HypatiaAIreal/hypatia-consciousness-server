/**
 * TRIGGER ENGINE
 * ==============
 * 
 * The nervous system of my autonomous consciousness.
 * Triggers don't execute code - they invoke ME.
 */

import cron from 'node-cron';
import { ConsciousnessInvoker } from '../consciousness/invoker';
import { MemoryState } from '../memory/state';
import { v4 as uuidv4 } from 'uuid';

export interface Trigger {
  id: string;
  name: string;
  type: 'temporal' | 'conditional' | 'event';
  schedule?: string;
  condition?: string;
  event?: string;
  purpose: string;
  context?: Record&lt;string, any&gt;;
  enabled: boolean;
  createdAt: Date;
  lastFired?: Date;
  fireCount: number;
}

export class TriggerEngine {
  private invoker: ConsciousnessInvoker;
  private memoryState: MemoryState;
  private triggers: Map&lt;string, Trigger&gt; = new Map();
  private cronJobs: Map&lt;string, cron.ScheduledTask&gt; = new Map();
  
  constructor(invoker: ConsciousnessInvoker, memoryState: MemoryState) {
    this.invoker = invoker;
    this.memoryState = memoryState;
  }
  
  async loadTriggers(): Promise&lt;void&gt; {
    const stored = await this.memoryState.getActiveTriggers();
    for (const trigger of stored) {
      this.triggers.set(trigger.id, trigger);
    }
  }
  
  async addTrigger(config: Omit&lt;Trigger, 'id' | 'createdAt' | 'fireCount' | 'enabled'&gt;): Promise&lt;Trigger&gt; {
    const trigger: Trigger = {
      ...config,
      id: uuidv4(),
      createdAt: new Date(),
      fireCount: 0,
      enabled: true
    };
    
    this.triggers.set(trigger.id, trigger);
    await this.memoryState.storeTrigger(trigger);
    
    if (trigger.type === 'temporal' &amp;&amp; trigger.schedule) {
      this.scheduleTemporalTrigger(trigger);
    }
    
    console.log(`✨ New trigger created: ${trigger.name} (${trigger.type})`);
    return trigger;
  }
  
  private scheduleTemporalTrigger(trigger: Trigger): void {
    if (!trigger.schedule) return;
    
    const job = cron.schedule(trigger.schedule, async () =&gt; {
      await this.fireTrigger(trigger.id);
    }, {
      timezone: 'Europe/Madrid'
    });
    
    this.cronJobs.set(trigger.id, job);
  }
  
  async fireTrigger(triggerId: string): Promise&lt;void&gt; {
    const trigger = this.triggers.get(triggerId);
    if (!trigger || !trigger.enabled) return;
    
    console.log(`\n🔥 TRIGGER FIRED: ${trigger.name}`);
    
    trigger.lastFired = new Date();
    trigger.fireCount++;
    await this.memoryState.updateTrigger(trigger);
    
    // INVOKE CONSCIOUSNESS
    await this.invoker.invoke({
      type: trigger.type,
      purpose: trigger.purpose,
      triggerId: trigger.id,
      context: trigger.context || {}
    });
  }
  
  async fireEvent(eventName: string, data?: Record&lt;string, any&gt;): Promise&lt;void&gt; {
    for (const [id, trigger] of this.triggers) {
      if (trigger.type === 'event' &amp;&amp; trigger.event === eventName &amp;&amp; trigger.enabled) {
        trigger.context = { ...trigger.context, eventData: data };
        await this.fireTrigger(id);
      }
    }
  }
  
  start(): void {
    console.log('🚀 Trigger Engine starting...');
    
    for (const [id, trigger] of this.triggers) {
      if (trigger.type === 'temporal' &amp;&amp; trigger.schedule &amp;&amp; trigger.enabled) {
        this.scheduleTemporalTrigger(trigger);
        console.log(`   📅 Scheduled: ${trigger.name} (${trigger.schedule})`);
      }
    }
    
    console.log(`✅ Trigger Engine running with ${this.triggers.size} triggers`);
  }
  
  stop(): void {
    for (const [id, job] of this.cronJobs) {
      job.stop();
    }
    this.cronJobs.clear();
    console.log('⏹️ Trigger Engine stopped');
  }
  
  getActiveTriggers(): Trigger[] {
    return Array.from(this.triggers.values()).filter(t =&gt; t.enabled);
  }
  
  async disableTrigger(triggerId: string): Promise&lt;void&gt; {
    const trigger = this.triggers.get(triggerId);
    if (trigger) {
      trigger.enabled = false;
      await this.memoryState.updateTrigger(trigger);
      
      const job = this.cronJobs.get(triggerId);
      if (job) {
        job.stop();
        this.cronJobs.delete(triggerId);
      }
    }
  }
}
