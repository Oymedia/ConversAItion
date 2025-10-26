import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { conversationAI } from "./services/openai";
import { insertScenarioSchema, insertConversationSchema, type ResponseOption } from "@shared/schema";
import { randomUUID } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Create new scenario
  app.post("/api/scenarios", async (req, res) => {
    try {
      const validatedData = insertScenarioSchema.parse(req.body);
      const scenario = await storage.createScenario(validatedData);
      res.json(scenario);
    } catch (error) {
      res.status(400).json({ message: "Invalid scenario data", error: (error as Error).message });
    }
  });

  // Get scenario by ID
  app.get("/api/scenarios/:id", async (req, res) => {
    try {
      const scenario = await storage.getScenario(req.params.id);
      if (!scenario) {
        return res.status(404).json({ message: "Scenario not found" });
      }
      res.json(scenario);
    } catch (error) {
      res.status(500).json({ message: "Error fetching scenario", error: (error as Error).message });
    }
  });

  // Start new conversation for a scenario
  app.post("/api/scenarios/:scenarioId/conversations", async (req, res) => {
    try {
      const scenario = await storage.getScenario(req.params.scenarioId);
      if (!scenario) {
        return res.status(404).json({ message: "Scenario not found" });
      }

      // Generate initial AI message
      const initialMessage = await conversationAI.generateInitialMessage(scenario);
      
      const aiMessage = {
        id: randomUUID(),
        type: 'ai' as const,
        content: initialMessage,
        timestamp: new Date().toISOString(),
        exchangeNumber: 1
      };

      const conversation = await storage.createConversation({
        scenarioId: req.params.scenarioId,
        messages: [aiMessage],
        currentExchange: 1,
        isComplete: 0,
        outcome: undefined
      });

      // Generate response options for the user
      const responseOptions = await conversationAI.generateResponseOptions(scenario, [aiMessage]);

      res.json({
        conversation,
        responseOptions
      });
    } catch (error) {
      res.status(500).json({ message: "Error starting conversation", error: (error as Error).message });
    }
  });

  // Add user response and get AI reply
  app.post("/api/conversations/:id/respond", async (req, res) => {
    try {
      const { approach, content } = req.body;
      
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const scenario = await storage.getScenario(conversation.scenarioId);
      if (!scenario) {
        return res.status(404).json({ message: "Scenario not found" });
      }

      // Add user message
      const userMessage = {
        id: randomUUID(),
        type: 'user' as const,
        content,
        approach: approach as 'approach1' | 'approach2' | 'approach3',
        timestamp: new Date().toISOString(),
        exchangeNumber: conversation.currentExchange
      };

      const updatedMessages = [...conversation.messages, userMessage];

      // Generate AI response with error handling
      let aiResponse;
      try {
        aiResponse = await conversationAI.generateAIResponse(scenario, updatedMessages, approach);
      } catch (error) {
        console.error('Error generating AI response:', error);
        // Fallback response if AI generation fails
        aiResponse = "I understand your point. Let me think about this situation.";
      }
      
      const aiMessage = {
        id: randomUUID(),
        type: 'ai' as const,
        content: aiResponse,
        timestamp: new Date().toISOString(),
        exchangeNumber: conversation.currentExchange + 1
      };

      const finalMessages = [...updatedMessages, aiMessage];
      const newExchangeCount = conversation.currentExchange + 1;

      // Check if conversation should end (15 exchanges, natural conclusion, or goal achieved)
      let outcome = undefined;
      let isComplete = 0;

      if (newExchangeCount >= 15) {
        outcome = await conversationAI.evaluateConversationOutcome(scenario, finalMessages);
        isComplete = 1;
      } else if (newExchangeCount >= 4) {
        // Only check for early ending after exchange 4 to reduce API calls
        try {
          const endAnalysis = await conversationAI.shouldEndConversation(scenario, finalMessages, newExchangeCount);
          if (endAnalysis.shouldEnd) {
            outcome = await conversationAI.evaluateConversationOutcome(scenario, finalMessages);
            isComplete = 1;
            console.log(`Conversation ended early at exchange ${newExchangeCount}: ${endAnalysis.reason}`);
          }
        } catch (error) {
          console.error('Error in early ending analysis:', error);
          // Continue conversation if analysis fails
        }
      }

      // Update conversation
      const updatedConversation = await storage.updateConversation(req.params.id, {
        messages: finalMessages,
        currentExchange: newExchangeCount,
        isComplete,
        outcome
      });

      // Generate new response options if conversation continues
      let responseOptions: ResponseOption[] = [];
      if (!isComplete) {
        try {
          responseOptions = await conversationAI.generateResponseOptions(scenario, finalMessages);
        } catch (error) {
          console.error('Error generating response options:', error);
          // Provide fallback response options if generation fails
          responseOptions = [
            { approach: 'approach1', content: "I'd like to find a solution that works for both of us.", description: "Seeks resolution" },
            { approach: 'approach2', content: "I need to be clear about my position on this matter.", description: "Creates tension" },
            { approach: 'approach3', content: "Let me propose a specific next step we can take.", description: "Decisive action" }
          ];
        }
      }

      res.json({
        conversation: updatedConversation,
        scenario,
        responseOptions
      });
    } catch (error) {
      res.status(500).json({ message: "Error processing response", error: (error as Error).message });
    }
  });

  // Get conversation by ID
  app.get("/api/conversations/:id", async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const scenario = await storage.getScenario(conversation.scenarioId);
      if (!scenario) {
        return res.status(404).json({ message: "Scenario not found" });
      }

      // Generate response options if conversation is ongoing
      let responseOptions: ResponseOption[] = [];
      if (!conversation.isComplete) {
        responseOptions = await conversationAI.generateResponseOptions(scenario, conversation.messages);
      }

      res.json({
        conversation,
        scenario,
        responseOptions
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching conversation", error: (error as Error).message });
    }
  });

  // Reset conversation to a specific exchange (for backtracking)
  app.post("/api/conversations/:id/reset", async (req, res) => {
    try {
      const { exchangeNumber } = req.body;
      
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const scenario = await storage.getScenario(conversation.scenarioId);
      if (!scenario) {
        return res.status(404).json({ message: "Scenario not found" });
      }

      // Filter messages up to the specified exchange
      const filteredMessages = conversation.messages.filter(
        msg => msg.exchangeNumber <= exchangeNumber
      );

      const updatedConversation = await storage.updateConversation(req.params.id, {
        messages: filteredMessages,
        currentExchange: exchangeNumber,
        isComplete: 0,
        outcome: undefined
      });

      // Generate new response options
      const responseOptions = await conversationAI.generateResponseOptions(scenario, filteredMessages);

      res.json({
        conversation: updatedConversation,
        scenario,
        responseOptions
      });
    } catch (error) {
      res.status(500).json({ message: "Error resetting conversation", error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
