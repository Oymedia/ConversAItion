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

Generate 3 distinctly different response options that create varied conversation dynamics and outcomes:

1. **Approach 1** - Collaborative, seeks compromise and mutual understanding. This approach should lead toward RESOLUTION and finding middle ground.

2. **Approach 2** - Direct, firm, potentially confrontational. This approach should escalate the situation or create TENSION/DISPUTE, making the conversation more challenging.

3. **Approach 3** - Calculated, focused on specific goals, may involve ultimatums or walking away. This approach should create CLEAR CONSEQUENCES or DECISIVE ACTIONS that change the conversation's direction.

Each response must create a DIFFERENT conversation trajectory - one toward resolution, one toward conflict, one toward decisive action/conclusion.

CRITICAL REQUIREMENT: Each response option MUST be exactly 20-30 words maximum. Count the words carefully. If any response exceeds 30 words, it will be rejected. Be extremely concise and impactful.

Return as JSON in this exact format:
{
  "approach1": {
    "content": "the approach 1 response text that seeks compromise",
    "description": "Seeks resolution"
  },
  "approach2": {
    "content": "the approach 2 response text that creates tension", 
    "description": "Creates conflict"
  },
  "approach3": {
    "content": "the approach 3 response text with clear consequences",
    "description": "Decisive action"
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
      { approach: 'approach1', content: options.approach1?.content || "", description: options.approach1?.description || "Seeks resolution" },
      { approach: 'approach2', content: options.approach2?.content || "", description: options.approach2?.description || "Creates conflict" },
      { approach: 'approach3', content: options.approach3?.content || "", description: options.approach3?.description || "Decisive action" }
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

The user just responded using a ${userApproach} approach. As the character described in the profile, respond naturally to their message. 

IMPORTANT REACTION GUIDELINES:
- If they used APPROACH 1: Show openness to compromise but maintain your character's core interests. Move toward finding middle ground.
- If they used APPROACH 2: React with matching energy - show resistance, pushback, or escalation based on your character. Create tension.
- If they used APPROACH 3: Respond to their calculated move with your own strategic consideration. This might lead to acceptance, counter-offers, or walking away.

Stay true to the character's personality and motivations. Make the conversation dynamic and realistic, not neutral.

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
