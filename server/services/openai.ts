import OpenAI from "openai";
import { type ConversationMessage, type ResponseOption, type ConversationOutcome, type Scenario } from "@shared/schema";

// Using GPT-4o as requested by user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "your-api-key-here"
});

export class ConversationAI {
  
  async generateInitialMessage(scenario: Scenario): Promise<string> {
    try {
      const prompt = `You are roleplaying as a character in a conversation simulation. 

Character Profile: ${scenario.characterProfile}
Situation: ${scenario.topic}
The user's goal: ${scenario.goal}
Purpose of conversation: ${scenario.purpose}

As this character, start the conversation naturally based on the situation described. Keep it realistic and in character. The user wants to practice this conversation, so make it challenging but fair. Respond as if you are the character in this situation.

IMPORTANT: Keep your response to a MAXIMUM of 30 words.

Return only the character's opening message, no additional formatting.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
      });

      return response.choices[0].message.content || "Hello, let's discuss this matter.";
    } catch (error) {
      console.error('OpenAI API Error in generateInitialMessage:', error);
      throw new Error(`Failed to generate initial message: ${(error as Error).message}`);
    }
  }

  async generateResponseOptions(
    scenario: Scenario, 
    conversationHistory: ConversationMessage[]
  ): Promise<ResponseOption[]> {
    const historyText = conversationHistory
      .map(msg => `${msg.type.toUpperCase()}: ${msg.content}`)
      .join('\n');

    const prompt = `You are helping a user practice a conversation simulation.

Scenario Context:
- Purpose: ${scenario.purpose}
- Character Profile: ${scenario.characterProfile}
- Situation: ${scenario.topic}
- User's Goal: ${scenario.goal}

Conversation History:
${historyText}

Generate 3 different response options for the user representing different communication approaches:
1. Diplomatic - Collaborative, relationship-focused, seeking common ground
2. Assertive - Direct, firm, standing up for boundaries while remaining professional  
3. Strategic - Value-focused, logical reasoning, focusing on mutual benefits

IMPORTANT: Each response option must be MAXIMUM 30 words. Keep them concise and impactful.

Each response should be realistic and appropriate for the situation. Return as JSON in this exact format:
{
  "diplomatic": {
    "content": "the diplomatic response text",
    "description": "Collaborative approach"
  },
  "assertive": {
    "content": "the assertive response text", 
    "description": "Direct and firm"
  },
  "strategic": {
    "content": "the strategic response text",
    "description": "Value-focused reasoning"
  }
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 600,
    });

    const options = JSON.parse(response.choices[0].message.content || "{}");
    
    return [
      { approach: 'diplomatic', content: options.diplomatic?.content || "", description: options.diplomatic?.description || "Collaborative approach" },
      { approach: 'assertive', content: options.assertive?.content || "", description: options.assertive?.description || "Direct and firm" },
      { approach: 'strategic', content: options.strategic?.content || "", description: options.strategic?.description || "Value-focused reasoning" }
    ];
  }

  async generateAIResponse(
    scenario: Scenario,
    conversationHistory: ConversationMessage[],
    userApproach: string
  ): Promise<string> {
    const historyText = conversationHistory
      .map(msg => `${msg.type.toUpperCase()}: ${msg.content}`)
      .join('\n');

    const prompt = `You are roleplaying as a character in a conversation simulation.

Character Profile: ${scenario.characterProfile}
Situation: ${scenario.topic}  
User's Goal: ${scenario.goal}
Purpose: ${scenario.purpose}

Conversation History:
${historyText}

The user just responded using a ${userApproach} approach. As the character described in the profile, respond naturally to their message. Consider:
- How would this character personality react to this approach?
- Stay true to the character's motivations and communication style
- Make the conversation progress toward a realistic resolution
- Keep the response conversational and realistic
- Challenge the user appropriately based on the character profile

IMPORTANT: Keep your response to a MAXIMUM of 30 words.

Respond only as the character, no additional formatting.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
    });

    return response.choices[0].message.content || "I understand your perspective.";
  }

  async evaluateConversationOutcome(
    scenario: Scenario,
    conversationHistory: ConversationMessage[]
  ): Promise<ConversationOutcome> {
    const historyText = conversationHistory
      .map(msg => `${msg.type.toUpperCase()}: ${msg.content}`)
      .join('\n');

    const prompt = `Analyze this conversation simulation and provide an evaluation.

Original Goal: ${scenario.goal}
Purpose: ${scenario.purpose}
Character Profile: ${scenario.characterProfile}
Situation: ${scenario.topic}

Full Conversation:
${historyText}

Evaluate how well the user achieved their stated goal and provide insights. Return as JSON in this exact format:
{
  "goalAchieved": boolean,
  "goalPercentage": number (0-100),
  "communicationAnalysis": "brief analysis of communication effectiveness",
  "keyInsights": ["insight 1", "insight 2", "insight 3"],
  "alternativePaths": [
    {"approach": "approach name", "description": "what this approach would achieve"}
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 800,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      goalAchieved: result.goalAchieved || false,
      goalPercentage: result.goalPercentage || 0,
      communicationAnalysis: result.communicationAnalysis || "Analysis unavailable",
      keyInsights: result.keyInsights || [],
      alternativePaths: result.alternativePaths || []
    };
  }
}

export const conversationAI = new ConversationAI();
