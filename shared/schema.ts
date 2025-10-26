import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const scenarios = pgTable("scenarios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  purpose: text("purpose").notNull(),
  characterProfile: text("character_profile").array().notNull(),
  coreIssue: text("core_issue").notNull(),
  userStance: text("user_stance").notNull(),
  otherStance: text("other_stance").notNull(),
  relationship: text("relationship").notNull(),
  backgroundStory: text("background_story"),
  goal: text("goal").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scenarioId: varchar("scenario_id").notNull(),
  messages: jsonb("messages").$type<ConversationMessage[]>().notNull().default([]),
  currentExchange: integer("current_exchange").notNull().default(0),
  isComplete: integer("is_complete").notNull().default(0),
  outcome: jsonb("outcome").$type<ConversationOutcome>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertScenarioSchema = createInsertSchema(scenarios).omit({
  id: true,
  createdAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertScenario = z.infer<typeof insertScenarioSchema>;
export type Scenario = typeof scenarios.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export interface ConversationMessage {
  id: string;
  type: 'ai' | 'user';
  content: string;
  approach?: 'approach1' | 'approach2' | 'approach3';
  timestamp: string;
  exchangeNumber: number;
}

export interface ResponseOption {
  approach: 'approach1' | 'approach2' | 'approach3';
  content: string;
  description: string;
}

export interface ConversationOutcome {
  goalAchieved: boolean;
  goalPercentage: number;
  communicationAnalysis: string;
  keyInsights: string[];
  alternativePaths: Array<{
    approach: string;
    description: string;
  }>;
}

export interface ConversationState {
  scenario: Scenario;
  conversation: Conversation;
  responseOptions: ResponseOption[];
  isLoading: boolean;
}

export interface ConversationResponse {
  conversation: Conversation;
  scenario: Scenario;
  responseOptions: ResponseOption[];
}

export interface ConversationStartResponse {
  conversation: Conversation;
  responseOptions: ResponseOption[];
}
