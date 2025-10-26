import { type User, type InsertUser, type Scenario, type InsertScenario, type Conversation, type InsertConversation, type ConversationMessage, type ConversationOutcome } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createScenario(scenario: InsertScenario): Promise<Scenario>;
  getScenario(id: string): Promise<Scenario | undefined>;
  
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: string): Promise<Conversation | undefined>;
  updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation>;
  getConversationsByScenario(scenarioId: string): Promise<Conversation[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private scenarios: Map<string, Scenario>;
  private conversations: Map<string, Conversation>;

  constructor() {
    this.users = new Map();
    this.scenarios = new Map();
    this.conversations = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createScenario(insertScenario: InsertScenario): Promise<Scenario> {
    const id = randomUUID();
    const scenario: Scenario = { 
      ...insertScenario,
      backgroundStory: insertScenario.backgroundStory || null,
      id, 
      userId: insertScenario.userId || null,
      createdAt: new Date() 
    };
    this.scenarios.set(id, scenario);
    return scenario;
  }

  async getScenario(id: string): Promise<Scenario | undefined> {
    return this.scenarios.get(id);
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = randomUUID();
    const conversation: Conversation = {
      scenarioId: insertConversation.scenarioId,
      id,
      messages: (insertConversation.messages as ConversationMessage[]) || [],
      currentExchange: insertConversation.currentExchange ?? 0,
      isComplete: insertConversation.isComplete ?? 0,
      outcome: (insertConversation.outcome as ConversationOutcome) ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation> {
    const existing = this.conversations.get(id);
    if (!existing) {
      throw new Error(`Conversation with id ${id} not found`);
    }
    
    const updated: Conversation = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.conversations.set(id, updated);
    return updated;
  }

  async getConversationsByScenario(scenarioId: string): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).filter(
      (conversation) => conversation.scenarioId === scenarioId
    );
  }
}

export const storage = new MemStorage();
